import CompaniesScreen from '../../screens/Companies/CompaniesScreen';
import { runGenericScreenTests } from '../../test-utils.js';

runGenericScreenTests(CompaniesScreen, {
  successKey: 'companies.ecoCorp', // أو أي شركة تظهر عند النجاح
  emptyKey: 'companies.empty',
  errorKey: 'companies.error',
});



