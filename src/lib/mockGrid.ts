import type { Region } from "./types";

// deterministic pseudo-random for reproducible mock data
function seeded(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

interface RegionSpec {
  id: string; name: string;
  baseCarbon: number; // gCO2/kWh baseline
  basePrice: number;  // $/kWh baseline
  solarBias: number;  // how much midday solar cleans/cheapens it (0..1)
  seed: number;
}

const SPECS: RegionSpec[] = [
  { id: "caiso", name: "California (CAISO)", baseCarbon: 250, basePrice: 0.09, solarBias: 0.9, seed: 1 },
  { id: "ercot", name: "Texas (ERCOT)", baseCarbon: 400, basePrice: 0.06, solarBias: 0.5, seed: 2 },
  { id: "nyiso", name: "New York (NYISO)", baseCarbon: 300, basePrice: 0.11, solarBias: 0.3, seed: 3 },
  { id: "ieso", name: "Ontario (IESO)", baseCarbon: 120, basePrice: 0.08, solarBias: 0.2, seed: 4 },
];

// generate `horizon` hours of forecast for all regions, starting at currentHourOfDay.
export function generateMockRegions(horizon = 48, currentHourOfDay = new Date().getHours()): Region[] {
  return SPECS.map((spec) => {
    const rand = seeded(spec.seed);
    const hours = [];
    for (let h = 0; h < horizon; h++) {
      const hod = (currentHourOfDay + h) % 24;
      // solar dip: cleaner+cheaper ~10am-4pm
      const solar = Math.max(0, Math.sin(((hod - 6) / 12) * Math.PI)) * spec.solarBias;
      // evening peak: dirtier+pricier ~6-9pm
      const peak = Math.max(0, Math.sin(((hod - 17) / 6) * Math.PI)) * 0.6;
      const noise = (rand() - 0.5) * 0.15;
      const carbon = Math.max(30, spec.baseCarbon * (1 - solar * 0.6 + peak * 0.4 + noise));
      const price = Math.max(0.02, spec.basePrice * (1 - solar * 0.5 + peak * 0.7 + noise));
      hours.push({ hour: h, carbon: Math.round(carbon), price: Math.round(price * 1000) / 1000 });
    }
    return { id: spec.id, name: spec.name, hours };
  });
}
