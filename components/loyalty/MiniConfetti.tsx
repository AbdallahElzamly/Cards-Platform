'use client';

import React, { useEffect, useState } from 'react';

const PIECES = [
  { left: '12%', bg: '#f59e0b', delay: '0ms', duration: '950ms' },
  { left: '24%', bg: '#10b981', delay: '60ms', duration: '1100ms' },
  { left: '36%', bg: '#3b82f6', delay: '20ms', duration: '1000ms' },
  { left: '48%', bg: '#ec4899', delay: '90ms', duration: '1150ms' },
  { left: '60%', bg: '#f59e0b', delay: '40ms', duration: '980ms' },
  { left: '72%', bg: '#8b5cf6', delay: '80ms', duration: '1080ms' },
  { left: '84%', bg: '#10b981', delay: '30ms', duration: '1020ms' },
  { left: '18%', bg: '#ef4444', delay: '120ms', duration: '1120ms' },
  { left: '54%', bg: '#06b6d4', delay: '140ms', duration: '1050ms' },
  { left: '78%', bg: '#eab308', delay: '100ms', duration: '990ms' },
];

export default function MiniConfetti({ triggerKey }: { triggerKey: number }) {
  const [dismissedKey, setDismissedKey] = useState(0);

  useEffect(() => {
    if (!triggerKey) return;
    const timer = setTimeout(() => setDismissedKey(triggerKey), 1300);
    return () => clearTimeout(timer);
  }, [triggerKey]);

  const visible = triggerKey > 0 && dismissedKey !== triggerKey;
  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-12 z-50 mx-auto max-w-[430px] h-44 overflow-hidden"
    >
      {PIECES.map((p, idx) => (
        <span
          key={`${triggerKey}-${idx}`}
          style={{
            left: p.left,
            backgroundColor: p.bg,
            animation: `loyalty-confetti ${p.duration} ease-out ${p.delay} forwards`,
          }}
          className="absolute top-0 w-2.5 h-3.5 rounded-sm shadow-sm"
        />
      ))}
    </div>
  );
}
