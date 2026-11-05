import type { Show } from "@/lib/types";

/** 余票 = 总容量 − 已占用订单票数 */
export function publicRemainingSeats(capacity: number, heldSeats: number): number {
  return Math.max(0, capacity - heldSeats);
}

export function showPublicRemaining(show: Show, heldSeats: number): number {
  return publicRemainingSeats(show.capacity, heldSeats);
}
