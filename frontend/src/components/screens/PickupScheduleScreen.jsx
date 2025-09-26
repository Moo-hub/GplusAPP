import React from "react";
import GenericScreen from "../GenericScreen";
import { getPickupSchedule } from "../../services/api";

export default function PickupScheduleScreen(props) {
  return (
    <GenericScreen
      apiCall={async () => {
        const data = await getPickupSchedule();
        // Flatten for display
        return [
          ...(data.upcoming || []).map(x => ({ ...x, label: "upcoming" })),
          ...(data.past || []).map(x => ({ ...x, label: "past" })),
        ];
      }}
      titleKey="pickup_requests"
      emptyKey="no_pickups_found"
      {...props}
      renderItem={item => `${item.label === "upcoming" ? "[Upcoming]" : "[Past]"} ${item.type || item.status} - ${item.date}`}
    />
  );
}
