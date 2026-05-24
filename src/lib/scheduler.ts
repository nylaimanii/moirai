import type {
  Region, Workload, CarbonCostWeight, WindowResult, ScheduleComparison,
} from "./types";

// compute the totals for running `workload` starting at `startHour` in `region`.
// returns null if the window doesn't fit in the region's forecast horizon.
function evaluateWindow(
  region: Region,
  workload: Workload,
  startHour: number
): Omit<WindowResult, "score"> | null {
  const end = startHour + workload.durationHours;
  if (end > region.hours.length) return null;
  const slice = region.hours.slice(startHour, end);
  if (slice.length !== workload.durationHours) return null;

  let carbonG = 0; // grams
  let costUsd = 0;
  let sumIntensity = 0;
  let sumPrice = 0;
  for (const h of slice) {
    const kwh = workload.powerKw; // 1 hour at powerKw = powerKw kWh
    carbonG += h.carbon * kwh;
    costUsd += h.price * kwh;
    sumIntensity += h.carbon;
    sumPrice += h.price;
  }
  return {
    regionId: region.id,
    regionName: region.name,
    startHour,
    durationHours: workload.durationHours,
    totalCarbonKg: carbonG / 1000,
    totalCostUsd: costUsd,
    avgCarbonIntensity: sumIntensity / slice.length,
    avgPrice: sumPrice / slice.length,
  };
}

// score a window: normalize carbon + cost against the min/max across all
// candidate windows, then blend by weight. lower score = better.
function scoreWindows(
  windows: Omit<WindowResult, "score">[],
  weight: CarbonCostWeight
): WindowResult[] {
  if (windows.length === 0) return [];
  const carbons = windows.map((w) => w.totalCarbonKg);
  const costs = windows.map((w) => w.totalCostUsd);
  const cMin = Math.min(...carbons), cMax = Math.max(...carbons);
  const pMin = Math.min(...costs), pMax = Math.max(...costs);
  const norm = (v: number, lo: number, hi: number) =>
    hi === lo ? 0 : (v - lo) / (hi - lo);
  return windows.map((w) => ({
    ...w,
    score:
      weight * norm(w.totalCarbonKg, cMin, cMax) +
      (1 - weight) * norm(w.totalCostUsd, pMin, pMax),
  }));
}

// find the single best window across all regions for this workload.
export function findBestWindow(
  regions: Region[],
  workload: Workload,
  weight: CarbonCostWeight = 0.5
): ScheduleComparison | null {
  // every valid window in every region
  const all: Omit<WindowResult, "score">[] = [];
  for (const region of regions) {
    const maxStart = region.hours.length - workload.durationHours;
    for (let s = 0; s <= maxStart; s++) {
      const w = evaluateWindow(region, workload, s);
      if (w) all.push(w);
    }
  }
  if (all.length === 0) return null;

  const scored = scoreWindows(all, weight);
  scored.sort((a, b) => a.score - b.score);
  const best = scored[0];

  // "run now" = the best window that starts at hour 0 (immediate), across regions
  const nowWindows = scored.filter((w) => w.startHour === 0);
  const runNow = nowWindows.length > 0
    ? nowWindows.sort((a, b) => a.score - b.score)[0]
    : best;

  // best per region (for the candidates list / map)
  const bestPerRegion = new Map<string, WindowResult>();
  for (const w of scored) {
    const cur = bestPerRegion.get(w.regionId);
    if (!cur || w.score < cur.score) bestPerRegion.set(w.regionId, w);
  }
  const allCandidates = [...bestPerRegion.values()].sort((a, b) => a.score - b.score);

  const carbonSavedKg = runNow.totalCarbonKg - best.totalCarbonKg;
  const costSavedUsd = runNow.totalCostUsd - best.totalCostUsd;
  return {
    best,
    runNow,
    carbonSavedKg,
    costSavedUsd,
    carbonSavedPct: runNow.totalCarbonKg > 0 ? (carbonSavedKg / runNow.totalCarbonKg) * 100 : 0,
    costSavedPct: runNow.totalCostUsd > 0 ? (costSavedUsd / runNow.totalCostUsd) * 100 : 0,
    allCandidates,
  };
}
