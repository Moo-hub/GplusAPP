import React from "react";
import GenericScreen from "../GenericScreen";
import { getPickups } from "../../services/api";

export default function PickupScreen(props) {
  return (
    <GenericScreen
      apiCall={getPickups}
      titleKey="pickup_requests"
      emptyKey="no_pickups_found"
      {...props}
      renderItem={item => `${item.type} - ${item.location}`}
    />
  );
}
