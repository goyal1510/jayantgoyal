"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RefreshCcw, Settings } from "lucide-react"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/sheet"
import { cn } from "@repo/ui/lib/utils"
import { toast } from "sonner"

// ─── Constants ───────────────────────────────────────────────────────────────

const CELLS_PER_SIDE = 13
const HOME_STRETCH_LENGTH = 5
const ARM_DEPTH = 6
const TOKENS_PER_PLAYER = 4
const SVG_SIZE = 660
const CX = SVG_SIZE / 2
const CY = SVG_SIZE / 2
const CS = 30 // cell size

const PLAYER_STYLES = [
  { name: "Green", fill: "#16a34a", stroke: "#15803d", light: "#bbf7d0", bg: "#22c55e" },
  { name: "Red", fill: "#dc2626", stroke: "#b91c1c", light: "#fecaca", bg: "#ef4444" },
  { name: "Blue", fill: "#2563eb", stroke: "#1d4ed8", light: "#bfdbfe", bg: "#3b82f6" },
  { name: "Yellow", fill: "#ca8a04", stroke: "#a16207", light: "#fef08a", bg: "#eab308" },
  { name: "Purple", fill: "#9333ea", stroke: "#7e22ce", light: "#e9d5ff", bg: "#a855f7" },
] as const

// ─── Types ───────────────────────────────────────────────────────────────────

type Point = { x: number; y: number }

// ─── Geometry ────────────────────────────────────────────────────────────────

/** Map player index to arm index so track flows correctly */
function playerToArm(player: number, N: number): number {
  return player === 0 ? 0 : N - player
}

function getArmAngle(arm: number, N: number): number {
  return (2 * Math.PI * arm) / N - Math.PI / 2
}

/**
 * Get the screen position of a cell in the arm grid.
 * depth: 0 = tip (outermost), ARM_DEPTH-1 = center-adjacent (innermost)
 * col: -1 = left, 0 = center (home stretch / tip crossing), +1 = right
 */
function getArmCellPos(arm: number, depth: number, col: number, N: number): Point {
  const angle = getArmAngle(arm, N)
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  const perpX = -dirY
  const perpY = dirX
  const dist = (ARM_DEPTH - depth) * CS
  return {
    x: CX + dirX * dist + perpX * col * CS,
    y: CY + dirY * dist + perpY * col * CS,
  }
}

/** Convert absolute track index to screen position */
function trackIndexToPos(absIndex: number, N: number): Point {
  const section = Math.floor(absIndex / CELLS_PER_SIDE)
  const offset = absIndex % CELLS_PER_SIDE
  const arm = playerToArm(section, N)
  const nextArm = playerToArm((section + 1) % N, N)

  if (offset <= 4) {
    // Left column of this player's arm, going inward (depth 1→5)
    return getArmCellPos(arm, offset + 1, -1, N)
  } else if (offset <= 10) {
    // Right column of next player's arm, going outward (depth 5→0)
    return getArmCellPos(nextArm, 10 - offset, 1, N)
  } else if (offset === 11) {
    // Tip crossing of next player's arm
    return getArmCellPos(nextArm, 0, 0, N)
  } else {
    // Left column tip of next player's arm (depth 0)
    return getArmCellPos(nextArm, 0, -1, N)
  }
}

/** Convert home stretch index to screen position */
function homeStretchToPos(player: number, idx: number, N: number): Point {
  // idx 0 = entrance (near center, depth 5), idx 4 = near tip (depth 1)
  const arm = playerToArm(player, N)
  return getArmCellPos(arm, ARM_DEPTH - 1 - idx, 0, N)
}

/** Get home base token spots (4 positions in a 2x2 grid between arms) */
function getHomeBaseSpots(player: number, N: number): Point[] {
  const arm = playerToArm(player, N)
  const prevArm = (arm + 1) % N // previous arm in angular order (clockwise neighbor)
  const angle1 = getArmAngle(arm, N)
  const angle2 = getArmAngle(prevArm, N)
  const midAngle = (angle1 + angle2) / 2
  // Handle angle wrapping for the last player
  const angleDiff = angle2 - angle1
  const actualMidAngle = angleDiff > Math.PI
    ? angle1 + (angleDiff - 2 * Math.PI) / 2
    : angleDiff < -Math.PI
      ? angle1 + (angleDiff + 2 * Math.PI) / 2
      : midAngle

  const dist = ARM_DEPTH * CS * 0.55
  const bx = CX + Math.cos(actualMidAngle) * dist
  const by = CY + Math.sin(actualMidAngle) * dist

  // Perpendicular directions for the 2x2 grid
  const px = -Math.sin(actualMidAngle)
  const py = Math.cos(actualMidAngle)
  const dx = Math.cos(actualMidAngle)
  const dy = Math.sin(actualMidAngle)
  const sp = CS * 0.55

  return [
    { x: bx - px * sp - dx * sp, y: by - py * sp - dy * sp },
    { x: bx + px * sp - dx * sp, y: by + py * sp - dy * sp },
    { x: bx - px * sp + dx * sp, y: by - py * sp + dy * sp },
    { x: bx + px * sp + dx * sp, y: by + py * sp + dy * sp },
  ]
}

function isSafeCell(absTrackPos: number): boolean {
  const offset = absTrackPos % CELLS_PER_SIDE
  return offset === 0 || offset === 8 // entry cell + star cell
}

// ─── Build a lookup: arm cell key → track metadata ───────────────────────────

type CellMeta = {
  absIndex: number
  isEntry: boolean
  isSafe: boolean
  ownerPlayer: number // player whose section this cell belongs to
}

function buildTrackLookup(N: number): Map<string, CellMeta> {
  const totalCells = N * CELLS_PER_SIDE
  const lookup = new Map<string, CellMeta>()
  for (let i = 0; i < totalCells; i++) {
    const section = Math.floor(i / CELLS_PER_SIDE)
    const offset = i % CELLS_PER_SIDE
    const arm = playerToArm(section, N)
    const nextArm = playerToArm((section + 1) % N, N)
    let cArm: number, cDepth: number, cCol: number
    if (offset <= 4) {
      cArm = arm; cDepth = offset + 1; cCol = -1
    } else if (offset <= 10) {
      cArm = nextArm; cDepth = 10 - offset; cCol = 1
    } else if (offset === 11) {
      cArm = nextArm; cDepth = 0; cCol = 0
    } else {
      cArm = nextArm; cDepth = 0; cCol = -1
    }
    const key = `${cArm}-${cDepth}-${cCol}`
    lookup.set(key, {
      absIndex: i,
      isEntry: offset === 0,
      isSafe: offset === 0 || offset === 8,
      ownerPlayer: section,
    })
  }
  return lookup
}

// ─── Dice face ───────────────────────────────────────────────────────────────

const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
}

function DiceFace({ value }: { value: number }) {
  const dots = DICE_DOTS[value] ?? []
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16">
      <rect x="5" y="5" width="90" height="90" rx="14" fill="white" stroke="#94a3b8" strokeWidth="3" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#1e293b" />
      ))}
    </svg>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function Ludo() {
  const [playerCount, setPlayerCount] = useState(4)
  const [playerNames, setPlayerNames] = useState(["", "", "", "", ""])
  const [tokens, setTokens] = useState<number[][]>([])
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [diceValue, setDiceValue] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [hasRolled, setHasRolled] = useState(false)
  const [selectableTokens, setSelectableTokens] = useState<number[]>([])
  const [winner, setWinner] = useState<string | null>(null)
  const [showSetupSheet, setShowSetupSheet] = useState(true)
  const [consecutiveSixes, setConsecutiveSixes] = useState(0)
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalCells = playerCount * CELLS_PER_SIDE
  const finishDistance = totalCells + HOME_STRETCH_LENGTH

  const trackLookup = useMemo(() => buildTrackLookup(playerCount), [playerCount])

  useEffect(() => { setShowSetupSheet(true) }, [])
  useEffect(() => {
    return () => { if (rollIntervalRef.current) clearInterval(rollIntervalRef.current) }
  }, [])

  const getPlayerName = useCallback(
    (i: number) => playerNames[i]?.trim() || `Player ${PLAYER_STYLES[i]!.name}`,
    [playerNames],
  )

  const canMove = useCallback(
    (pos: number, dice: number): boolean => {
      if (pos === -1) return dice === 6
      if (pos >= finishDistance) return false
      return pos + dice <= finishDistance
    },
    [finishDistance],
  )

  // ─── Game actions ──────────────────────────────────────────────────────────

  const startGame = () => {
    setTokens(Array.from({ length: playerCount }, () => Array<number>(TOKENS_PER_PLAYER).fill(-1)))
    setCurrentPlayer(0)
    setDiceValue(null)
    setHasRolled(false)
    setSelectableTokens([])
    setWinner(null)
    setConsecutiveSixes(0)
    setShowSetupSheet(false)
  }

  const resetGame = () => {
    setShowSetupSheet(true)
    setDiceValue(null)
    setHasRolled(false)
    setSelectableTokens([])
    setWinner(null)
    setConsecutiveSixes(0)
  }

  const advanceTurn = useCallback(
    (extraTurn: boolean, currentTokens: number[][]) => {
      setHasRolled(false)
      setDiceValue(null)
      setSelectableTokens([])
      if (extraTurn) return
      let next = (currentPlayer + 1) % playerCount
      let attempts = 0
      while (attempts < playerCount) {
        if (!currentTokens[next]?.every((t) => t === finishDistance)) break
        next = (next + 1) % playerCount
        attempts++
      }
      setCurrentPlayer(next)
      setConsecutiveSixes(0)
    },
    [currentPlayer, playerCount, finishDistance],
  )

  const moveToken = useCallback(
    (tokenIndex: number, dice?: number) => {
      const d = dice ?? diceValue
      if (d === null || winner) return
      const newTokens = tokens.map((p) => [...p])
      const pos = newTokens[currentPlayer]![tokenIndex]!
      const newPos = pos === -1 ? 0 : pos + d
      let gotExtraTurn = d === 6
      let captured = false

      newTokens[currentPlayer]![tokenIndex] = newPos

      // Capture check (main track only)
      if (newPos >= 0 && newPos < totalCells) {
        const absPos = (currentPlayer * CELLS_PER_SIDE + newPos) % totalCells
        if (!isSafeCell(absPos)) {
          for (let pi = 0; pi < playerCount; pi++) {
            if (pi === currentPlayer) continue
            for (let ti = 0; ti < TOKENS_PER_PLAYER; ti++) {
              const oPos = newTokens[pi]![ti]!
              if (oPos >= 0 && oPos < totalCells) {
                const oAbs = (pi * CELLS_PER_SIDE + oPos) % totalCells
                if (oAbs === absPos) {
                  newTokens[pi]![ti] = -1
                  captured = true
                  toast(`${getPlayerName(currentPlayer)} captured ${getPlayerName(pi)}'s token!`, { duration: 2000 })
                }
              }
            }
          }
        }
      }
      if (newPos === finishDistance) {
        toast.success(`${getPlayerName(currentPlayer)} got a token home!`)
        gotExtraTurn = true
      }
      if (captured) gotExtraTurn = true
      setTokens(newTokens)
      setSelectableTokens([])
      if (newTokens[currentPlayer]!.every((t) => t === finishDistance)) {
        setWinner(getPlayerName(currentPlayer))
        setHasRolled(false)
        setDiceValue(null)
        toast.success(`${getPlayerName(currentPlayer)} wins!`, { duration: 5000 })
        return
      }
      advanceTurn(gotExtraTurn, newTokens)
    },
    [diceValue, winner, tokens, currentPlayer, totalCells, playerCount, finishDistance, getPlayerName, advanceTurn],
  )

  const rollDice = useCallback(() => {
    if (hasRolled || winner || isRolling) return
    setIsRolling(true)
    setSelectableTokens([])
    let count = 0
    rollIntervalRef.current = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      count++
      if (count >= 10) {
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
        rollIntervalRef.current = null
        const finalValue = Math.floor(Math.random() * 6) + 1
        setDiceValue(finalValue)
        setIsRolling(false)
        setHasRolled(true)
        if (finalValue === 6) {
          const newSixes = consecutiveSixes + 1
          setConsecutiveSixes(newSixes)
          if (newSixes >= 3) {
            toast.error(`${getPlayerName(currentPlayer)} rolled three 6s! Turn forfeited.`)
            setConsecutiveSixes(0)
            advanceTurn(false, tokens)
            return
          }
        } else {
          setConsecutiveSixes(0)
        }
        const playerTokens = tokens[currentPlayer]!
        const valid: number[] = []
        for (let i = 0; i < TOKENS_PER_PLAYER; i++) {
          if (canMove(playerTokens[i]!, finalValue)) valid.push(i)
        }
        if (valid.length === 0) {
          toast(`No valid moves for ${getPlayerName(currentPlayer)}`, { duration: 1500 })
          setTimeout(() => advanceTurn(finalValue === 6, tokens), 1000)
        } else if (valid.length === 1) {
          setTimeout(() => moveToken(valid[0]!, finalValue), 300)
        } else {
          setSelectableTokens(valid)
        }
      }
    }, 80)
  }, [hasRolled, winner, isRolling, consecutiveSixes, currentPlayer, tokens, canMove, getPlayerName, advanceTurn, moveToken])

  // ─── Token render data ─────────────────────────────────────────────────────

  const allTokenRenderData = useMemo(() => {
    if (tokens.length === 0) return []
    type TInfo = { pi: number; ti: number; pos: number; sp: Point; sel: boolean }
    const data: TInfo[] = []
    for (let pi = 0; pi < playerCount; pi++) {
      for (let ti = 0; ti < TOKENS_PER_PLAYER; ti++) {
        const pos = tokens[pi]?.[ti] ?? -1
        let sp: Point
        if (pos === -1) {
          sp = getHomeBaseSpots(pi, playerCount)[ti]!
        } else if (pos < totalCells) {
          const absPos = (pi * CELLS_PER_SIDE + pos) % totalCells
          sp = trackIndexToPos(absPos, playerCount)
        } else if (pos < finishDistance) {
          sp = homeStretchToPos(pi, pos - totalCells, playerCount)
        } else {
          const angle = getArmAngle(playerToArm(pi, playerCount), playerCount)
          sp = {
            x: CX + Math.cos(angle) * 16 + (ti % 2 === 0 ? -6 : 6),
            y: CY + Math.sin(angle) * 16 + (ti < 2 ? -6 : 6),
          }
        }
        data.push({ pi, ti, pos, sp: { ...sp }, sel: pi === currentPlayer && selectableTokens.includes(ti) })
      }
    }
    // Offset overlapping track tokens
    const groups = new Map<number, TInfo[]>()
    for (const d of data) {
      if (d.pos >= 0 && d.pos < totalCells) {
        const abs = (d.pi * CELLS_PER_SIDE + d.pos) % totalCells
        if (!groups.has(abs)) groups.set(abs, [])
        groups.get(abs)!.push(d)
      }
    }
    const offsets: Point[][] = [[], [{ x: 0, y: 0 }], [{ x: -5, y: 0 }, { x: 5, y: 0 }],
      [{ x: -5, y: -4 }, { x: 5, y: -4 }, { x: 0, y: 5 }],
      [{ x: -5, y: -5 }, { x: 5, y: -5 }, { x: -5, y: 5 }, { x: 5, y: 5 }]]
    for (const g of groups.values()) {
      if (g.length > 1) {
        const os = offsets[Math.min(g.length, 4)]!
        g.forEach((d, i) => { const o = os[i % os.length]!; d.sp = { x: d.sp.x + o.x, y: d.sp.y + o.y } })
      }
    }
    return data
  }, [tokens, playerCount, totalCells, finishDistance, currentPlayer, selectableTokens])

  // ─── Arm cells data for rendering ──────────────────────────────────────────

  const armCellsData = useMemo(() => {
    const cells: Array<{
      arm: number; depth: number; col: number
      pos: Point; angleDeg: number
      type: "track" | "home_stretch"
      trackMeta: CellMeta | null
      hsPlayer: number | null
    }> = []

    for (let arm = 0; arm < playerCount; arm++) {
      const angleDeg = (getArmAngle(arm, playerCount) * 180) / Math.PI
      for (let depth = 0; depth < ARM_DEPTH; depth++) {
        for (const col of [-1, 0, 1]) {
          const isHomeStretch = col === 0 && depth > 0
          const key = `${arm}-${depth}-${col}`
          const trackMeta = trackLookup.get(key) ?? null
          // Find which player owns this arm for home stretch coloring
          let hsPlayer: number | null = null
          if (isHomeStretch) {
            for (let p = 0; p < playerCount; p++) {
              if (playerToArm(p, playerCount) === arm) { hsPlayer = p; break }
            }
          }
          cells.push({
            arm, depth, col,
            pos: getArmCellPos(arm, depth, col, playerCount),
            angleDeg,
            type: isHomeStretch ? "home_stretch" : "track",
            trackMeta,
            hsPlayer,
          })
        }
      }
    }
    return cells
  }, [playerCount, trackLookup])

  // ─── Render ────────────────────────────────────────────────────────────────

  const tokenR = CS * 0.38

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ludo</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSetupSheet(true)}>
              <Settings className="mr-2 h-4 w-4" />Setup
            </Button>
            <Button variant="ghost" size="icon" onClick={resetGame}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className={cn("rounded-lg border p-3 transition-colors", winner ? "border-green-400 bg-green-100 dark:bg-green-900/20" : "bg-muted/20")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={cn("text-sm font-semibold", winner && "text-green-700 dark:text-green-400")}>
                {winner ? `Winner: ${winner}!` : tokens.length > 0 ? `Turn: ${getPlayerName(currentPlayer)}` : "Set up the game to start"}
              </div>
              {tokens.length > 0 && !winner && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PLAYER_STYLES[currentPlayer]!.fill }} />
                  <span className="text-xs text-muted-foreground">{playerCount} players · {PLAYER_STYLES[currentPlayer]!.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Game area */}
          {tokens.length > 0 && (
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Board SVG */}
              <div className="flex flex-1 justify-center">
                <div className="w-full max-w-[560px]">
                  <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="h-auto w-full">
                    {/* Background sectors (colored triangles from center to arm edges) */}
                    {Array.from({ length: playerCount }, (_, i) => {
                      const arm = playerToArm(i, playerCount)
                      const a1 = getArmAngle(arm, playerCount)
                      const r = ARM_DEPTH * CS + CS * 0.5
                      const halfAngle = Math.PI / playerCount
                      const p1x = CX + Math.cos(a1 - halfAngle) * r
                      const p1y = CY + Math.sin(a1 - halfAngle) * r
                      const p2x = CX + Math.cos(a1 + halfAngle) * r
                      const p2y = CY + Math.sin(a1 + halfAngle) * r
                      return (
                        <polygon
                          key={`bg-${i}`}
                          points={`${CX},${CY} ${p1x},${p1y} ${p2x},${p2y}`}
                          fill={PLAYER_STYLES[i]!.light}
                          opacity="0.2"
                        />
                      )
                    })}

                    {/* Home bases (colored areas between arms) */}
                    {Array.from({ length: playerCount }, (_, pi) => {
                      const spots = getHomeBaseSpots(pi, playerCount)
                      const xs = spots.map((s) => s.x)
                      const ys = spots.map((s) => s.y)
                      const pad = CS * 0.8
                      const mx = (Math.min(...xs) + Math.max(...xs)) / 2
                      const my = (Math.min(...ys) + Math.max(...ys)) / 2
                      const arm = playerToArm(pi, playerCount)
                      const angleDeg = (getArmAngle(arm, playerCount) * 180) / Math.PI
                      // Draw rotated home base rectangle
                      const hw = pad + CS * 0.2
                      const hh = pad + CS * 0.2
                      return (
                        <g key={`hb-${pi}`}>
                          <rect
                            x={mx - hw}
                            y={my - hh}
                            width={hw * 2}
                            height={hh * 2}
                            rx="12"
                            fill={PLAYER_STYLES[pi]!.bg}
                            stroke={PLAYER_STYLES[pi]!.stroke}
                            strokeWidth="2"
                            opacity="0.85"
                          />
                          {/* 4 token slots */}
                          {spots.map((spot, si) => (
                            <circle
                              key={si}
                              cx={spot.x}
                              cy={spot.y}
                              r={tokenR + 2}
                              fill={PLAYER_STYLES[pi]!.light}
                              stroke={PLAYER_STYLES[pi]!.stroke}
                              strokeWidth="1.5"
                              opacity="0.7"
                            />
                          ))}
                          {/* Player label */}
                          <text
                            x={mx}
                            y={my}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill="white"
                            opacity="0.6"
                            transform={`rotate(${angleDeg + 90}, ${mx}, ${my})`}
                          >
                            {getPlayerName(pi).toUpperCase()}
                          </text>
                        </g>
                      )
                    })}

                    {/* Grid cells (arms) */}
                    {armCellsData.map((cell) => {
                      const { pos, angleDeg, type, trackMeta, hsPlayer, arm, depth, col } = cell
                      let fillColor = "#ffffff"
                      let strokeColor = "#cbd5e1"
                      let strokeW = 1
                      let label: string | null = null
                      let labelColor = "#666"

                      if (type === "home_stretch" && hsPlayer !== null) {
                        fillColor = PLAYER_STYLES[hsPlayer]!.light
                        strokeColor = PLAYER_STYLES[hsPlayer]!.stroke
                        strokeW = 1.5
                      } else if (trackMeta) {
                        if (trackMeta.isEntry) {
                          fillColor = PLAYER_STYLES[trackMeta.ownerPlayer]!.light
                          strokeColor = PLAYER_STYLES[trackMeta.ownerPlayer]!.stroke
                          strokeW = 2
                          label = "\u25B6" // arrow
                          labelColor = PLAYER_STYLES[trackMeta.ownerPlayer]!.fill
                        } else if (trackMeta.isSafe) {
                          fillColor = "#fef3c7"
                          strokeColor = "#f59e0b"
                          strokeW = 1.5
                          label = "\u2605" // star
                          labelColor = "#d97706"
                        }
                      }

                      return (
                        <g key={`cell-${arm}-${depth}-${col}`}>
                          <rect
                            x={pos.x - CS / 2}
                            y={pos.y - CS / 2}
                            width={CS}
                            height={CS}
                            rx="3"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={strokeW}
                            transform={`rotate(${angleDeg}, ${pos.x}, ${pos.y})`}
                          />
                          {label && (
                            <text
                              x={pos.x}
                              y={pos.y + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="12"
                              fill={labelColor}
                              style={{ pointerEvents: "none" }}
                            >
                              {label}
                            </text>
                          )}
                        </g>
                      )
                    })}

                    {/* Center goal (colored polygon) */}
                    {(() => {
                      const r = CS * 1.1
                      const pts = Array.from({ length: playerCount }, (_, i) => {
                        const arm = playerToArm(i, playerCount)
                        const a = getArmAngle(arm, playerCount)
                        return `${CX + Math.cos(a) * r},${CY + Math.sin(a) * r}`
                      }).join(" ")
                      return (
                        <g>
                          {/* Colored triangular sectors */}
                          {Array.from({ length: playerCount }, (_, i) => {
                            const arm = playerToArm(i, playerCount)
                            const a1 = getArmAngle(arm, playerCount)
                            const nextArm = playerToArm((i + 1) % playerCount, playerCount)
                            const a2 = getArmAngle(nextArm, playerCount)
                            return (
                              <polygon
                                key={`center-${i}`}
                                points={`${CX},${CY} ${CX + Math.cos(a1) * r},${CY + Math.sin(a1) * r} ${CX + Math.cos(a2) * r},${CY + Math.sin(a2) * r}`}
                                fill={PLAYER_STYLES[i]!.bg}
                                stroke="white"
                                strokeWidth="1"
                                opacity="0.8"
                              />
                            )
                          })}
                          <polygon points={pts} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                          <circle cx={CX} cy={CY} r={CS * 0.35} fill="white" stroke="#94a3b8" strokeWidth="1" />
                          <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="bold" fill="#64748b">
                            HOME
                          </text>
                        </g>
                      )
                    })()}

                    {/* Tokens */}
                    {allTokenRenderData.map((t) => (
                      <g key={`tk-${t.pi}-${t.ti}`}>
                        {t.sel && (
                          <circle cx={t.sp.x} cy={t.sp.y} r={tokenR + 3} fill="none" stroke={PLAYER_STYLES[t.pi]!.fill} strokeWidth="2">
                            <animate attributeName="r" from={tokenR + 1} to={tokenR + 10} dur="0.9s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.7" to="0" dur="0.9s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <circle
                          cx={t.sp.x}
                          cy={t.sp.y}
                          r={t.sel ? tokenR + 2 : tokenR}
                          fill={PLAYER_STYLES[t.pi]!.fill}
                          stroke={t.sel ? "#ffffff" : PLAYER_STYLES[t.pi]!.stroke}
                          strokeWidth={t.sel ? 2.5 : 1.5}
                          style={{
                            cursor: t.sel ? "pointer" : "default",
                            filter: t.sel ? "drop-shadow(0 0 6px rgba(255,255,255,0.9))" : undefined,
                          }}
                          onClick={() => t.sel && moveToken(t.ti)}
                        />
                        <text
                          x={t.sp.x}
                          y={t.sp.y + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="8"
                          fontWeight="bold"
                          fill="white"
                          style={{ pointerEvents: "none" }}
                        >
                          {t.ti + 1}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-full space-y-4 lg:w-56">
                {/* Dice */}
                <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
                  <div className={cn("transition-transform", isRolling && "animate-bounce")}>
                    {diceValue ? <DiceFace value={diceValue} /> : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-400">Roll</div>
                    )}
                  </div>
                  <Button onClick={rollDice} disabled={hasRolled || !!winner || isRolling || tokens.length === 0} className="w-full" size="sm">
                    {isRolling ? "Rolling..." : selectableTokens.length > 0 ? "Select a token" : "Roll Dice"}
                  </Button>
                  {selectableTokens.length > 0 && (
                    <p className="text-center text-xs text-muted-foreground">Click a glowing token on the board</p>
                  )}
                </div>

                {/* Players */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Players</Label>
                  {Array.from({ length: playerCount }, (_, i) => {
                    const pts = tokens[i] ?? []
                    const atHome = pts.filter((t) => t === -1).length
                    const onBoard = pts.filter((t) => t >= 0 && t < finishDistance).length
                    const finished = pts.filter((t) => t === finishDistance).length
                    const isCurrent = i === currentPlayer && !winner
                    return (
                      <div
                        key={i}
                        className={cn("flex items-center gap-2 rounded-lg border p-2 text-xs transition-all", isCurrent && "ring-2 ring-offset-1 ring-offset-background")}
                        style={isCurrent ? { borderColor: PLAYER_STYLES[i]!.fill, ["--tw-ring-color" as string]: PLAYER_STYLES[i]!.fill } : undefined}
                      >
                        <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: PLAYER_STYLES[i]!.fill }} />
                        <span className="flex-1 truncate font-medium">{getPlayerName(i)}</span>
                        <div className="flex gap-1.5 text-muted-foreground">
                          <span title="At home">H:{atHome}</span>
                          <span title="On board">B:{onBoard}</span>
                          <span title="Finished">F:{finished}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quick rules */}
                <div className="space-y-1 rounded-lg border p-3 text-[10px] text-muted-foreground">
                  <p className="text-xs font-medium text-foreground">Quick rules</p>
                  <p>Roll 6 to enter a token</p>
                  <p>6 = extra turn</p>
                  <p>Land on opponent = capture</p>
                  <p>Exact roll to finish</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup sheet */}
      <Sheet open={showSetupSheet} onOpenChange={setShowSetupSheet}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader className="pb-2">
            <SheetTitle>Setup Ludo</SheetTitle>
            <SheetDescription>Choose number of players and enter names. Board shape changes with player count.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Number of Players</Label>
              <div className="grid grid-cols-3 gap-2">
                {([3, 4, 5] as const).map((n) => (
                  <Button key={n} variant={playerCount === n ? "secondary" : "outline"} onClick={() => setPlayerCount(n)} className="flex h-auto flex-col gap-1 py-3">
                    <span className="text-lg font-bold">{n}</span>
                    <span className="text-[10px] text-muted-foreground">{n === 3 ? "Triangle" : n === 4 ? "Square" : "Pentagon"}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Player Names</Label>
              <div className="space-y-2">
                {Array.from({ length: playerCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: PLAYER_STYLES[i]!.fill }} />
                    <Input
                      placeholder={`Player ${PLAYER_STYLES[i]!.name}`}
                      value={playerNames[i] ?? ""}
                      onChange={(e) => { const n = [...playerNames]; n[i] = e.target.value; setPlayerNames(n) }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1 rounded-lg border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Rules</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Roll 6 to move a token out of home</li>
                <li>Rolling 6 gives an extra turn</li>
                <li>Landing on an opponent sends them home</li>
                <li>Star cells are safe zones (no captures)</li>
                <li>Exact roll needed to reach the center</li>
                <li>Three 6s in a row forfeits your turn</li>
                <li>First to get all 4 tokens home wins!</li>
              </ul>
            </div>
            <Button onClick={startGame} className="w-full">Start Game</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
