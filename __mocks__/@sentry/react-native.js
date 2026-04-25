module.exports = {
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  withScope: jest.fn((cb) => cb({ setExtra: jest.fn() })),
  wrap: jest.fn((component) => component),
  ReactNativeTracing: jest.fn(),
  ReactNavigationInstrumentation: jest.fn(),
};
