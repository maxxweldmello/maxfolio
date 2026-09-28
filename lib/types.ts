// Shared data types used by pages and components.

export type WorkTask = {
  id: string;
  hasDetail: boolean;
  title?: string;
  description?: string;
  start?: string;
  end?: string;
  image?: string;
  pageHref?: string;
};

export type WorkProject = {
  id: string;
  name: string;
  description?: string;
  start?: string;
  end?: string;
  linkOnly?: boolean;
  liveUrl?: string;
  liveUrlLabel?: string;
  walkthroughUrl?: string;
  tasks: WorkTask[];
};

export type ContributionYear = {
  year: number;
  image: string;
  total?: number;
};

export type WorkCompany = {
  id: string;
  company: string;
  role: string;
  location?: string;
  start: string;
  end: string;
  description?: string;
  projects: WorkProject[];
  contributions?: ContributionYear[];
};

export type SiteSettings = {
  name: string;
  brand: string;
  bio: string;
  location: string;
  email: string;
  role: { title: string };
  home: {
    heroImage: string;
    headline: { main: string; italic: string };
    ctas: { label: string; caption: string; href: string; external: boolean }[];
    footerCaption: string;
  };
  workPage: {
    eyebrow: string;
    titleLines: string[];
    standfirst: string;
    experienceStat: string;
  };
};

export type ContactPageData = {
  eyebrow: string;
  heading: string;
  statement: string;
  links: { label: string; value: string; href: string }[];
  footer: { name: string; location: string; role: string };
};

export type ResumePageData = {
  pdfUrl: string;
  /** Direct-download link — different shape from pdfUrl when the file lives on Google Drive. */
  downloadUrl?: string;
  downloadFilename?: string;
  updatedAt?: string;
};
