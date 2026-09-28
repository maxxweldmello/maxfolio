import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWritingPost, getWritingPosts } from "@/lib/data";
import { renderWritingBody } from "@/components/prose/renderBody";
import { ArrowLeft } from "@/components/icons";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = "https://maxxwel.dev";

export async function generateStaticParams() {
  const posts = await getWritingPosts();
  return posts
    .filter((w) => w.status === "published")
    .map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getWritingPost(slug);
  if (!post) return {};

  const url = `${siteUrl}/learning/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function WritingDetail({ params }: PageProps) {
  const { slug } = await params;
  const post = await getWritingPost(slug);
  if (!post || post.status !== "published" || !post.body) return notFound();

  const allPosts = await getWritingPosts();
  const others = allPosts
    .filter((w) => w.status === "published" && w.slug !== post.slug)
    .slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `${siteUrl}/learning/${post.slug}`,
    author: { "@type": "Person", name: "Maxwel D'Mello" },
    keywords: post.tags.join(", "),
  };

  const words = post.title.split(" ");
  const last = words.slice(-1).join(" ");
  const first = words.slice(0, -1).join(" ");

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Full-width hero image ── */}
      {post.image && (
        <div style={{ width: "100%", height: "60vh", minHeight: 340, position: "relative", overflow: "hidden" }}>
          <img
            src={post.image}
            alt={post.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
          />
        </div>
      )}

      <article className="mx-auto max-w-[860px] px-6 md:px-10 pt-10 pb-24">
        <Link
          href="/learning"
          className="inline-flex items-center gap-2 mono transition-colors hover:text-[var(--accent-strong)]"
          style={{ color: "var(--ink-30)" }}
        >
          <ArrowLeft size={12} />
          Learning
        </Link>

        <header className="mt-10 mb-14">
          <p className="label mb-6">
            {post.category} · {post.readTime} · {post.publishedDate}
          </p>

          <h1 className="display text-[clamp(2.2rem,5.8vw,4rem)]">
            {first}{" "}
            <span className="display-italic" style={{ color: "var(--accent-strong)" }}>
              {last}
            </span>
          </h1>

          <p className="mt-8 serif italic text-[19px] leading-[1.6]" style={{ color: "var(--ink-70)" }}>
            {post.excerpt}
          </p>

          {post.tags.length > 0 && (
            <p className="mono mt-7" style={{ color: "var(--ink-30)" }}>
              {post.tags.join("  ·  ")}
            </p>
          )}
        </header>

        <div className="rule" />

        <div className="pt-4">{renderWritingBody(post.body)}</div>

        {others.length > 0 && (
          <footer className="mt-24">
            <div className="rule mb-8" />
            <p className="label mb-6">Keep reading</p>
            <div className="grid sm:grid-cols-2 gap-10">
              {others.map((o) => (
                <Link key={o.slug} href={`/learning/${o.slug}`} className="group">
                  <p className="label mb-2">{o.category}</p>
                  <h3
                    className="serif text-[19px] leading-snug transition-colors group-hover:text-[var(--accent-strong)]"
                    style={{ color: "var(--ink)" }}
                  >
                    {o.title}
                  </h3>
                  <p className="mono mt-2" style={{ color: "var(--ink-30)" }}>
                    {o.readTime}
                  </p>
                </Link>
              ))}
            </div>
          </footer>
        )}
      </article>
    </main>
  );
}
