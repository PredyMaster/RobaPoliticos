import { create } from 'zustand'
import type {
  EquipResult,
  InventoryItem,
  PlayerEquipment,
  PurchaseResult,
  ShopItemType,
} from '../game/types/economy'
import type { BoxItem, HandItem, Weapon } from '../game/types/game'
import { getInventory, getEquipment, purchaseItem, equipItem } from '../services/local/inventory'
import { getBox } from '../game/data/boxes'
import { getHand } from '../game/data/hands'
import { getWeapon } from '../game/data/weapons'
import { usePlayerStore } from './usePlayerStore'

type InventoryState = {
  items: InventoryItem[]
  equipment: PlayerEquipment | null
  isLoading: boolean
  loadError: string | null
}

type InventoryActions = {
  // Carga inventario + equipamiento del jugador desde localStorage
  loadInventory: (userId: string) => Promise<void>

  // Compra un item y sincroniza estado local
  purchase: (itemType: ShopItemType, itemId: string) => Promise<PurchaseResult>

  // Equipa un item del inventario y actualiza estado local
  equip: (itemType: ShopItemType, itemId: string) => Promise<EquipResult>

  // Selectores derivados
  equippedWeapon: () => Weapon | null
  equippedHand: () => HandItem | null
  equippedBox: () => BoxItem | null
  ownsItem: (itemType: ShopItemType, itemId: string) => boolean
}

export const useInventoryStore = create<InventoryState & InventoryActions>((set, get) => ({
  items: [],
  equipment: null,
  isLoading: false,
  loadError: null,

  loadInventory: async (userId) => {
    set({ isLoading: true, loadError: null })

    const [invResult, eqResult] = await Promise.all([
      getInventory(userId),
      getEquipment(userId),
    ])

    if (invResult.error || eqResult.error) {
      set({ loadError: invResult.error ?? eqResult.error, isLoading: false })
      return
    }

    set({
      items: invResult.data,
      equipment: eqResult.data,
      isLoading: false,
    })
  },

  purchase: async (itemType, itemId) => {
    const result = await purchaseItem(itemType, itemId)

    if (result.ok) {
      const { session } = usePlayerStore.getState()
      if (session) {
        const [inventoryResult, equipmentResult] = await Promise.all([
          getInventory(session.userId),
          getEquipment(session.userId),
        ])

        if (!inventoryResult.error && !equipmentResult.error) {
          set({
            items: inventoryResult.data,
            equipment: equipmentResult.data,
          })
        }
      }

      await usePlayerStore.getState().refreshWallet()
    }

    return result
  },

  equip: async (itemType, itemId) => {
    const result = await equipItem(itemType, itemId)

    if (result.ok) {
      const { session } = usePlayerStore.getState()
      if (session) {
        const { data, error } = await getEquipment(session.userId)
        if (!error) set({ equipment: data })
      }
    }

    return result
  },

  equippedWeapon: () => {
    const { equipment } = get()
    if (!equipment) return null
    return getWeapon(equipment.equippedWeaponId)
  },

  equippedHand: () => {
    const { equipment } = get()
    if (!equipment?.equippedHandId) return null
    return getHand(equipment.equippedHandId)
  },

  equippedBox: () => {
    const { equipment } = get()
    if (!equipment) return null
    return getBox(equipment.equippedBoxId)
  },

  ownsItem: (itemType, itemId) => {
    return get().items.some(
      (item) => item.itemType === itemType && item.itemId === itemId,
    )
  },
}))
