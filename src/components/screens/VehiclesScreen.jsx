import React from "react";
import { getVehicles } from "../../services/api";
import GenericScreenStatic from "../GenericScreen";

export default function VehiclesScreen(props) {
  // Determine GenericScreen at render time so test suites can inject
  // a stub via global.GenericScreen in their beforeEach.
  const GenericScreen = (typeof globalThis !== 'undefined' && globalThis.GenericScreen)
    || (typeof global !== 'undefined' && global.GenericScreen)
    || GenericScreenStatic;

  return (
    <GenericScreen
      apiCall={getVehicles}
      titleKey="vehicles"
      emptyKey="no_vehicles_found"
      {...props}
      renderItem={item => `${item.name} (${item.location || ''}) - ${item.price || ''}`}
    />
  );
}


