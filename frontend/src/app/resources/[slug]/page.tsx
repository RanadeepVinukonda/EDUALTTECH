import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicFetchStrict } from "@/lib/server-api";
import type { ResourceTutorialResponse, ResourceArticleDetail } from "@/lib/types";
import LinkButton from "@/components/ui/LinkButton";
import ResourceReader from "@/components/resources/ResourceReader";
import ResourceArticleReader from "@/components/resources/ResourceArticleReader";

interface ArticleResponse {
  article: ResourceArticleDetail;
}

async function loadArticle(slug: string) {
  return publicFetchStrict<ArticleResponse>(`/resources/article/${slug}`, {}, 120);
}

async function loadTutorial(slug: string) {
  return publicFetchStrict<ResourceTutorialResponse>(`/resources/tutorial/${slug}`, {}, 120);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  // Try article first
  const { data: articleData } = await loadArticle(slug);
  if (articleData?.article) {
    const article = articleData.article;
    const description = article.description?.slice(0, 160) || "Comprehensive free tutorial on EduAltTech";
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

  // Fallback to legacy tutorial
  const { data: tutorialData } = await loadTutorial(slug);
  const resource = tutorialData?.resource;
  if (!resource) return { title: "Resource — EduAltTech" };
  const description = resource.description.slice(0, 160);
  return {
    title: `${resource.title} — Free Tutorial`,
    description,
    alternates: { canonical: `/resources/${resource.slug}` },
  };
}

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Check if it's a first-class ResourceArticle
  const { data: articleData, error: articleError } = await loadArticle(slug);
  if (articleData?.article) {
    return <ResourceArticleReader article={articleData.article} />;
  }

  // 2. Check if it's a legacy multi-chapter ResourceTutorial
  const { data: tutorialData, error: tutorialError } = await loadTutorial(slug);
  if (tutorialData?.resource) {
    return <ResourceReader resource={tutorialData.resource} />;
  }

  // 3. If both had network errors
  if (articleError && tutorialError) {
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
