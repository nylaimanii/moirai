import { useStore } from "../store/useStore";

export function WeightSlider() {
  const { weight, setWeight, run, result } = useStore();

  const onChange = (v: number) => {
    setWeight(v);
    // re-run only if a result already exists (user has scheduled once)
    if (result) run();
  };

  return (
    <div className="rounded-2xl border border-violet-400/20 bg-space-800/60 p-5 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-gold-300">cost</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-haze-500">priority</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-neon-300">carbon</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.05} value={weight}
        onChange={(e) => onChange(+e.target.value)}
        className="mt-3 w-full accent-violet-400"
      />
      <div className="mt-2 text-center font-mono text-[10px] text-haze-500">
        {weight <= 0.3 ? "optimizing for cost" : weight >= 0.7 ? "optimizing for carbon" : "balanced"}
      </div>
    </div>
  );
}
