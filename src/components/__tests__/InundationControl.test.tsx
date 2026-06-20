import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import InundationControl from "../InundationControl";
import type { InundationLevel } from "../inundationOverlay";

jest.mock("@common-ui/contexts/LocaleContext", () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

jest.mock("@utils/utils", () => ({
  useUtils: () => ({ formatFlow: (n: number) => `${n} cfs` }),
}));

const levels: InundationLevel[] = [
  { key: "minor", labelTx: "map.levelMinor", cfs: 20000, url: "u1" },
  { key: "moderate", labelTx: "map.levelModerate", cfs: 32200, url: "u2" },
  { key: "major", labelTx: "map.levelMajor", cfs: 42500, url: "u3" },
];

describe("InundationControl", () => {
  it("calls onSelect with the level key when a level is pressed", () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <InundationControl levels={levels} selectedKey={null} onSelect={onSelect} />
    );
    fireEvent.press(getByText("map.levelModerate"));
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
});
