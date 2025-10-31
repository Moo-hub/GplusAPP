import React from "react";
import { getPickups } from "../../services/api";
import GenericScreen from "../../components/GenericScreen";

export default function PickupScreen(props) {
  return (
    <div data-testid="pickups-page">
      <GenericScreen
      apiCall={getPickups}
      titleKey="pickup_requests"
      emptyKey="no_pickups_found"
      {...props}
      renderItem={item => `${item.type} - ${item.location}`}
    />
    </div>
  );
}


