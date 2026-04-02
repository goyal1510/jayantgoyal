let audioCtx: AudioContext | null = null

/**
 * Plays a short, subtle chime to accompany toasts.
 * No-op on the server or if Web Audio is unavailable.
 */
export async function playToastSound() {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return

  audioCtx = audioCtx ?? new AudioContext()
  try {
    // Resume in case the context was suspended by the browser.
    if (audioCtx.state === "suspended") {
      await audioCtx.resume()
    }

    const duration = 0.18
    const oscillator = audioCtx.createOscillator()
    const gain = audioCtx.createGain()

    oscillator.type = "triangle"
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)

    const now = audioCtx.currentTime
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscillator.connect(gain)
    gain.connect(audioCtx.destination)

    oscillator.start(now)
    oscillator.stop(now + duration)
  } catch (error) {
    console.warn("Unable to play toast sound", error)
  }
}
