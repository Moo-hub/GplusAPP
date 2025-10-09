export const getVehicles = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: "Truck #12", status: "Active", icon: "🚛" },
        { id: 2, name: "Van #8", status: "Idle", icon: "🚚" },
        { id: 3, name: "Loader #3", status: "On Route", icon: "🚜" }
      ]);
    }, 800);
  });
};