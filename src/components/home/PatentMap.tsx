"use client";

import { useState, memo } from "react";
import { ExternalLink } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "@vnedyalk0v/react19-simple-maps";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";

// Bundled locally — no CDN fetch at runtime
import worldData from "@/data/countries-110m.json";

/* ------------------------------------------------------------------ */
/*  Patent data                                                        */
/* ------------------------------------------------------------------ */

interface Patent {
  number: string;
  label: string;
  title?: string;
  url: string;
}

interface Jurisdiction {
  id: string;
  name: string;
  patents: Patent[];
  color: string;
  hoverColor: string;
  /** ISO 3166-1 numeric codes for countries in this jurisdiction */
  countryCodes: string[];
}

function patentUrl(pubNumber: string) {
  // Use WIPO PatentScope for PCT / WO publications
  if (pubNumber.startsWith("WO")) {
    // Strip kind code (A1, A2, etc.) for WIPO doc ID
    const docId = pubNumber.replace(/[A-Z]\d$/, "");
    return `https://patentscope.wipo.int/search/en/detail.jsf?docId=${docId}`;
  }
  // Use Espacenet for all other jurisdictions (US, GB, EP, AU)
  return `https://worldwide.espacenet.com/patent/search?q=pn%3D${pubNumber}`;
}

/** PCT-eligible countries (everything not in a specific jurisdiction) */
const PCT_GREEN = "#1a7a5a";
const PCT_GREEN_HOVER = "#15634a";

const jurisdictions: Jurisdiction[] = [
  {
    id: "us",
    name: "United States",
    color: "#1a56db",
    hoverColor: "#1540a8",
    countryCodes: ["840"],
    patents: [
      // ── Granted patents (newest first) ──
      { number: "US12556844B1", label: "US 12,556,844 B1", title: "CPU & RAM Monitor", url: patentUrl("US12556844B1") },
      { number: "US12554272B2", label: "US 12,554,272 B2", title: "Valve Control System", url: patentUrl("US12554272B2") },
      { number: "US12539800B2", label: "US 12,539,800 B2", title: "Swivel Vehicle Table", url: patentUrl("US12539800B2") },
      { number: "US12515234B2", label: "US 12,515,234 B2", title: "Auto Cleaning Sprayer", url: patentUrl("US12515234B2") },
      { number: "US12503005B2", label: "US 12,503,005 B2", title: "Split-Load EV Chassis", url: patentUrl("US12503005B2") },
      { number: "US12433360B1", label: "US 12,433,360 B1", title: "Dual-Layer Elastic Belt", url: patentUrl("US12433360B1") },
      { number: "US12404623B2", label: "US 12,404,623 B2", title: "Vehicle Camera Cover", url: patentUrl("US12404623B2") },
      { number: "US12381417B2", label: "US 12,381,417 B2", title: "Nano Inductance Cells", url: patentUrl("US12381417B2") },
      { number: "US12354583B2", label: "US 12,354,583 B2", title: "Voice Isolation Mask", url: patentUrl("US12354583B2") },
      { number: "US12349766B2", label: "US 12,349,766 B2", title: "Cleated Shoe Cover", url: patentUrl("US12349766B2") },
      { number: "US12337915B2", label: "US 12,337,915 B2", title: "Universal Docking Bracket", url: patentUrl("US12337915B2") },
      { number: "US12318654B2", label: "US 12,318,654 B2", title: "Exercise Handle", url: patentUrl("US12318654B2") },
      { number: "US12277273B2", label: "US 12,277,273 B2", title: "Haptic Device", url: patentUrl("US12277273B2") },
      { number: "US12236923B2", label: "US 12,236,923 B2", title: "Music Production Device", url: patentUrl("US12236923B2") },
      { number: "US12213474B2", label: "US 12,213,474 B2", title: "Bait Station", url: patentUrl("US12213474B2") },
      { number: "US12189040B2", label: "US 12,189,040 B2", title: "Bicycle Handlebar Grip", url: patentUrl("US12189040B2") },
      { number: "US12121131B1", label: "US 12,121,131 B1", title: "Dispensing Stick", url: patentUrl("US12121131B1") },
      { number: "US11937591B1", label: "US 11,937,591 B1", title: "Fishing Rod Feeder", url: patentUrl("US11937591B1") },
      { number: "US11839788B2", label: "US 11,839,788 B2", title: "Resistance Exercise Anchor", url: patentUrl("US11839788B2") },
      { number: "US11836570B1", label: "US 11,836,570 B1", title: "Machine-Readable Labels", url: patentUrl("US11836570B1") },
      { number: "US11833384B2", label: "US 11,833,384 B2", title: "Resistance Bands", url: patentUrl("US11833384B2") },
      { number: "US11483078B1", label: "US 11,483,078 B1", title: "ULF Communications", url: patentUrl("US11483078B1") },
      { number: "US10878232B2", label: "US 10,878,232 B2", title: "Invoice Automation", url: patentUrl("US10878232B2") },
      // ── Published applications ──
      { number: "US20260018000A1", label: "US 2026/0018000 A1", title: "Smart Package Pod", url: patentUrl("US20260018000A1") },
      { number: "US20260052163A1", label: "US 2026/0052163 A1", title: "Cybersecurity Honeypot", url: patentUrl("US20260052163A1") },
      { number: "US2024270289A1", label: "US 2024/270289 A1", title: "Gondola Transport System", url: patentUrl("US2024270289A1") },
      { number: "US20260016255A1", label: "US 2026/0016255 A1", title: "Modular Archery Bow", url: patentUrl("US20260016255A1") },
      { number: "US2025191492A1", label: "US 2025/191492 A1", title: "VR Medical Training", url: patentUrl("US2025191492A1") },
      { number: "US2025256054A1", label: "US 2025/256054 A1", title: "Baby Patting Device", url: patentUrl("US2025256054A1") },
      { number: "US2025366786A1", label: "US 2025/366786 A1", title: "Health Monitoring Diaper", url: patentUrl("US2025366786A1") },
      { number: "US20260021372A1", label: "US 2026/0021372 A1", title: "Snowboard Boot Stabilizer", url: patentUrl("US20260021372A1") },
      { number: "US2025314123A1", label: "US 2025/314123 A1", title: "Cat Gate System", url: patentUrl("US2025314123A1") },
      { number: "US2023211133A1", label: "US 2023/211133 A1", title: "Dual Stopcock", url: patentUrl("US2023211133A1") },
      { number: "US2025380670A1", label: "US 2025/380670 A1", title: "Smart Pet Collar", url: patentUrl("US2025380670A1") },
      { number: "US20260033674A1", label: "US 2026/0033674 A1", title: "Cutting Board", url: patentUrl("US20260033674A1") },
      { number: "US20260050739A1", label: "US 2026/0050739 A1", title: "AI Character Portrayals", url: patentUrl("US20260050739A1") },
      { number: "US2025338980A1", label: "US 2025/338980 A1", title: "Tri-Fold Video Display", url: patentUrl("US2025338980A1") },
      { number: "US2025323845A1", label: "US 2025/323845 A1", title: "AI Call Re-Engagement", url: patentUrl("US2025323845A1") },
      { number: "US20260020642A1", label: "US 2026/0020642 A1", title: "Orthopedic Safety Boot", url: patentUrl("US20260020642A1") },
      { number: "US20260008580A1", label: "US 2026/0008580 A1", title: "Medication Container", url: patentUrl("US20260008580A1") },
      { number: "US2025041653A1", label: "US 2025/041653 A1", title: "Exercise Platform", url: patentUrl("US2025041653A1") },
      { number: "US2025387034A1", label: "US 2025/387034 A1", title: "Heart Rate Sharing", url: patentUrl("US2025387034A1") },
      { number: "US2025221384A1", label: "US 2025/221384 A1", title: "Smart Dog Collar", url: patentUrl("US2025221384A1") },
      { number: "US2025353392A1", label: "US 2025/353392 A1", title: "EV Docking System", url: patentUrl("US2025353392A1") },
      { number: "US2025137432A1", label: "US 2025/137432 A1", title: "Pressure-Differential Engine", url: patentUrl("US2025137432A1") },
      { number: "US2025251701A1", label: "US 2025/251701 A1", title: "3D Watch Winder", url: patentUrl("US2025251701A1") },
      { number: "US2025029518A1", label: "US 2025/029518 A1", title: "Magnetic Collectible Display", url: patentUrl("US2025029518A1") },
      { number: "US2025349225A1", label: "US 2025/349225 A1", title: "Musical Instrument Layouts", url: patentUrl("US2025349225A1") },
      { number: "US2025383183A1", label: "US 2025/383183 A1", title: "Dual-Profile Mounting Rail", url: patentUrl("US2025383183A1") },
      { number: "US2025303675A1", label: "US 2025/303675 A1", title: "Laminated Film Assembly", url: patentUrl("US2025303675A1") },
      { number: "US2025199325A1", label: "US 2025/199325 A1", title: "VR Fragrance Device", url: patentUrl("US2025199325A1") },
      { number: "US2024374013A1", label: "US 2024/374013 A1", title: "Dual Deodorant Dispenser", url: patentUrl("US2024374013A1") },
      { number: "US20260033580A1", label: "US 2026/0033580 A1", title: "Convertible Headwear", url: patentUrl("US20260033580A1") },
      { number: "US2025316250A1", label: "US 2025/316250 A1", title: "Dynamic Audio Retrigger", url: patentUrl("US2025316250A1") },
    ],
  },
  {
    id: "gb",
    name: "United Kingdom",
    color: "#0f3d8a",
    hoverColor: "#0a2d66",
    countryCodes: ["826"],
    patents: [
      // ── Granted ──
      { number: "GB2623310B", label: "GB 2,623,310 B", title: "Valve Control System", url: patentUrl("GB2623310B") },
    ],
  },
  {
    id: "eu",
    name: "Europe (EPO)",
    color: "#1540a8",
    hoverColor: "#0f3d8a",
    countryCodes: [
      "040", "056", "100", "191", "196", "203", "208", "233", "246", "250",
      "276", "300", "348", "352", "372", "380", "428", "440", "442", "470",
      "528", "578", "616", "620", "642", "703", "705", "724", "752", "756", "792",
    ],
    patents: [
      // ── Granted ──
      { number: "EP4576048B1", label: "EP 4,576,048 B1", title: "Spatial Memory Aid", url: patentUrl("EP4576048B1") },
      // ── Published ──
      { number: "EP4655775A1", label: "EP 4,655,775 A1", title: "Modular Smart Frame", url: patentUrl("EP4655775A1") },
      { number: "EP4035264A1", label: "EP 4,035,264 A1", title: "Audio Data Processing", url: patentUrl("EP4035264A1") },
      { number: "EP4695742A1", label: "EP 4,695,742 A1", title: "QR Code Optimization", url: patentUrl("EP4695742A1") },
      { number: "EP4651704A1", label: "EP 4,651,704 A1", title: "Self-Watering Planter", url: patentUrl("EP4651704A1") },
    ],
  },
  {
    id: "au",
    name: "Australia & NZ",
    color: "#1a56db",
    hoverColor: "#1540a8",
    countryCodes: ["036", "554"],
    patents: [
      // ── Granted ──
      { number: "AU2022440230B2", label: "AU 2022440230 B2", title: "Vehicle Docking Module", url: patentUrl("AU2022440230B2") },
      { number: "AU2023361441B2", label: "AU 2023361441 B2", title: "Valve Control System", url: patentUrl("AU2023361441B2") },
      { number: "AU2020471661B2", label: "AU 2020471661 B2", title: "Bait Station", url: patentUrl("AU2020471661B2") },
      { number: "NZ799057A", label: "NZ 799,057 A", title: "Bait Station", url: patentUrl("NZ799057A") },
      // ── Published ──
      { number: "AU2025202303A1", label: "AU 2025202303 A1", title: "Cat Gate System", url: patentUrl("AU2025202303A1") },
      { number: "AU2022440229A1", label: "AU 2022440229 A1", title: "EV Docking System", url: patentUrl("AU2022440229A1") },
      { number: "AU2024277082A1", label: "AU 2024277082 A1", title: "Exercise Handle", url: patentUrl("AU2024277082A1") },
      { number: "AU2023425963A1", label: "AU 2023425963 A1", title: "Modular Smart Frame", url: patentUrl("AU2023425963A1") },
      { number: "AU2021331104A1", label: "AU 2021331104 A1", title: "Mood Detection Device", url: patentUrl("AU2021331104A1") },
    ],
  },
  {
    id: "ca",
    name: "Canada",
    color: "#2563eb",
    hoverColor: "#1d4ed8",
    countryCodes: ["124"],
    patents: [
      { number: "CA3246062A1", label: "CA 3,246,062 A1", title: "Animal Trap Monitor", url: patentUrl("CA3246062A1") },
      { number: "CA3267615A1", label: "CA 3,267,615 A1", title: "Valve Control System", url: patentUrl("CA3267615A1") },
      { number: "CA3192924A1", label: "CA 3,192,924 A1", title: "Bait Station", url: patentUrl("CA3192924A1") },
      { number: "CA3250800A1", label: "CA 3,250,800 A1", title: "EV Docking Module", url: patentUrl("CA3250800A1") },
    ],
  },
  {
    id: "pct",
    name: "International (155+ States)",
    color: PCT_GREEN,
    hoverColor: PCT_GREEN_HOVER,
    countryCodes: [],
    patents: [
      { number: "WO2024079441A1", label: "WO 2024/079441 A1", title: "Valve Control System", url: patentUrl("WO2024079441A1") },
      { number: "WO2024156974A1", label: "WO 2024/156974 A1", title: "Modular Smart Frame", url: patentUrl("WO2024156974A1") },
      { number: "WO2024240368A1", label: "WO 2024/240368 A1", title: "Exercise Handle", url: patentUrl("WO2024240368A1") },
      { number: "WO2022073056A1", label: "WO 2022/073056 A1", title: "Bait Station", url: patentUrl("WO2022073056A1") },
      { number: "BR112022018356A2", label: "BR 112022018356 A2", title: "Electronic Vaping Device", url: patentUrl("BR112022018356A2") },
    ],
  },
];

/** Look up which jurisdiction a country belongs to (by numeric ISO code) */
function getJurisdictionForCountry(countryId: string): Jurisdiction | null {
  for (const j of jurisdictions) {
    if (j.countryCodes.includes(countryId)) return j;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function PatentMap() {
  const [activeJurisdiction, setActiveJurisdiction] = useState<string | null>(
    null
  );

  const activeData = jurisdictions.find((j) => j.id === activeJurisdiction);

  /** Determine fill colour for a given country */
  function getFill(countryId: string): string {
    const j = getJurisdictionForCountry(countryId);

    // If this country's jurisdiction is actively hovered
    if (j && activeJurisdiction === j.id) return j.hoverColor;

    // If this country belongs to a highlighted jurisdiction
    if (j) return j.color;

    // Unassigned countries = PCT eligible (dark green)
    if (activeJurisdiction === "pct") return PCT_GREEN_HOVER;
    return PCT_GREEN;
  }

  function getOpacity(countryId: string): number {
    const j = getJurisdictionForCountry(countryId);
    if (j && activeJurisdiction === j.id) return 1;
    if (j) return 0.7;
    if (activeJurisdiction === "pct") return 0.85;
    return 0.55;
  }

  function getStroke(countryId: string): string {
    const j = getJurisdictionForCountry(countryId);
    if (j && activeJurisdiction === j.id) return "#ffffff";
    if (j) return "#ffffff";
    if (activeJurisdiction === "pct") return "#ffffff";
    return "#2d8a6a";
  }

  function getStrokeWidth(countryId: string): number {
    const j = getJurisdictionForCountry(countryId);
    if (j && activeJurisdiction === j.id) return 1.2;
    if (j) return 0.8;
    if (activeJurisdiction === "pct") return 0.6;
    return 0.3;
  }

  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4">Global Coverage</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Patents &amp; Applications Worldwide
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A selection of granted patents and published applications
            drafted by Alexander IP, with PCT coverage across 155+
            contracting states. Hover over any region to browse.
          </p>
        </div>

        {/* Map — nearly full-width */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="relative bg-gradient-to-br from-[#eef3fb] to-[#e4eaf5] rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <ComposableMap
              projectionConfig={{
                rotate: [-10, 0, 0] as any,
                scale: 155,
              }}
              style={{ width: "100%", height: "auto" }}
            >
              <Geographies geography={worldData}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryId = geo.id as string;
                    const j = getJurisdictionForCountry(countryId);

                    return (
                      <Geography
                        key={geo.rsmKey ?? geo.id ?? countryId}
                        geography={geo}
                        fill={getFill(countryId)}
                        stroke={getStroke(countryId)}
                        strokeWidth={getStrokeWidth(countryId)}
                        style={{
                          default: {
                            outline: "none",
                            opacity: getOpacity(countryId),
                            transition: "all 250ms ease",
                          },
                          hover: {
                            outline: "none",
                            fill: j ? j.hoverColor : PCT_GREEN_HOVER,
                            opacity: 1,
                            cursor: "pointer",
                            transition: "all 150ms ease",
                          },
                          pressed: {
                            outline: "none",
                          },
                        }}
                        onMouseEnter={() => {
                          setActiveJurisdiction(j ? j.id : "pct");
                        }}
                        onClick={() => {
                          const target = j ? j.id : "pct";
                          setActiveJurisdiction(
                            activeJurisdiction === target ? null : target
                          );
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>

        {/* Jurisdictions — horizontal row underneath the map */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {jurisdictions.map((j) => {
              const isActive = activeJurisdiction === j.id;
              const grantCount = j.patents.filter((p) =>
                /B\d?$/.test(p.label.trim())
              ).length;
              const pubCount = j.patents.length - grantCount;

              return (
                <div key={j.id}>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? "bg-blue/10 border-blue/40 shadow-sm"
                        : "bg-white border-slate-200 hover:border-blue/30 hover:bg-slate-50"
                    }`}
                    onMouseEnter={() => setActiveJurisdiction(j.id)}
                    onClick={() =>
                      setActiveJurisdiction(isActive ? null : j.id)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: j.color }}
                      />
                      <span className="font-semibold text-navy text-sm">
                        {j.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 ml-5">
                      {j.id === "pct"
                        ? `${pubCount} published · 155+ states`
                        : <>
                            {grantCount > 0 && `${grantCount} granted`}
                            {grantCount > 0 && pubCount > 0 && " \u00B7 "}
                            {pubCount > 0 && `${pubCount} published`}
                          </>
                      }
                    </p>
                  </button>

                  {/* Expandable patent list */}
                  {j.patents.length > 0 && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isActive
                          ? "max-h-[600px] opacity-100 mt-1"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                        <ul className="space-y-0.5 max-h-[350px] overflow-y-auto">
                          {j.patents.map((p) => (
                            <li key={p.number}>
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue hover:text-blue-dark flex items-start gap-1.5 py-1.5 px-2 rounded hover:bg-blue/5 transition-colors w-full group"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-mono whitespace-nowrap">{p.label}</span>
                                  {p.title && (
                                    <p className="text-[11px] text-slate-400 font-sans truncate mt-0.5">{p.title}</p>
                                  )}
                                </div>
                                <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!activeData && (
            <p className="text-xs text-slate-400 pt-3 text-center">
              Hover or tap a region to view selected publications
            </p>
          )}

          <p className="text-center text-sm text-slate-400 mt-8">
            Selected examples only &mdash; full portfolio and client
            references available on request
          </p>
        </div>
      </Container>
    </section>
  );
}

export default memo(PatentMap);
