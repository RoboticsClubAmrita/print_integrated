/**
 * Demo seed data. Ten orders cover all nine statuses so every UI state is
 * visible immediately; two open penalties (₹15) exercise the pending-dues
 * collection gate; a QUEUED and a PRINTING order carry near-future
 * transition deadlines so the first session sees live movement.
 */
import type { AppNotification, Db, Order, Penalty, PrintLocation, User } from '@/types'
import { SCHEMA_VERSION } from '@/services/db'

export const DEMO_EMAIL = 'ananya@cb.students.amrita.edu'
export const DEMO_PASSWORD = 'print123'

export const LOCATIONS: PrintLocation[] = [
  { id: 'loc-ab1', name: 'AB1 Print Hub' },
  { id: 'loc-ab2', name: 'AB2 Xerox Centre' },
  { id: 'loc-lib', name: 'Central Library Print Desk' },
  { id: 'loc-hall', name: 'Amriteshwari Hall Kiosk' },
]

const DEMO_USER: User = {
  id: 'u-demo',
  collegeId: 'CB.EN.U4CSE22042',
  name: 'Ananya Menon',
  email: DEMO_EMAIL,
  phone: '9876543210',
  password: DEMO_PASSWORD,
  role: 'ADMIN',
  balance: 0,
}

interface SeedOrderSpec {
  ref: number
  fileName: string
  status: Order['status']
  pages: number
  totalDocPages?: number
  copies: number
  side: Order['side']
  createdMinsAgo: number
  scheduledForMins?: number
  nextTransitionSecs?: number
  balanceApplied?: number
  stackName?: string
  collectedStackName?: string
  location?: PrintLocation
}

function makeOrder(now: number, spec: SeedOrderSpec): Order {
  const perCopy =
    spec.side === 'SINGLE' ? spec.pages * 2 : Math.ceil(spec.pages / 2) * 3
  const printCost = spec.copies * perCopy
  const balanceApplied = spec.balanceApplied ?? 0
  const location = spec.location ?? LOCATIONS[0]
  return {
    id: `PE-${spec.ref}`,
    jobId: `job-${spec.ref}`,
    userId: DEMO_USER.id,
    fileName: spec.fileName,
    fileSizeKb: 0,
    pages: spec.pages,
    totalDocPages: spec.totalDocPages ?? spec.pages,
    copies: spec.copies,
    side: spec.side,
    colorMode: 'BW',
    pageType: 'A4',
    selectedPages: null,
    createdAt: new Date(now - spec.createdMinsAgo * 60_000).toISOString(),
    scheduleType: spec.scheduledForMins !== undefined ? 'SCHEDULED' : 'NOW',
    scheduledFor:
      spec.scheduledForMins !== undefined
        ? new Date(now + spec.scheduledForMins * 60_000).toISOString()
        : null,
    status: spec.status,
    costPerPage: spec.side === 'SINGLE' ? 2 : 3,
    printCost,
    balanceApplied,
    totalCost: printCost + balanceApplied,
    locationId: location.id,
    locationName: location.name,
    stackName: spec.stackName ?? null,
    collectedStackName: spec.collectedStackName ?? null,
    nextTransitionAt:
      spec.nextTransitionSecs !== undefined
        ? new Date(now + spec.nextTransitionSecs * 1000).toISOString()
        : null,
  }
}

export function seedDb(): Db {
  const now = Date.now()

  const orders: Order[] = [
    // PENDING — drives "Pay ₹32" on detail + the TOTAL DUE statement
    makeOrder(now, {
      ref: 1041, fileName: 'DBMS_Unit4_Notes.pdf', status: 'PENDING',
      pages: 8, copies: 2, side: 'SINGLE', createdMinsAgo: 35,
    }),
    // SCHEDULED — cancellable, queues at its print time
    makeOrder(now, {
      ref: 1042, fileName: 'Seminar_Slides.pdf', status: 'SCHEDULED',
      pages: 24, copies: 1, side: 'DOUBLE', createdMinsAgo: 120,
      scheduledForMins: 2 * 24 * 60, location: LOCATIONS[1],
    }),
    // QUEUED — first session watches it start printing (~40s in)
    makeOrder(now, {
      ref: 1043, fileName: 'Lab_Record.pdf', status: 'QUEUED',
      pages: 12, copies: 1, side: 'SINGLE', createdMinsAgo: 6,
      nextTransitionSecs: 40,
    }),
    // PRINTING — advances to awaiting-stack (~90s in)
    makeOrder(now, {
      ref: 1044, fileName: 'Assignment_3.docx', status: 'PRINTING',
      pages: 6, copies: 1, side: 'SINGLE', createdMinsAgo: 12,
      nextTransitionSecs: 90, location: LOCATIONS[2],
    }),
    // PRINTED_PENDING_STACK — frozen (no free slot) to keep the state visible
    makeOrder(now, {
      ref: 1045, fileName: 'Circuit_Diagram.png', status: 'PRINTED_PENDING_STACK',
      pages: 1, copies: 2, side: 'SINGLE', createdMinsAgo: 50,
    }),
    // COMPLETED — the collection (OTP + dues gate) demo
    makeOrder(now, {
      ref: 1046, fileName: 'Resume_2026.pdf', status: 'COMPLETED',
      pages: 2, copies: 1, side: 'SINGLE', createdMinsAgo: 95,
      stackName: 'B', location: LOCATIONS[1],
    }),
    // COLLECTED with a carried-over balance row in its cost breakdown
    makeOrder(now, {
      ref: 1047, fileName: 'Hostel_Form.pdf', status: 'COLLECTED',
      pages: 2, copies: 1, side: 'SINGLE', createdMinsAgo: 2 * 24 * 60,
      balanceApplied: 6, collectedStackName: 'A',
    }),
    // COLLECTED — plain history entry
    makeOrder(now, {
      ref: 1048, fileName: 'Question_Bank.pdf', status: 'COLLECTED',
      pages: 30, copies: 1, side: 'DOUBLE', createdMinsAgo: 5 * 24 * 60,
      collectedStackName: 'C', location: LOCATIONS[2],
    }),
    // CANCELLED — feeds the totalDue quirk (unpaid includes cancelled)
    makeOrder(now, {
      ref: 1049, fileName: 'Old_Notes.pdf', status: 'CANCELLED',
      pages: 10, copies: 1, side: 'SINGLE', createdMinsAgo: 3 * 24 * 60,
    }),
    // FAILED — filled-black chip + the quirk
    makeOrder(now, {
      ref: 1050, fileName: 'Corrupt_Scan.pdf', status: 'FAILED',
      pages: 3, copies: 1, side: 'SINGLE', createdMinsAgo: 4 * 24 * 60,
    }),
  ]

  const penalties: Penalty[] = [
    // Settled via PE-1047's invoice (its balanceApplied row) — 0 remaining
    {
      id: 'pen-1', userId: DEMO_USER.id, referenceId: 'PE-1047',
      amount: 6, settledAmount: 6,
      createdAt: new Date(now - 2 * 24 * 3_600_000).toISOString(),
    },
    // Open dues — together ₹15, blocking collection until paid
    {
      id: 'pen-2', userId: DEMO_USER.id, referenceId: 'PE-1039',
      amount: 9, settledAmount: 0,
      createdAt: new Date(now - 6 * 24 * 3_600_000).toISOString(),
    },
    {
      id: 'pen-3', userId: DEMO_USER.id, referenceId: 'PE-1036',
      amount: 6, settledAmount: 0,
      createdAt: new Date(now - 9 * 24 * 3_600_000).toISOString(),
    },
  ]

  const notifications: AppNotification[] = [
    {
      id: 'n-3', userId: DEMO_USER.id, title: 'Ready to collect!',
      body: 'Resume_2026.pdf is ready — come collect it.',
      time: new Date(now - 18 * 60_000).toISOString(),
    },
    {
      id: 'n-2', userId: DEMO_USER.id, title: 'Printed',
      body: 'Circuit_Diagram.png is printed and waiting for a pickup slot.',
      time: new Date(now - 42 * 60_000).toISOString(),
    },
    {
      id: 'n-1', userId: DEMO_USER.id, title: 'Printing now',
      body: 'Assignment_3.docx is being printed.',
      time: new Date(now - 55 * 60_000).toISOString(),
    },
  ]

  return {
    schemaVersion: SCHEMA_VERSION,
    seededAt: new Date(now).toISOString(),
    users: [DEMO_USER],
    orders,
    penalties,
    notifications,
  }
}
