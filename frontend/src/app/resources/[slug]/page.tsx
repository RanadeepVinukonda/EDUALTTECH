import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicFetchStrict } from "@/lib/server-api";
import type { ResourceArticleDetail } from "@/lib/types";
import LinkButton from "@/components/ui/LinkButton";
import ResourceArticleReader from "@/components/resources/ResourceArticleReader";

interface ArticleResponse {
  article: ResourceArticleDetail;
}

function loadArticle(slug: string) {
  return publicFetchStrict<ArticleResponse>(`/resources/article/${slug}`, {}, 120);
}

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

  if (data?.article) return <ResourceArticleReader article={data.article} />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div role="alert" className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
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
