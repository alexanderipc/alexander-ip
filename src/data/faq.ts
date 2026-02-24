export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const faqItems: FAQItem[] = [
  {
    question: "Is my idea patentable?",
    answer:
      "To be patentable, your invention must be (a) a technical solution to a problem, and (b) definable in a self-contained manner. It must also be novel (new) and non-obvious compared to everything that's already publicly known. A patent search is the best way to assess this with confidence.",
    category: "Patentability",
  },
  {
    question: "Do I need to file before disclosing my invention?",
    answer:
      "Yes. Public disclosure before filing can destroy your ability to get a patent in most jurisdictions. Always file first, then disclose. If you need to share details with potential partners or investors beforehand, use a non-disclosure agreement (NDA).",
    category: "Patentability",
  },
  {
    question:
      "What's the difference between a provisional and non-provisional patent?",
    answer:
      "A provisional application is a lower-cost placeholder that gives you 12 months of 'patent pending' status and establishes your priority date. A non-provisional is the full application that actually gets examined by the patent office. You must file a non-provisional within 12 months of the provisional to maintain your priority date.",
    category: "Process",
  },
  {
    question: "What is a PCT application?",
    answer:
      "A PCT (Patent Cooperation Treaty) application is a mechanism for extending your patent protection internationally. It gives you 'global patent pending' status without having to file in individual countries immediately. Around 30 months from your earliest priority date, you then choose which specific countries to enter and pay for.",
    category: "Process",
  },
  {
    question: "How long does it take to get a patent?",
    answer:
      "Typically 2\u20134 years from filing to grant, depending on the jurisdiction and complexity. The US tends to be 2\u20133 years; Europe can be 3\u20135 years. The drafting and filing stage itself takes 45 days (standard) from when I have all the information needed.",
    category: "Process",
  },
  {
    question: "How much does a patent cost?",
    answer:
      "My patent drafting services start from $995 for simple inventions, $1,195 for mid-tier, and $1,395 for complex inventions. These are my professional fees only \u2014 government filing fees are paid separately by you directly to the patent office (e.g., ~$400 for USPTO micro entity, ~\u00a3325 for UKIPO). Full package pricing including search, drawings, and filing ranges from $1,970 to $2,370.",
    category: "Pricing",
  },
  {
    question: "Why are your prices so much lower than traditional patent firms?",
    answer:
      "Traditional patent firms carry massive overheads: large offices, support staff, partnership structures, and junior associates who do the work while partners bill for it. I operate as a lean, solo practice with the same calibre of training and experience (Kilburn & Strode, Legal 500), delivering the work personally without the overhead markup.",
    category: "Pricing",
  },
  {
    question: "Why aren't you a registered patent attorney?",
    answer:
      "I have the full training and track record of a qualified patent attorney, having trained at Kilburn & Strode LLP (a top-tier Legal 500 firm) and passed the pre-qualification exams. The 2020 exam cancellations due to COVID and a subsequent career pivot into independent practice meant formal qualification was not completed. This has not been a practical obstacle \u2014 I have secured hundreds of patents to grant across multiple jurisdictions over 5+ years of independent practice.",
    category: "About",
  },
  {
    question: "Can I use AI to write my patent?",
    answer:
      "You can, but editing AI-generated patent drafts is often more work than starting from scratch. Patent claims require precise legal language and strategic drafting that AI tools currently struggle with. Poorly drafted claims can result in patents that technically 'grant' but don't actually protect your invention in any meaningful way.",
    category: "Process",
  },
  {
    question: "What happens if my patent is rejected?",
    answer:
      "Receiving an office action (rejection) is a normal part of the patent process \u2014 it doesn't mean your application has failed. It's the beginning of a dialogue with the patent examiner. I analyse the objections, develop a strategic response, and draft formal arguments and claim amendments to overcome them. Many patents that receive initial rejections go on to be granted.",
    category: "Process",
  },
  {
    question: "How do payments work?",
    answer:
      "For direct clients, payment is typically structured as 50% to begin work and 50% on delivery. Payment can be made via Stripe (card payment) or bank transfer. Government filing fees are always paid by you directly to the relevant patent office \u2014 I'll guide you through this process.",
    category: "Pricing",
  },
  {
    question: "Do you offer NDAs?",
    answer:
      "Yes. NDAs are provided after an engagement has been purchased, before you submit any confidential information about your invention. This protects both parties and ensures a professional working relationship from the outset.",
    category: "About",
  },
  {
    question: "I found you on Fiverr \u2014 can I work with you directly?",
    answer:
      "Absolutely. Many of my clients start on Fiverr and then transition to working directly. The benefits include no platform commission (which means potential savings for you), more flexible communication, and a direct professional relationship. The quality of work is identical \u2014 it's the same person doing the same work.",
    category: "About",
  },
  {
    question: "What technology areas do you cover?",
    answer:
      "I cover virtually any technical subject matter including software, AI/ML, communications, medical devices, consumer products, mechanical inventions, IoT, energy systems, security technology, and more. The only area I generally don't handle is in-depth biological or biotech applications.",
    category: "About",
  },
];

export const faqCategories = [
  "All",
  "Patentability",
  "Process",
  "Pricing",
  "About",
];
