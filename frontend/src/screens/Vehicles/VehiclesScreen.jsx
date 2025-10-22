import { getVehicles } from "../../api/vehicles";
import "./VehiclesScreen.css";

// Helper function to get badge variant based on status
const getStatusVariant = (status) => {
  switch (status) {
    case "Active": return "success";
    case "Idle": return "warning";
    case "On Route": return "info";
    default: return "default";
  }
};

export default function VehiclesScreen() {
  return (
    <GenericScreen
      apiCall={getVehicles}
      titleKey="Fleet Status"
      emptyKey="No vehicles available"
      errorKey="Could not load vehicle data"
    >
      {(vehicles) => (
        <div className="vehicles-grid">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} title={vehicle.name} variant="dark">
              <div className="vehicle-details">
                <p>{vehicle.icon} {vehicle.name}</p>
                <Badge variant={getStatusVariant(vehicle.status)}>
                  {vehicle.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </GenericScreen>
  );
}