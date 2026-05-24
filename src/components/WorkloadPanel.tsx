import { useStore } from "../store/useStore";
import { PRESETS } from "../data/presets";

export function WorkloadPanel() {
  const { workload, setWorkload, run } = useStore();

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-space-800/60 p-6 backdrop-blur">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">
        define a workload
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const active = workload.name === p.label;
          return (
            <button
              key={p.label}
              onClick={() => setWorkload({ name: p.label, durationHours: p.durationHours, powerKw: p.powerKw })}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                active
                  ? "border-neon-400/60 bg-neon-400/10 text-neon-300"
                  : "border-haze-500/30 text-haze-300 hover:border-cyan-400/40"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-haze-500">
            duration (hours)
          </span>
          <input
            type="number" min={1} max={48} value={workload.durationHours}
            onChange={(e) => setWorkload({ durationHours: Math.max(1, Math.min(48, +e.target.value || 1)) })}
            className="rounded-lg border border-haze-500/25 bg-space-900/70 px-3 py-2 text-sm text-haze-100 outline-none focus:border-cyan-400/50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-haze-500">
            power draw (kW)
          </span>
          <input
            type="number" min={1} max={500} value={workload.powerKw}
            onChange={(e) => setWorkload({ powerKw: Math.max(1, +e.target.value || 1) })}
            className="rounded-lg border border-haze-500/25 bg-space-900/70 px-3 py-2 text-sm text-haze-100 outline-none focus:border-cyan-400/50"
          />
        </label>
      </div>

      <button
        onClick={run}
        className="mt-6 w-full rounded-xl border border-neon-400/40 bg-neon-400/10 py-3 font-mono text-xs uppercase tracking-[0.18em] text-neon-300 transition hover:bg-neon-400/20"
      >
        find best window →
      </button>
    </div>
  );
}
