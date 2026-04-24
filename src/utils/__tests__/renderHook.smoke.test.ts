import { renderHook, act } from "@testing-library/react-native";
import { useState } from "react";

/**
 * This file only exists to verify @testing-library/react-native is correctly
 * installed and renderHook works in this project's jest environment.
 * It tests no app code — delete it once hook tests exist in other files.
 */
describe("@testing-library/react-native smoke test", () => {
  test("renderHook can mount a hook and read its state", () => {
    const { result } = renderHook(() => useState(0));

    expect(result.current[0]).toBe(0);
  });

  test("act correctly flushes state updates", () => {
    const { result } = renderHook(() => useState(0));

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
  });

  test("renderHook re-renders with new props", () => {
    const { result, rerender } = renderHook(
      ({ initial }: { initial: number }) => useState(initial),
      { initialProps: { initial: 10 } }
    );

    expect(result.current[0]).toBe(10);

    rerender({ initial: 99 });

    // state does not reset on rerender — initial prop is only used once
    expect(result.current[0]).toBe(10);
  });
});
