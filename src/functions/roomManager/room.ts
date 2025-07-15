export interface Player {
    id: string
    name: string
    // add more player properties as needed
}

export interface Room {
    players: Player[]
    // add more room properties as needed, e.g.:
    gameState?: any
    createdAt?: number
    // etc.
}

const rooms: Record<string, Room> = {}

export function generateRoomCode(length = 5): string {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length)
        .toUpperCase()
}

export { rooms }