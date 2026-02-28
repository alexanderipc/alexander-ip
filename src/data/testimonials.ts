export interface Testimonial {
  quote: string;
  attribution: string;
  service: string;
  highlight?: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "His depth of patent knowledge is incredible, and his meticulous attention to detail is fantastic. This is the sixth patent he's drafted for me, and I continue to learn from his insightful feedback every time.",
    attribution: "Repeat Client",
    service: "Patent Drafting",
    highlight: "sixth patent",
  },
  {
    quote:
      "The understanding Alex has of the space as an IP attorney is clearly differentiating.",
    attribution: "Startup Founder",
    service: "Consultation",
    highlight: "clearly differentiating",
  },
  {
    quote:
      "Alexander was excellent to work with and was very professional. I also liked that he is very smart and that he can quickly and deeply understand your business and evaluate it.",
    attribution: "Business Owner",
    service: "Patent Search",
    highlight: "quickly and deeply understand",
  },
  {
    quote:
      "Great experience working with Alexander on a patent landscape project. The work was thorough, well-structured, and delivered on time. Communication was clear, and the final output was easy to interpret and genuinely useful.",
    attribution: "Technology Company",
    service: "Patent Search",
    highlight: "genuinely useful",
  },
  {
    quote:
      "Extremely professional and exacting, doing what he said he was going to do on time and taking care of the entire process.",
    attribution: "Individual Inventor",
    service: "Patent Drafting",
    highlight: "entire process",
  },
  {
    quote:
      "Very professional and highly recommended. Well organized and experienced in patent search and filing.",
    attribution: "Recent Client",
    service: "Patent Filing",
    highlight: "highly recommended",
  },
  {
    quote:
      "The quality of his analysis is better than most people I know in the profession.",
    attribution: "Practising US Attorney",
    service: "Office Correspondence",
    highlight: "better than most",
  },
];
