export interface Service {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  startingPrice: string;
  currency: string;
  delivery: string;
  icon: string;
  features: string[];
  pricing: PricingTier[];
  extras?: Extra[];
  whoIsItFor: string[];
  faq: { question: string; answer: string }[];
}

export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface Extra {
  name: string;
  price: string;
  note?: string;
}

export const services: Service[] = [
  {
    slug: "consultation",
    title: "Patent Law & Strategy Consultation",
    shortTitle: "Consultation",
    description:
      "Expert advice on patentability, strategy, and IP protection — designed for those who need guidance before committing to a full filing.",
    longDescription:
      "A paid consultation covering patentability assessments, filing strategy, and general IP guidance. This is designed for those who have a good idea but aren't sure whether it's worth pursuing patent protection. It is not a patent search and does not result in any official document — rather, it's a platform for expert advice tailored to your situation. If I'm unable to provide value, you'll receive a full refund.",
    startingPrice: "$125",
    currency: "USD",
    delivery: "14 days",
    icon: "MessageSquare",
    features: [
      "Live video consultation",
      "Patentability assessment",
      "Filing strategy advice",
      "Jurisdiction recommendations",
      "Full refund if unable to provide value",
    ],
    pricing: [
      {
        name: "Standard Consultation",
        price: "$125",
        description: "Expert advice on your invention and IP strategy",
        features: [
          "Live consultation via video call",
          "Patentability assessment",
          "Strategy recommendations",
          "Written summary of key points",
          "Full refund guarantee if no value provided",
        ],
      },
    ],
    whoIsItFor: [
      "Inventors unsure whether their idea is patentable",
      "Startups needing IP strategy guidance",
      "Anyone wanting expert advice before committing to a full filing",
    ],
    faq: [
      {
        question: "What happens during a consultation?",
        answer:
          "We'll discuss your invention in detail, assess its patentability, and I'll provide tailored strategic advice on the best path forward — including which jurisdictions to consider, timing, and budget expectations.",
      },
      {
        question: "Is this the same as a patent search?",
        answer:
          "No. A consultation provides expert strategic advice based on my experience and knowledge. A patent search is a formal investigation of the prior art landscape with a detailed written report. Both are valuable, but serve different purposes.",
      },
    ],
  },
  {
    slug: "patent-search",
    title: "Patent Search (Prior Art / Patentability)",
    shortTitle: "Patent Search",
    description:
      "A thorough investigation of the prior art landscape with a detailed report on your invention's patentability prospects.",
    longDescription:
      "A comprehensive patent search examining existing patents, published applications, and other prior art to assess the patentability of your invention. You'll receive a detailed report identifying the closest prior art, your strongest points of novelty, and an honest assessment of your prospects. This can be ordered standalone or bundled with patent drafting at no additional time.",
    startingPrice: "$335",
    currency: "USD",
    delivery: "21 days",
    icon: "Search",
    features: [
      "Comprehensive prior art investigation",
      "Detailed patentability report",
      "Identification of closest prior art",
      "Assessment of strongest novelty points",
      "Strategic advice on how to proceed",
    ],
    pricing: [
      {
        name: "Basic",
        price: "$335",
        description: "Prior Art Search — published patents relevant to your invention",
        features: [
          "Search of published patents",
          "Detailed patentability report",
          "Key prior art documents identified",
          "Summary and opinion",
          "21-day delivery",
        ],
      },
      {
        name: "Standard",
        price: "$375",
        description: "Expanded Prior Art Search — includes web disclosures & non-patent literature",
        features: [
          "Everything in Basic",
          "Web disclosures and non-patent publications",
          "Broader prior art landscape",
          "Enhanced novelty assessment",
          "21-day delivery",
        ],
        popular: true,
      },
      {
        name: "Premium",
        price: "$485",
        description: "Expanded Search + Strategy Call to discuss the best way forward",
        features: [
          "Everything in Standard",
          "Live strategy call after search",
          "Personalised filing advice",
          "Jurisdiction recommendations",
          "21-day delivery",
        ],
      },
    ],
    whoIsItFor: [
      "Inventors wanting to assess patentability before investing in a full application",
      "Those who need to understand the competitive patent landscape",
      "Anyone wanting data-driven confidence in their filing decision",
    ],
    faq: [
      {
        question: "Should I get a search before drafting?",
        answer:
          "It's highly recommended. A search helps identify the strongest angle for your patent claims and can save significant time and money by flagging issues early. If bundled with drafting, it adds no extra time to the overall timeline.",
      },
      {
        question: "What databases do you search?",
        answer:
          "I search all major patent databases including USPTO, EPO (Espacenet), WIPO (PatentScope), and relevant national databases. The search also covers non-patent literature where relevant.",
      },
    ],
  },
  {
    slug: "patent-drafting",
    title: "Utility Patent Drafting & Filing",
    shortTitle: "Patent Drafting",
    description:
      "Full preparation of patent documents — background, summary, detailed description, claims, abstract, and drawings — ready for filing in any major jurisdiction.",
    longDescription:
      "Complete preparation of a utility patent application including all required elements: background of the invention, summary, detailed description, patent claims, abstract, and coordination of patent drawings. The application is drafted to professional standards, covering both provisional and non-provisional formats, and can be filed in the US, UK, Europe, Canada, Australia, or internationally via PCT. After purchase, you'll receive a questionnaire to provide technical details about your invention.",
    startingPrice: "$995",
    currency: "USD",
    delivery: "45 days",
    icon: "FileText",
    features: [
      "Complete patent application drafting",
      "Professional claims drafting",
      "Detailed description with drawings coordination",
      "Covers provisional & non-provisional",
      "Multi-jurisdiction support (US, UK, EP, PCT, CA, AU)",
      "Filing with patent office included in full packages",
    ],
    pricing: [
      {
        name: "Simple Invention",
        price: "$995",
        description: "Mechanical inventions with few moving parts",
        features: [
          "Background, summary, detailed description",
          "Professional claims (up to 20)",
          "Abstract",
          "45-day delivery",
          "One round of revisions",
        ],
      },
      {
        name: "Mid-Tier Invention",
        price: "$1,195",
        description: "Electrical/electronic systems, moderate complexity",
        features: [
          "Background, summary, detailed description",
          "Professional claims (up to 20)",
          "Abstract",
          "45-day delivery",
          "One round of revisions",
        ],
        popular: true,
      },
      {
        name: "Complex Invention",
        price: "$1,395",
        description: "Software, AI, biochemistry, advanced systems",
        features: [
          "Background, summary, detailed description",
          "Professional claims (up to 20)",
          "Abstract",
          "45-day delivery",
          "One round of revisions",
        ],
      },
    ],
    extras: [
      {
        name: "Patent Search",
        price: "$375",
        note: "21 days standalone, or included within the 45-day drafting timeline if bundled",
      },
      {
        name: "Patent Illustrations (created by Alexander)",
        price: "$350",
        note: "Professional patent drawings prepared to patent office standards",
      },
      {
        name: "Patent Illustrations (client-provided, formatted)",
        price: "$50",
        note: "Your drawings formatted and integrated to meet patent office requirements",
      },
      {
        name: "Patent Filing / Submission",
        price: "$250",
        note: "Filing with the patent office on your behalf (excludes government fees)",
      },
    ],
    whoIsItFor: [
      "Inventors ready to file a patent application",
      "Startups protecting core technology",
      "Anyone with an invention that's been validated through search or consultation",
    ],
    faq: [
      {
        question: "Which complexity tier is right for me?",
        answer:
          "If your invention is purely mechanical with few moving parts, choose Simple. If it involves electronics but no software, choose Mid-Tier. If it involves software, AI, or advanced chemistry/biology, choose Complex. Not sure? Book a consultation and I'll advise.",
      },
      {
        question: "Can you file in my country?",
        answer:
          "I cover all major jurisdictions: US (USPTO), UK (UKIPO), Europe (EPO), Canada (CIPO), Australia (IP Australia), and international PCT applications. For other countries, I can coordinate national phase entry.",
      },
      {
        question: "What about rush delivery?",
        answer:
          "Rush options are available: 30 days (+$200), 21 days (+$400), 14 days (+$700), or 7 days (+100% of base price). You must specify a target date — 'ASAP' is not accepted.",
      },
    ],
  },
  {
    slug: "patent-prosecution",
    title: "Patent Prosecution (Office Action Responses)",
    shortTitle: "Prosecution",
    description:
      "Expert analysis and response to patent office rejections — turning objections into granted patents.",
    longDescription:
      "When a patent examiner raises objections to your application (an 'office action'), you need a strategic, well-argued response. I analyse the examiner's objections, develop a response strategy, and draft formal response documents including claim amendments and legal arguments. This covers all types of rejections including 35 USC \u00a7101, \u00a7102, \u00a7103, \u00a7112 issues, drawing objections, and restriction requirements.",
    startingPrice: "$450",
    currency: "USD",
    delivery: "14 days",
    icon: "Scale",
    features: [
      "Detailed analysis of examiner objections",
      "Strategic response plan",
      "Formal response letter with legal arguments",
      "Claim amendments where needed",
      "Covers all rejection types (\u00a7101, \u00a7102, \u00a7103, \u00a7112)",
      "Final office actions, RCEs, and appeals support",
    ],
    pricing: [
      {
        name: "Part A: Review & Strategy",
        price: "$950\u2013$1,150",
        description: "Analysis of office action + strategic response proposal",
        features: [
          "Detailed review of all objections",
          "Prior art analysis",
          "Proposed response strategy",
          "Claim amendment recommendations",
        ],
      },
      {
        name: "Part B: Formal Response",
        price: "$300\u2013$550",
        description: "Drafting of official response letter for filing",
        features: [
          "Formal response document",
          "Legal arguments",
          "Amended claims (if needed)",
          "Ready for filing",
        ],
      },
    ],
    whoIsItFor: [
      "Patent applicants who have received an office action",
      "Those with existing applications that need expert prosecution",
      "Anyone whose patent has been rejected and needs a strategic response",
    ],
    faq: [
      {
        question: "Why is prosecution split into two parts?",
        answer:
          "Part A (Review & Strategy) lets you understand the situation and approve the approach before committing to the full formal response. This ensures you're comfortable with the strategy and gives you control over the process.",
      },
      {
        question: "What if my patent was previously rejected?",
        answer:
          "I handle all stages of prosecution including responses to final office actions, Requests for Continued Examination (RCEs), after-final amendments, and appeals strategy. Many patents that receive initial rejections go on to be granted with the right response.",
      },
    ],
  },
  {
    slug: "international-filing",
    title: "International Patent Filing (PCT & National Phase)",
    shortTitle: "International Filing",
    description:
      "Strategic international patent protection through PCT applications and national phase entries across all major markets.",
    longDescription:
      "Extend your patent protection globally through the Patent Cooperation Treaty (PCT) route. I handle PCT international applications, strategic advice on ISA/IPEA selection, Chapter II demands, and coordination of national phase entries across multiple jurisdictions. This includes timing advice to maximise your protection windows and cost optimisation across countries.",
    startingPrice: "$600",
    currency: "USD",
    delivery: "21\u201345 days",
    icon: "Globe",
    features: [
      "PCT international application filing",
      "National phase entry coordination",
      "ISA/IPEA selection strategy",
      "Priority date and timing advice",
      "Cost optimisation across jurisdictions",
      "Coverage: US, UK, EP, CA, AU, CN, JP, KR, IN, BR, MX, SG, and more",
    ],
    pricing: [
      {
        name: "PCT Filing",
        price: "$600\u2013$950",
        description: "International patent application via WIPO",
        features: [
          "PCT application preparation",
          "Filing with chosen receiving office",
          "ISA selection advice",
          "Filing receipt provided",
        ],
      },
      {
        name: "National Phase Entry",
        price: "Varies by jurisdiction",
        description: "Entry into specific countries from PCT",
        features: [
          "Application preparation for target country",
          "Local requirements compliance",
          "Coordination with local representatives",
          "Strategic advice on country selection",
        ],
      },
    ],
    whoIsItFor: [
      "Patent holders wanting global protection",
      "Startups targeting international markets",
      "Anyone approaching their PCT deadline (30 months from priority)",
    ],
    faq: [
      {
        question: "What is a PCT application?",
        answer:
          "A PCT (Patent Cooperation Treaty) application gives you 'global patent pending' status without immediately filing in individual countries. Around 30 months from your earliest priority date, you then choose which specific countries to enter. It's a cost-effective way to keep your international options open.",
      },
      {
        question: "Which countries should I file in?",
        answer:
          "This depends on your market, manufacturing locations, and competitors. I provide strategic advice on country selection as part of the service, helping you balance protection with cost.",
      },
    ],
  },
  {
    slug: "ip-valuation",
    title: "IP Valuation & Portfolio Strategy",
    shortTitle: "IP Valuation",
    description:
      "Comprehensive patent portfolio valuations for internal decision-making, investor presentations, and strategic planning.",
    longDescription:
      "Detailed analysis and valuation of your patent portfolio, available in three tiers depending on your needs. Reports cover market conditions, competitor IP analysis, strategic prioritisation, and individual patent valuations. Investor-facing versions with positive positioning can be prepared separately.",
    startingPrice: "$2,250",
    currency: "USD",
    delivery: "25\u201335 days",
    icon: "TrendingUp",
    features: [
      "Portfolio valuation reports",
      "Competitor IP analysis",
      "Strategic prioritisation advice",
      "Individual patent valuations (Full tier)",
      "Investor-facing versions available",
      "Gap analysis and future filing recommendations",
    ],
    pricing: [
      {
        name: "Basic",
        price: "$2,250",
        description: "Holistic ecosystem valuation, 25-day delivery",
        features: [
          "Overall portfolio value range",
          "General market conditions analysis",
          "Holistic ecosystem valuation",
        ],
      },
      {
        name: "Mid-Tier",
        price: "$3,500",
        description: "Adds competitor analysis, 30-day delivery",
        features: [
          "Everything in Basic",
          "Detailed competitor IP analysis",
          "Strategic prioritisation advice",
        ],
        popular: true,
      },
      {
        name: "Full",
        price: "$4,750",
        description: "Individual patent valuations, 35-day delivery",
        features: [
          "Everything in Mid-Tier",
          "Individual valuations per patent",
          "Specific leverage strategies",
          "Portfolio-level assessment",
        ],
      },
    ],
    whoIsItFor: [
      "Startups seeking investment and needing IP valuation for due diligence",
      "Companies making strategic decisions about their patent portfolio",
      "Anyone needing a professional assessment of their IP assets",
    ],
    faq: [
      {
        question: "Which tier do I need?",
        answer:
          "Basic is ideal for a general understanding of your portfolio's value. Mid-Tier adds competitive context and strategic advice. Full provides granular, per-patent valuations — best for investor presentations or M&A due diligence.",
      },
      {
        question: "Can you prepare an investor-facing version?",
        answer:
          "Yes. Investor-facing reports are prepared with appropriate positive positioning while remaining factually accurate. These can be prepared as a separate deliverable.",
      },
    ],
  },
];

export const rushSurcharges = [
  { days: 30, surcharge: "+$200" },
  { days: 21, surcharge: "+$400" },
  { days: 14, surcharge: "+$700" },
  { days: 7, surcharge: "+100% of base price" },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
