export type MaterialType = 'wood' | 'brick' | 'wheat' | 'sheep' | 'ore' | 'desert'

export interface HexTile {
    id: number
    materialType: MaterialType
    rollNumber: number | null
    x: number
    y: number
}


export interface Player {
    id: string
    name: string
    color: string

    resources: {
        wood: number
        brick: number
        wheat: number
        sheep: number
        ore: number
    }

    devCards: string[]        // e.g. ['Knight', 'Monopoly']
    newDevCards: string[]     // bought this turn

    playedDevCard: boolean

    points: number
    knightsPlayed: number
    hasLongestRoad: boolean
    hasLargestArmy: boolean

    longestRoad: number

    invRoad: number
    invSettlement: number
    invCity: number

    buildings: Building[]     // List of roads/houses/mansions with positions
    isMyTurn: boolean

    isReady: boolean

}

export type BuildingType = 'road' | 'settlement' | 'city'

export interface Building {
    type: BuildingType
    position: number[]          // [q, r, cornerIndex] or edge
    connectedTo?: number[][]    // For roads (from → to)
}

export interface Room {
    players: Player[]
    // add more room properties as needed, e.g.:
    gameState?: any
    createdAt?: number
    board?: HexTile[]
    // etc.
}
