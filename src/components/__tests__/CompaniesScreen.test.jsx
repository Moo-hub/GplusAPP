import React from 'react';
import CompaniesScreen from '../screens/CompaniesScreen';
import { runGenericScreenTests } from '../../test-utils';

runGenericScreenTests(CompaniesScreen, {
  successKey: 'companies.ecoCorp', // أو أي شركة تظهر عند النجاح
  emptyKey: 'companies.empty',
  errorKey: 'companies.error',
});



