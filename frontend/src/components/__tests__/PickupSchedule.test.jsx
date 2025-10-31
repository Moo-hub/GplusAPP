import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import PickupSchedule from '../../components/PickupSchedule';
import * as api from '../../services/api';

describe('PickupSchedule', () => {
  beforeEach(() => {
    // Mock getPickupSchedule to return valid data
    vi.spyOn(api, 'getPickupSchedule').mockResolvedValue({
      upcoming: [{ id: 1, date: '2025-10-26', status: 'upcoming' }],
      past: [{ id: 2, date: '2025-10-20', status: 'past' }]
    });
  });
  it('renders upcoming and past pickups', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PickupSchedule />
      </I18nextProvider>
    );
    // Await for the schedule to load
    expect((await screen.findAllByText(/Pickup Schedule|pickup_schedule/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Upcoming Requests|upcoming/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Past Requests|past/i)).length).toBeGreaterThan(0);
  });
});


