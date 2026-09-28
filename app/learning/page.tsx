import type { Metadata } from "next";
import LearningCarousel from "@/components/learning/LearningCarousel";
import { getWritingPosts } from "@/lib/data";
import Tour from "@/components/tour/Tour";
import { siteTour } from "@/components/tour/flow";

export const metadata: Metadata = {
  title: "Learnings",
  description:
    "Longer-form notes on production systems — the reasoning behind decisions, and the parts of shipping that never reach a changelog.",
};

export default async function WritingPage() {
  const allPosts = await getWritingPosts();
  const published = allPosts.filter((w) => w.status === "published");

  /* the whole page is one editorial board: the intro is a tile in it, with the posts as photographs around it */
  return (
    <main className="writing-main" style={{ minHeight: "100dvh", background: "var(--paper)" }}>
      <LearningCarousel posts={published} />
      <Tour steps={siteTour} autoStartDelay={null} fabTone="dark" fabInNav />
    </main>
  );
}
