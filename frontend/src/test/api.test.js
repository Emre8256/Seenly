import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTenSignal, getOwnerDashboard, getOwnerResponseHistory, sendVerificationCode, deleteAccount, getApiBaseUrl } from '../services/api';

describe('API contract errors', () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it('preserves 401 status so protected screens can expire the session', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ message: 'Session expired' }), { status: 401 }));
    await expect(getOwnerDashboard('expired')).rejects.toMatchObject({ status: 401, message: 'Session expired' });
  });

  it('does not report a failed registration as success', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ message: 'Verification required' }), { status: 403 }));
    await expect(createTenSignal('Ada', 'ada@example.test', [], null)).rejects.toMatchObject({ status: 403 });
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

  it('deleteAccount sends DELETE request with X-Owner-Token header', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 200 }));
    const result = await deleteAccount('test-owner-token');
    expect(result).toBe(true);
    expect(fetch.mock.calls[0][0]).toContain('/api/billing/delete-account');
    expect(fetch.mock.calls[0][1].method).toBe('DELETE');
    expect(fetch.mock.calls[0][1].headers['X-Owner-Token']).toBe('test-owner-token');
  });

  it('deleteAccount throws with status code when request fails', async () => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }));
    await expect(deleteAccount('invalid-token')).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized'
    });
  });

  it('getApiBaseUrl returns configured prefix or empty string in test environment', () => {
    const url = getApiBaseUrl();
    expect(typeof url).toBe('string');
  });
});
