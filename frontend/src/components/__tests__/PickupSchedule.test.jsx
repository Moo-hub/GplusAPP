// import React from 'react'; // Remove duplicate React import
import { render, screen } from '@testing-library/react';
import PickupSchedule from '../PickupSchedule';
import { setupI18nMock } from '../../test-utils';

describe('PickupSchedule', () => {
  it('renders upcoming and past pickups', async () => {
    const { useTranslation } = setupI18nMock({ 'Pickup Schedule': 'Pickup Schedule', upcoming: 'Upcoming Requests', past: 'Past Requests' });
    vi.mock('react-i18next', () => ({ useTranslation: () => useTranslation() }));
    render(<PickupSchedule />);
    expect(await screen.findByText(/Pickup Schedule|pickup_schedule/i)).toBeInTheDocument();
    expect(await screen.findByText(/Upcoming Requests|upcoming/i)).toBeInTheDocument();
    expect(await screen.findByText(/Past Requests|past/i)).toBeInTheDocument();
  });
});


