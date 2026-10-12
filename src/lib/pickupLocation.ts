export const PICKUP_ADDRESS = '71 Champaca St, Marikina, Metro Manila';
const encodedPickupAddress = encodeURIComponent(PICKUP_ADDRESS);

export const PICKUP_GOOGLE_MAPS_URL =
  `https://www.google.com/maps/search/?api=1&query=${encodedPickupAddress}`;
export const PICKUP_WAZE_URL = `https://waze.com/ul?q=${encodedPickupAddress}&navigate=yes`;
