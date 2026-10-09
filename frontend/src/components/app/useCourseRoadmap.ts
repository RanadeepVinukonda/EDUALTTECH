"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { describeError, errorCode } from "@/lib/errors";
import type { CourseDetailResponse, Roadmap } from "@/lib/app-types";

export interface CourseRoadmapState {
  detail: CourseDetailResponse | null;
  roadmap: Roadmap | null;
  completed: Set<string>;
  loading: boolean;
  error: string | null;
  code: string | null;
  reload: () => Promise<void>;
}

/**
 * Shared loader for the enrolled-course detail + authoritative roadmap.
 * Used by the roadmap page and the lesson viewer so both read one source.
 */
export function useCourseRoadmap(slug: string): CourseRoadmapState {
  const [detail, setDetail] = useState<CourseDetailResponse | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCode(null);
    try {
      const d = await apiGet<CourseDetailResponse>(`/courses/${slug}`);
      setDetail(d);
      if (d.access.canRead) {
        const rm = await apiGet<Roadmap>(`/courses/${d.course.id}/roadmap`);
        setRoadmap(rm);
        setCompleted(new Set(rm.completedLessonIds));
      } else {
        setRoadmap(null);
      }
    } catch (err) {
      setError(describeError(err, "Could not load this course."));
      setCode(errorCode(err));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { detail, roadmap, completed, loading, error, code, reload };
}
