import * as Sentry from "@sentry/react-native";
import { logError } from "../sentry";

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

describe("logError", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls Sentry.captureException with the error and extra info", () => {
    const error = new Error("test error");
    const info = { component: "TestComponent" };

    logError(error, info);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: info });
  });

  it("calls Sentry.captureException with null extra when errorInfo is omitted", () => {
    const error = new Error("bare error");

    logError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: null });
  });
});
