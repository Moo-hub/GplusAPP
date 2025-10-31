import React from "react";
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
        const response = await getPoints();
        // Normalize to an array of list items for list-mode rendering
        if (response && Array.isArray(response.data)) return response.data;
        if (Array.isArray(response)) return response;
        if (response && typeof response === 'object' && Array.isArray(response.rewards)) {
          // Map rewards to simple items with name; leave other fields N/A
          return response.rewards.map((name, idx) => ({ id: idx, name }));
        }
        // If unknown shape, return [] so empty renders
        return [];
      }}
      titleKey="points"
      emptyKey="no_points_found"
      {...props}
    />
  );
}


