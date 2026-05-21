import { feature } from "topojson-client";
import worldData from "world-atlas/land-110m.json";

type LngLat = [number, number];

// returns sampled [lat, lon] points that fall on land.
// strategy: walk a fine global grid, keep points inside land polygons.
export function sampleLandPoints(stepDeg = 1.4): LngLat[] {
  const topo = worldData as unknown as {
    objects: { land: unknown };
  };
  const land = feature(topo as never, topo.objects.land as never) as unknown as {
    type: string;
    features?: { geometry: unknown }[];
    geometry?: unknown;
  };
  const polys: number[][][][] = [];
  const geom =
    land.type === "FeatureCollection" && land.features
      ? land.features.map((f) => f.geometry)
      : [land.geometry];
  for (const gRaw of geom) {
    const g = gRaw as { type?: string; coordinates?: number[][][] | number[][][][] };
    if (!g || !g.type) continue;
    if (g.type === "Polygon") polys.push(g.coordinates as number[][][]);
    else if (g.type === "MultiPolygon")
      for (const p of g.coordinates as number[][][][]) polys.push(p);
  }

  const out: LngLat[] = [];
  for (let lat = -85; lat <= 85; lat += stepDeg) {
    for (let lon = -180; lon <= 180; lon += stepDeg) {
      if (pointInAnyPolygon(lon, lat, polys)) out.push([lat, lon]);
    }
  }
  return out;
}

// ray-casting point-in-polygon over a set of polygons (with holes).
function pointInAnyPolygon(lon: number, lat: number, polys: number[][][][]): boolean {
  for (const poly of polys) {
    // poly[0] = outer ring, poly[1..] = holes
    if (pointInRing(lon, lat, poly[0])) {
      let inHole = false;
      for (let h = 1; h < poly.length; h++) {
        if (pointInRing(lon, lat, poly[h])) { inHole = true; break; }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      (yi > lat) !== (yj > lat) &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
