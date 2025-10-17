import { getPoints } from "../../services/api";
import GenericScreenStatic from '../GenericScreen';

export default function PointsScreen(props) {
  // Allow tests to stub a global GenericScreen (runGenericScreenTests uses vi.stubGlobal)
  const GenericScreen = (typeof globalThis !== 'undefined' && globalThis.GenericScreen)
    || (typeof global !== 'undefined' && global.GenericScreen)
    || GenericScreenStatic;

  return (
    <GenericScreen
      apiCall={async () => {
        const data = await getPoints();
        if (Array.isArray(data.rewards)) {
          return data.rewards.map((r, i) => ({ id: i, name: r }));
        }
        return [];
      }}
      titleKey="points"
      emptyKey="no_points_found"
      {...props}
    />
  );
}


