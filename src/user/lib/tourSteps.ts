import type { TourStep } from '@/components/app/CoachTour'

export const NEW_ORDER_TOUR_STEPS: TourStep[] = [
  {
    id: 'tour-upload',
    title: 'Upload Your Document',
    description: 'Pick any PDF, Word doc or image — we detect the page count instantly.',
  },
  {
    id: 'tour-side',
    title: 'Single or Double-Sided',
    description: 'Double-sided fits two pages per sheet — cheaper and greener for long documents.',
  },
  {
    id: 'tour-pages',
    title: 'Pick Specific Pages',
    description: 'Print every page, or tap in to choose a custom range like 1-5, 8.',
  },
  {
    id: 'tour-copies',
    title: 'Set Your Copies',
    description: 'Use + and – to change how many copies you need.',
  },
  {
    id: 'tour-schedule',
    title: 'Choose When to Print',
    description: 'Print right now, or schedule your order for a later time.',
  },
  {
    id: 'tour-location',
    title: 'Choose Your Location',
    description: 'Pick which print stack should receive your order.',
  },
  {
    id: 'tour-total',
    title: 'Estimated Total',
    description: 'Your live cost updates instantly as you adjust pages, copies and sides.',
  },
  {
    id: 'tour-submit',
    title: 'Place Your Order',
    description: "When you're ready, tap here to review and confirm your print job.",
  },
  {
    id: 'tour-nav',
    title: 'Switch Between Tabs',
    description: 'Jump to Orders, Billing or Profile anytime using this bar.',
  },
]