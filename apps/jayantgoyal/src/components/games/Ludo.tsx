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

const CELLS_PER_SIDE = 9
const HOME_STRETCH_LENGTH = 5
const TOKENS_PER_PLAYER = 4
const SVG_SIZE = 600
const CX = SVG_SIZE / 2
const CY = SVG_SIZE / 2
const POLYGON_RADIUS = 220

const PLAYER_STYLES = [
  { name: "Red", fill: "#ef4444", stroke: "#b91c1c", light: "#fee2e2" },
  { name: "Blue", fill: "#3b82f6", stroke: "#1d4ed8", light: "#dbeafe" },
  { name: "Green", fill: "#22c55e", stroke: "#15803d", light: "#dcfce7" },
  { name: "Yellow", fill: "#eab308", stroke: "#a16207", light: "#fef9c3" },
  { name: "Purple", fill: "#a855f7", stroke: "#7e22ce", light: "#f3e8ff" },
] as const

// ─── Types ───────────────────────────────────────────────────────────────────

type Point = { x: number; y: number }

// ─── Geometry helpers (pure functions, defined outside component) ─────────────

function getVertices(n: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return {
      x: CX + POLYGON_RADIUS * Math.cos(angle),
      y: CY + POLYGON_RADIUS * Math.sin(angle),
    }
  })
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function getTrackCellPos(absIndex: number, vertices: Point[]): Point {
  const n = vertices.length
  const side = Math.floor(absIndex / CELLS_PER_SIDE)
  const offset = absIndex % CELLS_PER_SIDE
  const v1 = vertices[side % n]!
  const v2 = vertices[(side + 1) % n]!
  const t = (offset + 0.5) / CELLS_PER_SIDE
  return lerp(v1, v2, t)
}

function getHomeStretchPos(
  playerIndex: number,
  cellIndex: number,
  vertices: Point[],
): Point {
  const vertex = vertices[playerIndex]!
  const center: Point = { x: CX, y: CY }
  const t = (cellIndex + 1) / (HOME_STRETCH_LENGTH + 1.5)
  return lerp(vertex, center, t)
}

function getHomeBasePositions(playerIndex: number, vertices: Point[]): Point[] {
  const n = vertices.length
  const v1 = vertices[playerIndex]!
  const v2 = vertices[(playerIndex + 1) % n]!
  const mid = lerp(v1, v2, 0.5)
  const dx = mid.x - CX
  const dy = mid.y - CY
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return Array(4).fill({ x: mid.x, y: mid.y })

  const outDist = 45
  const baseX = mid.x + (dx / len) * outDist
  const baseY = mid.y + (dy / len) * outDist

  const perpX = -dy / len
  const perpY = dx / len
  const spacing = 14
  const radial = 7

  return [
    {
      x: baseX - perpX * spacing + (dx / len) * radial,
      y: baseY - perpY * spacing + (dy / len) * radial,
    },
    {
      x: baseX + perpX * spacing + (dx / len) * radial,
      y: baseY + perpY * spacing + (dy / len) * radial,
    },
    {
      x: baseX - perpX * spacing - (dx / len) * radial,
      y: baseY - perpY * spacing - (dy / len) * radial,
    },
    {
      x: baseX + perpX * spacing - (dx / len) * radial,
      y: baseY + perpY * spacing - (dy / len) * radial,
    },
  ]
}

function isSafeCell(absTrackPos: number): boolean {
  return absTrackPos % CELLS_PER_SIDE === Math.floor(CELLS_PER_SIDE / 2)
}

function isEntryCell(absTrackPos: number): boolean {
  return absTrackPos % CELLS_PER_SIDE === 0
}

// ─── Dice face SVG ───────────────────────────────────────────────────────────

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
    <svg viewBox="0 0 100 100" className="w-16 h-16">
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="14"
        fill="white"
        stroke="#94a3b8"
        strokeWidth="3"
      />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="9" fill="#1e293b" />
      ))}
    </svg>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function Ludo() {
  const [playerCount, setPlayerCount] = useState(4)
  const [playerNames, setPlayerNames] = useState(["", "", "", "", ""])
  // tokens[player][token] = distance from entry
  // -1 = home, 0..totalCells-1 = track, totalCells..totalCells+HSL-1 = home stretch, totalCells+HSL = finished
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
  const vertices = useMemo(() => getVertices(playerCount), [playerCount])
  const cellRadius = playerCount <= 3 ? 14 : playerCount === 4 ? 12 : 10
  const tokenRadius = cellRadius - 1

  useEffect(() => {
    setShowSetupSheet(true)
  }, [])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current)
    }
  }, [])

  const getPlayerName = useCallback(
    (index: number) =>
      playerNames[index]?.trim() || `Player ${PLAYER_STYLES[index]!.name}`,
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

  // ─── Game actions ────────────────────────────────────────────────────────

  const startGame = () => {
    const newTokens = Array.from({ length: playerCount }, () =>
      Array<number>(TOKENS_PER_PLAYER).fill(-1),
    )
    setTokens(newTokens)
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
      let newPos: number
      let gotExtraTurn = d === 6
      let captured = false

      if (pos === -1) {
        newPos = 0
      } else {
        newPos = pos + d
      }

      newTokens[currentPlayer]![tokenIndex] = newPos

      // Capture check (only on main track)
      if (newPos >= 0 && newPos < totalCells) {
        const absPos =
          (currentPlayer * CELLS_PER_SIDE + newPos) % totalCells
        if (!isSafeCell(absPos)) {
          for (let pi = 0; pi < playerCount; pi++) {
            if (pi === currentPlayer) continue
            for (let ti = 0; ti < TOKENS_PER_PLAYER; ti++) {
              const oPos = newTokens[pi]![ti]!
              if (oPos >= 0 && oPos < totalCells) {
                const oAbs =
                  (pi * CELLS_PER_SIDE + oPos) % totalCells
                if (oAbs === absPos) {
                  newTokens[pi]![ti] = -1
                  captured = true
                  toast(
                    `${getPlayerName(currentPlayer)} captured ${getPlayerName(pi)}'s token!`,
                    { duration: 2000 },
                  )
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

      // Check win
      if (newTokens[currentPlayer]!.every((t) => t === finishDistance)) {
        setWinner(getPlayerName(currentPlayer))
        setHasRolled(false)
        setDiceValue(null)
        toast.success(`${getPlayerName(currentPlayer)} wins!`, {
          duration: 5000,
        })
        return
      }

      advanceTurn(gotExtraTurn, newTokens)
    },
    [
      diceValue,
      winner,
      tokens,
      currentPlayer,
      totalCells,
      playerCount,
      finishDistance,
      getPlayerName,
      advanceTurn,
    ],
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

        // Three consecutive 6s check
        if (finalValue === 6) {
          const newSixes = consecutiveSixes + 1
          setConsecutiveSixes(newSixes)
          if (newSixes >= 3) {
            toast.error(
              `${getPlayerName(currentPlayer)} rolled three 6s! Turn forfeited.`,
            )
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
          toast(`No valid moves for ${getPlayerName(currentPlayer)}`, {
            duration: 1500,
          })
          setTimeout(() => advanceTurn(finalValue === 6, tokens), 1000)
        } else if (valid.length === 1) {
          setTimeout(() => moveToken(valid[0]!, finalValue), 300)
        } else {
          setSelectableTokens(valid)
        }
      }
    }, 80)
  }, [
    hasRolled,
    winner,
    isRolling,
    consecutiveSixes,
    currentPlayer,
    tokens,
    canMove,
    getPlayerName,
    advanceTurn,
    moveToken,
  ])

  // ─── Token render data ──────────────────────────────────────────────────

  const allTokenRenderData = useMemo(() => {
    if (tokens.length === 0) return []

    type TokenInfo = {
      playerIndex: number
      tokenIndex: number
      pos: number
      screenPos: Point
      isSelectable: boolean
    }

    const data: TokenInfo[] = []

    for (let pi = 0; pi < playerCount; pi++) {
      for (let ti = 0; ti < TOKENS_PER_PLAYER; ti++) {
        const pos = tokens[pi]?.[ti] ?? -1
        let screenPos: Point

        if (pos === -1) {
          screenPos = getHomeBasePositions(pi, vertices)[ti]!
        } else if (pos < totalCells) {
          const absPos = (pi * CELLS_PER_SIDE + pos) % totalCells
          screenPos = getTrackCellPos(absPos, vertices)
        } else if (pos < finishDistance) {
          screenPos = getHomeStretchPos(pi, pos - totalCells, vertices)
        } else {
          // Finished — position near center grouped by player
          const angle = (2 * Math.PI * pi) / playerCount - Math.PI / 2
          const r = 18
          screenPos = {
            x: CX + r * Math.cos(angle) + (ti % 2 === 0 ? -6 : 6),
            y: CY + r * Math.sin(angle) + (ti < 2 ? -6 : 6),
          }
        }

        data.push({
          playerIndex: pi,
          tokenIndex: ti,
          pos,
          screenPos: { ...screenPos },
          isSelectable:
            pi === currentPlayer && selectableTokens.includes(ti),
        })
      }
    }

    // Offset overlapping tokens on the same track cell
    const trackGroups = new Map<number, TokenInfo[]>()
    for (const d of data) {
      if (d.pos >= 0 && d.pos < totalCells) {
        const abs =
          (d.playerIndex * CELLS_PER_SIDE + d.pos) % totalCells
        if (!trackGroups.has(abs)) trackGroups.set(abs, [])
        trackGroups.get(abs)!.push(d)
      }
    }
    const groupOffsets: Point[][] = [
      [],
      [{ x: 0, y: 0 }],
      [{ x: -5, y: 0 }, { x: 5, y: 0 }],
      [{ x: -5, y: -5 }, { x: 5, y: -5 }, { x: 0, y: 5 }],
      [
        { x: -5, y: -5 },
        { x: 5, y: -5 },
        { x: -5, y: 5 },
        { x: 5, y: 5 },
      ],
    ]
    for (const group of trackGroups.values()) {
      if (group.length > 1) {
        const offsets = groupOffsets[Math.min(group.length, 4)]!
        group.forEach((d, i) => {
          const o = offsets[i % offsets.length]!
          d.screenPos = {
            x: d.screenPos.x + o.x,
            y: d.screenPos.y + o.y,
          }
        })
      }
    }

    return data
  }, [
    tokens,
    playerCount,
    totalCells,
    finishDistance,
    vertices,
    currentPlayer,
    selectableTokens,
  ])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ludo</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSetupSheet(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Setup
            </Button>
            <Button variant="ghost" size="icon" onClick={resetGame}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ── Status bar ────────────────────────────────────────────── */}
          <div
            className={cn(
              "rounded-lg border p-3 transition-colors",
              winner
                ? "border-green-400 bg-green-100 dark:bg-green-900/20"
                : "bg-muted/20",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                className={cn(
                  "text-sm font-semibold",
                  winner && "text-green-700 dark:text-green-400",
                )}
              >
                {winner
                  ? `Winner: ${winner}!`
                  : tokens.length > 0
                    ? `Turn: ${getPlayerName(currentPlayer)}`
                    : "Set up the game to start"}
              </div>
              {tokens.length > 0 && !winner && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: PLAYER_STYLES[currentPlayer]!.fill,
                    }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {playerCount} players ·{" "}
                    {PLAYER_STYLES[currentPlayer]!.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Game area ─────────────────────────────────────────────── */}
          {tokens.length > 0 && (
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Board */}
              <div className="flex flex-1 justify-center">
                <div className="w-full max-w-[520px]">
                  <svg
                    viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                    className="h-auto w-full"
                  >
                    {/* Polygon sector fills */}
                    {vertices.map((v, i) => {
                      const v2 = vertices[(i + 1) % playerCount]!
                      return (
                        <polygon
                          key={`sector-${i}`}
                          points={`${CX},${CY} ${v.x},${v.y} ${v2.x},${v2.y}`}
                          fill={PLAYER_STYLES[i]!.light}
                          opacity="0.35"
                        />
                      )
                    })}

                    {/* Polygon outline */}
                    <polygon
                      points={vertices
                        .map((v) => `${v.x},${v.y}`)
                        .join(" ")}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="2"
                    />

                    {/* Track cells */}
                    {Array.from({ length: totalCells }, (_, i) => {
                      const pos = getTrackCellPos(i, vertices)
                      const safe = isSafeCell(i)
                      const entry = isEntryCell(i)
                      const ownerSide = Math.floor(i / CELLS_PER_SIDE)
                      return (
                        <g key={`track-${i}`}>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={cellRadius}
                            fill={
                              entry
                                ? PLAYER_STYLES[ownerSide]!.light
                                : safe
                                  ? "#fef3c7"
                                  : "#ffffff"
                            }
                            stroke={
                              entry
                                ? PLAYER_STYLES[ownerSide]!.stroke
                                : safe
                                  ? "#f59e0b"
                                  : "#cbd5e1"
                            }
                            strokeWidth="1.5"
                          />
                          {safe && (
                            <text
                              x={pos.x}
                              y={pos.y + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="10"
                              fill="#d97706"
                            >
                              ★
                            </text>
                          )}
                          {entry && (
                            <text
                              x={pos.x}
                              y={pos.y + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="7"
                              fontWeight="bold"
                              fill={PLAYER_STYLES[ownerSide]!.stroke}
                            >
                              S
                            </text>
                          )}
                        </g>
                      )
                    })}

                    {/* Home stretch cells */}
                    {Array.from({ length: playerCount }, (_, pi) =>
                      Array.from(
                        { length: HOME_STRETCH_LENGTH },
                        (_, ci) => {
                          const pos = getHomeStretchPos(
                            pi,
                            ci,
                            vertices,
                          )
                          return (
                            <circle
                              key={`hs-${pi}-${ci}`}
                              cx={pos.x}
                              cy={pos.y}
                              r={cellRadius}
                              fill={PLAYER_STYLES[pi]!.light}
                              stroke={PLAYER_STYLES[pi]!.stroke}
                              strokeWidth="1.5"
                            />
                          )
                        },
                      ),
                    )}

                    {/* Center goal */}
                    <circle
                      cx={CX}
                      cy={CY}
                      r={24}
                      fill="#fbbf24"
                      stroke="#d97706"
                      strokeWidth="2"
                    />
                    <text
                      x={CX}
                      y={CY + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#92400e"
                    >
                      HOME
                    </text>

                    {/* Home bases */}
                    {Array.from({ length: playerCount }, (_, pi) => {
                      const spots = getHomeBasePositions(pi, vertices)
                      const xs = spots.map((s) => s.x)
                      const ys = spots.map((s) => s.y)
                      const pad = 14
                      const minX = Math.min(...xs) - pad
                      const minY = Math.min(...ys) - pad
                      const maxX = Math.max(...xs) + pad
                      const maxY = Math.max(...ys) + pad
                      return (
                        <g key={`hb-${pi}`}>
                          <rect
                            x={minX}
                            y={minY}
                            width={maxX - minX}
                            height={maxY - minY}
                            rx="10"
                            fill={PLAYER_STYLES[pi]!.light}
                            stroke={PLAYER_STYLES[pi]!.stroke}
                            strokeWidth="1.5"
                            opacity="0.6"
                          />
                          {spots.map((spot, si) => (
                            <circle
                              key={si}
                              cx={spot.x}
                              cy={spot.y}
                              r={9}
                              fill="white"
                              stroke={PLAYER_STYLES[pi]!.stroke}
                              strokeWidth="1"
                              opacity="0.5"
                            />
                          ))}
                        </g>
                      )
                    })}

                    {/* Tokens */}
                    {allTokenRenderData.map((t) => (
                      <g
                        key={`token-${t.playerIndex}-${t.tokenIndex}`}
                      >
                        {/* Pulse ring for selectable tokens */}
                        {t.isSelectable && (
                          <circle
                            cx={t.screenPos.x}
                            cy={t.screenPos.y}
                            r={tokenRadius + 4}
                            fill="none"
                            stroke={
                              PLAYER_STYLES[t.playerIndex]!.fill
                            }
                            strokeWidth="2"
                          >
                            <animate
                              attributeName="r"
                              from={tokenRadius + 2}
                              to={tokenRadius + 12}
                              dur="0.9s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              from="0.7"
                              to="0"
                              dur="0.9s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                        {/* Token body */}
                        <circle
                          cx={t.screenPos.x}
                          cy={t.screenPos.y}
                          r={
                            t.isSelectable
                              ? tokenRadius + 2
                              : tokenRadius
                          }
                          fill={PLAYER_STYLES[t.playerIndex]!.fill}
                          stroke={
                            t.isSelectable
                              ? "#ffffff"
                              : PLAYER_STYLES[t.playerIndex]!.stroke
                          }
                          strokeWidth={t.isSelectable ? 2.5 : 1.5}
                          style={{
                            cursor: t.isSelectable
                              ? "pointer"
                              : "default",
                            filter: t.isSelectable
                              ? "drop-shadow(0 0 4px rgba(255,255,255,0.8))"
                              : undefined,
                          }}
                          onClick={() =>
                            t.isSelectable &&
                            moveToken(t.tokenIndex)
                          }
                        />
                        {/* Token number label */}
                        <text
                          x={t.screenPos.x}
                          y={t.screenPos.y + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="8"
                          fontWeight="bold"
                          fill="white"
                          style={{ pointerEvents: "none" }}
                        >
                          {t.tokenIndex + 1}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* ── Sidebar ──────────────────────────────────────────── */}
              <div className="w-full space-y-4 lg:w-56">
                {/* Dice */}
                <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
                  <div
                    className={cn(
                      "transition-transform",
                      isRolling && "animate-bounce",
                    )}
                  >
                    {diceValue ? (
                      <DiceFace value={diceValue} />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-xs text-slate-400">
                        Roll
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={rollDice}
                    disabled={
                      hasRolled ||
                      !!winner ||
                      isRolling ||
                      tokens.length === 0
                    }
                    className="w-full"
                    size="sm"
                  >
                    {isRolling
                      ? "Rolling..."
                      : selectableTokens.length > 0
                        ? "Select a token"
                        : "Roll Dice"}
                  </Button>
                  {selectableTokens.length > 0 && (
                    <p className="text-center text-xs text-muted-foreground">
                      Click a glowing token on the board
                    </p>
                  )}
                </div>

                {/* Player list */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Players</Label>
                  {Array.from({ length: playerCount }, (_, i) => {
                    const pts = tokens[i] ?? []
                    const atHome = pts.filter(
                      (t) => t === -1,
                    ).length
                    const onBoard = pts.filter(
                      (t) => t >= 0 && t < finishDistance,
                    ).length
                    const finished = pts.filter(
                      (t) => t === finishDistance,
                    ).length
                    const isCurrent =
                      i === currentPlayer && !winner
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-2 text-xs transition-all",
                          isCurrent &&
                            "ring-2 ring-offset-1 ring-offset-background",
                        )}
                        style={
                          isCurrent
                            ? {
                                borderColor:
                                  PLAYER_STYLES[i]!.fill,
                                // ring color via CSS var
                                ["--tw-ring-color" as string]:
                                  PLAYER_STYLES[i]!.fill,
                              }
                            : undefined
                        }
                      >
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              PLAYER_STYLES[i]!.fill,
                          }}
                        />
                        <span className="flex-1 truncate font-medium">
                          {getPlayerName(i)}
                        </span>
                        <div className="flex gap-1.5 text-muted-foreground">
                          <span title="At home">
                            H:{atHome}
                          </span>
                          <span title="On board">
                            B:{onBoard}
                          </span>
                          <span title="Finished">
                            F:{finished}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Rules reminder */}
                <div className="space-y-1 rounded-lg border p-3 text-[10px] text-muted-foreground">
                  <p className="text-xs font-medium text-foreground">
                    Quick rules
                  </p>
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

      {/* ── Setup sheet ──────────────────────────────────────────────── */}
      <Sheet open={showSetupSheet} onOpenChange={setShowSetupSheet}>
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader className="pb-2">
            <SheetTitle>Setup Ludo</SheetTitle>
            <SheetDescription>
              Choose number of players and enter names. The board shape
              changes based on player count.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-4">
            {/* Player count */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Number of Players
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {([3, 4, 5] as const).map((n) => (
                  <Button
                    key={n}
                    variant={
                      playerCount === n ? "secondary" : "outline"
                    }
                    onClick={() => setPlayerCount(n)}
                    className="flex h-auto flex-col gap-1 py-3"
                  >
                    <span className="text-lg font-bold">{n}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {n === 3
                        ? "Triangle"
                        : n === 4
                          ? "Square"
                          : "Pentagon"}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Player names */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Player Names
              </Label>
              <div className="space-y-2">
                {Array.from({ length: playerCount }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{
                        backgroundColor: PLAYER_STYLES[i]!.fill,
                      }}
                    />
                    <Input
                      placeholder={`Player ${PLAYER_STYLES[i]!.name}`}
                      value={playerNames[i] ?? ""}
                      onChange={(e) => {
                        const names = [...playerNames]
                        names[i] = e.target.value
                        setPlayerNames(names)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Rules */}
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

            <Button onClick={startGame} className="w-full">
              Start Game
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
