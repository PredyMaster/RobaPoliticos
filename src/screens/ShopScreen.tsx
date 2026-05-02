import { useEffect, useState, type CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import { resolveBoxId } from "../game/data/boxes"
import { resolveHandId } from "../game/data/hands"
import {
  SHOP_BOXES,
  SHOP_HANDS,
  SHOP_WEAPONS,
  type ShopBoxCatalogItem,
  type ShopCatalogItem,
  type ShopTier,
} from "../game/data/shopCatalog"
import { resolveWeaponId } from "../game/data/weapons"
import type { ShopItemStatus, ShopItemType } from "../game/types/economy"
import { useInventoryStore } from "../store/useInventoryStore"
import { usePlayerStore } from "../store/usePlayerStore"
import { FONT } from "./shared/theme"

type ShopScreenProps = {
  embedded?: boolean
  onBack?: () => void
}

type ShopSelection = {
  category: ShopItemType
  id: string
}

type DetailStat = {
  icon: string
  label: string
  value: string
  filled: number
}

const SHOP_FONT = '"Arial Black", "Segoe UI", sans-serif'
const OUTLINE_SHADOW =
  "0 4px 0 rgba(0,0,0,0.55), 0 0 10px rgba(0,0,0,0.35), 2px 0 0 rgba(9,14,22,0.8), -2px 0 0 rgba(9,14,22,0.8), 0 2px 0 rgba(9,14,22,0.8), 0 -2px 0 rgba(9,14,22,0.8)"
const PANEL_BORDER = "2px solid rgba(96, 200, 255, 0.44)"

const ITEM_MAP = new Map<string, ShopCatalogItem>(
  [...SHOP_WEAPONS, ...SHOP_HANDS, ...SHOP_BOXES].map((item) => [
    `${item.category}:${item.id}`,
    item,
  ]),
)

const TIER_STYLES: Record<
  ShopTier,
  {
    frame: string
    frameBorder: string
    badge: string
    shadow: string
    accent: string
  }
> = {
  1: {
    frame: "linear-gradient(180deg, #9ae81e 0%, #4fa50c 100%)",
    frameBorder: "#d8ff7d",
    badge: "#77d40f",
    shadow: "rgba(73, 140, 11, 0.52)",
    accent: "#a6ff1f",
  },
  2: {
    frame: "linear-gradient(180deg, #60b5ff 0%, #2d74df 100%)",
    frameBorder: "#d9ebff",
    badge: "#4298ff",
    shadow: "rgba(40, 111, 214, 0.5)",
    accent: "#73c5ff",
  },
  3: {
    frame: "linear-gradient(180deg, #ffd54f 0%, #f2b200 100%)",
    frameBorder: "#fff2b8",
    badge: "#f0c016",
    shadow: "rgba(223, 157, 0, 0.44)",
    accent: "#ffe27a",
  },
  4: {
    frame: "linear-gradient(180deg, #ffab38 0%, #ff7a00 100%)",
    frameBorder: "#ffe0b0",
    badge: "#ff9320",
    shadow: "rgba(228, 112, 8, 0.46)",
    accent: "#ffbf6c",
  },
  5: {
    frame: "linear-gradient(180deg, #bf83ff 0%, #8e47db 100%)",
    frameBorder: "#ead2ff",
    badge: "#a45ceb",
    shadow: "rgba(126, 57, 190, 0.5)",
    accent: "#d09cff",
  },
  6: {
    frame: "linear-gradient(180deg, #ff7969 0%, #da2c22 100%)",
    frameBorder: "#ffd5d0",
    badge: "#eb4333",
    shadow: "rgba(166, 27, 18, 0.52)",
    accent: "#ff8b78",
  },
}

const SECTION_STYLES: Record<
  ShopItemType,
  {
    shell: string
    border: string
    banner: string
    shadow: string
  }
> = {
  weapon: {
    shell:
      "linear-gradient(180deg, rgba(142,64,24,0.94) 0%, rgba(93,31,13,0.98) 100%)",
    border: "rgba(255, 150, 74, 0.72)",
    banner: "linear-gradient(180deg, #a84c1f 0%, #713115 100%)",
    shadow: "rgba(117, 44, 11, 0.45)",
  },
  hand: {
    shell:
      "linear-gradient(180deg, rgba(10,88,152,0.94) 0%, rgba(7,59,112,0.98) 100%)",
    border: "rgba(74, 182, 255, 0.68)",
    banner: "linear-gradient(180deg, #0d75c2 0%, #08487d 100%)",
    shadow: "rgba(9, 79, 147, 0.42)",
  },
  box: {
    shell:
      "linear-gradient(180deg, rgba(41,104,18,0.94) 0%, rgba(22,70,15,0.98) 100%)",
    border: "rgba(131, 230, 73, 0.66)",
    banner: "linear-gradient(180deg, #4a981f 0%, #2a6513 100%)",
    shadow: "rgba(40, 105, 19, 0.45)",
  },
}

export function ShopView({
  embedded = false,
  onBack,
}: Required<ShopScreenProps>) {
  const navigate = useNavigate()
  const equipment = useInventoryStore((s) => s.equipment)
  const wallet = usePlayerStore((s) => s.wallet)
  const layout = useShopLayout()
  const [selected, setSelected] = useState<ShopSelection>(() => ({
    category: "weapon",
    id: normalizeCatalogId(
      "weapon",
      equipment?.equippedWeaponId ?? SHOP_WEAPONS[0].id,
    ),
  }))

  useEffect(() => {
    if (!equipment?.equippedWeaponId) return
    setSelected((current) => {
      if (current.category !== "weapon") return current
      if (current.id !== SHOP_WEAPONS[0].id) return current
      return {
        category: "weapon",
        id: normalizeCatalogId("weapon", equipment.equippedWeaponId),
      }
    })
  }, [equipment?.equippedWeaponId])

  const selectedItem = getCatalogItem(selected.category, selected.id)
  const handleBack = onBack ?? (() => navigate("/home"))

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: embedded ? "100vw" : undefined,
        height: embedded ? "100dvh" : undefined,
        display: "flex",
        flexDirection: "column",
        overflow: layout.compact ? "auto" : "hidden",
        color: "#fff",
        background:
          "radial-gradient(circle at top, rgba(27, 92, 162, 0.3), transparent 36%), linear-gradient(180deg, #061724 0%, #04121d 100%)",
        fontFamily: `${SHOP_FONT}, ${FONT}`,
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: layout.compact ? "auto" : "hidden",
          padding: layout.compact ? 12 : layout.short ? 12 : 16,
        }}
      >
        <TopBar coins={wallet?.currentCoins ?? 0} onBack={handleBack} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: layout.compact
              ? "1fr"
              : "minmax(0, 1fr) 430px",
            gap: layout.compact ? 14 : 16,
            alignItems: "start",
            minWidth: 0,
            height: layout.compact ? "auto" : "calc(100dvh - 148px)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: layout.short ? 10 : 12,
              minWidth: 0,
              minHeight: 0,
              justifyContent: "space-between",
            }}
          >
            <CategorySection
              title="ARMAS"
              category="weapon"
              items={SHOP_WEAPONS}
              selected={selected}
              onSelect={setSelected}
              layout={layout}
            />
            <CategorySection
              title="MANOS"
              category="hand"
              items={SHOP_HANDS}
              selected={selected}
              onSelect={setSelected}
              layout={layout}
            />
            <CategorySection
              title="CAJAS"
              category="box"
              items={SHOP_BOXES}
              selected={selected}
              onSelect={setSelected}
              layout={layout}
            />
          </div>

          <DetailPanel
            item={selectedItem}
            compact={layout.compact}
            short={layout.short}
          />
        </div>
      </div>
    </div>
  )
}

export function ShopScreen({ embedded = false, onBack }: ShopScreenProps) {
  const navigate = useNavigate()
  const handleBack = onBack ?? (() => navigate("/home"))
  return <ShopView embedded={embedded} onBack={handleBack} />
}

function TopBar({ coins, onBack }: { coins: number; onBack: () => void }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 14,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          minHeight: 108,
          padding: "18px 26px",
          borderRadius: 24,
          border: PANEL_BORDER,
          background:
            "linear-gradient(180deg, rgba(7,39,68,0.98) 0%, rgba(3,24,41,0.98) 100%)",
          boxShadow:
            "inset 0 0 0 2px rgba(0,0,0,0.28), 0 14px 40px rgba(0,0,0,0.28)",
        }}
      >
        <MoneyStackIcon />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "0.04em",
              textShadow: OUTLINE_SHADOW,
            }}
          >
            DINERO:
          </div>
          <div
            style={{
              marginTop: 8,
              color: "#93e81c",
              fontSize: 30,
              fontWeight: 900,
              lineHeight: 1,
              textShadow: OUTLINE_SHADOW,
              wordBreak: "break-word",
            }}
          >
            {formatCoins(coins)}€
          </div>
        </div>
      </div>

      <button type="button" onClick={onBack} style={backButtonStyle}>
        <span style={backArrowStyle}>←</span>
        <span style={{ textShadow: OUTLINE_SHADOW }}>VOLVER</span>
      </button>
    </div>
  )
}

function CategorySection({
  title,
  category,
  items,
  selected,
  onSelect,
  layout,
}: {
  title: string
  category: ShopItemType
  items: ShopCatalogItem[]
  selected: ShopSelection
  onSelect: (selection: ShopSelection) => void
  layout: ShopLayout
}) {
  const sectionStyle = SECTION_STYLES[category]

  return (
    <section
      style={{
        position: "relative",
        padding: layout.short ? "28px 12px 10px" : "32px 14px 12px",
        borderRadius: 24,
        border: `2px solid ${sectionStyle.border}`,
        background: sectionStyle.shell,
        boxShadow: `inset 0 0 0 2px rgba(0,0,0,0.22), 0 20px 44px ${sectionStyle.shadow}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -16,
          left: "50%",
          transform: "translateX(-50%)",
          minWidth: layout.short ? 176 : 200,
          padding: layout.short ? "6px 22px 8px" : "7px 24px 9px",
          borderRadius: 14,
          border: `2px solid ${sectionStyle.border}`,
          background: sectionStyle.banner,
          textAlign: "center",
          fontSize: layout.short ? 16 : 18,
          fontWeight: 900,
          letterSpacing: "0.03em",
          textShadow: OUTLINE_SHADOW,
          boxShadow: "0 10px 18px rgba(0,0,0,0.25)",
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: layout.compact
            ? "repeat(auto-fit, minmax(108px, 1fr))"
            : "repeat(6, minmax(0, 1fr))",
          gap: layout.short ? 8 : 10,
        }}
      >
        {items.map((item) => (
          <ShopTile
            key={`${item.category}:${item.id}`}
            item={item}
            selected={
              selected.category === item.category && selected.id === item.id
            }
            onSelect={() => onSelect({ category: item.category, id: item.id })}
            layout={layout}
          />
        ))}
      </div>
    </section>
  )
}

function ShopTile({
  item,
  selected,
  onSelect,
  layout,
}: {
  item: ShopCatalogItem
  selected: boolean
  onSelect: () => void
  layout: ShopLayout
}) {
  const tierStyle = TIER_STYLES[item.tier]
  const status = useItemStatus(item.category, item.id, item.unlockLevel)
  const statusLabel =
    status === "equipped"
      ? "EQUIPADO"
      : status === "owned"
        ? "TUYO"
        : status === "locked"
          ? "BLOQ."
          : null

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        ...resetButton,
        position: "relative",
        width: "100%",
        minWidth: 0,
      }}
    >
      {statusLabel && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            padding: "5px 8px",
            borderRadius: 999,
            background:
              status === "equipped"
                ? "rgba(128, 255, 118, 0.92)"
                : status === "owned"
                  ? "rgba(91, 184, 255, 0.9)"
                  : "rgba(33, 39, 51, 0.94)",
            color: status === "locked" ? "#cad2dc" : "#0b1520",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.03em",
            boxShadow: "0 8px 12px rgba(0,0,0,0.22)",
          }}
        >
          {statusLabel}
        </div>
      )}

      <div
        style={{
          padding: layout.short ? 6 : 8,
          borderRadius: 18,
          background: "rgba(0,0,0,0.42)",
          boxShadow: selected
            ? "0 0 0 5px rgba(0,0,0,0.75), 0 20px 32px rgba(0,0,0,0.35)"
            : "0 14px 24px rgba(0,0,0,0.28)",
          transition: "transform 0.18s ease, box-shadow 0.18s ease",
          transform: selected ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        <div
          style={{
            height: layout.short ? 104 : 118,
            borderRadius: 14,
            border: `4px solid ${tierStyle.frameBorder}`,
            background: tierStyle.frame,
            boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.18), 0 12px 24px ${tierStyle.shadow}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            opacity: status === "locked" ? 0.62 : 1,
          }}
        >
          <img
            src={item.imageSrc}
            alt={item.name}
            style={{
              width: "82%",
              height: "88%",
              objectFit: "contain",
              filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.32))",
            }}
          />
        </div>

        <div
          style={{
            marginTop: layout.short ? 4 : 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: tierStyle.accent,
            fontSize: layout.short ? 14 : 15,
            fontWeight: 900,
            textShadow: OUTLINE_SHADOW,
            lineHeight: 1,
          }}
        >
          <CoinIcon size={22} />
          <span>{formatCoins(item.price)}</span>
        </div>
      </div>
    </button>
  )
}

function DetailPanel({
  item,
  compact,
  short,
}: {
  item: ShopCatalogItem
  compact: boolean
  short: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const status = useItemStatus(item.category, item.id, item.unlockLevel)
  const purchase = useInventoryStore((s) => s.purchase)
  const equip = useInventoryStore((s) => s.equip)
  const coins = usePlayerStore((s) => s.wallet?.currentCoins ?? 0)

  useEffect(() => {
    setFeedback(null)
    setBusy(false)
  }, [item.category, item.id])

  const canBuy = status === "available" && coins >= item.price
  const stats = buildDetailStats(item)
  const tierStyle = TIER_STYLES[item.tier]

  async function handleAction() {
    if (status === "equipped" || status === "locked") return

    setBusy(true)
    setFeedback(null)

    if (status === "owned") {
      const result = await equip(item.category, item.id)
      setFeedback(
        result.ok
          ? "Equipado correctamente."
          : formatEquipError(result.error, item.category),
      )
      setBusy(false)
      return
    }

    const result = await purchase(item.category, item.id)
    setFeedback(
      result.ok
        ? "Comprado correctamente."
        : formatPurchaseError(result.error, item.category),
    )
    setBusy(false)
  }

  const actionLabel = getActionLabel(
    status,
    busy,
    item.price,
    canBuy,
    item.unlockLevel,
  )
  const actionDisabled =
    busy ||
    status === "equipped" ||
    status === "locked" ||
    (status === "available" && !canBuy)
  const statsSection = (
    <div
      style={{
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: "#97df17",
          fontSize: short ? 18 : 20,
          fontWeight: 900,
          letterSpacing: "0.03em",
          textShadow: OUTLINE_SHADOW,
        }}
      >
        ESTADISTICAS
      </div>

      <div
        style={{
          marginTop: short ? 14 : 18,
          display: "flex",
          flexDirection: "column",
          gap: short ? 10 : 12,
        }}
      >
        {stats.map((stat) => (
          <StatRow key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  )
  const infoSection = (
    <div
      style={{
        minWidth: 0,
      }}
    >
      <div
        style={{
          color: tierStyle.accent,
          fontSize: compact ? 30 : short ? 30 : 34,
          fontWeight: 900,
          lineHeight: 0.98,
          textTransform: "uppercase",
          textShadow: OUTLINE_SHADOW,
        }}
      >
        {item.name}
      </div>

      <p
        style={{
          margin: "12px 0 0",
          fontSize: short ? 15 : 16,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.92)",
        }}
      >
        {item.description}
      </p>

      <div
        style={{
          marginTop: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: tierStyle.accent,
          fontWeight: 900,
          textShadow: OUTLINE_SHADOW,
        }}
      >
        <CoinIcon size={22} />
        <span>{formatCoins(item.price)}</span>
      </div>

      {feedback && (
        <p
          style={{
            margin: "14px 0 0",
            color:
              feedback.startsWith("Comprado") || feedback.startsWith("Equipado")
                ? "#9ce60e"
                : "#ff9b9b",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {feedback}
        </p>
      )}
    </div>
  )
  const actionSection = (
    <div
      style={{
        minWidth: compact ? 220 : 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: compact ? "center" : "flex-end",
      }}
    >
      <button
        type="button"
        onClick={handleAction}
        disabled={actionDisabled}
        style={{
          ...actionButtonStyle,
          marginTop: compact ? 0 : "auto",
          minHeight: compact ? (short ? 80 : 88) : short ? 92 : 100,
          fontSize: compact ? (short ? 20 : 22) : short ? 24 : 28,
          opacity: actionDisabled && status !== "equipped" ? 0.72 : 1,
          cursor: actionDisabled ? "not-allowed" : "pointer",
          background:
            status === "owned"
              ? "linear-gradient(180deg, #85d61a 0%, #5ea80f 100%)"
              : status === "equipped"
                ? "linear-gradient(180deg, #5bca71 0%, #388b47 100%)"
                : "linear-gradient(180deg, #87dd19 0%, #5da90d 100%)",
        }}
      >
        <span
          style={{
            fontSize: compact ? (short ? 30 : 34) : short ? 34 : 40,
            lineHeight: 1,
          }}
        >
          🛒
        </span>
        <span style={{ textShadow: OUTLINE_SHADOW }}>{actionLabel}</span>
      </button>
    </div>
  )

  return (
    <aside
      style={{
        position: compact ? "static" : "sticky",
        top: 0,
        minHeight: compact ? "auto" : 0,
        height: compact ? "auto" : "100%",
        padding: compact
          ? "18px 18px 20px"
          : short
            ? "18px 18px 18px"
            : "22px 20px 20px",
        borderRadius: 24,
        border: PANEL_BORDER,
        background:
          "linear-gradient(180deg, rgba(3,30,52,0.98) 0%, rgba(2,20,36,0.98) 100%)",
        boxShadow:
          "inset 0 0 0 2px rgba(0,0,0,0.3), 0 22px 42px rgba(0,0,0,0.34)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {compact ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.15fr) minmax(0, 1.2fr) minmax(220px, 0.85fr)",
            gap: short ? 16 : 20,
            alignItems: "center",
          }}
        >
          {statsSection}
          {infoSection}
          {actionSection}
        </div>
      ) : (
        <>
          {statsSection}

          <div
            style={{
              height: 2,
              margin: short ? "16px 0" : "20px 0",
              background:
                "linear-gradient(90deg, rgba(54,120,170,0), rgba(54,120,170,0.72), rgba(54,120,170,0))",
            }}
          />

          {infoSection}
          {actionSection}
        </>
      )}
    </aside>
  )
}

function StatRow({ stat }: { stat: DetailStat }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px minmax(0, 1fr) auto",
        gap: 10,
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontSize: 26,
          textAlign: "center",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.32))",
        }}
      >
        {stat.icon}
      </div>
      <div>
        <div
          style={{
            marginBottom: 5,
            fontSize: 14,
            fontWeight: 900,
            letterSpacing: "0.02em",
            textShadow: OUTLINE_SHADOW,
          }}
        >
          {stat.label}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={`${stat.label}-${index}`}
              style={{
                width: 22,
                height: 24,
                borderRadius: 4,
                border: "2px solid rgba(255,255,255,0.26)",
                background:
                  index < stat.filled
                    ? "linear-gradient(180deg, #b8f81f 0%, #75c707 100%)"
                    : "linear-gradient(180deg, #717883 0%, #383f48 100%)",
                boxShadow:
                  index < stat.filled
                    ? "inset 0 0 0 1px rgba(255,255,255,0.14), 0 8px 12px rgba(82,141,10,0.22)"
                    : "inset 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          minWidth: 44,
          textAlign: "right",
          color: "#97df17",
          fontSize: 18,
          fontWeight: 900,
          textShadow: OUTLINE_SHADOW,
        }}
      >
        {stat.value}
      </div>
    </div>
  )
}

function CoinIcon({ size }: { size: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #ffe96c 0%, #ffbf10 100%)",
        border: "2px solid #8c5200",
        boxShadow:
          "inset 0 0 0 2px rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.26)",
        color: "#8c5200",
        fontSize: Math.round(size * 0.62),
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      $
    </span>
  )
}

function MoneyStackIcon() {
  return (
    <div
      style={{ position: "relative", width: 108, height: 74, flexShrink: 0 }}
    >
      <div style={{ ...moneyBillStyle, left: 6, top: 24, rotate: "-16deg" }} />
      <div style={{ ...moneyBillStyle, left: 28, top: 8, rotate: "10deg" }} />
    </div>
  )
}

type ShopLayout = {
  compact: boolean
  short: boolean
}

function useShopLayout(
  widthBreakpoint = 1220,
  heightBreakpoint = 860,
): ShopLayout {
  const [layout, setLayout] = useState<ShopLayout>(() => {
    if (typeof window === "undefined") return { compact: false, short: false }
    return {
      compact: window.innerWidth < widthBreakpoint,
      short: window.innerHeight < heightBreakpoint,
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const onResize = () =>
      setLayout({
        compact: window.innerWidth < widthBreakpoint,
        short: window.innerHeight < heightBreakpoint,
      })

    onResize()
    window.addEventListener("resize", onResize)

    return () => window.removeEventListener("resize", onResize)
  }, [heightBreakpoint, widthBreakpoint])

  return layout
}

function useItemStatus(
  itemType: ShopItemType,
  itemId: string,
  unlockLevel: number,
): ShopItemStatus {
  const equipment = useInventoryStore((s) => s.equipment)
  const ownsItem = useInventoryStore((s) => s.ownsItem)
  const level = usePlayerStore((s) => s.profile?.level ?? 1)

  const equippedId =
    itemType === "weapon"
      ? equipment?.equippedWeaponId
      : itemType === "hand"
        ? equipment?.equippedHandId
        : equipment?.equippedBoxId

  if (equippedId && normalizeCatalogId(itemType, equippedId) === itemId)
    return "equipped"
  if (ownsItem(itemType, itemId)) return "owned"
  if (level < unlockLevel) return "locked"
  return "available"
}

function normalizeCatalogId(category: ShopItemType, id: string): string {
  if (category === "weapon") return resolveWeaponId(id)
  if (category === "hand") return resolveHandId(id)
  return resolveBoxId(id)
}

function getCatalogItem(category: ShopItemType, id: string): ShopCatalogItem {
  return (
    ITEM_MAP.get(`${category}:${normalizeCatalogId(category, id)}`) ??
    SHOP_WEAPONS[0]
  )
}

function buildDetailStats(item: ShopCatalogItem): DetailStat[] {
  if (item.category === "box") {
    const box = item as ShopBoxCatalogItem
    return [
      {
        icon: "▣",
        label: "TAMANO",
        value: box.size.toFixed(1),
        filled: toSegments(box.size, 1, 1.6),
      },
      {
        icon: "⇄",
        label: "VELOCIDAD",
        value: box.speed.toFixed(1),
        filled: toSegments(box.speed, 0.9, 1.5),
      },
      {
        icon: "★",
        label: "BONUS",
        value: box.bonus.toFixed(2),
        filled: toSegments(box.bonus, 1, 1.75),
      },
    ]
  }

  return [
    {
      icon: "⚔",
      label: "ATAQUE",
      value: `${item.attack}`,
      filled: toSegments(item.attack, 5, 65),
    },
    {
      icon: "💰",
      label: "BOTIN",
      value: `${item.loot}`,
      filled: toSegments(item.loot, 10, 80),
    },
  ]
}

function toSegments(value: number, min: number, max: number): number {
  if (max <= min) return 1
  const ratio = (value - min) / (max - min)
  return Math.max(1, Math.min(5, Math.round(ratio * 4) + 1))
}

function formatCoins(value: number): string {
  return value.toLocaleString("en-US")
}

function formatPurchaseError(error: string, category: ShopItemType): string {
  if (error === "invalid_item_type" && category === "hand")
    return "Ese item no se puede comprar."
  if (error === "already_owned") return "Ya tienes este item."
  if (error === "level_too_low") return "Tu nivel actual no permite comprarlo."
  if (error === "insufficient_coins") return "No tienes monedas suficientes."
  if (error === "item_not_found") return "Ese item no existe en el catálogo."
  return "No se pudo completar la compra."
}

function formatEquipError(error: string, category: ShopItemType): string {
  if (error === "invalid_item_type" && category === "hand")
    return "Ese item no se puede equipar."
  if (error === "not_owned") return "Primero tienes que comprar este item."
  return "No se pudo equipar el item."
}

function getActionLabel(
  status: ShopItemStatus,
  busy: boolean,
  price: number,
  canBuy: boolean,
  unlockLevel: number,
): string {
  if (busy) return "..."
  if (status === "equipped") return "EQUIPADO"
  if (status === "owned") return "EQUIPAR"
  if (status === "locked") return `NIVEL ${unlockLevel}`
  if (!canBuy) return "SIN MONEDAS"
  return price === 0 ? "GRATIS" : "COMPRAR"
}

const resetButton: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  textAlign: "inherit",
  color: "inherit",
  font: "inherit",
}

const backButtonStyle: CSSProperties = {
  ...resetButton,
  minWidth: 280,
  minHeight: 78,
  padding: "16px 26px",
  borderRadius: 22,
  border: "2px solid rgba(255, 197, 84, 0.72)",
  background: "linear-gradient(180deg, #f5b319 0%, #d68805 100%)",
  boxShadow:
    "inset 0 0 0 2px rgba(255,255,255,0.16), 0 16px 32px rgba(0,0,0,0.24)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 18,
  color: "#fff7df",
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: "0.03em",
}

const backArrowStyle: CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 18,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.84)",
  color: "#7f4a00",
  fontSize: 36,
  boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.15)",
}

const actionButtonStyle: CSSProperties = {
  ...resetButton,
  width: "100%",
  minHeight: 110,
  padding: "18px 26px",
  borderRadius: 26,
  border: "2px solid rgba(160, 255, 131, 0.5)",
  color: "#fffbe8",
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: "0.03em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 18,
  boxShadow:
    "inset 0 0 0 2px rgba(255,255,255,0.14), 0 18px 36px rgba(0,0,0,0.26)",
}

const moneyBillStyle: CSSProperties = {
  position: "absolute",
  width: 64,
  height: 40,
  borderRadius: 10,
  background: "linear-gradient(180deg, #9cf34b 0%, #56b516 100%)",
  border: "3px solid #173500",
  boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
}
