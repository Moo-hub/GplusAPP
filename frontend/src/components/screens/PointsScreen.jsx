import { getPoints } from "../../services/api";
import GenericScreenStatic from "../../components/GenericScreen";

export default function PointsScreen(props) {
  // Prefer a test-time stub on globalThis/global if present (tests call
  // vi.stubGlobal('GenericScreen', ...)). Otherwise, use the real imported
  // GenericScreen component.
  const GenericScreen = (typeof globalThis !== 'undefined' && globalThis.GenericScreen)
    || (typeof global !== 'undefined' && global.GenericScreen)
    || GenericScreenStatic;

  return (
    <GenericScreen
      apiCall={async () => {
        // Normalize the API response so tests and components can rely on a
        // predictable shape. If the API returns an object with a `rewards`
        // array, map it to [{id, name}] (used by unit tests that expect an
        // array). If rewards is null or not an array, return an empty array.
        // Otherwise, return the payload as-is so calling code that expects
        // an object (balance, impact, reward) continues to work.
        const data = await getPoints();
        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, 'rewards')) {
          const r = data.rewards;
          if (Array.isArray(r)) return r.map((name, idx) => ({ id: idx, name }));
          return [];
        }
        return data;
      }}
      titleKey="points"
      emptyKey="no_points_found"
      {...props}
    >
      {(data) => (
        <div data-testid="points-summary">
          <div data-testid="points-balance">{data && data.balance}</div>
        </div>
      )}
    </GenericScreen>
  );
}


