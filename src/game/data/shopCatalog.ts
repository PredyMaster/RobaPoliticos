export type ShopTier = 1 | 2 | 3 | 4 | 5 | 6

type ShopCatalogItemBase = {
  id: string
  name: string
  description: string
  price: number
  unlockLevel: number
  tier: ShopTier
  imageSrc: string
}

export type ShopWeaponCatalogItem = ShopCatalogItemBase & {
  category: "weapon"
  attack: number
  loot: number
}

export type ShopHandCatalogItem = ShopCatalogItemBase & {
  category: "hand"
  attack: number
  loot: number
}

export type ShopBoxCatalogItem = ShopCatalogItemBase & {
  category: "box"
  size: number
  collider: number
  speed: number
  bonus: number
}

export type ShopCatalogItem =
  | ShopWeaponCatalogItem
  | ShopHandCatalogItem
  | ShopBoxCatalogItem

function shopImageSrc(
  folder: "weapons" | "hands" | "boxes",
  prefix: "weapon" | "hand" | "box",
  index: number,
): string {
  return `/assets/shop/${folder}/${prefix}${index}.webp`
}

export const SHOP_WEAPONS: ShopWeaponCatalogItem[] = [
  {
    category: "weapon",
    id: "tree_branch",
    name: "Rama de árbol",
    attack: 10,
    loot: 10,
    price: 0,
    description: "Gratis, ecológica y peligrosa… si tienes mucha imaginación.",
    unlockLevel: 1,
    tier: 1,
    imageSrc: shopImageSrc("weapons", "weapon", 1),
  },
  {
    category: "weapon",
    id: "wrench",
    name: "Llave inglesa",
    attack: 18,
    loot: 24,
    price: 250,
    description: "No arregla problemas… los crea.",
    unlockLevel: 1,
    tier: 2,
    imageSrc: shopImageSrc("weapons", "weapon", 2),
  },
  {
    category: "weapon",
    id: "bat",
    name: "Bate",
    attack: 28,
    loot: 38,
    price: 800,
    description: "Clásico. Directo. Dolor garantizado.",
    unlockLevel: 1,
    tier: 3,
    imageSrc: shopImageSrc("weapons", "weapon", 3),
  },
  {
    category: "weapon",
    id: "hammer",
    name: "Martillo",
    attack: 38,
    loot: 52,
    price: 2000,
    description: "Cada golpe suena como una factura pagada.",
    unlockLevel: 1,
    tier: 4,
    imageSrc: shopImageSrc("weapons", "weapon", 4),
  },
  {
    category: "weapon",
    id: "pan",
    name: "Sartén",
    attack: 48,
    loot: 66,
    price: 5000,
    description: "Ideal para cocinar… y para repartir justicia.",
    unlockLevel: 1,
    tier: 5,
    imageSrc: shopImageSrc("weapons", "weapon", 5),
  },
  {
    category: "weapon",
    id: "golden_hammer",
    name: "Martillo dorado",
    attack: 50,
    loot: 100,
    price: 12000,
    description: "Para cuando quieres pegar como un millonario.",
    unlockLevel: 1,
    tier: 6,
    imageSrc: shopImageSrc("weapons", "weapon", 6),
  },
]

export const SHOP_HANDS: ShopHandCatalogItem[] = [
  {
    category: "hand",
    id: "bare_hand",
    name: "Mano desnuda",
    attack: 5,
    loot: 10,
    price: 0,
    description: "La vieja confiable… pero no esperes milagros.",
    unlockLevel: 1,
    tier: 1,
    imageSrc: shopImageSrc("hands", "hand", 1),
  },
  {
    category: "hand",
    id: "bandaged_hand",
    name: "Mano vendada",
    attack: 10,
    loot: 24,
    price: 200,
    description: "Te crees boxeador… y empiezas a parecerlo.",
    unlockLevel: 1,
    tier: 2,
    imageSrc: shopImageSrc("hands", "hand", 2),
  },
  {
    category: "hand",
    id: "leather_glove",
    name: "Guante de cuero",
    attack: 18,
    loot: 38,
    price: 700,
    description: "Elegante, cómodo y sorprendentemente agresivo.",
    unlockLevel: 1,
    tier: 3,
    imageSrc: shopImageSrc("hands", "hand", 3),
  },
  {
    category: "hand",
    id: "boxing_glove",
    name: "Guante de boxeo",
    attack: 25,
    loot: 52,
    price: 1500,
    description: "No ves los dedos, pero el daño sí se nota.",
    unlockLevel: 1,
    tier: 4,
    imageSrc: shopImageSrc("hands", "hand", 4),
  },
  {
    category: "hand",
    id: "iron_glove",
    name: "Guante de hierro",
    attack: 35,
    loot: 66,
    price: 4000,
    description: "Aquí ya no estás jugando.",
    unlockLevel: 1,
    tier: 5,
    imageSrc: shopImageSrc("hands", "hand", 5),
  },
  {
    category: "hand",
    id: "golden_glove",
    name: "Guante dorado",
    attack: 50,
    loot: 80,
    price: 10000,
    description: "Pegas tan fuerte que hasta el dinero sale volando.",
    unlockLevel: 1,
    tier: 6,
    imageSrc: shopImageSrc("hands", "hand", 6),
  },
]

export const SHOP_BOXES: ShopBoxCatalogItem[] = [
  {
    category: "box",
    id: "basic_box",
    name: "Caja básica",
    size: 1.0,
    collider: 0.8,
    speed: 1.0,
    bonus: 1.0,
    price: 0,
    description: "Hace su trabajo… sin entusiasmo.",
    unlockLevel: 1,
    tier: 1,
    imageSrc: shopImageSrc("boxes", "box", 1),
  },
  {
    category: "box",
    id: "wide_box",
    name: "Caja ancha",
    size: 1.0,
    collider: 1.0,
    speed: 0.9,
    bonus: 1.0,
    price: 500,
    description: "No corre, pero recoge TODO.",
    unlockLevel: 1,
    tier: 2,
    imageSrc: shopImageSrc("boxes", "box", 2),
  },
  {
    category: "box",
    id: "stone_box",
    name: "Caja con ruedas",
    size: 1.0,
    collider: 0.8,
    speed: 0.5,
    bonus: 1.1,
    price: 1500,
    description: "Echa el freno vaquero, mi ritmo es más tranquilo.",
    unlockLevel: 1,
    tier: 3,
    imageSrc: shopImageSrc("boxes", "box", 3),
  },
  {
    category: "box",
    id: "magnet_box",
    name: "Caja imán",
    size: 1.0,
    collider: 0.75,
    speed: 1.2,
    bonus: 1.25,
    price: 4000,
    description: "Las monedas vienen solas… sospechoso.",
    unlockLevel: 1,
    tier: 4,
    imageSrc: shopImageSrc("boxes", "box", 4),
  },
  {
    category: "box",
    id: "bonus_box",
    name: "Caja bonus",
    size: 1.0,
    collider: 0.9,
    speed: 1.3,
    bonus: 1.5,
    price: 8000,
    description: "Aquí empieza el dinero serio.",
    unlockLevel: 1,
    tier: 5,
    imageSrc: shopImageSrc("boxes", "box", 5),
  },
  {
    category: "box",
    id: "ultimate_box",
    name: "Caja definitiva",
    size: 1.0,
    collider: 1.4,
    speed: 1.4,
    bonus: 1.75,
    price: 15000,
    description: "Esto ya no es una caja, es una aspiradora de riqueza.",
    unlockLevel: 1,
    tier: 6,
    imageSrc: shopImageSrc("boxes", "box", 6),
  },
]
