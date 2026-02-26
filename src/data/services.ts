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
      "Expert advice on patentability, filing strategy, and IP protection — whether you're exploring an initial idea or need guidance on more advanced matters like multi-jurisdiction strategy.",
    longDescription:
      "A paid consultation covering patentability assessments, filing strategy, portfolio planning, and general IP guidance. Whether you're at the early stages wondering if your idea is worth protecting, or you need advice on more advanced matters like filing strategy across multiple jurisdictions, prosecution approach, or portfolio prioritisation — this is the place to start. It is not a patent search and does not result in any official document — rather, it's a platform for expert advice tailored to your situation. If we're unable to provide value, you'll receive a full refund.",
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
          "We'll discuss your invention in detail, assess its patentability, and provide tailored strategic advice on the best path forward — including which jurisdictions to consider, timing, and budget expectations.",
      },
      {
        question: "Is this the same as a patent search?",
        answer:
          "No. A consultation provides expert strategic advice based on deep industry experience and knowledge. A patent search is a formal investigation of the prior art landscape with a detailed written report. Both are valuable, but serve different purposes.",
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
          "We search all major patent databases including USPTO, EPO (Espacenet), WIPO (PatentScope), and relevant national databases. The search also covers non-patent literature where relevant.",
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
        name: "Patent Illustrations (created by Alexander IP)",
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
          "If your invention is purely mechanical with few moving parts, choose Simple. If it involves electronics but no software, choose Mid-Tier. If it involves software, AI, or advanced chemistry/biology, choose Complex. Not sure? Book a consultation and we'll advise.",
      },
      {
        question: "Can you file in my country?",
        answer:
          "We cover all major jurisdictions: US (USPTO), UK (UKIPO), Europe (EPO), Canada (CIPO), Australia (IP Australia), and international PCT applications. For other countries, we can coordinate national phase entry.",
      },
      {
        question: "What about rush delivery?",
        answer:
          "Rush options are available at 30, 21, 14, or 7-day timelines with increasing surcharges. The 7-day option is +100% of the base price. See the rush delivery table on this page for exact pricing. You must specify a target date — 'ASAP' is not accepted.",
      },
    ],
  },
  {
    slug: "patent-prosecution",
    title: "Patent Prosecution (Office Actions & Amendments)",
    shortTitle: "Prosecution",
    description:
      "Strategic handling of patent office correspondence — from examiner objections and amendments to restriction requirements and appeals.",
    longDescription:
      "Patent prosecution covers everything that happens between filing your application and getting it granted. This includes responding to examiner objections (office actions), amending claims, arguing patentability, handling restriction requirements, and navigating procedural issues. Every case is different, so prosecution is quoted on a case-by-case basis after reviewing your specific situation. Get in touch with your office action or application details and we'll provide a tailored quote.",
    startingPrice: "Quote",
    currency: "USD",
    delivery: "14\u201321 days",
    icon: "Scale",
    features: [
      "Detailed analysis of examiner correspondence",
      "Strategic response planning",
      "Formal response letters with legal arguments",
      "Claim amendments and restructuring",
      "Restriction requirements and election responses",
      "Final office actions, RCEs, and appeals support",
    ],
    pricing: [
      {
        name: "Prosecution Response",
        price: "Quoted per case",
        description: "Tailored to the complexity of your specific office action",
        features: [
          "Review and analysis of all objections",
          "Strategic response plan",
          "Formal response document with arguments",
          "Claim amendments where needed",
          "Ready for filing",
        ],
      },
    ],
    whoIsItFor: [
      "Patent applicants who have received correspondence from a patent office",
      "Those with existing applications that need expert prosecution",
      "Anyone whose patent application needs strategic amendments or responses",
    ],
    faq: [
      {
        question: "Why is prosecution quoted per case?",
        answer:
          "Prosecution work varies enormously depending on the type and number of objections, the technical complexity, and the prosecution history. A simple formality response is very different from a complex \u00a7103 obviousness argument. Quoting per case ensures you only pay for what your specific situation requires.",
      },
      {
        question: "What if my patent was previously rejected?",
        answer:
          "We handle all stages of prosecution including responses to final office actions, Requests for Continued Examination (RCEs), after-final amendments, and appeals strategy. Many patents that receive initial rejections go on to be granted with the right response.",
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
      "Extend your patent protection globally through the Patent Cooperation Treaty (PCT) route. We handle PCT international applications, strategic advice on ISA/IPEA selection, Chapter II demands, and coordination of national phase entries across multiple jurisdictions. This includes timing advice to maximise your protection windows and cost optimisation across countries.",
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
          "This depends on your market, manufacturing locations, and competitors. We provide strategic advice on country selection as part of the service, helping you balance protection with cost.",
      },
    ],
  },
  {
    slug: "fto",
    title: "Freedom to Operate (FTO) / Infringement Check",
    shortTitle: "FTO / Infringement",
    description:
      "Honest, understandable strategic advice on the risks of selling and manufacturing your product — backed by in-depth patent research and analysis.",
    longDescription:
      "Checking whether your product is at risk of infringing someone\u2019s patent is an unavoidably complex job. It involves extensive research, analysis, and in-depth patent law considerations. Even when the work is done properly, the answers are often given in legalese. This service is designed to give you honest, easily understandable strategic advice on your infringement risks. It involves an in-depth search for patents active in specific countries or regions where you might commercialise, detailed analysis of claim scope, and concrete advice on whether you infringe and how to avoid doing so.",
    startingPrice: "$600",
    currency: "USD",
    delivery: "30\u201345 days",
    icon: "ShieldCheck",
    features: [
      "In-depth patent landscape search",
      "Identification of high-risk active patents",
      "Detailed claims analysis (Standard & Premium)",
      "Concrete infringement risk assessment",
      "Design-around recommendations",
      "60-minute live consultation",
      "Written strategy report",
    ],
    pricing: [
      {
        name: "Patent Landscape",
        price: "$600",
        description: "Research and report identifying high-risk active patents and summarising the field",
        features: [
          "Patent landscape search in target jurisdictions",
          "High-risk patent identification",
          "Field summary report",
          "60-minute live consultation",
          "Strategy report",
          "30-day delivery",
        ],
      },
      {
        name: "Simple Invention FTO",
        price: "$1,600",
        description: "Full FTO search and report with detailed claims analysis — for straightforward products",
        features: [
          "Everything in Patent Landscape",
          "Detailed claim-by-claim analysis",
          "Infringement risk assessment",
          "Design-around recommendations",
          "Concrete strategic advice",
          "45-day delivery",
        ],
        popular: true,
      },
      {
        name: "Complex Invention FTO",
        price: "$2,500",
        description: "Full FTO search and report with detailed claims analysis — for complex products",
        features: [
          "Everything in Simple Invention FTO",
          "Broader claim scope analysis",
          "Multiple technology areas covered",
          "Advanced design-around strategies",
          "45-day delivery",
        ],
      },
    ],
    whoIsItFor: [
      "Companies preparing to launch a new product and needing to assess infringement risk",
      "Startups entering a competitive market with existing patent holders",
      "Manufacturers wanting clarity on freedom to operate before investing in production",
      "Anyone who has received a cease-and-desist or needs to understand their position",
    ],
    faq: [
      {
        question: "What\u2019s the difference between a patent search and an FTO?",
        answer:
          "A patent search assesses whether your invention is novel enough to patent. An FTO analysis assesses whether your product risks infringing someone else\u2019s existing patents. They answer different questions \u2014 one about your right to patent, the other about your right to sell.",
      },
      {
        question: "When should I get an FTO?",
        answer:
          "Ideally before you invest heavily in manufacturing, tooling, or market launch. An FTO early in the process can save significant costs by identifying risks before they become expensive problems.",
      },
      {
        question: "Which tier do I need?",
        answer:
          "The Patent Landscape package is ideal if you want a high-level understanding of the risk environment before committing to a full analysis. The Simple Invention FTO is right for most products \u2014 mechanical devices, consumer electronics, etc. The Complex Invention FTO is for products involving multiple technology areas, software-hardware integration, or particularly crowded patent landscapes.",
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
