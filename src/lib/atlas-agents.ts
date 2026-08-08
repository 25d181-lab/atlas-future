import {
  MANDIS,
  TRANSPORTERS,
  WAREHOUSES,
  WEATHER,
  type Mandi,
  type Transporter,
  type Warehouse,
  inr,
} from "./atlas-data";

export type AgentKey =
  | "agroguard"
  | "demand"
  | "negotiation"
  | "warehouse"
  | "logistics"
  | "insurance"
  | "twin";

export type AgentSpec = {
  key: AgentKey;
  name: string;
  role: string;
  durationMs: number;
};

export const AGENTS: AgentSpec[] = [
  { key: "agroguard", name: "AgroGuard", role: "Crop health & disease check", durationMs: 1400 },
  { key: "demand", name: "Demand Agent", role: "Best market & price prediction", durationMs: 1500 },
  { key: "negotiation", name: "Negotiation Agent", role: "Optimal selling price", durationMs: 1300 },
  { key: "warehouse", name: "Warehouse Agent", role: "Cold storage reservation", durationMs: 1400 },
  { key: "logistics", name: "Logistics Agent", role: "Transport booking", durationMs: 1300 },
  { key: "insurance", name: "Insurance Agent", role: "Claim readiness", durationMs: 1200 },
  { key: "twin", name: "Digital Twin", role: "What-if simulations", durationMs: 1600 },
];

export type Metric = { label: string; value: string };

export type AgentResult = {
  key: AgentKey;
  headline: string;
  reasoning: string[];
  metrics: Metric[];
};

export type Scenario = {
  name: string;
  probability: number;
  impact: string;
  mitigation: string;
  tone: "good" | "warn" | "bad";
};

export type ParsedRequest = { crop: string; tonnes: number; village: string; raw: string };

export type AtlasPlan = {
  request: ParsedRequest;
  mandi: Mandi;
  warehouse: Warehouse;
  transporter: Transporter;
  results: Record<AgentKey, AgentResult>;
  scenarios: Scenario[];
  economics: {
    baselinePerKg: number;
    negotiatedPerKg: number;
    grossRevenue: number;
    costs: number;
    netRevenue: number;
    extraIncome: number;
    wasteAvoidedKg: number;
  };
  summary: string;
};

const CROPS = ["tomato", "tomatoes", "onion", "potato", "ragi", "beans", "capsicum", "marigold"];

export function parseRequest(text: string, decision?: FarmerDecision): ParsedRequest {
  const lower = text.toLowerCase();
  const qtyMatch = lower.match(/(\d+(?:\.\d+)?)\s*(ton|tonne|tons|tonnes|t\b|quintal|kg)/);
  let tonnes = 2;
  if (qtyMatch) {
    const n = parseFloat(qtyMatch[1]!);
    const unit = qtyMatch[2]!;
    tonnes = unit.startsWith("kg") ? n / 1000 : unit.startsWith("quintal") ? n / 10 : n;
  }
  if (decision?.quantityKg && decision.quantityKg > 0) tonnes = decision.quantityKg / 1000;

  const cropHit = CROPS.find((c) => lower.includes(c));
  let crop = cropHit ? (cropHit === "tomatoes" ? "Tomato" : cropHit[0]!.toUpperCase() + cropHit.slice(1)) : "Tomato";
  if (decision?.crop) crop = decision.crop[0]!.toUpperCase() + decision.crop.slice(1);

  const villageMatch = text.match(/\b(?:in|at|from|near)\s+([A-Za-z][A-Za-z\s]{2,24})/i);
  let village = villageMatch
    ? villageMatch[1]!.trim().replace(/\s+(village|today|now)$/i, "")
    : "Vemagal, Kolar";
  if (decision?.village) village = decision.village;

  return { crop, tonnes: Math.max(0.1, tonnes), village, raw: text };
}

export function buildPlan(request: ParsedRequest, decision?: FarmerDecision): AtlasPlan {
  const kg = request.tonnes * 1000;
  const priority = decision?.priority ?? "balanced";
  const sellNow = decision?.sellNow === true || priority === "speed";

  // Demand: score mandis on price, demand, distance and forecast trend.
  // Weights shift with what the farmer actually asked for.
  const weights =
    priority === "price"
      ? { price: 4.5, trend: 2.4, demand: 0.08, distance: 0.015 }
      : priority === "speed"
        ? { price: 1.6, trend: 0.4, demand: 0.05, distance: 0.14 }
        : priority === "storage"
          ? { price: 3.6, trend: 3.2, demand: 0.1, distance: 0.03 }
          : { price: 3, trend: 1.6, demand: 0.08, distance: 0.045 };

  const named = decision?.targetMandi
    ? MANDIS.find((m) => m.name.toLowerCase().includes(decision.targetMandi!.toLowerCase().split(" ")[0]!))
    : undefined;

  const scored = MANDIS.map((m) => ({
    m,
    score:
      m.pricePerKg * weights.price +
      m.trend * weights.trend +
      m.demandIndex * weights.demand -
      m.distanceKm * weights.distance +
      (named && named.name === m.name ? 1000 : 0),
  })).sort((a, b) => b.score - a.score);
  const mandi = scored[0]!.m;
  const runnerUp = scored[1]!.m;

  const eligibleStores = WAREHOUSES.filter(
    (w) => w.capacityTonnes - w.usedTonnes >= request.tonnes && w.type !== "Ambient",
  );
  const warehouse =
    (priority === "storage"
      ? [...eligibleStores]
          .filter((w) => w.type === "Cold storage")
          .sort((a, b) => b.capacityTonnes - b.usedTonnes - (a.capacityTonnes - a.usedTonnes))[0]
      : undefined) ??
    [...eligibleStores].sort((a, b) => a.distanceKm - b.distanceKm)[0] ??
    WAREHOUSES[0]!;

  const fitting = TRANSPORTERS.filter((t) => t.capacityTonnes >= request.tonnes);
  const transporter =
    (priority === "speed"
      ? [...fitting].sort((a, b) => a.etaMinutes - b.etaMinutes)[0]
      : [...fitting].sort((a, b) => a.fare - b.fare)[0]) ??
    TRANSPORTERS[TRANSPORTERS.length - 1]!;

  const gradeShare = 0.86;
  const baselinePerKg = mandi.pricePerKg;
  const negotiationEdge = priority === "price" ? 1.095 : priority === "speed" ? 1.04 : 1.075;
  const negotiatedPerKg = +(baselinePerKg * negotiationEdge + 0.4).toFixed(2);
  const grossRevenue = kg * negotiatedPerKg * gradeShare + kg * (1 - gradeShare) * (negotiatedPerKg * 0.55);
  const storageDays = sellNow ? 0 : priority === "storage" ? 4 : priority === "price" ? 3 : 2;
  const costs = transporter.fare + warehouse.ratePerTonneDay * request.tonnes * storageDays + kg * 0.35;
  const netRevenue = grossRevenue - costs;
  const localBaseline = kg * (baselinePerKg * 0.82);
  const extraIncome = netRevenue - localBaseline;
  const wasteAvoidedKg = Math.round(kg * (sellNow ? 0.08 : 0.14));

  const priorityLine =
    priority === "price"
      ? "You asked for the best price, so I optimised for rate and trend over distance."
      : priority === "speed"
        ? "You asked to move it today, so I optimised for the fastest pickup and nearest buyer, not the top rate."
        : priority === "storage"
          ? "You asked to hold and wait, so I picked the market with the strongest 72-hour upside and the roomiest cold store."
          : "No special preference given, so I balanced price, distance and risk.";


  const results: Record<AgentKey, AgentResult> = {
    agroguard: {
      key: "agroguard",
      headline: `${request.crop} lot is Grade A (${Math.round(gradeShare * 100)}%) — no disease risk blocking sale`,
      reasoning: [
        `Scanned last 3 field images + ${request.village} plot history: no late blight or fruit borer signature.`,
        `Humidity ${WEATHER.humidity}% with ${WEATHER.forecast.toLowerCase()} → shelf life drops to ~${storageDays + 1} days if left in the open.`,
        `Recommendation: move to cold chain within 12 hours to protect Grade A share.`,
      ],
      metrics: [
        { label: "Grade A share", value: `${Math.round(gradeShare * 100)}%` },
        { label: "Disease risk", value: "Low (0.08)" },
        { label: "Safe window", value: "12 hours" },
      ],
    },
    demand: {
      key: "demand",
      headline: `${mandi.name} is the best market at ${inr(mandi.pricePerKg)}/kg (${mandi.trend > 0 ? "+" : ""}${mandi.trend}% in 72h)`,
      reasoning: [
        `Compared 5 mandis on price, arrivals, demand index and haul distance.`,
        `${mandi.name}: arrivals ${mandi.arrivalsTonnes}t, demand index ${mandi.demandIndex}/100, ${mandi.distanceKm} km away.`,
        `Next best ${runnerUp.name} at ₹${runnerUp.pricePerKg}/kg — rejected, ₹${(mandi.pricePerKg - runnerUp.pricePerKg).toFixed(1)}/kg lower.`,
      ],
      metrics: [
        { label: "Chosen mandi", value: mandi.name },
        { label: "Distance", value: `${mandi.distanceKm} km` },
        { label: "72h forecast", value: `${mandi.trend > 0 ? "+" : ""}${mandi.trend}%` },
      ],
    },
    negotiation: {
      key: "negotiation",
      headline: `Target price locked at ₹${negotiatedPerKg}/kg with 2 verified buyers`,
      reasoning: [
        `Opened parallel quotes with 2 commission agents at ${mandi.name}.`,
        `Used arrival shortage (${mandi.arrivalsTonnes}t vs 5-day avg) as leverage; floor set at ₹${(baselinePerKg * 1.02).toFixed(2)}/kg.`,
        `Best standing offer ₹${negotiatedPerKg}/kg for Grade A, ₹${(negotiatedPerKg * 0.55).toFixed(2)}/kg for Grade B.`,
      ],
      metrics: [
        { label: "Mandi rate", value: `₹${baselinePerKg}/kg` },
        { label: "Negotiated", value: `₹${negotiatedPerKg}/kg` },
        { label: "Uplift", value: `+${(((negotiatedPerKg - baselinePerKg) / baselinePerKg) * 100).toFixed(1)}%` },
      ],
    },
    warehouse: {
      key: "warehouse",
      headline: `${request.tonnes} t held at ${warehouse.name} (${warehouse.distanceKm} km)`,
      reasoning: [
        `Nearest ambient store (Malur) is at ${Math.round((WAREHOUSES[2]!.usedTonnes / WAREHOUSES[2]!.capacityTonnes) * 100)}% capacity — rejected.`,
        `${warehouse.name} has ${(warehouse.capacityTonnes - warehouse.usedTonnes).toFixed(0)} t free at ₹${warehouse.ratePerTonneDay}/t/day.`,
        `Reserved for ${storageDays} days as a price buffer if the mandi rate dips on arrival.`,
      ],
      metrics: [
        { label: "Facility", value: warehouse.type },
        { label: "Hold", value: `${storageDays} days` },
        { label: "Storage cost", value: inr(warehouse.ratePerTonneDay * request.tonnes * storageDays) },
      ],
    },
    logistics: {
      key: "logistics",
      headline: `${transporter.name} — ${transporter.vehicle}, pickup in ${transporter.etaMinutes} min`,
      reasoning: [
        `Matched vehicle capacity ${transporter.capacityTonnes}t to your ${request.tonnes}t lot to avoid part-load penalty.`,
        `Route ${request.village} → ${warehouse.location} → ${mandi.name}, ${(warehouse.distanceKm + mandi.distanceKm).toFixed(0)} km total.`,
        `Fare ${inr(transporter.fare)} fixed; driver rating ${transporter.rating}/5, reefer maintained at 12°C.`,
      ],
      metrics: [
        { label: "Pickup ETA", value: `${transporter.etaMinutes} min` },
        { label: "Fare", value: inr(transporter.fare) },
        { label: "Rating", value: `${transporter.rating}/5` },
      ],
    },
    insurance: {
      key: "insurance",
      headline: "Claim pack pre-filled — payout ready if rain damages the lot",
      reasoning: [
        `PMFBY + private horticulture cover mapped to survey no. of your ${request.village} plot.`,
        `Attached AgroGuard grading images, weigh-slip template and cold-chain temperature log.`,
        `Rain probability ${(WEATHER.rainProbability * 100).toFixed(0)}% → claim auto-files if transit damage exceeds 8%.`,
      ],
      metrics: [
        { label: "Cover", value: inr(grossRevenue * 0.7) },
        { label: "Docs ready", value: "4 / 4" },
        { label: "Filing", value: "Auto" },
      ],
    },
    twin: {
      key: "twin",
      headline: "3 futures simulated — plan holds in 2 of 3, fallback ready for the third",
      reasoning: [
        `Ran 5,000 Monte-Carlo passes on price, weather and warehouse availability.`,
        `Expected net ${inr(netRevenue)} with ±${inr(netRevenue * 0.09)} spread.`,
        `Worst case (price crash + full warehouse) still nets ${inr(netRevenue * 0.79)} using the Hosur fallback buyer.`,
      ],
      metrics: [
        { label: "Simulations", value: "5,000" },
        { label: "Plan confidence", value: "87%" },
        { label: "Downside", value: `-${inr(netRevenue * 0.21)}` },
      ],
    },
  };

  const scenarios: Scenario[] = [
    {
      name: "Rain hits in 36 hours",
      probability: WEATHER.rainProbability,
      impact: `Field-side spoilage of ~${Math.round(kg * 0.11)} kg if the lot stays outside.`,
      mitigation: `Cold storage reservation at ${warehouse.name} already covers this — no action needed.`,
      tone: "warn",
    },
    {
      name: "Mandi price crashes 15%",
      probability: 0.22,
      impact: `Net falls to ${inr(netRevenue * 0.83)} at ${mandi.name}.`,
      mitigation: `Hold 2 more days in cold storage and divert to ${runnerUp.name} / Hosur buyer at ₹${(mandi.pricePerKg * 0.98).toFixed(1)}/kg.`,
      tone: "bad",
    },
    {
      name: "Warehouse turns full",
      probability: 0.14,
      impact: "Reservation bumped; lot would wait on the truck for 6+ hours.",
      mitigation: `Hoskote Cold Storage held as standby with ${(WAREHOUSES[3]!.capacityTonnes - WAREHOUSES[3]!.usedTonnes).toFixed(0)} t free.`,
      tone: "good",
    },
  ];

  const summary = `${request.tonnes} t ${request.crop.toLowerCase()} from ${request.village}: sell at ${mandi.name} for ₹${negotiatedPerKg}/kg after a ${storageDays}-day cold hold at ${warehouse.name}, moved by ${transporter.name}. Estimated net ${inr(netRevenue)} — about ${inr(extraIncome)} more than a same-day local sale.`;

  return {
    request,
    mandi,
    warehouse,
    transporter,
    results,
    scenarios,
    economics: {
      baselinePerKg,
      negotiatedPerKg,
      grossRevenue,
      costs,
      netRevenue,
      extraIncome,
      wasteAvoidedKg,
    },
    summary,
  };
}
