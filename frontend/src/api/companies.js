export const getCompanies = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: "EcoCorp", icon: "🏢" },
        { id: 2, name: "GreenTech", icon: "🌱" },
        { id: 3, name: "RecycleNow", icon: "♻️" }
      ]);
    }, 800);
  });
};