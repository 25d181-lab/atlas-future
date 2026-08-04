/**
 * ATLAS mock dataset — realistic Indian agriculture reference data.
 * SIMULATED: figures are representative, not live feeds.
 */

export type Mandi = {
  name: string;
  district: string;
  distanceKm: number;
  pricePerKg: number;
  trend: number; // % change forecast over 72h
  arrivalsTonnes: number;
  demandIndex: number; // 0-100
};

export type Warehouse = {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  type: "Cold storage" | "Ambient" | "Pack house";
  capacityTonnes: number;
  usedTonnes: number;
  ratePerTonneDay: number;
};

export type Transporter = {
  id: string;
  name: string;
  vehicle: string;
  capacityTonnes: number;
  etaMinutes: number;
  fare: number;
  rating: number;
};

export const MANDIS: Mandi[] = [
  { name: "Kolar APMC", district: "Kolar", distanceKm: 62, pricePerKg: 24.5, trend: +6.2, arrivalsTonnes: 780, demandIndex: 88 },
  { name: "Bengaluru Binny Mill", district: "Bengaluru Urban", distanceKm: 48, pricePerKg: 22.8, trend: +2.1, arrivalsTonnes: 1120, demandIndex: 74 },
  { name: "Mysuru Bandipalya", district: "Mysuru", distanceKm: 96, pricePerKg: 21.2, trend: -1.4, arrivalsTonnes: 540, demandIndex: 61 },
  { name: "Chintamani APMC", district: "Chikkaballapur", distanceKm: 74, pricePerKg: 23.6, trend: +4.8, arrivalsTonnes: 430, demandIndex: 79 },
  { name: "Hosur (TN) Market", district: "Krishnagiri", distanceKm: 88, pricePerKg: 25.1, trend: +7.4, arrivalsTonnes: 360, demandIndex: 83 },
];

export const WAREHOUSES: Warehouse[] = [
  { id: "wh-1", name: "Kolar Cold Chain Hub", location: "Kolar", distanceKm: 18, type: "Cold storage", capacityTonnes: 400, usedTonnes: 312, ratePerTonneDay: 145 },
  { id: "wh-2", name: "Vemagal Pack House", location: "Vemagal", distanceKm: 26, type: "Pack house", capacityTonnes: 180, usedTonnes: 96, ratePerTonneDay: 110 },
  { id: "wh-3", name: "Malur Agri Store", location: "Malur", distanceKm: 34, type: "Ambient", capacityTonnes: 250, usedTonnes: 241, ratePerTonneDay: 70 },
  { id: "wh-4", name: "Hoskote Cold Storage", location: "Hoskote", distanceKm: 52, type: "Cold storage", capacityTonnes: 600, usedTonnes: 388, ratePerTonneDay: 132 },
  { id: "wh-5", name: "Mysuru Bandipalya Cold Unit", location: "Mysuru", distanceKm: 98, type: "Cold storage", capacityTonnes: 500, usedTonnes: 205, ratePerTonneDay: 121 },
];

export const TRANSPORTERS: Transporter[] = [
  { id: "tr-1", name: "Shakti Logistics", vehicle: "Tata 407 (reefer)", capacityTonnes: 3, etaMinutes: 55, fare: 4200, rating: 4.6 },
  { id: "tr-2", name: "Kolar Farm Movers", vehicle: "Ashok Leyland Dost", capacityTonnes: 1.5, etaMinutes: 40, fare: 2600, rating: 4.3 },
  { id: "tr-3", name: "GreenLine Reefer", vehicle: "Eicher Pro (reefer)", capacityTonnes: 6, etaMinutes: 85, fare: 6100, rating: 4.8 },
];

export const WEATHER = {
  location: "Kolar belt",
  forecast: "Light rain 18mm expected in 36 hours",
  humidity: 78,
  tempC: 29,
  rainProbability: 0.62,
};

export const FARMER = {
  name: "Ramesh Gowda",
  phone: "+91 98455 •••12",
  village: "Vemagal, Kolar",
  landAcres: 4.5,
  crops: ["Tomato", "Ragi", "Marigold"],
  fpo: "Kolar Horticulture FPO",
  atlasSince: "Mar 2026",
  trustScore: 82,
};

export const DECISION_HISTORY = [
  { id: "d-104", date: "12 Jul 2026", crop: "Tomato", qty: "1.4 t", mandi: "Chintamani APMC", price: "₹21.9/kg", gain: "+₹6,180", status: "Executed" },
  { id: "d-098", date: "28 Jun 2026", crop: "Marigold", qty: "0.6 t", mandi: "Bengaluru Binny Mill", price: "₹48.0/kg", gain: "+₹3,240", status: "Executed" },
  { id: "d-091", date: "09 Jun 2026", crop: "Tomato", qty: "2.1 t", mandi: "Kolar APMC", price: "₹18.4/kg", gain: "+₹4,900", status: "Executed" },
  { id: "d-085", date: "22 May 2026", crop: "Ragi", qty: "3.0 t", mandi: "Kolar APMC", price: "₹32.5/kg", gain: "+₹2,150", status: "Partially executed" },
];

export const FPO_FARMERS = [
  { name: "Ramesh Gowda", village: "Vemagal", crop: "Tomato", tonnes: 2.0, status: "Awaiting approval" },
  { name: "Lakshmamma B", village: "Sugatur", crop: "Tomato", tonnes: 1.2, status: "Executed" },
  { name: "Anil Kumar", village: "Malur", crop: "Beans", tonnes: 0.8, status: "In transit" },
  { name: "Shivanna R", village: "Narasapura", crop: "Tomato", tonnes: 3.4, status: "Stored" },
  { name: "Fathima Bi", village: "Bangarpet", crop: "Capsicum", tonnes: 0.9, status: "Executed" },
];

export const SWARM_ALERTS = [
  { village: "Sugatur", issue: "Early blight detected on 3 tomato plots", radiusKm: 6, farmersNotified: 41 },
  { village: "Narasapura", issue: "Leaf miner pressure rising", radiusKm: 9, farmersNotified: 27 },
];

export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");
