import CompaniesScreen from '../../screens/Companies/CompaniesScreen';
import { runGenericScreenTests } from '../../test-utils.js';
import { vi } from 'vitest'; // Already unified if other vitest symbols are imported above. If not, merge all vitest imports into one line.

// Ensure the services API is mocked so tests don't make real network calls.
vi.mock('../../services/api', () => ({
  getCompanies: vi.fn(() => Promise.resolve([{ id: 1, name: 'EcoCorp' }])),
}));

runGenericScreenTests(CompaniesScreen, {
  successKey: 'companies.ecoCorp', // أو أي شركة تظهر عند النجاح
  emptyKey: 'companies.empty',
  errorKey: 'companies.error',
});



