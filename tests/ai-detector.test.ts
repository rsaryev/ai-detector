import { expect, test } from "bun:test";
import fs from "fs";
import { createDetector } from "../src/detector.js";

test("AI detector", async () => {
  const aiQuickSort = fs.readFileSync(
    process.cwd() + "/tests/code/ai-quick-sort.ts",
    "utf8"
  );
  const humanQuickSort = fs.readFileSync(
    process.cwd() + "/tests/code/human-quick-sort.ts",
    "utf8"
  );
  const detector = createDetector();
  const [aiQuickSortResult, humanQuickSortResult] = await Promise.all([
    detector.detect(aiQuickSort),
    detector.detect(humanQuickSort),
  ]);

  console.log(`AI: ${aiQuickSortResult}%`);
  console.log(`Human: ${humanQuickSortResult}%`);

  expect(aiQuickSortResult).toBeGreaterThan(50);
  expect(humanQuickSortResult).toBeLessThan(50);
});
