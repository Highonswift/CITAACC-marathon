// ---- Event-wide constants & option lists (single source of truth for the UI) ----

export const EVENT = {
  name: "CITAACC Chennai Chapter – 5K Walk/Jog 2026",
  shortName: "CITAACC 5K 2026",
  tagline: "Celebrating Alumni Connections Through Wellness",
  date: "09 August 2026",
  dateISO: "2026-08-09T05:30:00+05:30",
  organizer: "Coimbatore Institute of Technology Alumni Association – Chennai Chapter",
  eventHeads: [
    { name: "Sampath", role: "Event Head" },
    { name: "Ragul", role: "Event Head" },
  ],
};

export const PRICING = {
  ADULT: 500,
  KID: 200,
} as const;

export const DEPARTMENTS = [
  "CSE",
  "ECE",
  "EEE",
  "Mechanical",
  "Civil",
  "IT",
  "Chemical",
  "Production",
  "MCA",
  "MBA",
  "Other",
] as const;

export const CHENNAI_ZONES = [
  "North Chennai",
  "South Chennai",
  "Central Chennai",
  "East Chennai",
  "West Chennai",
  "OMR / ECR",
  "Tambaram Region",
  "Chengalpattu Region",
  "Outside Chennai",
] as const;

export const ADULT_TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

// Kid sizes: age-based labels plus Adult XS, per PRD.
export const KID_TSHIRT_SIZES = [
  "2-3 Yrs",
  "4-5 Yrs",
  "6-7 Yrs",
  "8-9 Yrs",
  "10-11 Yrs",
  "12-13 Yrs",
  "Adult XS",
] as const;

export const MEMBERSHIP_OPTIONS = [
  { value: "LIFETIME_MEMBER", label: "Yes — CITAACC Life Time Member" },
  { value: "FAMILY_OR_SPOUSE", label: "CIT Alumni" },
] as const;

export const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export const REGISTRATION_BENEFITS = [
  { title: "Event T-Shirt", icon: "shirt" },
  { title: "Bib Number", icon: "hash" },
  { title: "Breakfast", icon: "coffee" },
  { title: "Participation Medal", icon: "medal" },
  { title: "Hydration Support", icon: "droplet" },
  { title: "Photography Coverage", icon: "camera" },
];

export const ACTIVITIES = [
  { title: "5K Walk/Jog", desc: "The flagship 5 kilometre route through the city." },
  { title: "Family Walk", desc: "A relaxed walk for families and children." },
  { title: "Warm-Up Session", desc: "Group warm-up led by fitness trainers." },
  { title: "Networking Session", desc: "Reconnect with fellow CIT alumni." },
  { title: "Kids Zone", desc: "Games and fun activities for children." },
  { title: "Photo Booth", desc: "Capture memories with friends and family." },
];

export const FAQS = [
  {
    q: "Who can participate in the 5K Walk/Jog?",
    a: "CIT alumni, their spouses, and family members including children are all welcome.",
  },
  {
    q: "How much does registration cost?",
    a: "₹500 per adult and ₹200 per kid. You can register multiple participants under one registration.",
  },
  {
    q: "What do I get with my registration?",
    a: "An event T-shirt, bib number, breakfast, participation medal, hydration support, and photography coverage.",
  },
  {
    q: "How do I check in on event day?",
    a: "Each participant receives a unique QR code on their digital event pass. Volunteers scan it at the venue for check-in and T-shirt collection.",
  },
  {
    q: "Can I register my whole family at once?",
    a: "Yes. Add as many participants as you like under a single registration and pay together.",
  },
  {
    q: "Is the registration fee refundable?",
    a: "Registration fees are non-refundable, but your pass is transferable within your family.",
  },
];
