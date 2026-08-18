/** Domain types mirroring the Flutter app's models (lib/models/*). */

export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'SUPER_ADMIN'

export type OrderStatus =
  | 'PENDING' // Awaiting Payment
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PRINTING'
  | 'PRINTED_PENDING_STACK' // Waiting for Pickup Slot
  | 'COMPLETED' // Ready to Collect
  | 'COLLECTED'
  | 'CANCELLED'
  | 'FAILED'

export type PrintSide = 'SINGLE' | 'DOUBLE'
export type ScheduleType = 'NOW' | 'SCHEDULED'
export type PaperSize = 'A2' | 'A3' | 'A4'
export type ColorMode = 'BW' | 'COLOR'

export interface User {
  id: string
  collegeId: string
  name: string
  email: string
  phone: string
  password: string
  role: Role
  balance: number
}

export interface Order {
  /** Human-friendly reference id shown in the UI, e.g. "PE-1041". */
  id: string
  jobId: string
  userId: string
  /** Backend document id — the key for both the local copy and `/api/files/:id/content`. */
  fileId: string | null
  /**
   * Where the stored document can be read back, or null while it still lives
   * only on this device (order placed, payment not yet settled).
   */
  fileUrl: string | null
  fileName: string
  fileSizeKb: number
  /** Pages to print per copy (length of selectedPages, or totalDocPages). */
  pages: number
  totalDocPages: number
  copies: number
  side: PrintSide
  colorMode: ColorMode
  pageType: PaperSize
  /** 1-based sorted page numbers; null = all pages. */
  selectedPages: number[] | null
  createdAt: string // ISO 8601
  scheduleType: ScheduleType
  scheduledFor: string | null // ISO 8601
  status: OrderStatus
  costPerPage: number
  printCost: number
  /** Carried-over penalty rolled into this invoice. */
  balanceApplied: number
  totalCost: number
  locationId: string | null
  locationName: string | null
  stackName: string | null
  collectedStackName: string | null
  /** Simulation deadline for the next automatic status transition. */
  nextTransitionAt: string | null // ISO 8601
}

export interface Penalty {
  id: string
  userId: string
  referenceId: string
  amount: number
  settledAmount: number
  createdAt: string // ISO 8601
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  time: string // ISO 8601
}

export interface PrintLocation {
  id: string
  name: string
}

export interface PriceRow {
  size: PaperSize
  type: 'bw' | 'colour'
  side: 'single' | 'double'
  price: number
}

export interface Session {
  userId: string
  token: string
  rememberMe: boolean
  createdAt: string // ISO 8601
}

export interface Prefs {
  rememberedEmail: string | null
  /** Legacy device-wide walkthrough flag. Superseded by `tourSeenUserIds`. */
  tourSeen: boolean
  /** Accounts that have already had their one first-run walkthrough. */
  tourSeenUserIds: string[]
  lastSeenNotificationsAt: string | null // ISO 8601
}

export interface Db {
  schemaVersion: number
  seededAt: string // ISO 8601
  users: User[]
  orders: Order[]
  penalties: Penalty[]
  notifications: AppNotification[]
}
