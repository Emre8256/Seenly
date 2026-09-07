import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsActionModal } from '../pages/SettingsPage';

describe('settings confirmation dialog', () => {
  it('closes with Escape and restores focus', () => {
    const close = vi.fn();
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<SettingsActionModal type="name" langCode="en" email="" onClose={close} onConfirm={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
    unmount();
    expect(opener).toHaveFocus();
  });

  it('does not allow incomplete email verification', () => {
    render(<SettingsActionModal type="email" langCode="en" email="ada@example.test" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Verify and Update' })).toBeDisabled();
  });
});
