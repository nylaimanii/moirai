import { useEffect, useRef, useState } from "react";
import { GlobeScene } from "../three/GlobeScene";
import { PROJECTS } from "../data/projects";

export function GlobeCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const scene = new GlobeScene(ref.current);
    scene.setOnSelect((id) => setSelectedId(id));
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  const selected = PROJECTS.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />

      {/* zoom controls — hidden while dived in */}
      {!selected && (
        <div className="absolute bottom-8 right-8 z-10 flex flex-col gap-2">
          <button
            onClick={() => sceneRef.current?.zoomIn()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-space-800/70 text-lg text-cyan-300 backdrop-blur transition hover:border-cyan-400/60 hover:text-cyan-400"
            aria-label="zoom in"
          >
            +
          </button>
          <button
            onClick={() => sceneRef.current?.zoomOut()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-space-800/70 text-lg text-cyan-300 backdrop-blur transition hover:border-cyan-400/60 hover:text-cyan-400"
            aria-label="zoom out"
          >
            −
          </button>
        </div>
      )}

      {/* placeholder dossier when a project is selected */}
      {selected && (
        <div className="absolute right-8 top-1/2 z-10 w-72 -translate-y-1/2 rounded-2xl border border-cyan-400/20 bg-space-800/80 p-5 backdrop-blur">
          <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
            {selected.type} · {selected.year}
          </div>
          <h2 className="mt-1 text-xl font-semibold text-haze-100">
            {selected.name}
          </h2>
          <div className="text-sm text-haze-300">
            {selected.city}, {selected.country}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-haze-300">
            {selected.blurb}
          </p>
          <div className="mt-4 font-mono text-[10px] text-haze-500">
            city + impact view coming next step
          </div>
          <button
            onClick={() => sceneRef.current?.returnToOrbit()}
            className="mt-4 w-full rounded-full border border-cyan-400/30 bg-space-700/60 px-4 py-2 text-sm text-cyan-300 transition hover:border-cyan-400/60 hover:text-cyan-400"
          >
            ← return to orbit
          </button>
        </div>
      )}
    </div>
  );
}
