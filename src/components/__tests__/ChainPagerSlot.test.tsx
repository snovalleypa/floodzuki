/**
 * @jest-environment jsdom
 */
import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

import { ChainPagerSlotContext, useChainPagerSlot } from "../ChainPagerSlot";

function SlotProbe() {
  const { isCurrent } = useChainPagerSlot();
  return <Text>{isCurrent ? "current" : "offscreen"}</Text>;
}

describe("ChainPagerSlot", () => {
  it("defaults to isCurrent=true when no provider is mounted", () => {
    const { getByText } = render(<SlotProbe />);
    expect(getByText("current")).toBeTruthy();
  });

  it("reflects the provider's value when wrapped", () => {
    const { getByText } = render(
      <ChainPagerSlotContext.Provider value={{ isCurrent: false }}>
        <SlotProbe />
      </ChainPagerSlotContext.Provider>
    );
    expect(getByText("offscreen")).toBeTruthy();
  });

  it("scopes per-slot when sibling providers carry different values", () => {
    const { getAllByText } = render(
      <>
        <ChainPagerSlotContext.Provider value={{ isCurrent: true }}>
          <SlotProbe />
        </ChainPagerSlotContext.Provider>
        <ChainPagerSlotContext.Provider value={{ isCurrent: false }}>
          <SlotProbe />
        </ChainPagerSlotContext.Provider>
      </>
    );
    expect(getAllByText("current")).toHaveLength(1);
    expect(getAllByText("offscreen")).toHaveLength(1);
  });
});
