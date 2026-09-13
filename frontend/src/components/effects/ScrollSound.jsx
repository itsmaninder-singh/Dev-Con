'use client';

import { useEffect, useRef } from 'react';
import soundManager from '../../utils/soundManager.js';

/**
 * ScrollSound: Smooth Ambient Scroll Synthesizer
 * Connects scroll velocity to continuous, fluid atmospheric sound.
 * Zero mechanical ticking, zero clicks/cracks, zero audio spam.
 * Respects prefers-reduced-motion and browser autoplay policies.
 */
export default function ScrollSound() {
  const lastScrollYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    lastScrollYRef.current = window.scrollY;
    lastTimeRef.current = performance.now();

    const handleScroll = () => {
      if (!tickingRef.current) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const currentTime = performance.now();
          const dt = Math.max(1, currentTime - lastTimeRef.current);
          const dy = Math.abs(currentY - lastScrollYRef.current);

          // Calculate instantaneous velocity in px/ms
          const velocity = (dy / dt) * 16.67; // Normalize to ~60fps px/frame

          soundManager.updateScrollVelocity(velocity);

          lastScrollYRef.current = currentY;
          lastTimeRef.current = currentTime;
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    // Unlock Web Audio context smoothly on first user interaction
    const unlockAudio = () => {
      soundManager.getContext();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
    window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
    window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      soundManager.fadeScrollToZero();
    };
  }, []);

  return null;
}

