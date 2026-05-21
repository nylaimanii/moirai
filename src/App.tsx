import { GlobeCanvas } from "./components/GlobeCanvas";

function App() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-space-900">
      <GlobeCanvas />

      {/* hud overlay — wordmark */}
      <div className="pointer-events-none absolute left-8 top-7 z-10">
        <h1 className="text-2xl font-semibold tracking-tight text-neon-400">
          moirai
        </h1>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan-400/80">
          the fates of what we build
        </p>
      </div>
    </div>
  );
}

export default App;
