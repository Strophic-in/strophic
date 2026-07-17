export interface Project {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  year: string;
  /** Two hex stops for the generated cover gradient (used when no cover image is set). */
  accent: [string, string];
  results: string[];
  featured: boolean;
  /** Small square logo shown next to the project title. */
  logoImage?: string | null;
  /** Live project URL - the project title links here when set. */
  url?: string | null;
}

// No placeholder case studies: real work comes from the admin CMS. An empty list
// makes the site show an honest "will be updated soon" note instead of fake projects.
export const projects: Project[] = [];

export const featuredProjects = projects.filter((p) => p.featured);
export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
