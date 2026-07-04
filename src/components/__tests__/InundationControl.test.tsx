import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import InundationControl from "../InundationControl";
import type { InundationLevel } from "../inundationOverlay";

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  // Return a readable unit for measure.ft; pass other keys through unchanged.
  useLocale: () => ({
    t: (key: string) => (key === "measure.ft" ? "ft" : key),
    locale: "en",
  }),
}));

jest.mock("@utils/utils", () => ({
  useUtils: () => ({ formatFlow: (n: number) => `${n} cfs` }),
}));

const levels: InundationLevel[] = [
  {
    key: "minor",
    label: { en: "Minor", es: "Menor" },
    cfs: 20000,
    feet: 53.69,
    url: "u1",
    roadClosuresUrl: null,
  },
  {
    key: "moderate",
    label: { en: "Moderate", es: "Moderada" },
    cfs: 32200,
    feet: 57.82,
    url: "u2",
    roadClosuresUrl: null,
  },
  {
    key: "major",
    label: { en: "Major", es: "Mayor" },
    cfs: 42500,
    feet: null,
    url: "u3",
    roadClosuresUrl: null,
  },
];

describe("InundationControl", () => {
  it("calls onSelect with the level key when a level is pressed", () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <InundationControl levels={levels} selectedKey={null} onSelect={onSelect} />
    );
    fireEvent.press(getByText("Moderate"));
    expect(onSelect).toHaveBeenCalledWith("moderate");
  });

  it("calls onSelect with null when None is pressed", () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <InundationControl levels={levels} selectedKey="minor" onSelect={onSelect} />
    );
    fireEvent.press(getByText("map.levelNone"));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("renders the cfs caption for each level", () => {
    const { getByText } = render(
      <InundationControl levels={levels} selectedKey={null} onSelect={jest.fn()} />
    );
    expect(getByText("20000 cfs")).toBeTruthy();
    expect(getByText("42500 cfs")).toBeTruthy();
  });

  it("renders the gauge height in feet to one decimal, omitting levels without a height", () => {
    const { getByText, getAllByText } = render(
      <InundationControl levels={levels} selectedKey={null} onSelect={jest.fn()} />
    );
    expect(getByText("53.7 ft")).toBeTruthy();
    expect(getByText("57.8 ft")).toBeTruthy();
    // major has feet: null, so only two height lines render.
    expect(getAllByText(/ ft$/).length).toBe(2);
  });

  it("opens the info popup when the info button is pressed", () => {
    const { getByLabelText, queryByText, getByText } = render(
      <InundationControl levels={levels} selectedKey={null} onSelect={jest.fn()} />
    );
    // Popup content is not rendered until the info button is pressed.
    expect(queryByText("map.info.intro")).toBeNull();
    fireEvent.press(getByLabelText("map.info.buttonLabel"));
    expect(getByText("map.info.intro")).toBeTruthy();
    expect(getByText("map.info.roadsNote")).toBeTruthy();
  });
});
