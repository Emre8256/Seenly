import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import SecuritySettingsTab from '../pages/settings/SecuritySettingsTab';
import { getNotificationPreferences, updateNotificationPreferences } from '../services/api';
import { LocaleProvider } from '../context/LocaleContext';

describe('Notification Preferences Frontend Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('API service functions', () => {
    it('getNotificationPreferences calls GET with X-Owner-Token header', async () => {
      const mockPrefs = {
        masterEmail: true,
        evaluations: true,
        reminders: true,
        cardChanges: true,
        capacityAlerts: true
      };
      fetch.mockResolvedValueOnce(new Response(JSON.stringify(mockPrefs), { status: 200 }));

      const result = await getNotificationPreferences('test-owner-token');
      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, options] = fetch.mock.calls[0];
      expect(url).toContain('/api/v1/tensignal/owner/notification-preferences');
      expect(options.headers['X-Owner-Token']).toBe('test-owner-token');
      expect(result).toEqual(mockPrefs);
    });

    it('updateNotificationPreferences calls PUT with X-Owner-Token and correct payload', async () => {
      const payload = {
        masterEmail: false,
        evaluations: true,
        reminders: false,
        cardChanges: true,
        capacityAlerts: true
      };
      fetch.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }));

      const result = await updateNotificationPreferences('test-owner-token', payload);
      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, options] = fetch.mock.calls[0];
      expect(url).toContain('/api/v1/tensignal/owner/notification-preferences');
      expect(options.method).toBe('PUT');
      expect(options.headers['X-Owner-Token']).toBe('test-owner-token');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(options.body)).toEqual(payload);
      expect(result).toEqual(payload);
    });

    it('throws when backend returns an error', async () => {
      fetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Unauthorized token' }), { status: 401 }));
      await expect(getNotificationPreferences('invalid-token')).rejects.toThrow('Unauthorized token');
    });
  });

  describe('SecuritySettingsTab UI Component', () => {
    const defaultPrefs = {
      masterEmail: true,
      evaluations: true,
      reminders: true,
      cardChanges: true,
      capacityAlerts: true
    };

    const renderWithLocale = (ui) => {
      return render(
        <LocaleProvider>
          {ui}
        </LocaleProvider>
      );
    };

    it('renders master switch and exactly 4 real subcategory switches without fake switches', () => {
      const handleToggle = vi.fn();
      renderWithLocale(
        <SecuritySettingsTab notifPrefs={defaultPrefs} handleToggleNotif={handleToggle} />
      );

      // Verify master switch is present
      const masterSwitch = document.getElementById('notif-switch-master');
      expect(masterSwitch).not.toBeNull();
      expect(masterSwitch.getAttribute('aria-checked')).toBe('true');

      // Verify 4 real category switches are present
      expect(document.getElementById('notif-switch-evaluations')).not.toBeNull();
      expect(document.getElementById('notif-switch-reminders')).not.toBeNull();
      expect(document.getElementById('notif-switch-card-changes')).not.toBeNull();
      expect(document.getElementById('notif-switch-capacity-alerts')).not.toBeNull();

      // Ensure fake switches are NOT present
      expect(screen.queryByText(/Weekly Digest/i)).toBeNull();
      expect(screen.queryByText(/Haftalık Özet/i)).toBeNull();
      expect(screen.queryByText(/Product Updates/i)).toBeNull();
      expect(screen.queryByText(/Pazarlama & Güncellemeler/i)).toBeNull();
    });

    it('does not render unnecessary notice boxes or unverified legal claims', () => {
      renderWithLocale(
        <SecuritySettingsTab notifPrefs={defaultPrefs} handleToggleNotif={vi.fn()} />
      );

      // Must NOT contain "yasal zorunluluk" or "legally required"
      expect(screen.queryByText(/yasal zorunluluk/i)).toBeNull();
      expect(screen.queryByText(/legally required/i)).toBeNull();
    });

    it('disables all subcategory switches when master switch is OFF while preserving their values', () => {
      const prefsWithMasterOff = {
        masterEmail: false,
        evaluations: true,
        reminders: false,
        cardChanges: true,
        capacityAlerts: false
      };
      const handleToggle = vi.fn();

      renderWithLocale(
        <SecuritySettingsTab notifPrefs={prefsWithMasterOff} handleToggleNotif={handleToggle} />
      );

      const masterSwitch = document.getElementById('notif-switch-master');
      expect(masterSwitch.getAttribute('aria-checked')).toBe('false');

      const evalSwitch = document.getElementById('notif-switch-evaluations');
      const reminderSwitch = document.getElementById('notif-switch-reminders');
      const cardSwitch = document.getElementById('notif-switch-card-changes');
      const capSwitch = document.getElementById('notif-switch-capacity-alerts');

      // All sub switches MUST be disabled
      expect(evalSwitch).toBeDisabled();
      expect(reminderSwitch).toBeDisabled();
      expect(cardSwitch).toBeDisabled();
      expect(capSwitch).toBeDisabled();

      // Their individual states must be preserved (not cleared to false)
      expect(evalSwitch.getAttribute('aria-checked')).toBe('true');
      expect(reminderSwitch.getAttribute('aria-checked')).toBe('false');
      expect(cardSwitch.getAttribute('aria-checked')).toBe('true');
      expect(capSwitch.getAttribute('aria-checked')).toBe('false');
    });

    it('calls handleToggleNotif with category key when clicked', () => {
      const handleToggle = vi.fn();
      renderWithLocale(
        <SecuritySettingsTab notifPrefs={defaultPrefs} handleToggleNotif={handleToggle} />
      );

      fireEvent.click(document.getElementById('notif-switch-master'));
      expect(handleToggle).toHaveBeenCalledWith('masterEmail');

      fireEvent.click(document.getElementById('notif-switch-evaluations'));
      expect(handleToggle).toHaveBeenCalledWith('evaluations');

      fireEvent.click(document.getElementById('notif-switch-reminders'));
      expect(handleToggle).toHaveBeenCalledWith('reminders');

      fireEvent.click(document.getElementById('notif-switch-card-changes'));
      expect(handleToggle).toHaveBeenCalledWith('cardChanges');

      fireEvent.click(document.getElementById('notif-switch-capacity-alerts'));
      expect(handleToggle).toHaveBeenCalledWith('capacityAlerts');
    });
  });
});
