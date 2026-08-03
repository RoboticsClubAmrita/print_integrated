import {
  FileUp,
  KeyRound,
  Package,
  Route,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react'

/**
 * The six stages of a print job, in order, as shown by the landing page's
 * "How it works" section.
 *
 * These used to live alongside the first-run walkthrough carousel and were
 * shared with it; that carousel has been removed, so this is now just the
 * landing-page copy.
 */
export const HOW_IT_WORKS_STEPS = [
  {
    icon: FileUp,
    title: 'Upload in seconds',
    body: 'Pick any PDF, DOC or image — PrintEase detects the page count for you instantly.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Choose your options',
    body: 'Single or double-sided, copies, colour and the exact page range — your call.',
  },
  {
    icon: Wallet,
    title: 'Pay securely',
    body: 'Checkout with Razorpay. Your total is always clear before you confirm.',
  },
  {
    icon: Route,
    title: 'Track every step',
    body: 'Watch your job move from queued to printing to ready — live, with notifications.',
  },
  {
    icon: KeyRound,
    title: 'Get a pickup OTP',
    body: "When it's ready, generate a one-time code so only you can collect it.",
  },
  {
    icon: Package,
    title: 'Grab & go',
    body: 'Show your OTP at the stack and collect your prints — no queue, no waiting.',
  },
] as const
