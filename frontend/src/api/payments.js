export const getPaymentMethods = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: "Credit Card", icon: "💳" },
        { id: 2, name: "Wallet", icon: "👛" },
        { id: 3, name: "Bank Transfer", icon: "🏦" }
      ]);
    }, 800);
  });
};