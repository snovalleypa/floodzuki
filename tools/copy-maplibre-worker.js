/* global __dirname */
// Copies maplibre-gl's web worker next to the other static web assets so it is
// served from our own origin at /maplibre-gl-worker.mjs.
//
// Why: maplibre-gl 6 ships ESM-only and starts its worker from a real URL that
// it derives from `import.meta.url`. Under Metro that URL is not a usable
// location, so MapLibreWebGageMap.tsx tells maplibre where the worker lives via
// `setWorkerUrl()`. The copy is gitignored and re-made on every install so it
// can never drift from the installed maplibre-gl version.
//
// Runs from the `postinstall` script in package.json.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const dest = path.join(root, "public", "maplibre-gl-worker.mjs");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Copied maplibre-gl worker to ${path.relative(root, dest)}`);
