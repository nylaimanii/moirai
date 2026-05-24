import { useStore } from "../store/useStore";

function hourLabel(h: number): string {
  if (h === 0) return "now";
  const d = new Date();
  d.setHours(d.getHours() + h, 0, 0, 0);
  const hh = d.getHours();
  const ampm = hh >= 12 ? "pm" : "am";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `in ${h}h · ${h12}${ampm}`;
}

export function ResultCard() {
  const result = useStore((s) => s.result);
  if (!result) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-haze-500/15 bg-space-800/40 text-center">
        <p className="font-mono text-xs text-haze-500">
          define a workload → see when to run it
        </p>
      </div>
    );
  }

  const { best, carbonSavedPct, costSavedPct, carbonSavedKg, costSavedUsd } = result;
  return (
    <div key={`${best.regionId}-${best.startHour}-${result.runNow.totalCostUsd.toFixed(2)}`} className="rounded-2xl border border-neon-400/25 bg-space-800/60 p-7 backdrop-blur" style={{ animation: "flareIn .6s ease-out" }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neon-400">
        optimal window
      </div>
      <div className="mt-2 text-2xl font-semibold text-haze-100">
        {best.regionName}
      </div>
      <div className="mt-1 font-mono text-sm text-cyan-300">
        run {hourLabel(best.startHour)} · {best.durationHours}h
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-neon-400/20 bg-neon-400/5 p-4">
          <div className="font-mono text-[9px] uppercase tracking-wider text-haze-500">carbon saved</div>
          <div className="mt-1 text-3xl font-bold text-neon-300" style={{ textShadow: "0 0 18px rgba(22,224,140,0.45)" }}>
            −{carbonSavedPct.toFixed(0)}%
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-haze-500">{carbonSavedKg.toFixed(1)} kg CO₂</div>
        </div>
        <div className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-4">
          <div className="font-mono text-[9px] uppercase tracking-wider text-haze-500">cost saved</div>
          <div className="mt-1 text-3xl font-bold text-gold-300" style={{ textShadow: "0 0 18px rgba(244,198,106,0.4)" }}>
            −{costSavedPct.toFixed(0)}%
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-haze-500">${costSavedUsd.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-5 border-t border-haze-500/15 pt-4 font-mono text-[10px] text-haze-500">
        vs running now: {result.runNow.totalCarbonKg.toFixed(1)} kg · ${result.runNow.totalCostUsd.toFixed(2)}
      </div>
    </div>
  );
}
