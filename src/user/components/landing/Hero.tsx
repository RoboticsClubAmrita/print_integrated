import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { TicketShowcase } from '@/components/landing/TicketShowcase'
import { staggerParent, fadeSlideChild } from '@/lib/motion'
import { useAppStore } from '@/store/appStore'

export function Hero() {
  const isLoggedIn = useAppStore((s) => !!s.user)

  return (
    <section className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-28 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
      <motion.div
        variants={staggerParent()}
        initial="hidden"
        animate="visible"
        className="lg:col-span-6 text-center lg:text-left"
      >
        <motion.span
          variants={fadeSlideChild}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-chip text-[12.5px] font-bold text-ink"
        >
          <span className="size-1.5 rounded-full bg-success" />
          Built for Amrita campus printing
        </motion.span>

        <motion.h1
          variants={fadeSlideChild}
          className="mt-5 text-[42px] sm:text-[56px] lg:text-[64px] font-extrabold tracking-[-2px] leading-[1.02] text-ink"
        >
          Campus printing,
          <br />
          minus the queue.
        </motion.h1>

        <motion.p
          variants={fadeSlideChild}
          className="mt-6 text-[16px] sm:text-[18px] font-medium text-muted max-w-[480px] mx-auto lg:mx-0 leading-relaxed"
        >
          Upload a document, set your pages and copies, pay in seconds, and collect with a
          one-time code — no counters, no waiting.
        </motion.p>

        <motion.div
          variants={fadeSlideChild}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
        >
          <Link
            to={isLoggedIn ? '/app' : '/register'}
            className="press inline-flex items-center gap-2.5 h-14 px-7 rounded-[16px] bg-ink text-white font-bold text-[16px] hover:bg-ink-soft transition-colors w-full sm:w-auto justify-center"
          >
            {isLoggedIn ? 'Open App' : 'Get Started'}
            <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
          <a
            href="#how-it-works"
            className="press-soft inline-flex items-center h-14 px-7 rounded-[16px] border-[1.5px] border-line text-ink font-bold text-[16px] hover:border-muted/50 transition-colors w-full sm:w-auto justify-center"
          >
            See how it works
          </a>
        </motion.div>
      </motion.div>

      <div className="lg:col-span-6">
        <TicketShowcase />
      </div>
    </section>
  )
}
