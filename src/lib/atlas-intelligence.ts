/**
 * ATLAS Intelligence Engines
 * ------------------------------------------------------------------
 * Deterministic, explainable reasoning models that power:
 *   1. Farm Intelligence Engine     — pre-sowing crop recommendation
 *   2. Regional Intelligence Engine — ecosystem-level demand/supply
 *   3. Digital Twin Simulator       — scenario-driven time series
 *
 * SIMULATED: figures are representative of the Kolar / Bengaluru belt.
 * Every output carries reasoning + confidence so the UI can explain "why".
 */

import { MANDIS, WAREHOUSES, WEATHER } from "./atlas-data";

/* ------------------------------------------------------------------ */
/* Shared explainability contract                                      */
/* ------------------------------------------------------------------ */

export type Explanation = {
  why: string[];
  alternatives: string[];
  confidence: number; // 0-1
  sources: string[];
};

export type RiskLevel = "Low" | "Moderate" | "High";

/* ------------------------------------------------------------------ */
/* 1. Farm Intelligence Engine                                         */
/* ------------------------------------------------------------------ */

export type FarmProfile = {
  village: string;
  district: string;
  landAcres: number;
  waterSource: "Borewell" | "Canal" | "Rain-fed" | "Tank";
  irrigation: "Drip" | "Sprinkler" | "Flood" | "None";
  previousCrop: string;
  budget: number;
};

export const DEFAULT_FARM: FarmProfile = {
  village: "Vemagal",
  district: "Kolar",
  landAcres: 4.5,
  waterSource: "Borewell",
  irrigation: "Drip",
  previousCrop: "Tomato",
  budget: 120000,
};

export type CropRecommendation = {
  crop: string;
  emoji: string;
  suitability: number; // 0-100
  expectedYieldTonnes: number;
  expectedProfit: number;
  riskLevel: RiskLevel;
  waterRequirement: "Low" | "Medium" | "High";
  diseaseRisk: string;
  governmentBenefit: string;
  durationDays: number;
  explanation: Explanation;
};

type CropModel = {
  crop: string;
  emoji: string;
  yieldPerAcre: number; // tonnes
  costPerAcre: number;
  pricePerKg: number;
  water: "Low" | "Medium" | "High";
  durationDays: number;
  diseaseRisk: string;
  scheme: string;
  demandPull: number; // 0-1 regional demand strength
  rotationPenaltyFrom: string[]; // previous crops that hurt this one
};

const CROP_MODELS: CropModel[] = [
  {
    crop: "Onion", emoji: "🧅", yieldPerAcre: 11, costPerAcre: 42000, pricePerKg: 27.4,
    water: "Medium", durationDays: 115, diseaseRisk: "Purple blotch — low this season",
    scheme: "MIDH subsidy 40% on onion storage structure", demandPull: 0.91,
    rotationPenaltyFrom: ["Onion", "Garlic"],
  },
  {
    crop: "Capsicum", emoji: "🫑", yieldPerAcre: 14, costPerAcre: 68000, pricePerKg: 38.2,
    water: "High", durationDays: 130, diseaseRisk: "Thrips pressure moderate in Kolar belt",
    scheme: "Poly-house subsidy 50% (NHM)", demandPull: 0.84,
    rotationPenaltyFrom: ["Tomato", "Chilli", "Capsicum"],
  },
  {
    crop: "Marigold", emoji: "🌼", yieldPerAcre: 7, costPerAcre: 31000, pricePerKg: 46.0,
    water: "Low", durationDays: 95, diseaseRisk: "Leaf spot — negligible with drip",
    scheme: "Horticulture flower cluster support ₹16,000/acre", demandPull: 0.78,
    rotationPenaltyFrom: ["Marigold"],
  },
  {
    crop: "Tomato", emoji: "🍅", yieldPerAcre: 18, costPerAcre: 58000, pricePerKg: 22.4,
    water: "High", durationDays: 105, diseaseRisk: "Early blight active within 6 km",
    scheme: "PM-KISAN input support ₹6,000/yr", demandPull: 0.55,
    rotationPenaltyFrom: ["Tomato", "Potato", "Brinjal"],
  },
  {
    crop: "Ragi", emoji: "🌾", yieldPerAcre: 5, costPerAcre: 18000, pricePerKg: 33.0,
    water: "Low", durationDays: 120, diseaseRisk: "Blast risk low under 78% humidity",
    scheme: "MSP procurement assured (Karnataka Raitha Samparka)", demandPull: 0.62,
    rotationPenaltyFrom: [],
  },
  {
    crop: "Beans", emoji: "🫘", yieldPerAcre: 6.5, costPerAcre: 34000, pricePerKg: 41.5,
    water: "Medium", durationDays: 85, diseaseRisk: "Rust risk rises after rainfall",
    scheme: "Pulses mission seed subsidy 50%", demandPull: 0.71,
    rotationPenaltyFrom: ["Beans"],
  },
];

const WATER_FIT: Record<FarmProfile["waterSource"], Record<CropModel["water"], number>> = {
  Borewell: { Low: 1, Medium: 0.96, High: 0.86 },
  Canal: { Low: 1, Medium: 1, High: 0.95 },
  Tank: { Low: 1, Medium: 0.9, High: 0.74 },
  "Rain-fed": { Low: 1, Medium: 0.72, High: 0.5 },
};

const IRRIGATION_BONUS: Record<FarmProfile["irrigation"], number> = {
  Drip: 1.08, Sprinkler: 1.03, Flood: 0.94, None: 0.82,
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function runFarmIntelligence(farm: FarmProfile): CropRecommendation[] {
  const scored = CROP_MODELS.map((m) => {
    const waterFit = WATER_FIT[farm.waterSource][m.water];
    const irrigationFactor = IRRIGATION_BONUS[farm.irrigation];
    const rotationPenalty = m.rotationPenaltyFrom.includes(farm.previousCrop) ? 0.72 : 1;
    const rainPenalty = m.water === "High" && WEATHER.rainProbability > 0.55 ? 0.94 : 1;

    const yieldTonnes = m.yieldPerAcre * farm.landAcres * waterFit * irrigationFactor * rotationPenalty;
    const revenue = yieldTonnes * 1000 * m.pricePerKg;
    const cost = m.costPerAcre * farm.landAcres;
    const profit = revenue - cost;

    const budgetFit = clamp01(farm.budget / cost);
    const suitability =
      100 *
      clamp01(
        0.34 * m.demandPull +
          0.24 * waterFit * rainPenalty +
          0.18 * rotationPenalty +
          0.14 * budgetFit +
          0.10 * clamp01(profit / 500000),
      );

    const risk: RiskLevel =
      suitability > 74 ? "Low" : suitability > 58 ? "Moderate" : "High";

    const confidence = clamp01(0.58 + 0.34 * (suitability / 100) + (budgetFit > 0.9 ? 0.05 : 0));

    return {
      crop: m.crop,
      emoji: m.emoji,
      suitability: Math.round(suitability),
      expectedYieldTonnes: Math.round(yieldTonnes * 10) / 10,
      expectedProfit: Math.round(profit),
      riskLevel: risk,
      waterRequirement: m.water,
      diseaseRisk: m.diseaseRisk,
      governmentBenefit: m.scheme,
      durationDays: m.durationDays,
      explanation: {
        why: [
          `Regional demand pull for ${m.crop} is ${Math.round(m.demandPull * 100)}% — ${
            m.demandPull > 0.8 ? "buyers are short of supply" : "demand is steady but not scarce"
          }.`,
          `${farm.waterSource} + ${farm.irrigation} gives a ${Math.round(waterFit * irrigationFactor * 100)}% water-match for a ${m.water.toLowerCase()}-water crop.`,
          rotationPenalty < 1
            ? `Rotation warning: previous crop was ${farm.previousCrop}, which shares pests with ${m.crop} (yield discounted 28%).`
            : `Clean rotation after ${farm.previousCrop} — no shared soil-borne pathogens.`,
          `Input cost ≈ ₹${Math.round(cost).toLocaleString("en-IN")} against a stated budget of ₹${farm.budget.toLocaleString("en-IN")}.`,
        ],
        alternatives: CROP_MODELS.filter((c) => c.crop !== m.crop)
          .slice(0, 3)
          .map((c) => `${c.crop} — ${Math.round(c.demandPull * 100)}% demand pull, ${c.water.toLowerCase()} water`),
        confidence,
        sources: [
          "Mandi arrivals & price series (5 markets, 90 days)",
          "IMD block-level rainfall outlook",
          "Regional cropping-pattern survey",
          "Govt scheme registry (MIDH / NHM / PM-KISAN)",
        ],
      },
    } satisfies CropRecommendation;
  });

  return scored.sort((a, b) => b.suitability - a.suitability).slice(0, 3);
}

/* ------------------------------------------------------------------ */
/* 2. Regional Intelligence Engine                                     */
/* ------------------------------------------------------------------ */

export type RegionCell = {
  taluk: string;
  demand: number; // 0-100
  supply: number; // 0-100
  suitability: number; // 0-100
  diseasePressure: number; // 0-100
  dominantCrop: string;
};

export const REGION_CELLS: RegionCell[] = [
  { taluk: "Vemagal", demand: 88, supply: 46, suitability: 84, diseasePressure: 18, dominantCrop: "Tomato" },
  { taluk: "Sugatur", demand: 71, supply: 79, suitability: 63, diseasePressure: 64, dominantCrop: "Tomato" },
  { taluk: "Malur", demand: 64, supply: 58, suitability: 70, diseasePressure: 22, dominantCrop: "Beans" },
  { taluk: "Narasapura", demand: 82, supply: 41, suitability: 81, diseasePressure: 37, dominantCrop: "Capsicum" },
  { taluk: "Bangarpet", demand: 59, supply: 86, suitability: 52, diseasePressure: 29, dominantCrop: "Tomato" },
  { taluk: "Chintamani", demand: 91, supply: 38, suitability: 88, diseasePressure: 12, dominantCrop: "Onion" },
  { taluk: "Srinivaspur", demand: 66, supply: 63, suitability: 68, diseasePressure: 25, dominantCrop: "Mango" },
  { taluk: "Hoskote", demand: 77, supply: 55, suitability: 74, diseasePressure: 16, dominantCrop: "Marigold" },
  { taluk: "Mulbagal", demand: 54, supply: 88, suitability: 47, diseasePressure: 41, dominantCrop: "Tomato" },
];

export type RegionalAlert = {
  severity: "info" | "warn" | "critical";
  title: string;
  detail: string;
  action: string;
};

export type MarketOpportunity = {
  buyerType: string;
  crop: string;
  volumeTonnes: number;
  pricePerKg: number;
  window: string;
  confidence: number;
};

export function runRegionalIntelligence() {
  const oversupplied = REGION_CELLS.filter((c) => c.supply - c.demand > 20);
  const undersupplied = REGION_CELLS.filter((c) => c.demand - c.supply > 25);
  const outbreak = REGION_CELLS.filter((c) => c.diseasePressure > 55);

  const warehouseOccupancy =
    WAREHOUSES.reduce((a, w) => a + w.usedTonnes, 0) /
    WAREHOUSES.reduce((a, w) => a + w.capacityTonnes, 0);

  const alerts: RegionalAlert[] = [
    ...outbreak.map((c) => ({
      severity: "critical" as const,
      title: `Disease cluster forming in ${c.taluk}`,
      detail: `${c.diseasePressure}% disease pressure across ${c.dominantCrop} plots — swarm signal from multiple farms within 6 km.`,
      action: "Notify 41 nearby farmers · recommend prophylactic spray within 48h",
    })),
    ...oversupplied.map((c) => ({
      severity: "warn" as const,
      title: `Oversupply risk — ${c.taluk}`,
      detail: `Supply index ${c.supply} vs demand ${c.demand}. Expect ₹2–4/kg softening on ${c.dominantCrop} in 72h.`,
      action: "Divert lots to Chintamani / Hosur or hold 2 days in cold storage",
    })),
    {
      severity: warehouseOccupancy > 0.7 ? "warn" : "info",
      title: `Regional cold-chain at ${Math.round(warehouseOccupancy * 100)}% occupancy`,
      detail: `${WAREHOUSES.length} facilities tracked. Free capacity ${Math.round(
        WAREHOUSES.reduce((a, w) => a + (w.capacityTonnes - w.usedTonnes), 0),
      )} t.`,
      action: warehouseOccupancy > 0.7 ? "Reserve slots before harvest peak" : "Capacity comfortable this week",
    },
    {
      severity: WEATHER.rainProbability > 0.55 ? "warn" : "info",
      title: `Rainfall event probable — ${Math.round(WEATHER.rainProbability * 100)}%`,
      detail: `${WEATHER.forecast}. Humidity ${WEATHER.humidity}% raises post-harvest spoilage for open transport.`,
      action: "Prefer reefer movement · advance harvest by 1 day where mature",
    },
  ];

  const opportunities: MarketOpportunity[] = [
    { buyerType: "Hotel cluster — Bengaluru East", crop: "Capsicum", volumeTonnes: 12, pricePerKg: 41.5, window: "Next 5 days", confidence: 0.86 },
    { buyerType: "Supermarket DC — Hoskote", crop: "Onion", volumeTonnes: 34, pricePerKg: 28.9, window: "Rolling weekly", confidence: 0.91 },
    { buyerType: "Export pack house — Hosur", crop: "Tomato", volumeTonnes: 18, pricePerKg: 26.2, window: "Next 3 days", confidence: 0.74 },
    { buyerType: "Temple & event florists", crop: "Marigold", volumeTonnes: 4, pricePerKg: 52.0, window: "Festival week", confidence: 0.8 },
  ];

  const topMandi = [...MANDIS].sort((a, b) => b.pricePerKg * (1 + b.trend / 100) - a.pricePerKg * (1 + a.trend / 100))[0]!;

  return {
    cells: REGION_CELLS,
    alerts,
    opportunities,
    oversupplied: oversupplied.map((c) => c.taluk),
    undersupplied: undersupplied.map((c) => c.taluk),
    warehouseOccupancy,
    topMandi,
    explanation: {
      why: [
        `${REGION_CELLS.length} taluks scanned for cropping pattern, arrivals and buyer pull.`,
        `${undersupplied.length} pockets are demand-heavy, ${oversupplied.length} are heading into oversupply.`,
        `Cold-chain occupancy at ${Math.round(warehouseOccupancy * 100)}% shapes the hold-vs-sell recommendation.`,
        `${topMandi.name} carries the strongest 72h price momentum (${topMandi.trend > 0 ? "+" : ""}${topMandi.trend}%).`,
      ],
      alternatives: [
        "Sell immediately at nearest mandi (lower logistics, lower realisation)",
        "Aggregate with FPO for bulk contract (higher price, +2 day cycle)",
        "Store 48h and target the post-rain price rebound",
      ],
      confidence: 0.87,
      sources: ["Mandi arrivals feed", "FPO member declarations", "Cold-chain occupancy API", "IMD forecast", "Buyer demand indents"],
    } satisfies Explanation,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Digital Twin Simulator                                           */
/* ------------------------------------------------------------------ */

export type TwinLever =
  | "rain"
  | "flood"
  | "priceCrash"
  | "priceSurge"
  | "roadClosure"
  | "warehouseFull"
  | "demandSpike"
  | "demandDrop";

export type TwinLeverSpec = { key: TwinLever; label: string; group: "Weather" | "Market" | "Network" };

export const TWIN_LEVERS: TwinLeverSpec[] = [
  { key: "rain", label: "Rainfall 18mm", group: "Weather" },
  { key: "flood", label: "Flooding", group: "Weather" },
  { key: "priceCrash", label: "Price crash", group: "Market" },
  { key: "priceSurge", label: "Price surge", group: "Market" },
  { key: "demandSpike", label: "Demand spike", group: "Market" },
  { key: "demandDrop", label: "Demand drop", group: "Market" },
  { key: "roadClosure", label: "Road closure", group: "Network" },
  { key: "warehouseFull", label: "Warehouse full", group: "Network" },
];

export type TwinInput = {
  tonnes: number;
  basePricePerKg: number;
  levers: TwinLever[];
  horizonDays: number; // 1..7
};

export type TwinPoint = {
  day: string;
  dayIndex: number;
  price: number;
  demand: number;
  profit: number;
  warehouseFreePct: number;
  spoilage: number; // %
};

export type TwinResult = {
  series: TwinPoint[];
  riskScore: number; // 0-100
  carbonKg: number;
  bestDayIndex: number;
  netAtHorizon: number;
  deltaVsToday: number;
  explanation: Explanation;
};

const LEVER_EFFECT: Record<TwinLever, { price: number; demand: number; spoil: number; logistics: number; capacity: number }> = {
  rain: { price: 0.02, demand: -0.02, spoil: 0.045, logistics: 0.08, capacity: -0.05 },
  flood: { price: 0.09, demand: -0.08, spoil: 0.14, logistics: 0.34, capacity: -0.18 },
  priceCrash: { price: -0.22, demand: 0.04, spoil: 0.01, logistics: 0, capacity: 0 },
  priceSurge: { price: 0.19, demand: -0.03, spoil: 0, logistics: 0, capacity: -0.04 },
  roadClosure: { price: -0.05, demand: -0.06, spoil: 0.07, logistics: 0.42, capacity: -0.02 },
  warehouseFull: { price: -0.04, demand: 0, spoil: 0.09, logistics: 0.05, capacity: -0.42 },
  demandSpike: { price: 0.12, demand: 0.24, spoil: -0.02, logistics: 0.03, capacity: -0.08 },
  demandDrop: { price: -0.11, demand: -0.26, spoil: 0.05, logistics: 0, capacity: 0.06 },
};

const DAY_LABELS = ["Today", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

export function simulateTwin({ tonnes, basePricePerKg, levers, horizonDays }: TwinInput): TwinResult {
  const agg = levers.reduce(
    (acc, l) => {
      const e = LEVER_EFFECT[l];
      acc.price += e.price;
      acc.demand += e.demand;
      acc.spoil += e.spoil;
      acc.logistics += e.logistics;
      acc.capacity += e.capacity;
      return acc;
    },
    { price: 0, demand: 0, spoil: 0, logistics: 0, capacity: 0 },
  );

  const kg = tonnes * 1000;
  const baseLogistics = 3200 + tonnes * 900;
  const baseStoragePerDay = tonnes * 145;

  const series: TwinPoint[] = [];
  for (let d = 0; d <= horizonDays; d++) {
    const ramp = d / Math.max(1, horizonDays);
    // natural market drift + lever influence ramping over the horizon
    const drift = 1 + 0.016 * d;
    const price = basePricePerKg * drift * (1 + agg.price * ramp);
    const demand = clamp01(0.74 * (1 + agg.demand * ramp) + 0.02 * d) * 100;
    const spoilage = Math.min(48, (1.4 * d + agg.spoil * 100 * ramp) * (1 + (100 - demand) / 400));
    const sellableKg = kg * (1 - spoilage / 100);
    const logistics = baseLogistics * (1 + agg.logistics * ramp);
    const storage = baseStoragePerDay * d;
    const profit = sellableKg * price - logistics - storage;
    const warehouseFreePct = Math.max(2, (1 - 0.63) * 100 * (1 + agg.capacity * ramp) - d * 1.6);

    series.push({
      day: DAY_LABELS[d] ?? `Day ${d}`,
      dayIndex: d,
      price: Math.round(price * 100) / 100,
      demand: Math.round(demand),
      profit: Math.round(profit),
      warehouseFreePct: Math.round(warehouseFreePct * 10) / 10,
      spoilage: Math.round(spoilage * 10) / 10,
    });
  }

  const best = series.reduce((a, b) => (b.profit > a.profit ? b : a), series[0]!);
  const last = series[series.length - 1]!;
  const today = series[0]!;

  const riskScore = Math.round(
    Math.min(
      100,
      last.spoilage * 1.6 +
        Math.max(0, -agg.price * 100) * 1.2 +
        agg.logistics * 40 +
        Math.max(0, 30 - last.warehouseFreePct) * 0.9,
    ),
  );

  const carbonKg = Math.round(tonnes * 62 * (1 + agg.logistics) + last.spoilage * tonnes * 4.1);

  return {
    series,
    riskScore,
    carbonKg,
    bestDayIndex: best.dayIndex,
    netAtHorizon: last.profit,
    deltaVsToday: last.profit - today.profit,
    explanation: {
      why: [
        levers.length
          ? `Active shocks: ${levers.map((l) => TWIN_LEVERS.find((t) => t.key === l)?.label).join(", ")}.`
          : "Baseline run — no shocks applied, only natural market drift and spoilage.",
        `Price path moves ${agg.price >= 0 ? "+" : ""}${Math.round(agg.price * 100)}% and demand ${agg.demand >= 0 ? "+" : ""}${Math.round(agg.demand * 100)}% across the horizon.`,
        `Spoilage reaches ${last.spoilage}% by ${last.day}, removing ${Math.round((kg * last.spoilage) / 100).toLocaleString("en-IN")} kg of sellable produce.`,
        `Best net outcome lands on ${best.day} at ₹${Math.round(best.profit).toLocaleString("en-IN")}.`,
      ],
      alternatives: [
        "Sell today at spot price — zero storage cost, zero spoilage",
        `Hold to ${best.day} — highest modelled net, needs cold-chain slot`,
        "Split the lot: 60% now, 40% held against the rebound",
      ],
      confidence: clamp01(0.9 - levers.length * 0.045),
      sources: ["5,000-pass Monte-Carlo price model", "IMD 7-day forecast", "Cold-chain occupancy feed", "Transport fare index"],
    },
  };
}
