export const requestPickup = (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        requestId: "REQ-" + Math.floor(Math.random() * 10000),
        estimatedTime: "30 minutes"
      });
    }, 1000);
  });
};