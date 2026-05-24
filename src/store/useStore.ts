import { create } from "zustand";
import type { Workload, ScheduleComparison } from "../lib/types";
import { findBestWindow } from "../lib/scheduler";
import { generateMockRegions } from "../lib/mockGrid";

interface State {
  workload: Workload;
  weight: number; // carbon vs cost, 0..1
  result: ScheduleComparison | null;
  setWorkload: (w: Partial<Workload>) => void;
  setWeight: (n: number) => void;
  run: () => void;
}

export const useStore = create<State>((set, get) => ({
  workload: { id: "w1", name: "GPU fine-tune", durationHours: 4, powerKw: 10 },
  weight: 0.5,
  result: null,
  setWorkload: (w) => set((s) => ({ workload: { ...s.workload, ...w } })),
  setWeight: (n) => set({ weight: n }),
  run: () => {
    const { workload, weight } = get();
    const regions = generateMockRegions(48, new Date().getHours());
    const result = findBestWindow(regions, workload, weight);
    set({ result });
  },
}));
