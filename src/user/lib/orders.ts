/**
 * Order status vocabulary — labels, chip styling, timeline mapping and the
 * status-change notification copy, all ported verbatim from the Flutter app
 * (lib/models/print_order.dart, lib/widgets/status_chip.dart,
 * lib/state/app_state.dart, lib/screens/order_detail_screen.dart).
 */
import type { ColorMode, Order, OrderStatus, PrintSide } from '@/types'
import { printCost } from '@/lib/pricing'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Awaiting Payment',
  SCHEDULED: 'Scheduled',
  QUEUED: 'Queued',
  PRINTING: 'Printing',
  PRINTED_PENDING_STACK: 'Waiting for Pickup Slot',
  COMPLETED: 'Ready to Collect',
  COLLECTED: 'Collected',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
}

export const SIDE_LABELS: Record<PrintSide, string> = {
  SINGLE: 'Single-sided',
  DOUBLE: 'Double-sided',
}

export function colorModeLabel(mode: ColorMode): string {
  return mode === 'COLOR' ? 'Colour' : 'B&W'
}

/** paid = anything except pending / cancelled / failed. */
export function isPaid(status: OrderStatus): boolean {
  return status !== 'PENDING' && status !== 'CANCELLED' && status !== 'FAILED'
}

/** Authoritative cost when present, else the local fallback formula. */
export function orderCost(order: Order): number {
  if (order.totalCost > 0) return Math.round(order.totalCost)
  return printCost({ pages: order.pages, copies: order.copies, side: order.side })
}

export type ChipTone = 'muted' | 'warning' | 'success'

/** Dot tone + filled-black emphasis per status (status_chip.dart). */
export const STATUS_CHIP: Record<OrderStatus, { tone: ChipTone; filled: boolean }> = {
  PENDING: { tone: 'warning', filled: false },
  SCHEDULED: { tone: 'muted', filled: false },
  QUEUED: { tone: 'muted', filled: false },
  PRINTING: { tone: 'warning', filled: true },
  PRINTED_PENDING_STACK: { tone: 'warning', filled: false },
  COMPLETED: { tone: 'success', filled: true },
  COLLECTED: { tone: 'success', filled: false },
  CANCELLED: { tone: 'muted', filled: false },
  FAILED: { tone: 'warning', filled: true },
}

/** The five timeline nodes, in order. */
export const TIMELINE_NODES = [
  'Awaiting Payment',
  'Queued',
  'Printing',
  'Ready to Collect',
  'Collected',
] as const

/**
 * Index of the node a status sits on. PRINTED_PENDING_STACK collapses onto
 * the "Ready" node (relabeled), SCHEDULED onto the first node.
 * Returns -1 for CANCELLED / FAILED (they show a message card instead).
 */
export function timelineIndex(status: OrderStatus): number {
  switch (status) {
    case 'PENDING':
    case 'SCHEDULED':
      return 0
    case 'QUEUED':
      return 1
    case 'PRINTING':
      return 2
    case 'PRINTED_PENDING_STACK':
    case 'COMPLETED':
      return 3
    case 'COLLECTED':
      return 4
    case 'CANCELLED':
    case 'FAILED':
      return -1
  }
}

/** Node label, honoring the awaiting-stack relabel of node 3. */
export function timelineNodeLabel(nodeIndex: number, status: OrderStatus): string {
  if (nodeIndex === 3 && status === 'PRINTED_PENDING_STACK') {
    return STATUS_LABELS.PRINTED_PENDING_STACK
  }
  return TIMELINE_NODES[nodeIndex]
}

/**
 * Notification copy fired on a status transition (app_state.dart).
 * Returns null for transitions that never notify.
 */
export function transitionNotification(
  fileName: string,
  from: OrderStatus,
  to: OrderStatus,
): { title: string; body: string } | null {
  switch (to) {
    case 'PRINTING':
      return { title: 'Printing now', body: `${fileName} is being printed.` }
    case 'PRINTED_PENDING_STACK':
      return { title: 'Printed', body: `${fileName} is printed and waiting for a pickup slot.` }
    case 'COMPLETED':
      return { title: 'Ready to collect!', body: `${fileName} is ready — come collect it.` }
    case 'COLLECTED':
      return { title: 'Collected', body: `${fileName} was collected. Thanks!` }
    case 'QUEUED':
      if (from === 'SCHEDULED') {
        return { title: 'Scheduled print queued', body: `${fileName} is now in the print queue.` }
      }
      return null
    default:
      return null
  }
}
