// a single hour of grid data for one region
export interface GridHour {
  hour: number;            // 0..N hours from "now" (0 = current hour)
  carbon: number;          // gCO2 per kWh (lower = cleaner)
  price: number;           // $ per kWh (lower = cheaper)
}

export interface Region {
  id: string;              // e.g. "caiso"
  name: string;            // e.g. "California (CAISO)"
  lng: number;             // approximate centroid longitude (for the map)
  lat: number;             // approximate centroid latitude
  hours: GridHour[];       // forecast horizon, hour 0..N
}

export interface Workload {
  id: string;
  name: string;            // e.g. "GPU fine-tune"
  durationHours: number;   // how many contiguous hours it needs
  powerKw: number;         // average power draw in kW
}

// how much to weigh carbon vs cost when scoring a window. 0 = all cost,
// 1 = all carbon. 0.5 = balanced.
export type CarbonCostWeight = number;

export interface WindowResult {
  regionId: string;
  regionName: string;
  startHour: number;       // hour offset the window starts
  durationHours: number;
  // totals for the workload over the window:
  totalCarbonKg: number;   // kg CO2
  totalCostUsd: number;    // $
  avgCarbonIntensity: number; // gCO2/kWh averaged over the window
  avgPrice: number;        // $/kWh averaged over the window
  score: number;           // combined normalized score (lower = better)
}

export interface ScheduleComparison {
  best: WindowResult;          // optimal window across all regions
  runNow: WindowResult;        // running immediately in the best-now region
  carbonSavedKg: number;       // runNow - best
  costSavedUsd: number;
  carbonSavedPct: number;      // 0..100
  costSavedPct: number;
  allCandidates: WindowResult[]; // every region's best window, sorted
}
