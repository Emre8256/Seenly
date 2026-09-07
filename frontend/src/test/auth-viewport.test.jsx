import React from 'react';
import { act, render, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import useAuthViewport from '../pages/quiz/useAuthViewport';

function Harness({ active = true }) {
  const ref = useAuthViewport(active);
  return <div ref={ref} data-testid="viewport" />;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('tracks keyboard height and viewport panning, restores height and cleans up', () => {
  vi.useFakeTimers();
  const viewport = Object.assign(new EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
  vi.stubGlobal('visualViewport', viewport);
  const { getByTestId, rerender } = render(<Harness />);
  const root = getByTestId('viewport');
  act(() => vi.runAllTimers());
  expect(root.style.getPropertyValue('--auth-height')).toBe('800px');
  act(() => {
    viewport.height = 360;
    viewport.offsetTop = 40;
    viewport.dispatchEvent(new Event('resize'));
    vi.runAllTimers();
  });
  expect(root.style.getPropertyValue('--auth-height')).toBe('360px');
  expect(root.style.getPropertyValue('--auth-top')).toBe('40px');
  expect(root.dataset.compact).toBe('true');
  act(() => {
    viewport.height = 800;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event('resize'));
    vi.runAllTimers();
  });
  expect(root.dataset.compact).toBe('false');
  rerender(<Harness active={false} />);
  act(() => {
    viewport.dispatchEvent(new Event('resize'));
    vi.runAllTimers();
  });
  expect(root.style.getPropertyValue('--auth-height')).toBe('');
});

it('falls back without VisualViewport and leaves pinch zoom to the browser', () => {
  vi.useFakeTimers();
  vi.stubGlobal('visualViewport', undefined);
  const { getByTestId, unmount } = render(<Harness />);
  act(() => vi.runAllTimers());
  expect(getByTestId('viewport').style.getPropertyValue('--auth-height')).toBe(`${window.innerHeight}px`);
  unmount();
  vi.stubGlobal('visualViewport', Object.assign(new EventTarget(), { height: 200, offsetTop: 30, scale: 2 }));
  const view = render(<Harness />);
  act(() => vi.runAllTimers());
  expect(view.getByTestId('viewport').style.getPropertyValue('--auth-height')).toBe('');
});
