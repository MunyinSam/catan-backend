import { Player, Building } from '../../interface/interface'

export function createDefaultPlayer(id: string, name: string, color: string): Player {
    return {
        id,
        name,
        color: color,

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
        isReady: false,
    }
}
