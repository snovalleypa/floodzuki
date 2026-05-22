/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react-native";

import { GageSummaryCard } from "../GageSummaryCard";

// --- Mocks (kept minimal: just enough that the chevron Row renders) ---

jest.mock("mobx-react-lite", () => ({
  observer: (fn: any) => fn,
}));

jest.mock("@models/helpers/useStores", () => ({
  useStores: () => ({
    forecastsStore: { getForecast: () => null },
    getTimezone: () => "America/Los_Angeles",
  }),
}));

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (k: string) => k }),
}));

jest.mock("@common-ui/utils/responsive", () => ({
  useResponsive: () => ({ isWideScreen: false, isMobile: false }),
}));

jest.mock("@utils/useTimeout", () => ({ useTimeout: jest.fn() }));

jest.mock("@utils/utils", () => ({
  useUtils: () => ({
    formatFlow: () => "",
    formatFlowTrend: () => "",
    formatHeight: () => "",
  }),
}));

jest.mock("@utils/navigation", () => ({ openLinkInBrowser: jest.fn() }));

jest.mock("@common-ui/components/Card", () => {
  const React = require("react");
  const Pass = ({ children }: any) => React.createElement(React.Fragment, null, children ?? null);
  return { Card: Pass, CardFooter: Pass };
});

jest.mock("@common-ui/components/Common", () => {
  const React = require("react");
  const Pass = ({ children }: any) => React.createElement(React.Fragment, null, children ?? null);
  return { Cell: Pass, Row: Pass, RowOrCell: Pass };
});

jest.mock("@common-ui/components/Conditional", () => {
  const React = require("react");
  return {
    If: ({ condition, children }: any) => (condition ? children : null),
    Ternary: ({ condition, children }: any) => {
      const arr = React.Children.toArray(children);
      return condition ? arr[0] ?? null : arr[1] ?? null;
    },
  };
});

jest.mock("@common-ui/components/Text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Pass = ({ children }: any) => React.createElement(Text, null, children ?? null);
  return {
    LabelText: Pass,
    SmallerText: Pass,
    SmallText: Pass,
    SmallTitle: Pass,
    MediumText: Pass,
    RegularText: Pass,
  };
});

// IconButton renders its title as plain text so we can find it with getByText.
jest.mock("@common-ui/components/Button", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const Pass = ({ title }: any) => React.createElement(Text, null, title);
  return { IconButton: Pass, LinkButton: Pass };
});

// Link strips itself; chevron Buttons rendered inside are what we assert on.
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    Link: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock("app/_layout", () => ({
  ROUTES: { ForecastDetails: "/forecast/[id]", GageDetails: "/gage/[id]" },
}));

const baseGage = { id: "USGS-X", title: "Test Gage", isMetagage: false, nwrfcId: "X" };

describe("GageSummaryCard chevrons", () => {
  it("shows the Details link when noDetails is false", () => {
    const { queryByText } = render(<GageSummaryCard gage={baseGage as any} />);
    expect(queryByText("forecastScreen.details")).not.toBeNull();
    expect(queryByText("forecastScreen.viewGage")).toBeNull();
  });

  it("shows the View Gage link when noDetails is true and not a metagage", () => {
    const { queryByText } = render(<GageSummaryCard gage={baseGage as any} noDetails />);
    expect(queryByText("forecastScreen.details")).toBeNull();
    expect(queryByText("forecastScreen.viewGage")).not.toBeNull();
  });

  it("shows neither link when noDetails is true and the gage is a metagage", () => {
    const metagage = { ...baseGage, isMetagage: true };
    const { queryByText } = render(<GageSummaryCard gage={metagage as any} noDetails />);
    expect(queryByText("forecastScreen.details")).toBeNull();
    expect(queryByText("forecastScreen.viewGage")).toBeNull();
  });

  it("still shows the Details link when onPress is provided (forecast home pattern)", () => {
    const { queryByText } = render(<GageSummaryCard gage={baseGage as any} onPress={jest.fn()} />);
    expect(queryByText("forecastScreen.details")).not.toBeNull();
  });
});
