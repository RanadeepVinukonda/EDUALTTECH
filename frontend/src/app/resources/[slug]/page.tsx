import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicFetchStrict } from "@/lib/server-api";
import type { ResourceArticleDetailResponse } from "@/lib/types";
import LinkButton from "@/components/ui/LinkButton";
import ResourceArticleReader from "@/components/resources/ResourceArticleReader";

const loadArticle = cache((slug: string) =>
  publicFetchStrict<ResourceArticleDetailResponse>(`/resources/article/${slug}`, {}, 120),
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await loadArticle(slug);
  const article = data?.article;
  if (!article) return { title: "Resource — EduAltTech" };

  const description = article.description?.slice(0, 160) || "A free learning guide on EduAltTech.";
  return {
    title: `${article.title} — Free Learning Guide | EduAltTech`,
    description,
    alternates: { canonical: `/resources/${article.slug}` },
    openGraph: {
      type: "article",
      siteName: "EduAltTech",
      locale: "en_IN",
      url: `/resources/${article.slug}`,
      title: article.title,
      description,
    },
  };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await loadArticle(slug);

  if (data?.article) {
    const hydratedArticle = {
      ...data.article,
      isBookmarked: data.isBookmarked ?? data.article.isBookmarked,
      prevArticle: data.prev ?? data.article.prevArticle ?? null,
      nextArticle: data.next ?? data.article.nextArticle ?? null,
      linkedCourse: data.article.linkedCourse ?? data.article.relatedCourse ?? null,
    };
    return <ResourceArticleReader article={hydratedArticle} />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div role="alert" className="mx-auto max-w-md border-y border-slate-200 bg-paper-2 p-8">
          <h1 className="font-display text-xl font-semibold text-ink-900">We couldn&apos;t load this resource</h1>
          <p className="mt-2 text-sm text-slate-600">There was a problem reaching the server. Please try again.</p>
          <div className="mt-6 flex justify-center gap-3">
            <LinkButton href={`/resources/${slug}`}>Try again</LinkButton>
            <LinkButton href="/resources" variant="secondary">
              All resources
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  notFound();
}
