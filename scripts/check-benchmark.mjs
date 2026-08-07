import { readFile } from 'node:fs/promises';

const [, , baselinePath, ...currentPaths] = process.argv;
const regressionThreshold = 0.1;
const minimumRegressionMs = 0.006;

if (!baselinePath || currentPaths.length === 0) {
  console.error(
    'Usage: node scripts/check-benchmark.mjs <baseline> <current> [...current]',
  );
  process.exit(1);
}

const [baseline, ...currentRuns] = await Promise.all([
  readFile(baselinePath, 'utf8').then(JSON.parse),
  ...currentPaths.map((path) => readFile(path, 'utf8').then(JSON.parse)),
]);

const currentBenchmarkRuns = currentRuns.map(
  (current) =>
    new Map(
      current.files.flatMap((file) =>
        file.groups.flatMap((group) =>
          group.benchmarks.map((benchmark) => [benchmark.name, benchmark]),
        ),
      ),
    ),
);

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

let hasRegression = false;

for (const benchmark of baseline.benchmarks) {
  const results = currentBenchmarkRuns
    .map((run) => run.get(benchmark.name)?.mean)
    .filter((mean) => mean != null);

  if (results.length === 0) {
    console.error(`Missing benchmark: ${benchmark.name}`);
    hasRegression = true;
    continue;
  }

  const currentMean = median(results);
  const change = currentMean / benchmark.mean - 1;
  const absoluteChange = currentMean - benchmark.mean;
  const changePercent = (change * 100).toFixed(2);
  const isRegression =
    change > regressionThreshold && absoluteChange > minimumRegressionMs;

  console.log(
    `${isRegression ? 'FAIL' : 'PASS'} ${benchmark.name}: ${benchmark.mean.toFixed(4)}ms -> ${currentMean.toFixed(4)}ms (${changePercent}%)`,
  );

  hasRegression ||= isRegression;
}

if (hasRegression) {
  console.error(
    `Benchmark regression exceeds ${(regressionThreshold * 100).toFixed(0)}% and ${minimumRegressionMs}ms`,
  );
  process.exit(1);
}
