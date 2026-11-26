'use client';

import React from 'react';

const BALLOONS = [
  { left: '8%', size: '36px', color: '#f59e0b', duration: '6.5s', delay: '0s', drift: '22px', rot: '14deg', emoji: '🎈' },
  { left: '22%', size: '42px', color: '#ef4444', duration: '7.8s', delay: '1.2s', drift: '-20px', rot: '-10deg', emoji: '🎈' },
  { left: '38%', size: '34px', color: '#10b981', duration: '6.2s', delay: '2.5s', drift: '25px', rot: '16deg', emoji: '🎉' },
  { left: '54%', size: '40px', color: '#3b82f6', duration: '7.1s', delay: '0.8s', drift: '-18px', rot: '-12deg', emoji: '🎈' },
  { left: '70%', size: '44px', color: '#8b5cf6', duration: '8.2s', delay: '2.1s', drift: '20px', rot: '15deg', emoji: '🎈' },
  { left: '85%', size: '38px', color: '#ec4899', duration: '6.9s', delay: '1.6s', drift: '-24px', rot: '-14deg', emoji: '✨' },
];

const CONFETTI_PIECES = [
  { left: '5%', bg: '#f59e0b', duration: '3.8s', delay: '0s', sway: '25px', spin: '720deg', w: '8px', h: '12px' },
  { left: '15%', bg: '#10b981', duration: '4.2s', delay: '0.6s', sway: '-30px', spin: '540deg', w: '10px', h: '10px' },
  { left: '28%', bg: '#3b82f6', duration: '3.6s', delay: '1.4s', sway: '20px', spin: '680deg', w: '7px', h: '14px' },
  { left: '42%', bg: '#ec4899', duration: '4.5s', delay: '0.2s', sway: '-25px', spin: '800deg', w: '9px', h: '12px' },
  { left: '58%', bg: '#f59e0b', duration: '3.9s', delay: '1.8s', sway: '35px', spin: '620deg', w: '8px', h: '11px' },
  { left: '72%', bg: '#8b5cf6', duration: '4.1s', delay: '0.9s', sway: '-22px', spin: '750deg', w: '11px', h: '9px' },
  { left: '84%', bg: '#10b981', duration: '3.7s', delay: '1.2s', sway: '28px', spin: '590deg', w: '8px', h: '13px' },
  { left: '92%', bg: '#ef4444', duration: '4.4s', delay: '0.4s', sway: '-35px', spin: '820deg', w: '10px', h: '10px' },
  { left: '20%', bg: '#06b6d4', duration: '4.0s', delay: '2.2s', sway: '18px', spin: '640deg', w: '7px', h: '12px' },
  { left: '65%', bg: '#eab308', duration: '3.5s', delay: '2.0s', sway: '-28px', spin: '700deg', w: '9px', h: '14px' },
];

export default function MiniConfetti({
  active,
  triggerKey,
}: {
  active?: boolean;
  triggerKey?: number;
}) {
  // If active is true (e.g. member is viewing their progress/remaining visits),
  // balloons and confetti continuously rise/fall.
  // If only triggerKey is passed, it behaves gracefully.
  const isContinuous = active ?? (triggerKey !== undefined && triggerKey > 0);

  if (!isContinuous) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none"
    >
      {/* 1. Continuous Floating Balloons */}
      {BALLOONS.map((b, idx) => (
        <span
          key={`balloon-${idx}`}
          style={{
            left: b.left,
            fontSize: b.size,
            animation: `balloon-float ${b.duration} linear ${b.delay} infinite`,
            // @ts-expect-error CSS variable
            '--drift-x': b.drift,
            '--rot': b.rot,
          }}
          className="absolute -bottom-16 will-change-transform filter drop-shadow-sm select-none"
        >
          {b.emoji}
        </span>
      ))}

      {/* 2. Continuous Ambient Confetti Rain */}
      {CONFETTI_PIECES.map((c, idx) => (
        <span
          key={`confetti-${idx}`}
          style={{
            left: c.left,
            width: c.w,
            height: c.h,
            backgroundColor: c.bg,
            animation: `confetti-fall-continuous ${c.duration} linear ${c.delay} infinite`,
            // @ts-expect-error CSS variable
            '--sway-x': c.sway,
            '--spin': c.spin,
          }}
          className="absolute -top-6 rounded-xs shadow-xs will-change-transform opacity-90"
        />
      ))}
    </div>
  );
}
