// Simple API service using fetch (mocked for now)
const mockData = {
  pickups: [
    { id: 1, date: '2025-09-28', status: 'Scheduled' },
    { id: 2, date: '2025-09-20', status: 'Completed' },
  ],
  vehicles: [
    { id: 1, name: 'Truck 1', price: '$10', location: 'Downtown' },
    { id: 2, name: 'Truck 2', price: '$12', location: 'Uptown' },
  ],
  points: { value: 120, carbonImpact: '-12kg CO₂', rewards: '$5 Coupon' },
  companies: [
    { id: 1, name: 'EcoRecycle', icon: '♻️' },
    { id: 2, name: 'GreenFuture', icon: '🌱' },
  ],
  payment: { methods: ['Credit Card', 'Wallet'] },
};

export async function fetchPickups() {
  return new Promise(res => setTimeout(() => res(mockData.pickups), 500));
}
export async function fetchVehicles() {
  return new Promise(res => setTimeout(() => res(mockData.vehicles), 500));
}
export async function fetchPoints() {
  return new Promise(res => setTimeout(() => res(mockData.points), 500));
}
export async function fetchCompanies() {
  return new Promise(res => setTimeout(() => res(mockData.companies), 500));
}
export async function fetchPayment() {
  return new Promise(res => setTimeout(() => res(mockData.payment), 500));
}
export async function requestPickup(data) {
  // Simulate API call
  return new Promise(res => setTimeout(() => res({ success: true }), 700));
}

// Backwards-compatible named exports used by some components/tests
export const getCompanies = fetchCompanies;
export const getPickups = fetchPickups;
export const getVehicles = fetchVehicles;
export const getPoints = fetchPoints;
export const getPaymentMethods = fetchPayment;

