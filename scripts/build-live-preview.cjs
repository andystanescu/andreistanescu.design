const path = require("node:path");
const { webpack } = require("next/dist/compiled/webpack/webpack");
webpack({ mode: "none", optimization: { minimize: false }, target: "web", plugins: [new webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify("production") })], entry: path.resolve(__dirname, "live-preview-runtime.cjs"), output: { path: path.resolve(__dirname, "../public/assets"), filename: "live-component-runtime.js" }, performance: { hints: false } }, (error, stats) => {
  if (error || stats.hasErrors()) { console.error(error || stats.toString({ all: false, errors: true })); process.exitCode = 1; }
});
