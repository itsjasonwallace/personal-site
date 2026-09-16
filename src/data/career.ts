// Single source for career history. Role titles, companies, and years follow
// the section 4 headers in the resume master; everything on the site that
// states tenure derives from this list so the figures cannot drift apart.

export type Chapter = {
  role: string;
  company: string;
  start: number;
  end: number | null; // null = present
};

export const chapters: Chapter[] = [
  {
    role: "Senior Engineering Manager & Architect",
    company: "Charles Schwab",
    start: 2019,
    end: null,
  },
  {
    role: "Associate Director of Development",
    company: "Galliard Capital Management",
    start: 2014,
    end: 2019,
  },
  {
    role: "Solution Architect",
    company: "Wells Fargo",
    start: 2010,
    end: 2014,
  },
  {
    role: "Technical Director & Co-founder",
    company: "Skyline Document Services",
    start: 2006,
    end: 2010,
  },
  {
    role: "Lead Software Engineer",
    company: "Lighthouse Document Technologies",
    start: 2003,
    end: 2006,
  },
];

export const careerStartYear = Math.min(...chapters.map((c) => c.start));

// Computed at build time, like the footer copyright year.
export const yearsBuilding = new Date().getFullYear() - careerStartYear;

export const formatDates = (c: Chapter) =>
  `${c.start} \u2013 ${c.end ?? "Present"}`;
