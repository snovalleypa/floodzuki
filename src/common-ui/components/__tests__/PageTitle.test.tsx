import React from "react";
import { render } from "@testing-library/react-native";

import PageTitle from "../PageTitle";

// Head renders its children through unchanged so we can inspect the <title>.
jest.mock("expo-router/head", () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({
    t: (key: string) => (key === "common.title" ? "Floodzilla Gauge Network" : key),
  }),
}));

jest.mock("@common-ui/utils/responsive", () => ({ isWeb: true }));

describe("PageTitle", () => {
  it("renders '<name> — <brand>' when a name is provided", () => {
    const tree = JSON.stringify(render(<PageTitle name="Forecast" />).toJSON());
    expect(tree).toContain("Forecast - Floodzilla Gauge Network");
  });

  it("renders brand only when name is omitted", () => {
    const tree = JSON.stringify(render(<PageTitle />).toJSON());
    expect(tree).toContain("Floodzilla Gauge Network");
    expect(tree).not.toContain(" — ");
  });
});
