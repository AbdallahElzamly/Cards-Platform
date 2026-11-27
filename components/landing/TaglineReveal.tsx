'use client';

import React, { useEffect, useRef, useState } from 'react';

interface TaglineRevealProps {
  lines: string[];
}

export default function TaglineReveal({ lines }: TaglineRevealProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [activeWordCount, setActiveWordCount] = useState<number>(0);

  const allWords = lines.flatMap((line, lineIdx) =>
    line
      .trim()
      .split(/\s+/)
      .map((word, wordIdx, arr) => ({
        word,
        isLineBreakAfter: wordIdx === arr.length - 1 && lineIdx < lines.length - 1,
      }))
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    let rafId: number | null = null;
    let isVisible = false;

    const updateProgress = () => {
      rafId = null;
      if (!sectionRef.current || !isVisible) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight || 800;

      const startY = vh * 0.85;
      const endY = vh * 0.3;
      const rawProgress = (startY - rect.top) / (startY - endY);
      const clamped = Math.max(0, Math.min(1, rawProgress));
      const nextCount = Math.round(clamped * allWords.length);
      setActiveWordCount((prev) => (nextCount > prev ? nextCount : prev));
    };

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            scheduleUpdate();
          }
        });
      },
      { threshold: [0, 0.15, 0.35, 0.6, 0.85, 1] }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    scheduleUpdate();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [allWords.length]);

  return (
    <section
      ref={sectionRef}
      aria-label="الرسالة الأساسية"
      className="py-20 sm:py-28 px-4 sm:px-6 border-t border-b border-white/10 bg-[#000000]"
    >
      <div className="max-w-[680px] mx-auto text-center">
        <p
          className="text-2xl sm:text-4xl font-semibold leading-snug tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          {allWords.map((item, idx) => {
            const active = idx < activeWordCount;
            return (
              <React.Fragment key={idx}>
                <span
                  className={`inline-block transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:opacity-100 ${
                    active ? 'text-white opacity-100' : 'text-white opacity-25'
                  }`}
                >
                  {item.word}
                </span>{' '}
                {item.isLineBreakAfter && <br />}
              </React.Fragment>
            );
          })}
        </p>
      </div>
    </section>
  );
}
