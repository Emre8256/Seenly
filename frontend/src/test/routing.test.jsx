import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('hash routing', () => {
  it('renders a controlled result for an invalid route', async () => {
    window.location.hash = '#/does-not-exist';
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Sayfa bulunamadı' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ana sayfaya dön' })).toHaveAttribute('href', '#/');
  });
});
