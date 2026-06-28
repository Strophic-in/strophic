export interface Value {
  title: string;
  body: string;
  icon: string;
}

export const values: Value[] = [
  {
    icon: "check",
    title: "Ship the truth",
    body: "We'd rather show you a working slice than a polished promise. Reality beats roadmaps.",
  },
  {
    icon: "gauge",
    title: "Measure everything",
    body: "If it matters, it gets a number - quality, latency, cost. Opinions are cheap; evidence isn't.",
  },
  {
    icon: "shield",
    title: "Earn the trust",
    body: "Your data, your code, your call. We build like we'll be maintaining it for years - because we might.",
  },
  {
    icon: "sparkles",
    title: "Stay curious",
    body: "The tools change monthly. We keep learning so you don't have to chase every new model yourself.",
  },
];
