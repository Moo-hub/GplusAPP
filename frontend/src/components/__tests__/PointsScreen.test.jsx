import PointsScreen from '../PointsScreen';
import { runGenericScreenTests } from '../../test-utils';

runGenericScreenTests(PointsScreen, {
  successKey: 'points.title',
  emptyKey: 'points.empty',
  errorKey: 'points.error',
});