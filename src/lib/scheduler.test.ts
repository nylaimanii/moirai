import { describe, it, expect } from "vitest";
import { findBestWindow } from "./scheduler";
import { generateMockRegions } from "./mockGrid";
import type { Region, Workload } from "./types";

const workload: Workload = { id: "w1", name: "GPU fine-tune", durationHours: 4, powerKw: 10 };

describe("findBestWindow", () => {
  it("returns a result for mock regions", () => {
    const regions = generateMockRegions(48, 12);
    const r = findBestWindow(regions, workload, 0.5);
    expect(r).not.toBeNull();
  });

  it("best window is at least as good as running now", () => {
    const regions = generateMockRegions(48, 18); // start at evening peak
    const r = findBestWindow(regions, workload, 0.5)!;
    expect(r.best.score).toBeLessThanOrEqual(r.runNow.score);
    expect(r.carbonSavedKg).toBeGreaterThanOrEqual(0);
  });

  it("weight=1 (all carbon) picks the lowest-carbon window", () => {
    const regions = generateMockRegions(48, 12);
    const r = findBestWindow(regions, workload, 1)!;
    // best should have carbon <= every candidate's carbon
    for (const c of r.allCandidates) {
      expect(r.best.totalCarbonKg).toBeLessThanOrEqual(c.totalCarbonKg + 1e-9);
    }
  });

  it("weight=0 (all cost) picks the cheapest window", () => {
    const regions = generateMockRegions(48, 12);
    const r = findBestWindow(regions, workload, 0)!;
    for (const c of r.allCandidates) {
      expect(r.best.totalCostUsd).toBeLessThanOrEqual(c.totalCostUsd + 1e-9);
    }
  });

  it("returns null if workload longer than horizon", () => {
    const regions: Region[] = generateMockRegions(2, 12);
    const long: Workload = { ...workload, durationHours: 10 };
    expect(findBestWindow(regions, long, 0.5)).toBeNull();
  });

  it("ontario (cleanest grid) tends to win on carbon", () => {
    const regions = generateMockRegions(48, 12);
    const r = findBestWindow(regions, workload, 1)!;
    expect(r.best.regionId).toBe("ieso");
  });
});
