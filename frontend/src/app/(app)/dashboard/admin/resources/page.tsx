"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Add from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Close from "@mui/icons-material/Close";
import Search from "@mui/icons-material/Search";
import Category from "@mui/icons-material/Category";
import School from "@mui/icons-material/School";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type {
  ResourceCategoryItem,
  ResourceArticleCard,
  ResourceSubcategoryItem,
  CourseListItem,
} from "@/lib/types";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";

const LEARNING_PATH_SLUGS = new Set([
  "ai-for-kids",
  "ai-game-development",
  "music",
  "video-editing",
]);

const LESSON_TEMPLATE = `## What you will learn

Describe the idea in clear, learner-friendly language.

## Explore the idea

Explain the key concept with a practical example.

## Try it

Give learners a small activity they can complete.

## Check your understanding

Ask a question or describe what learners should be able to do.`;

async function loadAllAdminArticles(): Promise<ResourceArticleCard[]> {
  const firstPage = await apiGet<{
    articles: ResourceArticleCard[];
    total: number;
    hasMore: boolean;
  }>("/resources/admin/articles", { page: 1, limit: 100 });
  const articles = [...firstPage.articles];
  let page = 2;

  while (firstPage.hasMore && articles.length < firstPage.total) {
    const nextPage = await apiGet<{
      articles: ResourceArticleCard[];
      hasMore: boolean;
    }>("/resources/admin/articles", { page, limit: 100 });
    articles.push(...nextPage.articles);
    if (!nextPage.hasMore || nextPage.articles.length === 0) break;
    page += 1;
  }

  return articles;
}

export default function AdminResourcesPage() {
  const [activeTab, setActiveTab] = useState<"articles" | "categories">("articles");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ResourceCategoryItem[]>([]);
  const [articles, setArticles] = useState<ResourceArticleCard[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("all");

  // Article Modal State
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSubcategoryId, setFormSubcategoryId] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("Beginner");
  const [formMinutes, setFormMinutes] = useState(5);
  const [formTags, setFormTags] = useState("");
  const [formLinkedCourseId, setFormLinkedCourseId] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [chapterFormOpen, setChapterFormOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterDescription, setNewChapterDescription] = useState("");
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [editorPreview, setEditorPreview] = useState(false);
  const [savingArticle, setSavingArticle] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [catIcon, setCatIcon] = useState("code");
  const [savingCat, setSavingCat] = useState(false);

  // Subcategory Modal State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subParentCatId, setSubParentCatId] = useState("");
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [savingSub, setSavingSub] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [catsRes, articles, coursesRes] = await Promise.all([
        apiGet<{ categories: ResourceCategoryItem[] }>("/resources/categories"),
        loadAllAdminArticles(),
        apiGet<{ courses: CourseListItem[] }>("/courses?limit=50").catch(() => ({ courses: [] })),
      ]);
      setCategories(catsRes.categories || []);
      setArticles(articles);
      setCourses(coursesRes.courses || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtered subcategories based on chosen category in article modal
  const modalSubcategories = useMemo(() => {
    const found = categories.find((c) => c.id === formCategoryId);
    return found ? found.subcategories : [];
  }, [categories, formCategoryId]);
  const creatorCategories = useMemo(
    () =>
      editingArticleId
        ? categories
        : categories.filter((category) => LEARNING_PATH_SLUGS.has(category.slug)),
    [categories, editingArticleId],
  );

  function openCreateArticleModal() {
    setEditingArticleId(null);
    setFormTitle("");
    setFormSlug("");
    setFormDescription("");
    setFormContent(LESSON_TEMPLATE);
    setFormCategoryId(
      categories.find((category) => category.slug === "ai-for-kids")?.id ??
        categories.find((category) => LEARNING_PATH_SLUGS.has(category.slug))?.id ??
        "",
    );
    setFormSubcategoryId("");
    setFormDifficulty("Beginner");
    setFormMinutes(6);
    setFormTags("");
    setFormLinkedCourseId("");
    setFormPublished(true);
    setEditorPreview(false);
    setFormError(null);
    setChapterFormOpen(false);
    setNewChapterName("");
    setNewChapterDescription("");
    setChapterError(null);
    setArticleModalOpen(true);
  }

  async function openEditArticleModal(art: ResourceArticleCard) {
    setEditingArticleId(art.id);
    setFormTitle(art.title);
    setFormSlug(art.slug);
    setFormDescription(art.description);
    setFormCategoryId(art.category?.id || categories[0]?.id || "");
    setFormSubcategoryId(art.subcategory?.id || "");
    setFormDifficulty(art.difficulty);
    setFormMinutes(art.estimatedMinutes);
    setFormTags(art.tags?.join(", ") || "");
    setFormPublished(true);
    setFormError(null);
    setEditorPreview(false);
    setChapterFormOpen(false);
    setNewChapterName("");
    setNewChapterDescription("");
    setChapterError(null);

    try {
      const detail = await apiGet<{ article: { content: string; relatedCourseId?: string | null; isPublished: boolean } }>(
        `/resources/article/${art.slug}`
      );
      setFormContent(detail.article.content);
      setFormLinkedCourseId(detail.article.relatedCourseId || "");
      setFormPublished(detail.article.isPublished);
    } catch {
      setFormContent("");
    }

    setArticleModalOpen(true);
  }

  async function handleSaveArticle(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError("Title and content are required.");
      return;
    }

    setSavingArticle(true);
    setFormError(null);

    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim() || undefined,
      description: formDescription.trim(),
      content: formContent.trim(),
      categoryId: formCategoryId || undefined,
      subcategoryId: formSubcategoryId || undefined,
      difficulty: formDifficulty,
      estimatedMinutes: Number(formMinutes) || 5,
      tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
      relatedCourseId: formLinkedCourseId || null,
      isPublished: formPublished,
    };

    try {
      if (editingArticleId) {
        await apiPatch(`/resources/articles/${editingArticleId}`, payload);
      } else {
        await apiPost("/resources/articles", payload);
      }
      setArticleModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSavingArticle(false);
    }
  }

  async function handleCreateChapter() {
    if (!formCategoryId || !newChapterName.trim()) return;

    setCreatingChapter(true);
    setChapterError(null);
    try {
      const response = await apiPost<{ subcategory: ResourceSubcategoryItem }>("/resources/subcategories", {
        categoryId: formCategoryId,
        name: newChapterName.trim(),
        description: newChapterDescription.trim() || undefined,
        order: modalSubcategories.length + 1,
      });
      setCategories((current) =>
        current.map((category) =>
          category.id === formCategoryId
            ? { ...category, subcategories: [...category.subcategories, response.subcategory] }
            : category,
        ),
      );
      setFormSubcategoryId(response.subcategory.id);
      setNewChapterName("");
      setNewChapterDescription("");
      setChapterFormOpen(false);
    } catch (error) {
      setChapterError(error instanceof Error ? error.message : "Could not create chapter.");
    } finally {
      setCreatingChapter(false);
    }
  }

  async function handleDeleteArticle(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiDelete(`/resources/articles/${id}`);
      await loadData();
    } catch {
      alert("Failed to delete article");
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) return;
    setSavingCat(true);
    try {
      await apiPost("/resources/categories", {
        name: catName.trim(),
        slug: catSlug.trim() || undefined,
        description: catDescription.trim() || undefined,
        icon: catIcon,
      });
      setCategoryModalOpen(false);
      setCatName("");
      setCatSlug("");
      setCatDescription("");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSavingCat(false);
    }
  }

  async function handleCreateSubcategory(e: React.FormEvent) {
    e.preventDefault();
    if (!subName.trim() || !subParentCatId) return;
    setSavingSub(true);
    try {
      await apiPost("/resources/subcategories", {
        categoryId: subParentCatId,
        name: subName.trim(),
        slug: subSlug.trim() || undefined,
        description: subDescription.trim() || undefined,
      });
      setSubModalOpen(false);
      setSubName("");
      setSubSlug("");
      setSubDescription("");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create subcategory");
    } finally {
      setSavingSub(false);
    }
  }

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchSearch =
        !search.trim() ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCatFilter === "all" || a.category?.slug === selectedCatFilter;
      return matchSearch && matchCat;
    });
  }, [articles, search, selectedCatFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading resource library management..." />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
            Learning path content
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
            Add lessons to AI, music, and video learning paths. Place each lesson in the chapter where it belongs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-paper px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-paper-2"
          >
            <Category fontSize="small" />
            <span>+ Add category</span>
          </button>
          <button
            type="button"
            onClick={openCreateArticleModal}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 active:translate-y-px motion-reduce:transition-none"
          >
            <Add fontSize="small" />
            <span>Add a lesson</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-t-2 border-slate-300 bg-paper-2/70 px-4 py-3.5">
          <p className="text-xs font-semibold text-slate-600">Total tutorials</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{articles.length}</p>
        </div>
        <div className="border-t-2 border-slate-300 bg-paper-2/70 px-4 py-3.5">
          <p className="text-xs font-semibold text-slate-600">Categories</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{categories.length}</p>
        </div>
        <div className="border-t-2 border-slate-300 bg-paper-2/70 px-4 py-3.5">
          <p className="text-xs font-semibold text-slate-600">Subcategories</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">
            {categories.reduce((acc, c) => acc + c.subcategories.length, 0)}
          </p>
        </div>
        <div className="border-t-2 border-brand-600 bg-paper-2/70 px-4 py-3.5">
          <p className="text-xs font-semibold text-slate-600">Article reads</p>
          <p className="mt-2 font-display text-3xl font-semibold text-brand-700">
            {articles.reduce((acc, a) => acc + (a.views || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex min-w-0 gap-1 overflow-x-auto border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("articles")}
          className={cn(
            "min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-semibold transition",
            activeTab === "articles"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Lessons ({articles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={cn(
            "min-h-11 shrink-0 border-b-2 px-4 py-2 text-sm font-semibold transition",
            activeTab === "categories"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Learning paths ({categories.length})
        </button>
      </div>

      {/* Tab 1: Articles */}
      {activeTab === "articles" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none"
              />
            </div>
            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="all">All categories ({articles.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Articles Table */}
          <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-paper">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-paper-2 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Tutorial</th>
                    <th className="px-4 py-3">Category and subcategory</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        No lessons found. Add a lesson to build a learning path.
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-display font-semibold text-ink-900 line-clamp-1">{art.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
                            {art.isPublished === false ? "Hidden from learners" : "Published"} · {art.description}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{art.category?.name || "General"}</span>
                          {art.subcategory && (
                            <span className="text-slate-400"> › {art.subcategory.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {art.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-600">
                          {art.estimatedMinutes} min
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700">
                          {art.views.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/resources/${art.slug}`}
                              target="_blank"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700 transition"
                              title="Preview Live Page"
                            >
                              <OpenInNew sx={{ fontSize: 16 }} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => openEditArticleModal(art)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              title="Edit Article"
                            >
                              <Edit sx={{ fontSize: 16 }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteArticle(art.id, art.title)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete Article"
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === "categories" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                    Category
                  </span>
                  <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">{cat.name}</h3>
                  <p className="mt-1 text-xs text-slate-600">{cat.description || "No description provided."}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubParentCatId(cat.id);
                    setSubModalOpen(true);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  + Add topic
                </button>
              </div>

              {/* Subcategories */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Topics and subcategories ({cat.subcategories.length})
                </p>
                {cat.subcategories.length === 0 ? (
                  <p className="text-xs italic text-slate-400">No subcategories yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub.id}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {sub.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Write / Edit Lesson */}
      {articleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative my-8 w-full max-w-4xl rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {editingArticleId ? "Edit lesson" : "Add a lesson to a learning path"}
              </h2>
              <button
                type="button"
                onClick={() => setArticleModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <Close fontSize="small" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. What is artificial intelligence?"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Slug (optional)</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="leave blank to auto-generate"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">What learners will learn *</label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the idea and outcome for this lesson."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <section className="rounded-xl border border-slate-200 bg-paper-2/60 p-4">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-ink-900">Place this lesson in its path</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Choose a learning path and chapter. New lessons are added to the end of that chapter.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Learning path *</label>
                  <select
                    value={formCategoryId}
                    required={!editingArticleId}
                    onChange={(e) => {
                      setFormCategoryId(e.target.value);
                      setFormSubcategoryId("");
                      setChapterFormOpen(false);
                      setChapterError(null);
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  >
                    <option value="">Select a learning path</option>
                    {creatorCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  </div>

                  <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chapter *</label>
                  <select
                    value={formSubcategoryId}
                    onChange={(e) => setFormSubcategoryId(e.target.value)}
                    required={!editingArticleId}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  >
                    <option value="">Select a chapter</option>
                    {modalSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  </div>
                </div>
                {!editingArticleId && formCategoryId && (
                  <div className="mt-3">
                    {!chapterFormOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          setChapterFormOpen(true);
                          setChapterError(null);
                        }}
                        className="whitespace-nowrap text-xs font-semibold text-brand-700 hover:text-brand-800 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        + Add chapter
                      </button>
                    ) : (
                      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="new-chapter-name">
                            Chapter name
                          </label>
                          <input
                            id="new-chapter-name"
                            value={newChapterName}
                            onChange={(event) => setNewChapterName(event.target.value)}
                            placeholder="e.g. Build your first project"
                            maxLength={100}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700" htmlFor="new-chapter-description">
                            Short chapter description
                          </label>
                          <input
                            id="new-chapter-description"
                            value={newChapterDescription}
                            onChange={(event) => setNewChapterDescription(event.target.value)}
                            placeholder="What this chapter covers"
                            maxLength={1000}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleCreateChapter()}
                          disabled={creatingChapter || !newChapterName.trim()}
                          className="min-h-10 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
                        >
                          {creatingChapter ? "Adding…" : "Add chapter"}
                        </button>
                        {chapterError && (
                          <p role="alert" className="text-xs text-rose-700 sm:col-span-3">
                            {chapterError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Read Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={formMinutes}
                    onChange={(e) => setFormMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Related search terms (comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="patterns, data, classification"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Ecosystem Bridge: Connect Resource -> Course */}
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-900 mb-1">
                  <School fontSize="small" />
                  <span>Bridge to Structured Course (Optional Next Step)</span>
                </label>
                <p className="text-[11px] text-slate-600 mb-2">
                  When selected, readers of this tutorial will see an enrollment banner inviting them to join this mentor-led course.
                </p>
                <select
                  value={formLinkedCourseId}
                  onChange={(e) => setFormLinkedCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                >
                  <option value="">No linked course (Standalone)</option>
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>
                      {crs.title} ({crs.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Markdown Content Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Educational Content (Markdown) *</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditorPreview(false)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                        !editorPreview ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorPreview(true)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                        editorPreview ? "bg-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {editorPreview ? (
                  <div className="min-h-[250px] max-h-[400px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <MarkdownArticleViewer content={formContent} />
                  </div>
                ) : (
                  <textarea
                    rows={12}
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Write detailed guide in markdown..."
                    className="w-full rounded-xl border border-slate-300 font-mono text-xs text-slate-800 p-3 leading-relaxed focus:border-brand-600 focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="formPublished"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="formPublished" className="text-xs font-semibold text-slate-700">
                  Publish immediately (accessible publicly on /resources)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setArticleModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingArticle}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {savingArticle ? "Saving…" : editingArticleId ? "Save lesson" : "Publish lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Category */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-elev3 border border-slate-200 p-6">
            <h2 className="font-display text-base font-semibold text-ink-900">Add a category</h2>
            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Creative and Performing Arts"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Slug (optional)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="creative-arts"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Overview of this domain..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Icon Style</label>
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                >
                  <option value="code">Code & Technology</option>
                  <option value="school">School & Academic</option>
                  <option value="palette">Palette & Arts</option>
                  <option value="work">Business & Leadership</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  {savingCat ? "Creating..." : "Create category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Subcategory */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-elev3 border border-slate-200 p-6">
            <h2 className="font-display text-base font-semibold text-ink-900">Add a subcategory or topic</h2>
            <form onSubmit={handleCreateSubcategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent category</label>
                <select
                  value={subParentCatId}
                  onChange={(e) => setSubParentCatId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic name *</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Music Production"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Slug (optional)</label>
                <input
                  type="text"
                  value={subSlug}
                  onChange={(e) => setSubSlug(e.target.value)}
                  placeholder="music-production"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSubModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSub}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  {savingSub ? "Creating..." : "Create topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
