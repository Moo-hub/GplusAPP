import { getVehicles } from "../../services/api";
import GenericScreen from "../../components/GenericScreen";

export default function VehiclesScreen(props) {
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


