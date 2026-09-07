import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSeenly, getOwnerDashboard, getOwnerResponseHistory, sendVerificationCode } from '../services/api';

describe('API contract errors', () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it('preserves 401 status so protected screens can expire the session', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ message: 'Session expired' }), { status: 401 }));
    await expect(getOwnerDashboard('expired')).rejects.toMatchObject({ status: 401, message: 'Session expired' });
  });

  it('does not report a failed registration as success', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ message: 'Verification required' }), { status: 403 }));
    await expect(createSeenly('Ada', 'ada@example.test', [], null)).rejects.toMatchObject({ status: 403 });
  });

  it('encodes and bounds owner history requests', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ items: [], hasMore: false, totalCount: 0 }), { status: 200 }));
    await getOwnerResponseHistory('owner', 'cursor/value', 5);
    expect(fetch.mock.calls[0][0]).toContain('cursor=cursor%2Fvalue');
    expect(fetch.mock.calls[0][1].headers['X-Owner-Token']).toBe('owner');
  });

  it('accepts an empty successful send-code response', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(sendVerificationCode('ada@example.test', 'REGISTER'))
      .resolves.toEqual({ status: 'success' });
  });

  it('does not block the OTP screen when a successful proxy response is not JSON', async () => {
    fetch.mockResolvedValue(new Response('accepted', { status: 202 }));

    await expect(sendVerificationCode('ada@example.test', 'REGISTER'))
      .resolves.toEqual({ status: 'success' });
  });
});
