"use client";

import { useEffect, useState } from "react";
import Edit from "@mui/icons-material/Edit";
import { apiPatch } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import type { Me } from "@/lib/app-types";

const EDUCATION = ["School", "Undergraduate", "Postgraduate", "Professional", "Other"];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LEARNING_PACES = ["Relaxed", "Moderate", "Intensive"];
const LEARNING_FORMATS = ["Live sessions", "Recorded content", "Practical projects", "Mixed"];

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20";
const textareaClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20";

function NotSet({ children }: { children: React.ReactNode }) {
  return <span className="text-slate-400">{children}</span>;
}

export default function LearningProfileCard() {
  const { user, loading, refresh } = useAuth();

  const [educationLevel, setEducationLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [learningPace, setLearningPace] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [learningFormat, setLearningFormat] = useState("");
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState("");
  const [certifications, setCertifications] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [shortTermGoals, setShortTermGoals] = useState("");
  const [longTermGoals, setLongTermGoals] = useState("");

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  function fillFromUser(u: Me) {
    setEducationLevel(u.educationLevel ?? "");
    setInstitution(u.institution ?? "");
    setFieldOfStudy(u.fieldOfStudy ?? "");
    setGradYear(u.gradYear ? String(u.gradYear) : "");
    setTargetRole(u.targetRole ?? "");
    setSkillLevel(u.skillLevel ?? "");
    setLearningPace(u.learningPace ?? "");
    setWeeklyHours(u.weeklyHours ? String(u.weeklyHours) : "");
    setLearningFormat(u.learningFormat ?? "");
    setInterests(u.interests ?? "");
    setSkills(u.skills ?? "");
    setCertifications(u.certifications ?? "");
    setLearningGoals(u.learningGoals ?? "");
    setShortTermGoals(u.shortTermGoals ?? "");
    setLongTermGoals(u.longTermGoals ?? "");
  }

  useEffect(() => {
    if (!user) return;
    fillFromUser(user);
  }, [user]);

  function cancelEdit() {
    if (user) fillFromUser(user);
    setEditing(false);
  }

  if (loading || !user) return <Spinner label="Loading learning profile…" />;

  async function save() {
    const year = gradYear ? Number(gradYear) : null;
    if (year !== null && (!Number.isInteger(year) || year < 1950 || year > 2100)) {
      notifyError("Enter a graduation year between 1950 and 2100.");
      return;
    }
    const hours = weeklyHours ? Number(weeklyHours) : null;
    if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > 60)) {
      notifyError("Weekly study time must be between 1 and 60 hours.");
      return;
    }
    setSaving(true);
    try {
      await apiPatch<{ user: Me }>("/auth/me", {
        educationLevel: educationLevel || null,
        institution: institution.trim() || null,
        fieldOfStudy: fieldOfStudy.trim() || null,
        gradYear: year,
        targetRole: targetRole.trim() || null,
        skillLevel: skillLevel || null,
        learningPace: learningPace || null,
        weeklyHours: hours,
        learningFormat: learningFormat || null,
        interests: interests.trim() || null,
        skills: skills.trim() || null,
        certifications: certifications.trim() || null,
        learningGoals: learningGoals.trim() || null,
        shortTermGoals: shortTermGoals.trim() || null,
        longTermGoals: longTermGoals.trim() || null,
      });
      await refresh();
      setEditing(false);
      notifySuccess("Learning profile saved.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not save your learning profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">Learning profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            Helps us recommend courses, learning paths, and mentors that fit you.
          </p>
        </div>
        {editing ? (
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            Cancel
          </Button>
        ) : (
          <button
            type="button"
            aria-label="Edit learning profile"
            onClick={() => setEditing(true)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-ink-600 transition hover:bg-slate-50 hover:text-ink-900"
          >
            <Edit fontSize="small" />
          </button>
        )}
      </div>

      {editing ? (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lp-education" className="mb-1 block text-sm font-semibold text-ink-700">
                Education level
              </label>
              <select id="lp-education" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} className={selectClass}>
                <option value="">Prefer not to say</option>
                {EDUCATION.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lp-field" className="mb-1 block text-sm font-semibold text-ink-700">
                Field of study
              </label>
              <Input id="lp-field" value={fieldOfStudy} maxLength={160} onChange={(e) => setFieldOfStudy(e.target.value)} />
            </div>
            <div>
              <label htmlFor="lp-institution" className="mb-1 block text-sm font-semibold text-ink-700">
                Institution
              </label>
              <Input id="lp-institution" value={institution} maxLength={160} onChange={(e) => setInstitution(e.target.value)} />
            </div>
            <div>
              <label htmlFor="lp-year" className="mb-1 block text-sm font-semibold text-ink-700">
                Graduation year
              </label>
              <Input id="lp-year" type="number" inputMode="numeric" min={1950} max={2100} value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
            </div>
            <div>
              <label htmlFor="lp-role" className="mb-1 block text-sm font-semibold text-ink-700">
                Target role
              </label>
              <Input id="lp-role" value={targetRole} maxLength={160} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Front-end developer" />
            </div>
            <div>
              <label htmlFor="lp-skill" className="mb-1 block text-sm font-semibold text-ink-700">
                Current skill level
              </label>
              <select id="lp-skill" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className={selectClass}>
                <option value="">Prefer not to say</option>
                {SKILL_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lp-pace" className="mb-1 block text-sm font-semibold text-ink-700">
                Learning pace
              </label>
              <select id="lp-pace" value={learningPace} onChange={(e) => setLearningPace(e.target.value)} className={selectClass}>
                <option value="">Prefer not to say</option>
                {LEARNING_PACES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lp-hours" className="mb-1 block text-sm font-semibold text-ink-700">
                Weekly study time (hours)
              </label>
              <Input id="lp-hours" type="number" inputMode="numeric" min={1} max={60} value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lp-format" className="mb-1 block text-sm font-semibold text-ink-700">
                Preferred learning format
              </label>
              <select id="lp-format" value={learningFormat} onChange={(e) => setLearningFormat(e.target.value)} className={selectClass}>
                <option value="">No preference</option>
                {LEARNING_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lp-interests" className="mb-1 block text-sm font-semibold text-ink-700">
                Interests &amp; preferred topics
              </label>
              <textarea
                id="lp-interests"
                value={interests}
                rows={3}
                maxLength={1000}
                onChange={(e) => setInterests(e.target.value)}
                className={textareaClass}
                placeholder="Separate topics with commas, e.g. web development, data science, design"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lp-skills" className="mb-1 block text-sm font-semibold text-ink-700">
                Existing skills &amp; areas to improve
              </label>
              <textarea id="lp-skills" value={skills} rows={3} maxLength={1000} onChange={(e) => setSkills(e.target.value)} className={textareaClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lp-certifications" className="mb-1 block text-sm font-semibold text-ink-700">
                Certifications or qualifications you&apos;d like to pursue
              </label>
              <textarea id="lp-certifications" value={certifications} rows={3} maxLength={1000} onChange={(e) => setCertifications(e.target.value)} className={textareaClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="lp-goals" className="mb-1 block text-sm font-semibold text-ink-700">
                Learning goals
              </label>
              <textarea
                id="lp-goals"
                value={learningGoals}
                rows={3}
                maxLength={2000}
                onChange={(e) => setLearningGoals(e.target.value)}
                className={textareaClass}
                placeholder="What you want to achieve overall"
              />
            </div>
            <div>
              <label htmlFor="lp-short" className="mb-1 block text-sm font-semibold text-ink-700">
                Short-term objectives
              </label>
              <textarea id="lp-short" value={shortTermGoals} rows={3} maxLength={1000} onChange={(e) => setShortTermGoals(e.target.value)} className={textareaClass} />
            </div>
            <div>
              <label htmlFor="lp-long" className="mb-1 block text-sm font-semibold text-ink-700">
                Long-term objectives
              </label>
              <textarea id="lp-long" value={longTermGoals} rows={3} maxLength={1000} onChange={(e) => setLongTermGoals(e.target.value)} className={textareaClass} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={() => void save()} loading={saving}>
              Save changes
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-ink-700">Education level</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{educationLevel || <NotSet>Prefer not to say</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Field of study</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{fieldOfStudy || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Institution</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{institution || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Graduation year</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{gradYear || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Target role</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{targetRole || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Current skill level</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{skillLevel || <NotSet>Prefer not to say</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Learning pace</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{learningPace || <NotSet>Prefer not to say</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Weekly study time (hours)</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{weeklyHours || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold text-ink-700">Preferred learning format</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{learningFormat || <NotSet>No preference</NotSet>}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold text-ink-700">Interests &amp; preferred topics</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{interests || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold text-ink-700">Existing skills &amp; areas to improve</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{skills || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold text-ink-700">Certifications or qualifications</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{certifications || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold text-ink-700">Learning goals</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{learningGoals || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Short-term objectives</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{shortTermGoals || <NotSet>Not set</NotSet>}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Long-term objectives</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{longTermGoals || <NotSet>Not set</NotSet>}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
