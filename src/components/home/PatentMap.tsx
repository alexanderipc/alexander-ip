import { ExternalLink } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";

const patents = {
  us: [
    { number: "US11483078B1", label: "US 11,483,078 B1" },
    { number: "US11833384B2", label: "US 11,833,384 B2" },
    { number: "US11836570B1", label: "US 11,836,570 B1" },
    { number: "US11839788B2", label: "US 11,839,788 B2" },
    { number: "US11937591B1", label: "US 11,937,591 B1" },
    { number: "US12277273B2", label: "US 12,277,273 B2" },
    { number: "US12318654B2", label: "US 12,318,654 B2" },
  ],
  ep: [
    { number: "EP4576048B1", label: "EP 4,576,048 B1" },
  ],
  gb: [
    { number: "GB2623310B", label: "GB 2,623,310 B" },
  ],
  wo: [
    { number: "WO2022049262A2", label: "WO 2022/049262 A2" },
    { number: "WO2023152460A1", label: "WO 2023/152460 A1" },
  ],
  usPub: [
    { number: "US20220136940A1", label: "US 2022/0136940 A1" },
    { number: "US20230197215A1", label: "US 2023/0197215 A1" },
  ],
};

function espacenetUrl(pubNumber: string) {
  return `https://worldwide.espacenet.com/patent/search/family/${pubNumber}`;
}

export default function PatentMap() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-12">
          <Badge className="mb-4">Proven Track Record</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Patents Granted Worldwide
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From initial drafting through to grant — a selection of patents
            I&apos;ve taken through the full lifecycle across the US, UK, and
            Europe.
          </p>
        </div>

        {/* World Map SVG */}
        <div className="max-w-4xl mx-auto mb-12">
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-auto"
            role="img"
            aria-label="World map showing patent jurisdictions: United States, United Kingdom, and Europe"
          >
            {/* Background */}
            <rect width="1000" height="500" fill="#f8fafc" rx="12" />

            {/* Grid lines for visual depth */}
            {[100, 200, 300, 400].map((y) => (
              <line
                key={`h-${y}`}
                x1="0"
                y1={y}
                x2="1000"
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            ))}
            {[200, 400, 600, 800].map((x) => (
              <line
                key={`v-${x}`}
                x1={x}
                y1="0"
                x2={x}
                y2="500"
                stroke="#e2e8f0"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            ))}

            {/* Simplified continent shapes */}

            {/* North America */}
            <path
              d="M80,80 L180,60 L240,80 L280,120 L300,100 L320,120 L300,180 L280,200 L260,240 L240,280 L200,300 L160,280 L140,300 L120,280 L100,220 L80,200 L60,160 L70,120 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* USA highlight */}
            <path
              d="M100,160 L160,140 L200,150 L240,160 L280,170 L280,200 L260,240 L240,260 L200,280 L160,260 L140,280 L120,260 L100,220 L80,200 L80,180 Z"
              fill="#1a56db"
              fillOpacity="0.2"
              stroke="#1a56db"
              strokeWidth="2"
            />

            {/* South America */}
            <path
              d="M220,320 L260,300 L300,310 L320,340 L310,380 L300,420 L280,440 L260,460 L240,440 L230,400 L220,360 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Europe */}
            <path
              d="M440,80 L480,70 L520,80 L560,90 L580,120 L560,150 L540,170 L520,180 L500,190 L480,180 L460,190 L440,180 L430,150 L420,120 L430,100 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* EU highlight */}
            <path
              d="M440,80 L480,70 L520,80 L560,90 L580,120 L560,150 L540,170 L520,180 L500,190 L480,180 L460,190 L440,180 L430,150 L420,120 L430,100 Z"
              fill="#1a56db"
              fillOpacity="0.2"
              stroke="#1a56db"
              strokeWidth="2"
            />

            {/* UK highlight (small island) */}
            <rect
              x="420"
              y="88"
              width="14"
              height="30"
              rx="4"
              fill="#1a56db"
              fillOpacity="0.35"
              stroke="#1a56db"
              strokeWidth="2"
            />

            {/* Africa */}
            <path
              d="M460,210 L500,200 L540,210 L560,240 L570,280 L560,320 L540,360 L520,390 L500,400 L480,390 L460,360 L450,320 L440,280 L450,240 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Asia */}
            <path
              d="M580,80 L640,60 L700,70 L760,80 L820,100 L860,120 L880,160 L860,200 L820,220 L780,200 L740,190 L700,180 L660,170 L620,160 L600,140 L590,120 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* India/SE Asia */}
            <path
              d="M700,200 L740,210 L760,240 L740,280 L720,300 L700,280 L690,250 L680,220 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Australia */}
            <path
              d="M780,340 L820,330 L860,340 L880,360 L870,390 L840,400 L810,400 L790,390 L780,370 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Japan/Far East */}
            <path
              d="M860,120 L870,100 L880,120 L875,140 L865,150 L855,140 Z"
              fill="#cbd5e1"
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* Connection lines from jurisdictions to labels */}

            {/* US marker + pulse */}
            <circle cx="190" cy="210" r="8" fill="#1a56db" />
            <circle
              cx="190"
              cy="210"
              r="8"
              fill="none"
              stroke="#1a56db"
              strokeWidth="2"
              opacity="0.4"
            >
              <animate
                attributeName="r"
                from="8"
                to="24"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.4"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* UK marker + pulse */}
            <circle cx="427" cy="103" r="6" fill="#1a56db" />
            <circle
              cx="427"
              cy="103"
              r="6"
              fill="none"
              stroke="#1a56db"
              strokeWidth="2"
              opacity="0.4"
            >
              <animate
                attributeName="r"
                from="6"
                to="20"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.4"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* EU marker + pulse */}
            <circle cx="510" cy="130" r="7" fill="#1a56db" />
            <circle
              cx="510"
              cy="130"
              r="7"
              fill="none"
              stroke="#1a56db"
              strokeWidth="2"
              opacity="0.4"
            >
              <animate
                attributeName="r"
                from="7"
                to="22"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.4"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* WO/PCT marker (Geneva) */}
            <circle cx="470" cy="140" r="5" fill="#0f3d8a" />

            {/* Labels */}

            {/* US Label */}
            <rect
              x="110"
              y="260"
              width="160"
              height="52"
              rx="8"
              fill="white"
              stroke="#1a56db"
              strokeWidth="1.5"
            />
            <text
              x="190"
              y="282"
              textAnchor="middle"
              className="fill-navy"
              fontWeight="700"
              fontSize="14"
            >
              United States
            </text>
            <text
              x="190"
              y="300"
              textAnchor="middle"
              className="fill-blue"
              fontWeight="600"
              fontSize="12"
            >
              7 granted + 2 published
            </text>

            {/* UK Label */}
            <rect
              x="350"
              y="30"
              width="120"
              height="48"
              rx="8"
              fill="white"
              stroke="#1a56db"
              strokeWidth="1.5"
            />
            <text
              x="410"
              y="52"
              textAnchor="middle"
              className="fill-navy"
              fontWeight="700"
              fontSize="14"
            >
              United Kingdom
            </text>
            <text
              x="410"
              y="68"
              textAnchor="middle"
              className="fill-blue"
              fontWeight="600"
              fontSize="12"
            >
              1 granted
            </text>

            {/* EU Label */}
            <rect
              x="540"
              y="56"
              width="130"
              height="48"
              rx="8"
              fill="white"
              stroke="#1a56db"
              strokeWidth="1.5"
            />
            <text
              x="605"
              y="78"
              textAnchor="middle"
              className="fill-navy"
              fontWeight="700"
              fontSize="14"
            >
              European Patent
            </text>
            <text
              x="605"
              y="94"
              textAnchor="middle"
              className="fill-blue"
              fontWeight="600"
              fontSize="12"
            >
              1 granted
            </text>

            {/* PCT Label */}
            <rect
              x="400"
              y="160"
              width="140"
              height="48"
              rx="8"
              fill="white"
              stroke="#0f3d8a"
              strokeWidth="1.5"
            />
            <text
              x="470"
              y="182"
              textAnchor="middle"
              className="fill-navy"
              fontWeight="700"
              fontSize="14"
            >
              PCT International
            </text>
            <text
              x="470"
              y="198"
              textAnchor="middle"
              className="fill-blue"
              fontWeight="600"
              fontSize="12"
            >
              2 published
            </text>

            {/* Note */}
            <text
              x="500"
              y="470"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="11"
            >
              Showing a selection of patents drafted and prosecuted through to
              grant &middot; Full portfolio available on request
            </text>
          </svg>
        </div>

        {/* Patent Links Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {/* US Granted */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue rounded-full" />
              <h3 className="font-semibold text-navy text-sm">
                US Granted Patents
              </h3>
            </div>
            <ul className="space-y-1.5">
              {patents.us.map((p) => (
                <li key={p.number}>
                  <a
                    href={espacenetUrl(p.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue hover:text-blue-dark inline-flex items-center gap-1 font-mono"
                  >
                    {p.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* EP Granted */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue rounded-full" />
              <h3 className="font-semibold text-navy text-sm">
                European Patent
              </h3>
            </div>
            <ul className="space-y-1.5">
              {patents.ep.map((p) => (
                <li key={p.number}>
                  <a
                    href={espacenetUrl(p.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue hover:text-blue-dark inline-flex items-center gap-1 font-mono"
                  >
                    {p.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
              {patents.gb.map((p) => (
                <li key={p.number}>
                  <a
                    href={espacenetUrl(p.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue hover:text-blue-dark inline-flex items-center gap-1 font-mono"
                  >
                    {p.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-slate-400 mt-2">
              EP &amp; GB granted
            </p>
          </div>

          {/* PCT Published */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-darker rounded-full" />
              <h3 className="font-semibold text-navy text-sm">
                PCT Applications
              </h3>
            </div>
            <ul className="space-y-1.5">
              {patents.wo.map((p) => (
                <li key={p.number}>
                  <a
                    href={espacenetUrl(p.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue hover:text-blue-dark inline-flex items-center gap-1 font-mono"
                  >
                    {p.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* US Published */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-light rounded-full" />
              <h3 className="font-semibold text-navy text-sm">
                US Published Applications
              </h3>
            </div>
            <ul className="space-y-1.5">
              {patents.usPub.map((p) => (
                <li key={p.number}>
                  <a
                    href={espacenetUrl(p.number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue hover:text-blue-dark inline-flex items-center gap-1 font-mono"
                  >
                    {p.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
