/**
 * Registry of the homepage's editable sections.
 *
 * The public homepage renders a fixed set of blocks. Each block can be
 * customized from the admin (Homepage CMS) by a record whose `key` is one of
 * the keys below. A record can:
 *   - hide the block       → `enabled: false`
 *   - override its heading  → `title` / `subtitle`
 *   - pass block options    → `config` (documented per key)
 *
 * This registry is the single source of truth shared by the admin (key dropdown
 * + config help) and the website (rendering), so the two never drift. When no
 * record exists for a key, the website renders that block with its built-in
 * defaults.
 */

/** A documented `config` property for a section. */
export interface HomepageConfigField {
  /** Property name inside the Config (JSON) object. */
  name: string;
  /** What this property controls. */
  description: string;
}

export interface HomepageSectionDef {
  /** Stable key stored on the record (and looked up by the website). */
  key: string;
  /** Human-readable name for the admin dropdown. */
  label: string;
  /** What the block is and what editing it does. */
  description: string;
  /** What the record's `title` overrides (omit if the block has no title). */
  title?: string;
  /** What the record's `subtitle` overrides (omit if not applicable). */
  subtitle?: string;
  /** Documented `config` keys (empty = this block takes no config options). */
  config: HomepageConfigField[];
  /** Ready-to-paste sample for the Config (JSON) field. */
  sampleConfig: Record<string, unknown>;
}

const eyebrow: HomepageConfigField = {
  name: "eyebrow",
  description: 'Small label shown above the title (e.g. "What we do").',
};

export const HOMEPAGE_SECTIONS: HomepageSectionDef[] = [
  {
    key: "hero",
    label: "Hero (top banner)",
    description:
      "The first screen visitors see. Title overrides the big headline; Subtitle overrides the line beneath it.",
    title: "Main headline (plain text - the styled default is used when left blank)",
    subtitle: "Supporting line under the headline",
    config: [{ name: "badge", description: 'The small pill above the headline (e.g. "Available for new projects").' }],
    sampleConfig: { badge: "Available for new projects" },
  },
  {
    key: "services",
    label: "Services grid",
    description:
      "The grid of services (cards come from the Services CMS). This controls the heading; disable to hide the whole block.",
    title: "Section title",
    subtitle: "Intro paragraph under the title",
    config: [eyebrow],
    sampleConfig: { eyebrow: "What we do" },
  },
  {
    key: "why-us",
    label: '"Why Strophic" block',
    description: "The four differentiators block. Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "Why Strophic" },
  },
  {
    key: "industries",
    label: "Industries block",
    description: "The 'who we help' industries grid. Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "Who we help" },
  },
  {
    key: "process",
    label: "Process block",
    description: "The 'how we work' four-step process. Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "How we work" },
  },
  {
    key: "featured-work",
    label: "Featured work",
    description:
      "The selected case studies grid (uses Projects marked Featured). Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "Selected work" },
  },
  {
    key: "featured-products",
    label: "Featured products",
    description:
      "The Micro-SaaS products grid (uses Products marked Featured). Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "Our products" },
  },
  {
    key: "testimonials",
    label: "Testimonials",
    description: "The testimonials grid (uses Testimonials marked Featured). Controls its heading; disable to hide it.",
    title: "Section title",
    subtitle: "Intro paragraph",
    config: [eyebrow],
    sampleConfig: { eyebrow: "In their words" },
  },
  {
    key: "newsletter",
    label: "Newsletter block",
    description: "The newsletter signup band. Title/Subtitle set the heading and copy; disable to hide it.",
    title: "Heading",
    subtitle: "Supporting copy",
    config: [{ name: "badge", description: 'The small pill label (e.g. "Newsletter").' }],
    sampleConfig: { badge: "Newsletter" },
  },
  {
    key: "cta",
    label: "Call to action (bottom)",
    description: "The closing call-to-action band. Title/Subtitle set the heading; config sets the buttons.",
    title: "CTA heading",
    subtitle: "CTA supporting text",
    config: [
      { name: "primaryLabel", description: "Primary button text." },
      { name: "primaryHref", description: "Primary button link (e.g. /contact)." },
      { name: "secondaryLabel", description: "Secondary button text." },
      { name: "secondaryHref", description: "Secondary button link (e.g. /work)." },
    ],
    sampleConfig: {
      primaryLabel: "Start a project",
      primaryHref: "/contact",
      secondaryLabel: "See our work",
      secondaryHref: "/work",
    },
  },
];

/** All valid section keys, in display order. */
export const HOMEPAGE_SECTION_KEYS = HOMEPAGE_SECTIONS.map((s) => s.key);

/** Look up a section definition by key. */
export function getHomepageSectionDef(key: string): HomepageSectionDef | undefined {
  return HOMEPAGE_SECTIONS.find((s) => s.key === key);
}
