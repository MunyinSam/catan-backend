interface Player {
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

}

export type BuildingType = 'road' | 'settlement' | 'city'

export interface Building {
    type: BuildingType
    position: number[]          // [q, r, cornerIndex] or edge
    connectedTo?: number[][]    // For roads (from → to)
}


export function createDefaultPlayer(id: string, name: string): Player {
    return {
        id,
        name,
        color: null as any,

        resources: {
            wood: 0,
            brick: 0,
            wheat: 0,
            sheep: 0,
            ore: 0,
        },

        devCards: [],
        newDevCards: [],
        playedDevCard: false,

        points: 0,
        knightsPlayed: 0,
        hasLongestRoad: false,
        hasLargestArmy: false,

        longestRoad: 0,

        invRoad: 15,
        invSettlement: 5,
        invCity: 4,

        buildings: [],

        isMyTurn: false,
    }
}
