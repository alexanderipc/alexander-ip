"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";

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
}

function espacenetUrl(pubNumber: string) {
  return `https://worldwide.espacenet.com/patent/search/family/${pubNumber}`;
}

const jurisdictions: Jurisdiction[] = [
  {
    id: "us",
    name: "United States",
    color: "#1a56db",
    patents: [
      { number: "US12318654B2", label: "US 12,318,654 B2", url: espacenetUrl("US12318654B2") },
      { number: "US12277273B2", label: "US 12,277,273 B2", url: espacenetUrl("US12277273B2") },
      { number: "US11937591B1", label: "US 11,937,591 B1", url: espacenetUrl("US11937591B1") },
      { number: "US11839788B2", label: "US 11,839,788 B2", url: espacenetUrl("US11839788B2") },
      { number: "US11836570B1", label: "US 11,836,570 B1", url: espacenetUrl("US11836570B1") },
      { number: "US11833384B2", label: "US 11,833,384 B2", url: espacenetUrl("US11833384B2") },
      { number: "US11483078B1", label: "US 11,483,078 B1", url: espacenetUrl("US11483078B1") },
      { number: "US20220136940A1", label: "US 2022/0136940 A1", url: espacenetUrl("US20220136940A1") },
      { number: "US20230197215A1", label: "US 2023/0197215 A1", url: espacenetUrl("US20230197215A1") },
    ],
  },
  {
    id: "eu",
    name: "Europe",
    color: "#1540a8",
    patents: [
      { number: "EP4576048B1", label: "EP 4,576,048 B1", url: espacenetUrl("EP4576048B1") },
    ],
  },
  {
    id: "gb",
    name: "United Kingdom",
    color: "#0f3d8a",
    patents: [
      { number: "GB2623310B", label: "GB 2,623,310 B", url: espacenetUrl("GB2623310B") },
    ],
  },
  {
    id: "pct",
    name: "PCT International",
    color: "#4b83e8",
    patents: [
      { number: "WO2022049262A2", label: "WO 2022/049262 A2", url: espacenetUrl("WO2022049262A2") },
      { number: "WO2023152460A1", label: "WO 2023/152460 A1", url: espacenetUrl("WO2023152460A1") },
    ],
  },
];

/* Accurate simplified world map paths — Natural Earth style, 960×500 */
const mapRegions = {
  northAmerica:
    "M55,58 L70,52 L90,46 L115,42 L140,44 L162,48 L180,55 L200,52 L215,48 L228,52 L240,58 L252,64 L260,72 L265,82 L268,96 L262,108 L254,120 L245,130 L240,138 L235,145 L228,152 L218,158 L208,162 L195,165 L182,162 L170,158 L158,155 L145,150 L135,145 L125,138 L115,132 L105,125 L95,118 L85,112 L78,105 L72,96 L65,85 L58,74 L52,66 Z",
  usa: "M72,112 L85,105 L98,100 L115,96 L132,94 L150,92 L168,92 L185,94 L202,96 L218,100 L232,106 L245,112 L255,118 L262,125 L265,132 L260,140 L252,148 L242,155 L232,160 L218,162 L205,160 L192,158 L178,155 L165,152 L152,150 L138,146 L125,142 L115,136 L105,130 L95,124 L85,118 L78,114 Z",
  southAmerica:
    "M198,200 L212,195 L225,198 L238,205 L248,215 L255,228 L258,242 L260,258 L258,275 L255,292 L248,308 L240,322 L232,335 L222,345 L215,352 L210,348 L206,338 L202,325 L200,310 L198,295 L195,278 L192,262 L190,245 L190,228 L192,215 Z",
  europe:
    "M448,52 L460,48 L472,52 L485,55 L498,58 L508,62 L518,68 L525,76 L530,84 L532,92 L530,100 L525,108 L518,114 L510,118 L502,122 L494,126 L486,128 L478,128 L470,126 L462,122 L455,118 L448,112 L442,106 L438,98 L436,90 L436,82 L438,72 L442,64 L445,58 Z",
  uk: "M424,66 L428,62 L430,66 L432,72 L434,80 L432,88 L430,94 L426,98 L422,94 L420,88 L418,80 L418,72 L420,68 Z",
  africa:
    "M448,148 L462,142 L478,140 L494,142 L510,146 L525,152 L536,160 L545,172 L550,186 L554,202 L555,220 L554,238 L550,256 L545,272 L538,286 L528,298 L518,308 L508,316 L498,320 L488,318 L478,312 L468,304 L458,294 L452,282 L446,268 L442,252 L440,236 L438,220 L438,204 L440,188 L442,174 L445,162 Z",
  middleEast:
    "M532,92 L548,88 L562,92 L574,100 L580,110 L578,120 L572,130 L564,136 L556,140 L546,142 L536,138 L530,132 L528,122 L528,110 Z",
  asia: "M525,32 L548,28 L575,25 L605,22 L638,24 L668,28 L698,32 L725,36 L748,42 L768,48 L785,56 L798,64 L806,74 L810,84 L810,94 L806,104 L798,112 L786,118 L772,122 L756,124 L740,122 L722,118 L705,114 L688,112 L672,108 L655,104 L640,100 L626,96 L612,92 L598,88 L585,82 L572,76 L560,70 L548,64 L538,56 L532,46 Z",
  india:
    "M620,132 L635,128 L648,134 L658,144 L665,158 L668,174 L666,190 L660,204 L650,214 L640,220 L632,216 L625,208 L620,196 L616,182 L614,168 L616,152 L618,142 Z",
  seAsia:
    "M688,146 L705,140 L720,146 L730,156 L735,168 L732,180 L725,190 L715,196 L705,192 L698,184 L692,174 L688,164 L686,154 Z",
  eastAsia:
    "M662,58 L682,54 L702,58 L722,64 L738,72 L752,82 L762,92 L766,105 L762,115 L752,122 L738,128 L722,132 L706,128 L692,124 L678,118 L666,110 L656,100 L650,90 L648,78 L652,68 Z",
  japan:
    "M772,70 L780,66 L786,70 L788,78 L786,86 L780,92 L774,96 L768,92 L766,86 L766,78 Z",
  australia:
    "M720,292 L742,286 L762,284 L782,286 L802,292 L818,304 L826,318 L828,332 L824,346 L816,356 L804,362 L790,366 L775,364 L760,358 L748,348 L740,336 L736,322 L734,308 Z",
  indonesia:
    "M680,228 L698,224 L716,228 L732,234 L742,242 L738,250 L728,254 L714,256 L698,254 L685,248 L676,242 L674,234 Z",
};

export default function PatentMap() {
  const [activeJurisdiction, setActiveJurisdiction] = useState<string | null>(null);

  const activeData = jurisdictions.find((j) => j.id === activeJurisdiction);

  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4">Proven Track Record</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Patents Granted Worldwide
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From initial drafting through to grant &mdash; a selection of
            patents I&apos;ve taken through the full lifecycle. Hover over a
            highlighted region to see publications.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
            {/* Map */}
            <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-3 sm:p-5 overflow-hidden shadow-sm">
              <svg
                viewBox="0 0 880 420"
                className="w-full h-auto select-none"
                role="img"
                aria-label="Interactive world map showing patent jurisdictions"
              >
                {/* Ocean */}
                <defs>
                  <radialGradient id="ocean" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#e8edf4" />
                  </radialGradient>
                </defs>
                <rect width="880" height="420" fill="url(#ocean)" />

                {/* Base continents */}
                {Object.entries(mapRegions).map(([key, d]) => {
                  if (key === "usa" || key === "uk" || key === "europe") return null;
                  return (
                    <path
                      key={key}
                      d={d}
                      fill="#d1d9e6"
                      stroke="#b0bdd0"
                      strokeWidth="0.5"
                      className={`transition-all duration-300 ${
                        activeJurisdiction === "pct" ? "fill-[#dbe4f8]" : ""
                      }`}
                    />
                  );
                })}

                {/* USA — interactive */}
                <path
                  d={mapRegions.usa}
                  fill={activeJurisdiction === "us" ? "#1a56db" : "#a8c4f5"}
                  fillOpacity={activeJurisdiction === "us" ? 0.5 : 0.35}
                  stroke="#1a56db"
                  strokeWidth={activeJurisdiction === "us" ? 2 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setActiveJurisdiction("us")}
                  onMouseLeave={() => setActiveJurisdiction(null)}
                  onClick={() => setActiveJurisdiction(activeJurisdiction === "us" ? null : "us")}
                />

                {/* Europe — interactive */}
                <path
                  d={mapRegions.europe}
                  fill={activeJurisdiction === "eu" ? "#1540a8" : "#a8c4f5"}
                  fillOpacity={activeJurisdiction === "eu" ? 0.5 : 0.3}
                  stroke="#1540a8"
                  strokeWidth={activeJurisdiction === "eu" ? 2 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setActiveJurisdiction("eu")}
                  onMouseLeave={() => setActiveJurisdiction(null)}
                  onClick={() => setActiveJurisdiction(activeJurisdiction === "eu" ? null : "eu")}
                />

                {/* UK — interactive (rendered on top of Europe) */}
                <path
                  d={mapRegions.uk}
                  fill={activeJurisdiction === "gb" ? "#0f3d8a" : "#8db0f0"}
                  fillOpacity={activeJurisdiction === "gb" ? 0.6 : 0.4}
                  stroke="#0f3d8a"
                  strokeWidth={activeJurisdiction === "gb" ? 2.5 : 1.5}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setActiveJurisdiction("gb")}
                  onMouseLeave={() => setActiveJurisdiction(null)}
                  onClick={() => setActiveJurisdiction(activeJurisdiction === "gb" ? null : "gb")}
                />

                {/* PCT highlight overlay on all continents */}
                {activeJurisdiction === "pct" &&
                  Object.entries(mapRegions).map(([key, d]) => {
                    if (key === "usa" || key === "uk" || key === "europe") return null;
                    return (
                      <path
                        key={`pct-${key}`}
                        d={d}
                        fill="#4b83e8"
                        fillOpacity="0.12"
                        stroke="none"
                        className="pointer-events-none"
                      />
                    );
                  })}

                {/* Animated markers */}
                {[
                  { cx: 175, cy: 128, color: "#1a56db", r: 5 },
                  { cx: 426, cy: 80, color: "#0f3d8a", r: 4 },
                  { cx: 490, cy: 90, color: "#1540a8", r: 4 },
                ].map((m, i) => (
                  <g key={i}>
                    <circle cx={m.cx} cy={m.cy} r={m.r} fill={m.color} className="pointer-events-none" />
                    <circle
                      cx={m.cx}
                      cy={m.cy}
                      r={m.r}
                      fill="none"
                      stroke={m.color}
                      strokeWidth="1.5"
                      className="pointer-events-none"
                    >
                      <animate attributeName="r" from={m.r} to={m.r * 3.5} dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                  </g>
                ))}
              </svg>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 space-y-2">
              {jurisdictions.map((j) => {
                const isActive = activeJurisdiction === j.id;
                const grantCount = j.patents.filter((p) => /B\d?$/.test(p.label.trim())).length;
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
                      onMouseLeave={() => setActiveJurisdiction(null)}
                      onClick={() => setActiveJurisdiction(isActive ? null : j.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: j.color }}
                        />
                        <span className="font-semibold text-navy text-sm">{j.name}</span>
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
                        isActive ? "max-h-[400px] opacity-100 mt-1" : "max-h-0 opacity-0"
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
                  Hover or tap a region to view patents on Espacenet
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-8">
            Showing a selection of patents drafted and prosecuted through to
            grant &middot; Full portfolio available on request
          </p>
        </div>
      </Container>
    </section>
  );
}
