# Supabase — Instrucciones de setup

## Aplicar migraciones

Ejecuta los archivos SQL en este orden desde el **Editor SQL** de Supabase
(dashboard → SQL Editor → New query):

| Archivo | Contenido |
|---|---|
| `001_tables.sql` | Todas las tablas del esquema |
| `002_rls.sql` | Row Level Security en todas las tablas |
| `003_trigger_new_user.sql` | Trigger que crea perfil, wallet e inventario inicial al registrarse |
| `004_rpc_purchase_item.sql` | RPC `purchase_item` — comprar arma o caja |
| `005_rpc_equip_item.sql` | RPC `equip_item` — equipar item del inventario |
| `006_rpc_submit_run.sql` | RPC `submit_run` — guardar partida + anti-cheat + ranking |
| `007_rpc_claim_mission.sql` | Tabla `missions_catalog` + RPC `claim_mission_reward` |
| `008_seed_weapons.sql` | Datos iniciales de las 8 armas |
| `009_seed_boxes.sql` | Datos iniciales de las 6 cajas |
| `010_seed_missions.sql` | Catálogo de misiones (diarias, semanales, logros) |

## Variables de entorno

Copia `.env.example` a `.env` y rellena con los valores del dashboard
(Settings → API):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Auth

- Activar Email Auth: Authentication → Providers → Email → Enable.
- Confirmar email: opcional en desarrollo, recomendado en producción.

## Notas de seguridad

- Todas las escrituras sensibles van por RPCs con `security definer`.
- El cliente solo puede hacer SELECT en sus propias filas.
- `weapons`, `boxes` y `leaderboard_weekly` son de lectura pública.
- `submit_run` incluye validaciones anti-cheat básicas; runs sospechosas
  se marcan con `suspicious = true` y no actualizan puntuaciones.
