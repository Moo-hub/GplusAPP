export const getPoints = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        balance: 1200,
        impact: "~8kg CO₂",
        reward: "20% off next pickup"
      });
    }, 800);
  });
};
