# Product

## Register

product

## Platform

web

## Users

Primary users are students on campus who need documents printed. They're often on mobile, moving between classes, uploading a file, choosing pages/copies, picking a location and pickup time, and paying — all in a few minutes of downtime, not at a desk. Secondary users are the print shop's own staff, who run day-to-day fulfillment through a separate admin portal: working the order queue, managing locations and pricing, and tracking penalties. The two never share a screen — a student never sees admin chrome, and staff never see the student-facing shell.

## Product Purpose

PrintEase exists to remove the physical queue at a campus print shop. A student uploads a document, pays, and gets a pickup slot without ever standing in line; the shop gets a clean, trackable order pipeline instead of walk-up chaos. Success is measured in time-to-pickup and in how invisible the ordering step feels — the app should get out of the way as fast as possible.

## Positioning

Order-ahead printing for campus: upload, pay, and pick up on your schedule. The differentiator is time saved, not price or print quality — this is mobile ordering applied to printing, not a better copy shop.

## Brand Personality

Fast, precise, modern. Confidence comes from speed and clarity, not decoration — accurate page counts, live pricing, and honest status updates do the persuading, not marketing language. The shipped direction is a paper-and-ink print-shop system (ink `#0b0b0d` / paper `#f4f4f6`, green `#34c759` as the one brand accent, Plus Jakarta Sans, ticket/perforation/dot-grid motifs) rather than a generic dark-glass SaaS look. Admin ("Press Room") is the same system permanently in ink-dark with amber as its mode marker — one brand, two rooms, not two apps.

## Anti-references

Should never read as generic campus portal software — no dated LMS/registrar forms, default browser widgets, or bureaucratic zero-personality UI. That institutional flatness is the thing this product is explicitly built to feel nothing like.

## Design Principles

Order-ahead over queue: every core flow should shrink time-to-pickup, never add ceremony or extra steps between upload and pickup confirmation.

Precision reads as trust: exact page counts, live pricing breakdowns, and honest order-status timelines are the credibility mechanism — not copy, not badges.

One tool, two audiences, no crossover: the student app and the admin portal stay purpose-built for their own user; neither leaks the other's layout, tone, or density.

Never institutional: reject campus-portal and generic-SaaS defaults alike — every screen should feel deliberately designed, not assembled from framework defaults.

## Accessibility & Inclusion

WCAG 2.1 AA baseline: color contrast, full keyboard navigation, and reduced-motion support. Reduced motion is already partially handled in the CSS (`prefers-reduced-motion` fallbacks on the animated background) and that pattern should extend to any new motion work.
