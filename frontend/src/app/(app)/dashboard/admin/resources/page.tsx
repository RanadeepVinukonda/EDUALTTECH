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
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import type { ResourceCategoryItem, ResourceArticleCard, CourseListItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";

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
  const [formAuthor, setFormAuthor] = useState("EduAltTech Faculty");
  const [formTags, setFormTags] = useState("");
  const [formLinkedCourseId, setFormLinkedCourseId] = useState("");
  const [formPublished, setFormPublished] = useState(true);
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
      const [catsRes, articlesRes, coursesRes] = await Promise.all([
        apiGet<{ categories: ResourceCategoryItem[] }>("/resources/categories"),
        apiGet<{ articles: ResourceArticleCard[] }>("/resources/library?limit=100"),
        apiGet<{ courses: CourseListItem[] }>("/courses?limit=50").catch(() => ({ courses: [] })),
      ]);
      setCategories(catsRes.categories || []);
      setArticles(articlesRes.articles || []);
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

  function openCreateArticleModal() {
    setEditingArticleId(null);
    setFormTitle("");
    setFormSlug("");
    setFormDescription("");
    setFormContent(
      "## Introduction\n\nExplain the foundational concept here.\n\n```python\n# Example code snippet\ndef calculate_metric():\n    return 42\n```\n\n## Practical Walkthrough\n\n1. Step one\n2. Step two\n\n> Note: Emphasize key takeaways for the learner."
    );
    setFormCategoryId(categories[0]?.id || "");
    setFormSubcategoryId("");
    setFormDifficulty("Beginner");
    setFormMinutes(6);
    setFormAuthor("EduAltTech Faculty");
    setFormTags("technology, guide, basics");
    setFormLinkedCourseId("");
    setFormPublished(true);
    setEditorPreview(false);
    setFormError(null);
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

    try {
      const detail = await apiGet<{ article: { content: string; authorAttribution?: string; linkedCourseId?: string; published: boolean } }>(
        `/resources/article/${art.slug}`
      );
      setFormContent(detail.article.content);
      setFormAuthor(detail.article.authorAttribution || "EduAltTech Faculty");
      setFormLinkedCourseId(detail.article.linkedCourseId || "");
      setFormPublished(detail.article.published);
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
      authorAttribution: formAuthor.trim(),
      tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
      linkedCourseId: formLinkedCourseId || null,
      published: formPublished,
    };

    try {
      if (editingArticleId) {
        await apiPut(`/resources/admin/articles/${editingArticleId}`, payload);
      } else {
        await apiPost("/resources/admin/articles", payload);
      }
      setArticleModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSavingArticle(false);
    }
  }

  async function handleDeleteArticle(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiDelete(`/resources/admin/articles/${id}`);
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
      await apiPost("/resources/admin/categories", {
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
      await apiPost("/resources/admin/subcategories", {
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            Resource Library Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create multidisciplinary tutorials, organize learning categories, and bridge free resources to structured courses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Category fontSize="small" />
            <span>+ Add Category</span>
          </button>
          <button
            type="button"
            onClick={openCreateArticleModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition"
          >
            <Add fontSize="small" />
            <span>Write New Tutorial</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tutorials</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{articles.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Categories</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{categories.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subcategories</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink-900">
            {categories.reduce((acc, c) => acc + c.subcategories.length, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Article Reads</p>
          <p className="mt-2 font-display text-3xl font-semibold text-brand-700">
            {articles.reduce((acc, a) => acc + (a.views || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("articles")}
          className={cn(
            "border-b-2 px-5 py-3 text-sm font-semibold transition",
            activeTab === "articles"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Articles & Tutorials ({articles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={cn(
            "border-b-2 px-5 py-3 text-sm font-semibold transition",
            activeTab === "categories"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Categories & Subcategories ({categories.length})
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
              <option value="all">All Domains ({articles.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Articles Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Tutorial</th>
                    <th className="px-4 py-3">Category / Subcategory</th>
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
                        No articles found. Click &quot;Write New Tutorial&quot; to publish one.
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-display font-semibold text-ink-900 line-clamp-1">{art.title}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">{art.description}</p>
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
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Domain Category
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
                  + Add Topic
                </button>
              </div>

              {/* Subcategories */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Topics / Subcategories ({cat.subcategories.length})
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

      {/* Modal: Write / Edit Article */}
      {articleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative my-8 w-full max-w-4xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {editingArticleId ? "Edit Educational Tutorial" : "Create New Educational Tutorial"}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tutorial Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Practical Machine Learning in Python"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Summary Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="A concise synopsis of concepts learned in this tutorial."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Category *</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => {
                      setFormCategoryId(e.target.value);
                      setFormSubcategoryId("");
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subcategory / Topic</label>
                  <select
                    value={formSubcategoryId}
                    onChange={(e) => setFormSubcategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  >
                    <option value="">General Topic</option>
                    {modalSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

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

              <div className="grid gap-4 sm:grid-cols-3">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Author / Faculty Attribution</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="ai, machine-learning, python"
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
                  {savingArticle ? "Saving..." : editingArticleId ? "Update Tutorial" : "Publish Tutorial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Category */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 p-6">
            <h2 className="font-display text-base font-semibold text-ink-900">Add New Domain Category</h2>
            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
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
                  {savingCat ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Subcategory */}
      {subModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 p-6">
            <h2 className="font-display text-base font-semibold text-ink-900">Add Subcategory / Topic</h2>
            <form onSubmit={handleCreateSubcategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Category</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Name *</label>
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
                  {savingSub ? "Creating..." : "Create Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
