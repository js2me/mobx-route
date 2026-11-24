import { readFile, writeFile } from 'node:fs/promises';

const baselinePath = 'benchmark-baseline.json';
const args = process.argv.slice(2);
const [outputPath, ...resultPaths] =
  args[0] === '--output' ? args.slice(1) : [baselinePath, ...args];

if (!outputPath || resultPaths.length === 0) {
  console.error(
    'Usage: node scripts/update-benchmark-baseline.mjs [--output <baseline.json>] <benchmark-results.json> [...results]',
  );
  process.exit(1);
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const readBenchmarks = async (path) => {
  const result = JSON.parse(await readFile(path, 'utf8'));
  return result.files.flatMap((file) =>
    file.groups.flatMap((group) => group.benchmarks),
  );
};

const [baseline, ...resultRuns] = await Promise.all([
  readFile(baselinePath, 'utf8').then(JSON.parse),
  ...resultPaths.map(readBenchmarks),
]);

const meansByName = new Map();

for (const benchmarks of resultRuns) {
  for (const benchmark of benchmarks) {
    const means = meansByName.get(benchmark.name) ?? [];
    means.push(benchmark.mean);
    meansByName.set(benchmark.name, means);
  }
}

const baselineNames = new Set(
  baseline.benchmarks.map((benchmark) => benchmark.name),
);
const updatedNames = new Set(
  [...meansByName.keys()].filter((name) => baselineNames.has(name)),
);
const benchmarks = [...meansByName].map(([name, means]) => ({
  name,
  mean: median(means),
}));

await writeFile(outputPath, `${JSON.stringify({ benchmarks }, null, 2)}\n`);

console.log(`Updated ${updatedNames.size} baseline benchmarks.`);
console.log(`Added ${benchmarks.length - updatedNames.size} new benchmarks.`);
console.log(
  `Removed ${baseline.benchmarks.length - updatedNames.size} stale benchmarks.`,
);
