export type MaterialType = 'wood' | 'brick' | 'wheat' | 'sheep' | 'ore' | 'desert'

export interface HexTile {
    id: number
    materialType: MaterialType
    rollNumber: number | null
    x: number
    y: number
}

const materialsPool: MaterialType[] = [
    ...Array(7).fill('wood'),
    ...Array(7).fill('brick'),
    ...Array(7).fill('wheat'),
    ...Array(7).fill('sheep'),
    ...Array(7).fill('ore'),
    ...Array(2).fill('desert'),
]

const rollNumberPool = [
    2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 9, 9, 9,
    9, 9, 10, 10, 10, 10, 11, 11, 11, 12,
]


export const generateFullBoard = (): HexTile[] => {
    const radius = 3
    const size = 40
    const tiles: HexTile[] = []

    const shuffledMaterials = [...materialsPool].sort(() => Math.random() - 0.5)
    const shuffledRolls = [...rollNumberPool].sort(() => Math.random() - 0.5)

    let id = 0
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius)
        const r2 = Math.min(radius, -q + radius)
        for (let r = r1; r <= r2; r++) {
            const material = shuffledMaterials.pop() || 'desert'
            const rollNumber =
                material === 'desert' ? null : shuffledRolls.pop() || null

            const x = size * 1.5 * q
            const y = size * Math.sqrt(3) * (r + q / 2)

            tiles.push({
                id: id++,
                materialType: material,
                rollNumber,
                x,
                y,
            })
        }
    }

    return tiles
}