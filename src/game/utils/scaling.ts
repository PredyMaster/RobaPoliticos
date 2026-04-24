// Utilidades de escalado y safe areas para 16:9 horizontal

export const BASE_WIDTH  = 1920
export const BASE_HEIGHT = 1080

// Zona segura donde va el gameplay crítico (dentro del canvas base)
export const SAFE_ZONE = {
  x:      160,
  y:       80,
  width:  1600,
  height:  920,
}

// Convierte coordenadas del canvas base a coordenadas de pantalla real
export function toScreenX(baseX: number, scaleX: number): number {
  return baseX * scaleX
}

export function toScreenY(baseY: number, scaleY: number): number {
  return baseY * scaleY
}

// Calcula el factor de escala para ajustar el canvas al contenedor
export function computeScale(
  containerWidth: number,
  containerHeight: number,
): { scaleX: number; scaleY: number; scale: number } {
  const scaleX = containerWidth  / BASE_WIDTH
  const scaleY = containerHeight / BASE_HEIGHT
  const scale  = Math.min(scaleX, scaleY)   // FIT (mantiene ratio)
  return { scaleX: scale, scaleY: scale, scale }
}

// Devuelve el offset de centrado cuando el canvas tiene barras negras
export function computeOffset(
  containerWidth: number,
  containerHeight: number,
  scale: number,
): { offsetX: number; offsetY: number } {
  return {
    offsetX: (containerWidth  - BASE_WIDTH  * scale) / 2,
    offsetY: (containerHeight - BASE_HEIGHT * scale) / 2,
  }
}

// Convierte un punto de pantalla táctil al espacio del canvas base
export function screenToCanvas(
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  scale: number,
): { x: number; y: number } {
  return {
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale,
  }
}
