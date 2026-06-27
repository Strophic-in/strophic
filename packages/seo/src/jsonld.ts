/**
 * Schema.org JSON-LD builders. Each returns a plain object that the website
 * serializes into a <script type="application/ld+json"> tag. Helps both classic
 * SEO and generative engines (GEO) understand the entities on a page.
 */
type JsonLd = Record<string, unknown>;

export function organizationSchema(input: {
  name: string;
  url: string;
  logo: string;
  description?: string;
  sameAs?: string[];
  email?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    logo: input.logo,
    ...(input.description ? { description: input.description } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}

export function websiteSchema(input: { name: string; url: string }): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: input.url,
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleSchema(input: {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  publisherName: string;
  publisherLogo: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: input.url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    ...(input.authorName ? { author: { "@type": "Person", name: input.authorName } } : {}),
    publisher: {
      "@type": "Organization",
      name: input.publisherName,
      logo: { "@type": "ImageObject", url: input.publisherLogo },
    },
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  url: string;
  providerName: string;
  providerUrl: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: input.url,
    provider: { "@type": "Organization", name: input.providerName, url: input.providerUrl },
  };
}

export function softwareAppSchema(input: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.applicationCategory ?? "BusinessApplication",
    operatingSystem: "Web",
  };
}

export function faqSchema(items: { question: string; answer: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function personSchema(input: {
  name: string;
  url: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  sameAs?: string[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url,
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}
