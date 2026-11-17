/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "jest",
  jest: {
    projectType: "custom",
    configFile: "package.json",
  },
  mutate: ["src/**/*.js", "!src/**/*.test.js"],
  reporters: ["clear-text", "progress", "html", "json"],
  htmlReporter: { fileName: "reports/mutation/mutation.html" },
  coverageAnalysis: "off",
  concurrency: 2,
  thresholds: { high: 80, low: 60, break: null },
};
