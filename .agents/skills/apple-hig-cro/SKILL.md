---
name: apple-hig-cro
description: >-
  Apple Human Interface Guidelines (HIG) and CRO (Conversion Rate Optimization) mobile-first design system.
  Use when designing or auditing mobile web interfaces, loyalty experiences, registration flows, haptic feedback,
  iOS fluid glassmorphism, 44px+ touch targets, and conversion psychology.
---

# Apple HIG & CRO Mobile-First Design System

This skill embeds Apple's official Human Interface Guidelines (iOS Design Principles) combined with CRO (Conversion Rate Optimization) strategies for mobile web applications.

## Core Apple HIG Principles for Web & Mobile
1. **Clarity & Typography:**
   - Hierarchy: Bold prominent titles (`text-2xl font-black`), secondary captions in subdued contrast.
   - Text truncation prevention and comfortable line heights (1.4-1.6x).
   - Safe areas: Respect notch and home indicator padding (`env(safe-area-inset-bottom)`).

2. **Touch Ergonomics & Fitts's Law:**
   - Minimum interactive tap target: 44 x 44 pt (min-h-[48px] to 56px for primary action buttons).
   - Thumb-zone optimization: Primary CTAs placed at the bottom within natural one-hand thumb reach.
   - Active press states: `active:scale-[0.97]` with smooth transition for physical tactile feel.

3. **Depth, Glassmorphism & Fluidity:**
   - Translucent background blurs (`backdrop-blur-xl`, `bg-white/80` or `bg-slate-900/80`).
   - Layered elevation with subtle border strokes (`border border-white/20` or `border-slate-200/60`) and soft ambient shadows (`shadow-2xl shadow-blue-500/10`).
   - Smooth 60fps GPU-accelerated CSS animations (`transform` and `opacity` only).

4. **Continuous Delight & Micro-Celebrations:**
   - Reward loops: When users hit milestones, trigger continuous organic animations (floating bubbles, ambient confetti, pulsing badges) rather than static or abrupt single-shot flashes.

## Conversion Rate Optimization (CRO) Pillars
1. **Frictionless Onboarding (The 1-Step Law):**
   - Eliminate unnecessary questions.
   - Auto-advance inputs (e.g. 4-digit PIN auto-submit on 4th digit).
   - Visual progress gradients: Clearly communicate "Only X visits left to get your free gift!" (Goal-Gradient effect).

2. **Retention & Marketing Telemetry:**
   - Never lose customer contact information. Store valid customer phone numbers securely and clearly in the merchant database so managers can perform win-back calls, WhatsApp loyalty perks, and personalized retention offers.
