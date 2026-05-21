import { useEffect, useRef } from "react";
import { GlobeScene } from "../three/GlobeScene";

export function GlobeCanvas() {
  const ref = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const scene = new GlobeScene(ref.current);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full" />
      {/* zoom controls */}
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
    </div>
  );
}
