function writeStr(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

/**
 * Generates a mono sine or square wave as a WAV data URL.
 * Used to create placeholder audio assets without requiring real audio files.
 */
export function toneDataUrl(
  freq:  number,
  durMs: number,
  vol    = 0.35,
  shape: 'sine' | 'square' = 'sine',
): string {
  const SR       = 22050
  const n        = Math.round(SR * durMs / 1000)
  const dataSize = n * 2
  const buf      = new ArrayBuffer(44 + dataSize)
  const view     = new DataView(buf)

  writeStr(view, 0,  'RIFF')
  view.setUint32(4,  36 + dataSize, true)
  writeStr(view, 8,  'WAVE')
  writeStr(view, 12, 'fmt ')
  view.setUint32(16, 16,     true)   // chunk size
  view.setUint16(20, 1,      true)   // PCM
  view.setUint16(22, 1,      true)   // mono
  view.setUint32(24, SR,     true)   // sample rate
  view.setUint32(28, SR * 2, true)   // byte rate
  view.setUint16(32, 2,      true)   // block align
  view.setUint16(34, 16,     true)   // bits per sample
  writeStr(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  const attack  = Math.max(1, Math.round(SR * 0.006))
  const release = Math.max(1, Math.round(SR * 0.08))

  for (let i = 0; i < n; i++) {
    const t   = i / SR
    const env = Math.min(i / attack, (n - i) / release, 1) * vol
    const raw = shape === 'square'
      ? (Math.sin(2 * Math.PI * freq * t) >= 0 ? 1.0 : -1.0)
      : Math.sin(2 * Math.PI * freq * t)
    view.setInt16(44 + i * 2, Math.round(raw * env * 32767), true)
  }

  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return 'data:audio/wav;base64,' + btoa(bin)
}
