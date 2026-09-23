import vm from "node:vm";
import assert from "node:assert";
import { performance } from "node:perf_hooks";

export type JudgeVerdict = "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT" | "RUNTIME_ERROR";

export interface TestCase {
  input: unknown[];
  expected: unknown;
}

export interface JudgeResult {
  result: JudgeVerdict;
  runtimeMs: number;
  detail: string;
}

const TIME_LIMIT_MS = 1_500;

/**
 * Judge a student's JavaScript `solve(...)` implementation against the
 * problem's test cases. Runs in an isolated vm context with a hard time
 * budget and no access to the filesystem, network, or process.
 *
 * Ceiling: node:vm is a robustness boundary, not a hard security sandbox —
 * swap this for a containerised judge (Docker/gVisor) if untrusted code
 * ever runs on shared production hardware.
 */
export function judgeJavascript(code: string, tests: TestCase[]): JudgeResult {
  const sandbox: Record<string, unknown> = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    deepEqual: assert.deepStrictEqual,
    performanceNow: () => performance.now(),
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    Promise,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
  };
  const context = vm.createContext(sandbox);

  // `solve(...)` runs OUTSIDE any try block so both runtime errors and the vm
  // timeout surface through runInContext and can be classified correctly.
  const harness = `
    const __tests = ${JSON.stringify(tests)};
    const __out = [];
    const __start = performanceNow();
    for (const __t of __tests) {
      const __s = performanceNow();
      const __got = solve(...__t.input);
      const __ms = performanceNow() - __s;
      let __ok = true;
      try { deepEqual(__got, __t.expected); } catch { __ok = false; }
      __out.push({ ok: __ok, ms: Math.round(__ms) });
    }
    __out.push({ _totalMs: Math.round(performanceNow() - __start) });
    JSON.stringify(__out);
  `;

  const started = performance.now();
  let payload: string;
  try {
    payload = vm.runInContext(code + "\n;\n" + harness, context, { timeout: TIME_LIMIT_MS });
  } catch (err) {
    const runtimeMs = Math.round(performance.now() - started);
    if (isTimeoutError(err)) {
      return { result: "TIME_LIMIT", runtimeMs: Math.max(runtimeMs, TIME_LIMIT_MS), detail: `Exceeded ${TIME_LIMIT_MS}ms time limit` };
    }
    return { result: "RUNTIME_ERROR", runtimeMs, detail: errorMessage(err) };
  }

  try {
    const rows = JSON.parse(payload) as Array<{ ok?: boolean; _totalMs?: number }>;
    const totalMs = rows.find((r) => r._totalMs !== undefined)?._totalMs ?? 0;
    const verdicts = rows.filter((r) => r.ok !== undefined);
    const passed = verdicts.filter((r) => r.ok).length;
    const detail = `${passed}/${verdicts.length} test cases passed`;
    return {
      result: passed === verdicts.length ? "ACCEPTED" : "WRONG_ANSWER",
      runtimeMs: totalMs,
      detail,
    };
  } catch {
    return { result: "RUNTIME_ERROR", runtimeMs: 0, detail: "Judge produced unreadable output" };
  }
}

// The vm timeout error is created in the context's realm, so `instanceof Error`
// fails here — match on its shape instead.
function isTimeoutError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  return (
    (err as { code?: string }).code === "ERR_SCRIPT_EXECUTION_TIMEOUT" ||
    /execution timed out/i.test((err as { message?: string }).message ?? "")
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "Code failed to run";
}