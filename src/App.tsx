import { WorkloadPanel } from "./components/WorkloadPanel";
import { WeightSlider } from "./components/WeightSlider";
import { ResultCard } from "./components/ResultCard";

function App() {
  return (
    <div className="min-h-screen bg-space-900 text-haze-100">
      <header className="px-8 pt-7">
        <h1 className="text-xl font-semibold tracking-tight text-neon-400">moirai</h1>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400/70">
          run compute when it's clean and cheap
        </p>
      </header>

      <main className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-6 px-8 pb-16 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <WorkloadPanel />
          <WeightSlider />
        </div>
        <ResultCard />
      </main>
    </div>
  );
}

export default App;
