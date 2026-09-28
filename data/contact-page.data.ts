import { profileData } from "./profile.data";

export const contactPageData = {
  eyebrow: "Contact",

  heading: "Get in touch.",

  statement: "Email is the fastest path.\nI reply within a day or two.\nIf I don't, call 100.",

  links: [
    { label: "Email",    value: `${profileData.email.username}@${profileData.email.domain}`, href: `https://mail.google.com/mail/?view=cm&fs=1&to=${profileData.email.username}@${profileData.email.domain}` },
    { label: "LinkedIn", value: "linkedin.com/in/maxwel-dmello",   href: profileData.socials.linkedin },
    { label: "GitHub",   value: "github.com/maxxweldmello",        href: profileData.socials.github },
  ],

  footer: {
    name:     profileData.name,
    location: profileData.location,
    role:     "Software Engineer",
  },
} as const;
