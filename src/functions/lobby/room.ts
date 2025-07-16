import { Room } from "../../interface/interface"

const rooms: Record<string, Room> = {}

export function generateRoomCode(length = 5): string {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length)
        .toUpperCase()
}

export { rooms }