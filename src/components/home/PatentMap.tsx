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
  return `https://patents.google.com/patent/${pubNumber}`;
}

const jurisdictions: Jurisdiction[] = [
  {
    id: "us",
    name: "United States",
    color: "#1a56db",
    hoverColor: "#1540a8",
    countryCodes: ["840"],
    patents: [
      { number: "US12318654B2", label: "US 12,318,654 B2", url: patentUrl("US12318654B2") },
      { number: "US12277273B2", label: "US 12,277,273 B2", url: patentUrl("US12277273B2") },
      { number: "US11937591B1", label: "US 11,937,591 B1", url: patentUrl("US11937591B1") },
      { number: "US11839788B2", label: "US 11,839,788 B2", url: patentUrl("US11839788B2") },
      { number: "US11836570B1", label: "US 11,836,570 B1", url: patentUrl("US11836570B1") },
      { number: "US11833384B2", label: "US 11,833,384 B2", url: patentUrl("US11833384B2") },
      { number: "US11483078B1", label: "US 11,483,078 B1", url: patentUrl("US11483078B1") },
      { number: "US20220136940A1", label: "US 2022/0136940 A1", url: patentUrl("US20220136940A1") },
      { number: "US20230197215A1", label: "US 2023/0197215 A1", url: patentUrl("US20230197215A1") },
    ],
  },
  {
    id: "gb",
    name: "United Kingdom",
    color: "#0f3d8a",
    hoverColor: "#0a2d66",
    countryCodes: ["826"],
    patents: [
      { number: "GB2623310B", label: "GB 2,623,310 B", url: patentUrl("GB2623310B") },
    ],
  },
  {
    id: "eu",
    name: "Europe (EPO)",
    color: "#1540a8",
    hoverColor: "#0f3d8a",
    // Major EPO member states
    countryCodes: [
      "040", // Austria
      "056", // Belgium
      "100", // Bulgaria
      "191", // Croatia
      "196", // Cyprus
      "203", // Czech Republic
      "208", // Denmark
      "233", // Estonia
      "246", // Finland
      "250", // France
      "276", // Germany
      "300", // Greece
      "348", // Hungary
      "352", // Iceland
      "372", // Ireland
      "380", // Italy
      "428", // Latvia
      "440", // Lithuania
      "442", // Luxembourg
      "470", // Malta
      "528", // Netherlands
      "578", // Norway
      "616", // Poland
      "620", // Portugal
      "642", // Romania
      "703", // Slovakia
      "705", // Slovenia
      "724", // Spain
      "752", // Sweden
      "756", // Switzerland
      "792", // Turkey
    ],
    patents: [
      { number: "EP4576048B1", label: "EP 4,576,048 B1", url: patentUrl("EP4576048B1") },
    ],
  },
  {
    id: "pct",
    name: "PCT International",
    color: "#4b83e8",
    hoverColor: "#1a56db",
    countryCodes: [], // PCT covers everything — handled specially
    patents: [
      { number: "WO2022049262A2", label: "WO 2022/049262 A2", url: patentUrl("WO2022049262A2") },
      { number: "WO2023152460A1", label: "WO 2023/152460 A1", url: patentUrl("WO2023152460A1") },
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

    // PCT mode: tint everything
    if (activeJurisdiction === "pct") return "#b8cff0";

    return "#d1d9e6"; // default grey
  }

  function getOpacity(countryId: string): number {
    const j = getJurisdictionForCountry(countryId);
    if (j && activeJurisdiction === j.id) return 1;
    if (j) return 0.7;
    if (activeJurisdiction === "pct") return 0.6;
    return 1;
  }

  function getStroke(countryId: string): string {
    const j = getJurisdictionForCountry(countryId);
    if (j && activeJurisdiction === j.id) return "#ffffff";
    if (j) return "#ffffff";
    return "#b0bdd0";
  }

  function getStrokeWidth(countryId: string): number {
    const j = getJurisdictionForCountry(countryId);
    if (j && activeJurisdiction === j.id) return 1.2;
    if (j) return 0.8;
    return 0.3;
  }

  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4">Selected Examples</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Patents Granted Worldwide
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A small selection of patents I&apos;ve drafted and prosecuted
            through to grant across multiple jurisdictions. Hover over a
            highlighted region to browse publications.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
            {/* Map */}
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
                      const isClickable = !!j;

                      return (
                        <Geography
                          key={geo.rsmKey}
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
                              fill: j ? j.hoverColor : "#c0c9d8",
                              opacity: 1,
                              cursor: isClickable ? "pointer" : "default",
                              transition: "all 150ms ease",
                            },
                            pressed: {
                              outline: "none",
                            },
                          }}
                          onMouseEnter={() => {
                            if (j) setActiveJurisdiction(j.id);
                          }}
                          onClick={() => {
                            if (j) {
                              setActiveJurisdiction(
                                activeJurisdiction === j.id ? null : j.id
                              );
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 space-y-2">
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
                        {grantCount > 0 && `${grantCount} granted`}
                        {grantCount > 0 && pubCount > 0 && " · "}
                        {pubCount > 0 && `${pubCount} published`}
                      </p>
                    </button>

                    {/* Expandable patent list */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        isActive
                          ? "max-h-[400px] opacity-100 mt-1"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="bg-white border border-slate-200 rounded-lg p-3 ml-2 shadow-sm">
                        <ul className="space-y-0.5">
                          {j.patents.map((p) => (
                            <li key={p.number}>
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue hover:text-blue-dark inline-flex items-center gap-1.5 font-mono py-1.5 px-2 rounded hover:bg-blue/5 transition-colors w-full group"
                              >
                                {p.label}
                                <ExternalLink className="w-3 h-3 flex-shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!activeData && (
                <p className="text-xs text-slate-400 px-4 pt-2 text-center lg:text-left">
                  Hover or tap a region to view selected publications
                </p>
              )}
            </div>
          </div>

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
