import { renderHook, act } from "@testing-library/react-native";
import { useInterval, useTimeout } from "../useTimeout";

describe("useInterval", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calls the callback repeatedly at the given interval", () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 1000));

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("does not call the callback when delay is null", () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, null));

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("uses the latest callback after re-render without re-starting the interval", () => {
    const first = jest.fn();
    const second = jest.fn();

    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: first },
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ cb: second });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("clears the interval on unmount", () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    unmount();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("useTimeout", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calls the callback once after the given delay", () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, 500));

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call the callback when delay is null", () => {
    const callback = jest.fn();
    renderHook(() => useTimeout(callback, null));

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("clears the timeout on unmount", () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    unmount();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(callback).not.toHaveBeenCalled();
  });
});
