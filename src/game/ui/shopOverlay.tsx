import { createRoot, type Root } from "react-dom/client"
import { ShopView } from "../../screens/ShopScreen"
import { C } from "../../screens/shared/theme"
import { EventBus } from "../EventBus"
import { useGameStore } from "../../store/useGameStore"

let host: HTMLDivElement | null = null
let root: Root | null = null
let isOpen = false

function ensureRoot(): Root | null {
  if (typeof document === "undefined") return null

  if (!host) {
    host = document.createElement("div")
    host.id = "shop-overlay-root"
    document.body.appendChild(host)
  }

  if (!root) {
    root = createRoot(host)
  }

  return root
}

function teardownRoot(): void {
  root?.unmount()
  root = null
  host?.remove()
  host = null
}

export function closeShopOverlay(): void {
  if (!isOpen) return
  isOpen = false
  teardownRoot()
  useGameStore.getState().closeShop()
  EventBus.emit("RUN_RESUMED")
}

export function openShopOverlay(): void {
  const overlayRoot = ensureRoot()
  if (!overlayRoot) return

  isOpen = true
  useGameStore.getState().openShop()

  overlayRoot.render(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        background: C.bg,
      }}
    >
      <ShopView embedded={true} onBack={closeShopOverlay} />
    </div>,
  )
}
