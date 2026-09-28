import Link from "next/link";
import type writings from "@/data/writings.data";

type Post = (typeof writings)[number];

const catId = (c: string) => `cat-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

export default function LearningCarousel({ posts }: { posts: Post[] }) {

  /* one block of a column: an optional picture, a wide-spaced upper-case heading in the normal weight, a line of small serif text and a
     thin rule under it */
  const block = (post: Post, opts: { image?: boolean; ratio?: string; heading: string; text: string }, k: string) => (
    <div key={k} className="lf-block">
      {opts.image && (
        <span className="lf-pic" style={{ aspectRatio: opts.ratio ?? "3 / 4", ...(post.image ? { backgroundImage: `url(${post.image})` } : {}) }} />
      )}
      <h2 className="lf-h">{opts.heading}</h2>
      <p className="lf-p">{opts.text}</p>
      <span className="lf-rule" aria-hidden />
    </div>
  );

  /* a whole column is one card: its blocks sit one above the other inside a single link to the post, so the column opens, and
     grows on hover, as one */
  const column = (post: Post, blocks: React.ReactNode) => (
    <Link id={catId(post.category)} href={`/learning/${post.slug}`} data-card className="writing-card lf-col">
      {blocks}
    </Link>
  );

  const [a, b, c] = posts;
  const summary = (p: Post) => p.tags.slice(0, 4).join(" · ");

  return (
    <div className="lc-page" id="feed">
      {/*
        The whole /learning page. A centred masthead (a title, a short sub-line and a paragraph, the title in the Career headline's display serif, the other two in the Career page's paragraph type), then a feed in
        three columns set at different heights. Each item is a picture, a wide-spaced upper-case heading in the normal weight, a line of small text and
        a hairline under it, and each column is one card: a text block and a picture block for the same post, one above the other, that open and grow together.
        On a phone the columns stack into one.
      */}
      <style>{`
        .lc-page { width: 100%; padding: clamp(190px, 28vh, 290px) clamp(20px, 4vw, 48px) clamp(120px, 12vh, 140px); }
        .lc-mast { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .lc-title-big { margin: 0; font-size: clamp(2rem, 4.5vw, 3.6rem); line-height: 1; letter-spacing: -0.03em; color: var(--ink); }
        .lc-desc { margin: clamp(16px, 2.6vh, 26px) 0 0; max-width: 1000px; font-family: var(--font-sans); font-size: clamp(13px, 1.1vw, 15px); line-height: 1.82; color: var(--ink-45); }
        .lf-cols { max-width: 1000px; margin: clamp(40px, 7vh, 72px) auto 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 clamp(24px, 3.4vw, 44px); align-items: start; }
        .lf-col { display: flex; flex-direction: column; text-decoration: none; color: var(--ink); scroll-margin-top: 110px; transition: transform 0.35s ease; }
        /* on hover the whole column, every block in it together, grows; a transform, so the text never re-wraps */
        .lf-col:hover { transform: scale(1.04); position: relative; z-index: 2; }
        .lf-col:nth-child(2) { margin-top: clamp(24px, 6vh, 70px); }
        .lf-col:nth-child(3) { margin-top: clamp(8px, 2vh, 24px); }
        .lf-block { display: block; }
        .lf-pic { display: block; width: 100%; background: var(--paper-sunken) center/cover no-repeat; }
        .lf-h { margin: clamp(18px, 3vh, 30px) 0 0; font-family: var(--font-sans); font-weight: 400; text-transform: uppercase; letter-spacing: 0.26em; line-height: 1.8;
          font-size: clamp(0.8rem, 1.05vw, 1rem); }
        .lf-p { margin: clamp(14px, 2.4vh, 24px) 0 0; font-family: var(--font-display); font-weight: 400; font-size: clamp(0.78rem, 0.9vw, 0.9rem); line-height: 1.55; letter-spacing: 0.02em; color: var(--ink-70);
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .lf-rule { display: block; height: 1px; background: var(--rule); margin: clamp(22px, 4vh, 40px) 0 clamp(26px, 4.6vh, 44px); }
        @media (max-width: 767px) {
          .lc-mast { display: flex; flex-direction: column; align-items: center; text-align: center; }
          .lc-page { padding-top: clamp(130px, 20vh, 170px); }
          .lc-title-big { font-size: clamp(2.6rem, 12.5vw, 3.4rem); line-height: 1.02; }
          .lc-desc { font-size: 15px; line-height: 1.7; color: var(--ink-70); }
          /* side-by-side snap carousel instead of a stacked list — the first
             card sits centered at rest (padding-inline == the peek either
             side of the 78vw card width), each swipe snaps the next one in */
          .lf-cols {
            display: flex;
            grid-template-columns: none;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 20px;
            padding-inline: 11vw;
            margin-top: clamp(28px, 6vh, 56px);
          }
          .lf-cols::-webkit-scrollbar { display: none; }
          .lf-col {
            flex: 0 0 78vw;
            scroll-snap-align: center;
          }
          .lf-col:nth-child(2), .lf-col:nth-child(3) { margin-top: 0; }
          .lf-h { letter-spacing: 0.2em; }
        }
      `}</style>

      <div className="lc-mast">
        <h1 className="display lc-title-big">Learning as I Build.</h1>
        <p className="lc-desc">
          Notes written while building: the reasoning behind each decision, how the services fit together, what broke along the way,
          and the lessons that never make it into a changelog.
        </p>
      </div>

      <div className="lf-cols">
        {a && column(a, [
          block(a, { heading: a.category, text: a.excerpt }, "t"),
          block(a, { image: true, ratio: "3 / 4", heading: a.title, text: summary(a) }, "i"),
        ])}
        {b && column(b, [
          block(b, { image: true, ratio: "1 / 1.28", heading: b.title, text: b.excerpt }, "i"),
          block(b, { heading: b.category, text: summary(b) }, "t"),
        ])}
        {c && column(c, [
          block(c, { image: true, ratio: "5 / 3", heading: c.title, text: c.excerpt }, "i"),
          block(c, { heading: c.category, text: summary(c) }, "t"),
        ])}
      </div>
    </div>
  );
}
