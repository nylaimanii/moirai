import { useEffect, useRef } from "react";
import { GlobeScene } from "../three/GlobeScene";

export function GlobeCanvas() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const scene = new GlobeScene(ref.current);
    return () => scene.dispose();
  }, []);

  return <div ref={ref} className="h-full w-full" />;
}
