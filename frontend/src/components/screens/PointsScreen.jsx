import { getPoints } from "../../services/api";

export default function PointsScreen(props) {
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


