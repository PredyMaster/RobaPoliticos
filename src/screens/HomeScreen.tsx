import { useNavigate } from "react-router-dom"
import { FONT } from "./shared/theme"

type HomeAction = {
  label: string
  path: string
  colors: readonly [string, string]
  textColor?: string
}

const ACTIONS: readonly HomeAction[] = [
  { label: "JUGAR", path: "/game", colors: ["#d32222", "#7e0d0d"] },
  { label: "RANKING", path: "/ranking", colors: ["#df5e10", "#9d2d05"] },
  {
    label: "OPCIONES",
    path: "/settings",
    colors: ["#f4bd19", "#dc7b00"],
    textColor: "#2a1800",
  },
] as const

export function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#1a1a2e",
        fontFamily: FONT,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(8px, 2vw, 24px)",
      }}
    >
      <div
        style={{
          width: "min(1240px, 100%)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) clamp(96px, 28vw, 320px)",
          alignItems: "center",
          gap: "clamp(10px, 3vw, 64px)",
          padding: "clamp(10px, 4vw, 64px)",
          borderRadius: "28px",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            minWidth: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <img
            src="/assets/home/home_image.png"
            alt="Roba al Politico"
            style={{
              width: "85%",
              maxWidth: "clamp(150px, 40vw, 410px)",
              height: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.35))",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(8px, 2vw, 18px)",
          }}
        >
          {ACTIONS.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              style={{
                width: "100%",
                minHeight: "clamp(40px, 8vw, 76px)",
                border: "none",
                borderRadius: "clamp(10px, 2vw, 16px)",
                cursor: "pointer",
                fontFamily: FONT,
                fontSize: "clamp(0.9rem, 2.3vw, 2rem)",
                fontWeight: 900,
                letterSpacing: "0.02em",
                color: action.textColor ?? "#fff",
                background: `linear-gradient(180deg, ${action.colors[0]} 0%, ${action.colors[1]} 100%)`,
                boxShadow:
                  "0 12px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
                textTransform: "uppercase",
                padding: "clamp(6px, 1.4vw, 12px)",
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
