export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const faqItems: FAQItem[] = [
  {
    question: "Is my idea patentable?",
    answer:
      "There are two basic requirements. First, your invention needs to be a technical solution to a problem — not just an abstract idea, but something concrete and definable. Second, it has to be new and non-obvious compared to everything that's already out there in the public domain. The best way to find out where you stand is a patent search. I'll look at what already exists and give you an honest assessment — if it's not patentable, I'll tell you that directly rather than letting you spend money on a filing that's going to hit a wall.",
    category: "Patentability",
  },
  {
    question: "Do I need to file before disclosing my invention?",
    answer:
      "This is one of the most important rules in patents, and people get caught out by it constantly. In most countries, if your invention is publicly known before you file, you can't patent it — full stop. That means no blog posts, no product launches, no demo videos, no conversations without an NDA. File first, disclose second. If you absolutely need to share details with an investor or a potential partner before filing, get a non-disclosure agreement in place. It's a simple precaution that protects everything downstream.",
    category: "Patentability",
  },
  {
    question: "How do patent claims work?",
    answer:
      "This is the part most people find confusing, but it's actually the most important part of a patent. Think of it this way: if you invented a chair, your patent claim might define it as 'a seat supported by four legs.' That claim draws the legal boundary around your invention. Now, if a competitor makes a seat supported by three legs, they don't infringe your patent — because your claim specified four. That's why claim drafting is so critical. Write them too narrowly and competitors design around you easily. Write them too broadly and the patent office rejects them because they cover things that already exist. The skill is in finding the right boundary — broad enough to be commercially valuable, specific enough to actually get granted.",
    category: "Process",
  },
  {
    question:
      "What's the difference between a provisional and non-provisional patent?",
    answer:
      "Provisional patents are one of the most commonly misunderstood mechanisms in the patent world. Here's what a provisional actually is: it's holding your place in line. You file it, you get a priority date and 'patent pending' status, and you have 12 months to file the real thing — the non-provisional application. The provisional itself doesn't get examined. It doesn't become a patent on its own. It just locks in your date so that if someone else files something similar after you, you were first. The non-provisional is the full application that actually goes through examination. If you don't file it within those 12 months, your provisional simply expires and you lose that priority date.",
    category: "Process",
  },
  {
    question: "What is a PCT application?",
    answer:
      "A PCT application is essentially holding your place in line internationally. Patents are territorial — a US patent only protects you in the US, a UK patent only in the UK — so if you want protection in multiple countries, you'd normally have to file in each one separately, each with its own fees and deadlines. A PCT application gives you a single filing that buys you time. Instead of having to file in every country immediately, you get 30 months from your earliest priority date to decide which specific countries you actually want to enter. That's 30 months to test the market, raise funding, or figure out where your product is actually selling before you commit to the cost of individual national filings. It's not a 'global patent' — that doesn't exist — but it's a very practical way to keep your international options open without spending a fortune upfront.",
    category: "Process",
  },
  {
    question: "How long does it take to get a patent?",
    answer:
      "From filing to grant, you're typically looking at 2 to 4 years depending on the country and the complexity of the technology. In the US, it tends to be around 2 to 3 years. Europe can stretch to 3 to 5 years. On my end, the drafting and filing stage takes around 4 to 6 weeks from the point where I have everything I need from you. The longer timeline is the examination process at the patent office — there's back and forth with the examiner, which is normal and expected.",
    category: "Process",
  },
  {
    question: "How much does a patent cost?",
    answer:
      "My drafting fees are tiered by complexity — straightforward mechanical inventions at the lowest tier, mid-complexity for electronics, and the highest tier for software, AI, or advanced systems. Full package pricing (search + drafting + drawings + filing) is also available. Government filing fees are separate and paid by you directly to the patent office. You can see exact pricing on my services pages — everything is transparent and published upfront, because I think the patent industry has a pricing transparency problem. You should know what you're paying before you commit.",
    category: "Pricing",
  },
  {
    question: "Why are your prices so much lower than traditional patent firms?",
    answer:
      "Because traditional firms have enormous overheads that get passed on to you. Large offices, support staff, partnership structures, junior associates doing the actual work while partners bill for supervising it. I trained at Kilburn & Strode — a top-tier Legal 500 firm — so the quality of training and experience is the same calibre you'd get at those firms. The difference is I've stripped out all the overhead. I do the work personally, I operate a lean practice, and I don't have a partnership structure taking a cut. You're paying for the expertise, not the office furniture.",
    category: "Pricing",
  },
  {
    question: "Utility vs design patents — what's the difference?",
    answer:
      "A utility patent protects how something works — the function, the mechanism, the technical solution. A design patent protects how something looks — the ornamental appearance. Think of it this way: if you've invented a new type of bottle opener with a clever mechanism, that's utility. If you've designed a bottle opener that looks distinctive but works the same as any other, that's design. They protect fundamentally different things. Most of the time when people say 'I want to patent my invention,' they're talking about utility patents. Design patents have their place, particularly for consumer products where the visual design itself has commercial value, but they won't stop a competitor who copies your function with a different appearance.",
    category: "Process",
  },
  {
    question: "Do I need a patent search before filing?",
    answer:
      "You don't strictly need one — you can file without it — but I'd strongly recommend it. A patent search tells you what already exists in your space before you invest in drafting and filing. It might reveal that your exact idea has been done before, which saves you a few thousand dollars and a lot of time. Or it might show that while similar things exist, your specific approach is novel — and that information helps me draft stronger claims because I know exactly what to distinguish your invention from. Skipping the search is a bit like buying a house without a survey. You might be fine, but if there's a problem, you'll wish you'd spent the money upfront.",
    category: "Patentability",
  },
  {
    question: "What happens if my patent is rejected?",
    answer:
      "First, don't panic. Getting an office action — what most people call a 'rejection' — is a completely normal part of the process. Think of it as the patent office's opening comments in a debate about patentability. It's the start of a dialogue, not a verdict. The examiner raises objections, and then we respond with arguments, evidence, and sometimes amendments to the claims. I'll analyse exactly what the examiner has said, explain it to you in plain English, and put together a strategic response. Many patents that receive initial rejections go on to be granted. The key is knowing how to navigate that conversation effectively.",
    category: "Process",
  },
  {
    question: "Can I use AI to write my patent?",
    answer:
      "You can try, but I'd be cautious. I've seen a lot of AI-generated patent drafts at this point, and the honest truth is that editing them into something usable is often more work than starting from scratch. The problem isn't that the language sounds robotic — it's that patent claims require very precise legal and technical drafting to actually protect you. AI tools tend to produce claims that read well on the surface but are either so broad they'll be rejected or so vague they won't stop anyone from copying you. A patent that 'grants' but doesn't actually protect your invention is worse than no patent at all — because you've spent the money and time thinking you're protected when you're not.",
    category: "Process",
  },
  {
    question: "Why aren't you a registered patent attorney?",
    answer:
      "I have the full training and track record of a qualified patent attorney. I trained at Kilburn & Strode LLP — a top-tier Legal 500 firm — and passed the pre-qualification exams. The 2020 exam cancellations due to COVID and a subsequent move into independent practice meant formal qualification wasn't completed. In practical terms, this hasn't been an obstacle. Over a decade in the industry, I've taken patents from drafting through to grant across the US, UK, and Europe, working across 140+ jurisdictions via PCT. The work speaks for itself, and I'm always happy to walk through my track record with anyone who wants to understand my background.",
    category: "About",
  },
  {
    question: "How do payments work?",
    answer:
      "Simple. For direct clients, it's 50% upfront to begin work and 50% on delivery. You can pay via Stripe (card) or bank transfer — whichever is easier for you. Government filing fees are always paid by you directly to the patent office. I'll walk you through exactly how to do that; it's straightforward.",
    category: "Pricing",
  },
  {
    question: "Do you offer NDAs?",
    answer:
      "Yes. Once an engagement is confirmed, I'll provide an NDA before you share any confidential details about your invention. I take this seriously — your idea is your most valuable asset at this stage, and it should be protected from the very first conversation where specifics are discussed.",
    category: "About",
  },
  {
    question: "I found you on Fiverr — can I work with you directly?",
    answer:
      "Absolutely, and many of my clients do exactly that. The work is identical — same person, same process, same quality. The benefit of working directly is there's no platform commission, which means potential savings for you, plus more flexible communication and a direct professional relationship. If you started on Fiverr and want to transition, just get in touch.",
    category: "About",
  },
  {
    question: "What technology areas do you cover?",
    answer:
      "Almost everything technical: software, AI and machine learning, communications, medical devices, consumer products, mechanical inventions, IoT, energy systems, security technology, and more. I've worked across a very wide range of subject matter over the years. The only area I generally don't handle is deep biotech or biological inventions — that's a specialist field with its own particular requirements.",
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
