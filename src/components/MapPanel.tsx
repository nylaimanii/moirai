import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { generateMockRegions } from "../lib/mockGrid";
import { useStore } from "../store/useStore";

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

// color a region by how clean+cheap it is right now (hour 0)
function regionColor(carbon: number, price: number): string {
  // normalize roughly: carbon 30..450, price 0.02..0.18
  const c = Math.min(1, Math.max(0, (carbon - 30) / 420));
  const p = Math.min(1, Math.max(0, (price - 0.02) / 0.16));
  const badness = (c + p) / 2; // 0 = clean+cheap, 1 = dirty+pricey
  // green (clean) -> gold -> red (dirty)
  if (badness < 0.4) return "#16e08c";
  if (badness < 0.65) return "#f4c66a";
  return "#ff5d7a";
}

export function MapPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerEls = useRef<Record<string, HTMLDivElement>>({});
  const [err, setErr] = useState<string | null>(null);
  const result = useStore((s) => s.result);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    if (!TOKEN) { setErr("Mapbox token missing — restart dev after creating .env"); return; }
    try {
      mapboxgl.accessToken = TOKEN;
      const map = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-95, 40], zoom: 2.6, projection: "mercator",
        attributionControl: false,
      });
      mapRef.current = map;
      map.on("error", (e) => setErr("Mapbox error: " + (e?.error?.message ?? "unknown")));
      map.on("style.load", () => {
        try {
          map.setFog({ color: "rgb(8,18,30)", "high-color": "rgb(20,80,110)", "horizon-blend": 0.1, "space-color": "rgb(4,8,16)", "star-intensity": 0.4 });
        } catch { /* fog optional */ }
        // markers
        const regions = generateMockRegions(48, new Date().getHours());
        for (const r of regions) {
          const now = r.hours[0];
          const color = regionColor(now.carbon, now.price);
          const el = document.createElement("div");
          el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color},0 0 24px ${color}88;cursor:pointer;transition:width .25s,height .25s,opacity .25s,box-shadow .25s;`;
          el.dataset.baseColor = color;
          markerEls.current[r.id] = el;
          const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
            `<div style="font-family:monospace;font-size:11px;color:#0a1420">${r.name}<br/>${now.carbon} gCO₂/kWh · $${now.price}/kWh</div>`
          );
          new mapboxgl.Marker({ element: el }).setLngLat([r.lng, r.lat]).setPopup(popup).addTo(map);
        }
      });
    } catch (e: any) {
      setErr("Map init failed: " + (e?.message ?? String(e)));
    }
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // react to scheduler result: highlight the winning region + flyTo, or revert all on null
  useEffect(() => {
    const map = mapRef.current;
    if (mapRef.current && !result) {
      for (const [, el] of Object.entries(markerEls.current)) {
        const base = el.dataset.baseColor || "#16e08c";
        el.style.width = "16px"; el.style.height = "16px";
        el.style.opacity = "1"; el.style.boxShadow = `0 0 12px ${base},0 0 24px ${base}88`;
        el.classList.remove("marker-pulse");
      }
    }
    if (!map || !result) return;
    const bestId = result.best.regionId;
    // restyle all markers: dim non-winners, supercharge the winner
    for (const [id, el] of Object.entries(markerEls.current)) {
      const base = el.dataset.baseColor || "#16e08c";
      if (id === bestId) {
        el.style.width = "22px";
        el.style.height = "22px";
        el.style.boxShadow = `0 0 16px ${base}, 0 0 32px ${base}, 0 0 48px ${base}aa`;
        el.style.opacity = "1";
        el.style.zIndex = "10";
        el.classList.add("marker-pulse");
      } else {
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.boxShadow = `0 0 8px ${base}88`;
        el.style.opacity = "0.45";
        el.style.zIndex = "1";
        el.classList.remove("marker-pulse");
      }
    }
    // fly to the winning region
    const region = generateMockRegions(48, new Date().getHours()).find((x) => x.id === bestId);
    if (region) {
      map.flyTo({ center: [region.lng, region.lat], zoom: 4.2, duration: 2200, essential: true });
    }
  }, [result]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-space-800/60">
      <div ref={ref} style={{ width: "100%", height: 360 }} />
      {err && (
        <div className="absolute inset-0 flex items-center justify-center bg-space-900/90 p-6 text-center">
          <div className="font-mono text-xs text-rose-300">{err}</div>
        </div>
      )}
      <div className="pointer-events-none absolute left-4 top-3 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
        live grid · now
      </div>
    </div>
  );
}
