/* eslint-disable no-undef */
// maplibre-gl 6 is ESM-only (no CommonJS entry), which Jest 29 cannot load from
// node_modules. The web map only imports the worker-URL helpers from it (the Map
// itself comes through @vis.gl/react-maplibre, which tests mock separately), so
// stub just those. Mapped in package.json "jest.moduleNameMapper".
module.exports = {
  getVersion: jest.fn(() => "0.0.0-test"),
  setWorkerUrl: jest.fn(),
  getWorkerUrl: jest.fn(() => ""),
};
