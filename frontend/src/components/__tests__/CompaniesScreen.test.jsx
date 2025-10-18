import CompaniesScreen from '../screens/CompaniesScreen';
import { runGenericScreenTests } from '../../test-utils';
import { vi } from 'vitest';

// Ensure the services API is mocked so tests don't make real network calls.
vi.mock('../../services/api', () => ({
  getCompanies: vi.fn(() => Promise.resolve([{ id: 1, name: 'EcoCorp' }])),
}));

runGenericScreenTests(CompaniesScreen, {
  successKey: 'companies.ecoCorp', // أو أي شركة تظهر عند النجاح
  emptyKey: 'companies.empty',
  errorKey: 'companies.error',
});



