import assert from "node:assert";
import { judgeJavascript } from "../src/lib/judge.js";

const tests = [
  { input: [2, 3], expected: 5 },
  { input: [-1, 1], expected: 0 },
];

assert.equal(judgeJavascript("function solve(a, b) { return a + b; }", tests).result, "ACCEPTED");
assert.equal(judgeJavascript("function solve(a, b) { return a - b; }", tests).result, "WRONG_ANSWER");
assert.equal(judgeJavascript("function solve() { throw new Error('boom'); }", tests).result, "RUNTIME_ERROR");
assert.equal(judgeJavascript("function solve(a, b) { while (true) {} }", tests).result, "TIME_LIMIT");

console.log("judge self-check OK");