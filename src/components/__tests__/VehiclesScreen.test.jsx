import VehiclesScreen from '../screens/VehiclesScreen';
import { runGenericScreenTests } from '../../test-utils';

runGenericScreenTests(VehiclesScreen, {
  successKey: 'vehicles.truckA',
  emptyKey: 'vehicles.empty',
  errorKey: 'vehicles.error',
});



