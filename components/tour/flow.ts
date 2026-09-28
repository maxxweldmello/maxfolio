import type { TourStep } from "./Tour";

/* The site tour, one run through the pages. Each step points at one part of one page; the tour moves on by itself, and a step
   with `click` presses that element when it moves on (opening a link, or the scroll-down button). */
export const siteTour: TourStep[] = [
  // ── home ──
  { path: "/", target: '[data-tour="home-left"]', title: "Who I am", body: "A software engineer who builds things that work in production, from backend services to the screens on top of them." },
  { path: "/", target: '[data-tour="home-middle"]', title: "The person behind it", body: "That's me. The work you'll see on these pages is the work I've shipped." },
  { path: "/", target: "[data-cta-column] a:nth-of-type(1)", title: "Full résumé", body: "One click to my complete résumé: every role, project and skill in one place." },
  { path: "/", target: "[data-cta-column] a:nth-of-type(2)", title: "Say hello", body: "Want to talk? Open the contact page and send me a message." },
  { path: "/", target: '[data-tour="journey"]', title: "Start here", body: "This arrow opens the menu that leads to the rest of the site." },
  { path: "/", menu: true, target: '[data-tour="menu-links"]', title: "Three pages", body: "Career is my story and timeline, Work is every project on one board, and Learning is what I write as I build." },
  { path: "/", menu: true, target: '[data-tour="menu-career"]', click: '[data-tour="menu-career"]', title: "Career first", body: "Let's open Career." },
  // ── career ──
  { path: "/career", target: ".career-hero-left", title: "My story", body: "Who I am in a few lines: a software engineer building systems from end to end." },
  { path: "/career", target: ".career-hero-center", title: "The portrait", body: "A face to go with the record below." },
  { path: "/career", target: ".career-hero-right", title: "What drives me", body: "The thinking behind how I build, in my own words." },
  { path: "/career", skipIfMissing: true, target: 'button[aria-label="Scroll down to timeline"]', title: "Keep going", body: "This button takes you down to the timeline. Watch the page scroll." },
  // the whole career page, scrolled slowly from top to bottom with nothing over it; then on to Work
  { path: "/career", silent: true, scroll: "bottom", target: "", title: "", body: "" },
  // ── work ──
  { text: true, path: "/work", target: ".work-head h1, .work-head > p:last-of-type", title: "What I've practiced", body: "Every company, every system, every task that shipped to production. The complete record, not a highlight reel." },
  { path: "/work", target: ".work-head dl", title: "In numbers", body: "My experience, the companies I've worked at and the projects I've built, at a glance." },
  { path: "/work", target: '[data-tour="work-board"]', title: "The whole record", body: "Every project and task is a card on this board, with Kayana Aid in the middle." },
  { path: "/work", drag: true, target: '[data-tour="work-board"]', title: "Drag it", body: "The board is draggable. Pull it in any direction to explore, and it glides on after you let go." },
  { path: "/work", target: 'button[aria-label="Re-centre the view"]', click: 'button[aria-label="Re-centre the view"]', title: "Re-centre", body: "One click brings the board back to the middle." },
  { path: "/work", one: true, target: 'a[href="/work/kayana-aid"]', title: "Open any card", body: "Click a card to open its full detail page. Try it yourself." },
  // ── learning ──
  { path: "/learning", target: ".lc-mast", title: "Learning as I Build", body: "Notes written while building: the reasoning behind each decision, how the services fit together, what broke along the way, and the lessons that never make it into a changelog." },
  { path: "/learning", target: ".lf-cols", title: "The notes", body: "Long-form write-ups, side by side. Let's look at them one at a time." },
  { path: "/learning", target: ".lf-cols > a:nth-of-type(1)", title: "Architecture", body: "How the whole backend fits together, told in one diagram." },
  { path: "/learning", target: ".lf-cols > a:nth-of-type(2)", title: "Infrastructure", body: "AWS in production: Cognito, S3, pipelines, logs and the bits nobody documents." },
  { path: "/learning", target: ".lf-cols > a:nth-of-type(3)", title: "Integrations", body: "Stripe Connect in production: onboarding, Terminal, payouts and instant payouts." },
  // ── contact ──
  { text: true, path: "/contact", target: '.contact-heading, [data-tour="contact-statement"]', title: "Get in touch", body: "Email is the fastest path. I reply within a day or two. If I don't, call 100." },
  { path: "/contact", target: ".contact-hero-img", title: "Say hello", body: "A picture to greet you on the way in." },
  { path: "/contact", target: ".contact-links-grid > div:last-child", title: "Find me", body: "Email, LinkedIn and GitHub. Each one is a single click away." },
  // ── résumé ──
  { text: true, path: "/resume", target: ".resume-hero-headline-row h1, .resume-hero-desc-desktop, .resume-hero-desc-mobile", title: "The complete résumé", body: "Every role, every system, every line that shipped to production. The full record, laid out without filter." },
  { path: "/resume", target: ".resume-hero-download a", title: "Download it", body: "Take the résumé with you as a PDF." },
  // the whole résumé, scrolled slowly from top to bottom with nothing over it
  { path: "/resume", silent: true, scroll: "bottom", target: "", title: "", body: "" },
];
