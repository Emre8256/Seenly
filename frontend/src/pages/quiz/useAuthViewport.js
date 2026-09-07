import { useLayoutEffect, useRef } from 'react';

// Mobile keyboards resize the visual viewport, which can differ from 100dvh.
export default function useAuthViewport(active) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!active || !root) return;
    const viewport = window.visualViewport;
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Let the browser retain its native pinch-zoom and panning behavior.
        if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
        const height = viewport?.height ?? window.innerHeight;
        root.style.setProperty('--auth-height', `${height}px`);
        root.style.setProperty('--auth-top', `${viewport?.offsetTop ?? 0}px`);
        root.dataset.compact = String(height < 540);
        const focused = document.activeElement;
        const scroller = focused?.closest('.seenly-wizard-body');
        if (!root.contains(focused) || !scroller) return;
        const input = focused.getBoundingClientRect();
        const bounds = scroller.getBoundingClientRect();
        if (input.bottom > bounds.bottom - 16) {
          scroller.scrollTop += input.bottom - bounds.bottom + 16;
        } else if (input.top < bounds.top + 16) {
          scroller.scrollTop -= bounds.top + 16 - input.top;
        }
      });
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    root.addEventListener('focusin', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      root.removeEventListener('focusin', update);
      root.style.removeProperty('--auth-height');
      root.style.removeProperty('--auth-top');
      delete root.dataset.compact;
    };
  }, [active]);
  return ref;
}
