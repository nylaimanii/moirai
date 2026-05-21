export interface ImpactScores {
  economy: number;   // 0-100, beneficial (gold)
  health: number;    // 0-100, burden (rose)
  pollution: number; // 0-100, burden (violet)
  traffic: number;   // 0-100, burden (orange)
  habitat: number;   // 0-100, burden (green flicker)
  noise: number;     // 0-100, burden (cyan)
}

export interface Project {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  type: string;
  year: string;
  blurb: string;
  impacts: ImpactScores;
}

// curated flagship global construction projects.
// impact scores are research-informed estimates, 0-100. labeled as
// estimates in the UI; not audited measurements.
export const PROJECTS: Project[] = [
  {
    id: "neom-the-line",
    name: "NEOM — The Line",
    city: "Tabuk Province",
    country: "Saudi Arabia",
    lat: 28.0, lon: 35.3,
    type: "Megacity",
    year: "2021–",
    blurb: "A 170km linear smart city. Vast scope means vast disruption — habitat loss and enormous resource draw, set against promised jobs and modernization.",
    impacts: { economy: 88, health: 55, pollution: 78, traffic: 64, habitat: 82, noise: 70 },
  },
  {
    id: "ca-hsr",
    name: "California High-Speed Rail",
    city: "Central Valley",
    country: "USA",
    lat: 36.7, lon: -119.8,
    type: "Transit",
    year: "2015–",
    blurb: "800 miles of high-speed track. Years of construction noise and farmland disruption traded for long-term emissions cuts and regional connectivity.",
    impacts: { economy: 80, health: 30, pollution: 40, traffic: 72, habitat: 48, noise: 66 },
  },
  {
    id: "grand-paris",
    name: "Grand Paris Express",
    city: "Paris",
    country: "France",
    lat: 48.85, lon: 2.35,
    type: "Metro",
    year: "2016–",
    blurb: "200km of new automated metro. Tunnel boring rattles dense neighborhoods now; relieves chronic congestion and links isolated suburbs later.",
    impacts: { economy: 84, health: 35, pollution: 38, traffic: 58, habitat: 22, noise: 74 },
  },
  {
    id: "nusantara",
    name: "Nusantara Capital City",
    city: "East Kalimantan",
    country: "Indonesia",
    lat: -0.9, lon: 116.7,
    type: "New Capital",
    year: "2022–",
    blurb: "An entire capital carved from Borneo rainforest. Deforestation and wildlife displacement weigh against decongesting a sinking Jakarta.",
    impacts: { economy: 76, health: 48, pollution: 70, traffic: 50, habitat: 92, noise: 60 },
  },
  {
    id: "hudson-tunnel",
    name: "Hudson Tunnel / Gateway",
    city: "New York City",
    country: "USA",
    lat: 40.75, lon: -74.0,
    type: "Rail Tunnel",
    year: "2023–",
    blurb: "New rail tunnels under the Hudson. Dust, detours, and dense-urban disruption now; resilient transit for millions later.",
    impacts: { economy: 82, health: 42, pollution: 44, traffic: 80, habitat: 18, noise: 78 },
  },
  {
    id: "eko-atlantic",
    name: "Eko Atlantic City",
    city: "Lagos",
    country: "Nigeria",
    lat: 6.42, lon: 3.4,
    type: "Reclaimed City",
    year: "2009–",
    blurb: "A city built on land reclaimed from the Atlantic. Coastal-ecosystem strain versus flood defense and new commercial capacity.",
    impacts: { economy: 79, health: 50, pollution: 58, traffic: 55, habitat: 75, noise: 52 },
  },
  {
    id: "delhi-rrts",
    name: "Delhi–Meerut RRTS",
    city: "Delhi NCR",
    country: "India",
    lat: 28.6, lon: 77.2,
    type: "Rapid Transit",
    year: "2019–",
    blurb: "India's first regional rapid-transit corridor. Heavy roadside construction in already-polluted air, aiming to pull cars off gridlocked highways.",
    impacts: { economy: 77, health: 58, pollution: 62, traffic: 76, habitat: 30, noise: 72 },
  },
  {
    id: "sydney-metro-west",
    name: "Sydney Metro West",
    city: "Sydney",
    country: "Australia",
    lat: -33.87, lon: 151.2,
    type: "Metro",
    year: "2020–",
    blurb: "Underground rail linking the CBD to Parramatta. Station-box excavation disrupts inner suburbs; doubles cross-city rail capacity on completion.",
    impacts: { economy: 81, health: 33, pollution: 36, traffic: 60, habitat: 20, noise: 70 },
  },
];
