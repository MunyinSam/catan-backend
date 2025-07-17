export type MaterialType =
    | 'wood'
    | 'brick'
    | 'wheat'
    | 'sheep'
    | 'ore'
    | 'desert'

export interface HexTile {
    id: number
    materialType: MaterialType
    rollNumber: number | null
    x: number
    y: number
}

export type ResourceType = 'brick' | 'wood' | 'ore' | 'wheat' | 'sheep'
export type Port = {
    x: number
    y: number
    ratio: '2:1' | '3:1'
    resource: ResourceType | null
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

const portCoords: { x: number; y: number }[] = [
    { x: 340, y: 90 },
    { x: 460, y: 90 },
    { x: 600, y: 160 },
    { x: 670, y: 280 },
    { x: 670, y: 420 },
    { x: 130, y: 280 },
    { x: 130, y: 420 },
    { x: 600, y: 530 },
    { x: 200, y: 540 },
    { x: 200, y: 160 },
    { x: 330, y: 600 },
    { x: 470, y: 600 },
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

function shuffle<T>(array: T[]): T[] {
    return array
        .map((a) => [Math.random(), a] as const)
        .sort(([a], [b]) => a - b)
        .map(([, b]) => b)
}

export function generatePorts(): Port[] {
    const resources: ResourceType[] = ['brick', 'wood', 'ore', 'wheat', 'sheep']

    // 2 null ports (3:1)
    const portsData: Omit<Port, 'x' | 'y'>[] = [
        { ratio: '3:1', resource: null },
        { ratio: '3:1', resource: null },
    ]

    // Add each resource once
    const baseResources = [...resources]

    // Add 5 more random ones from all 5
    const additional = shuffle([...resources]).slice(0, 5)

    const finalResources = shuffle([...baseResources, ...additional])

    portsData.push(
        ...finalResources.map((resource) => ({
            ratio: '2:1' as const,
            resource,
        }))
    )

    const shuffledCoords = shuffle(portCoords)

    return shuffledCoords.map((coord, i) => ({
        ...coord,
        ...portsData[i],
    }))
}
