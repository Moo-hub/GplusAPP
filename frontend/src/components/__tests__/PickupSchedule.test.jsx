import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import PickupSchedule from '../../components/PickupSchedule';

describe('PickupSchedule', () => {
  it('renders upcoming and past pickups', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <PickupSchedule />
      </I18nextProvider>
    );
    // Accept either real translations or fallback keys depending on test i18n mock
    expect(await screen.findByText(/Pickup Schedule|pickup_schedule/i)).toBeInTheDocument();
    expect(await screen.findByText(/Upcoming Requests|upcoming/i)).toBeInTheDocument();
    expect(await screen.findByText(/Past Requests|past/i)).toBeInTheDocument();
  });
});


