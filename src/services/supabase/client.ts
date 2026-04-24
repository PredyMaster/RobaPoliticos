import { createClient } from '@supabase/supabase-js'

// ── Tipos que reflejan exactamente el esquema SQL ────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          level?: number
        }
        Update: {
          username?: string
          avatar_url?: string | null
          level?: number
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          user_id: string
          total_score: number
          current_coins: number
          premium_gems: number
          updated_at: string
        }
        Insert: never
        Update: never
      }
      weapons: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          unlock_level: number
          coins_per_hit: number
          force: number
          cooldown: number
          critical_chance: number
          critical_multiplier: number
          spread: number
          rarity_bonus: number
          visual_asset: string
          sound_effect: string
        }
        Insert: never
        Update: never
      }
      boxes: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          unlock_level: number
          width: number
          height: number
          speed: number
          acceleration: number
          magnet_power: number
          multiplier: number
          visual_asset: string
        }
        Insert: never
        Update: never
      }
      player_inventory: {
        Row: {
          id: string
          user_id: string
          item_type: string
          item_id: string
          purchased_at: string
        }
        Insert: never
        Update: never
      }
      player_equipment: {
        Row: {
          user_id: string
          equipped_weapon_id: string | null
          equipped_box_id: string | null
          updated_at: string
        }
        Insert: never
        Update: never
      }
      runs: {
        Row: {
          id: string
          user_id: string
          score_gained: number
          coins_collected: number
          coins_lost: number
          hits: number
          critical_hits: number
          max_combo: number
          duration_seconds: number
          equipped_weapon_id: string | null
          equipped_box_id: string | null
          suspicious: boolean
          created_at: string
        }
        Insert: never
        Update: never
      }
      mission_progress: {
        Row: {
          id: string
          user_id: string
          mission_id: string
          progress: number
          completed: boolean
          claimed: boolean
          date_key: string | null
          updated_at: string
        }
        Insert: never
        Update: never
      }
      leaderboard_weekly: {
        Row: {
          user_id: string
          weekly_score: number
          week_start: string
        }
        Insert: never
        Update: never
      }
      missions_catalog: {
        Row: {
          id: string
          name: string
          description: string
          mission_type: string
          goal: number
          reward_coins: number
          reward_gems: number
        }
        Insert: never
        Update: never
      }
    }
    Functions: {
      purchase_item: {
        Args: { p_item_type: string; p_item_id: string }
        Returns: {
          ok: boolean
          error?: string
          item_type?: string
          item_id?: string
          required_level?: number
          needed?: number
          have?: number
        }
      }
      equip_item: {
        Args: { p_item_type: string; p_item_id: string }
        Returns: { ok: boolean; error?: string; item_type?: string; item_id?: string }
      }
      submit_run: {
        Args: {
          p_score_gained: number
          p_coins_collected: number
          p_coins_lost: number
          p_hits: number
          p_critical_hits: number
          p_max_combo: number
          p_duration_seconds: number
          p_equipped_weapon_id: string
          p_equipped_box_id: string
        }
        Returns: {
          ok: boolean
          error?: string
          run_saved?: boolean
          new_total_score?: number
          new_coins?: number
          new_level?: number
        }
      }
      claim_mission_reward: {
        Args: { p_mission_id: string; p_date_key?: string }
        Returns: { ok: boolean; error?: string; reward_coins?: number; reward_gems?: number }
      }
    }
  }
}

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
