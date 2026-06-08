import { computeSnapTarget, resolveInitialIndex } from "../ChainPager.helpers";

describe("computeSnapTarget", () => {
  const SCREEN = 400;

  it("snaps back when neither threshold is crossed", () => {
    expect(computeSnapTarget(1, -50, 100, SCREEN, 3)).toBe(1);
  });

  it("snaps to next page when dragged past 40% of screen width to the left", () => {
    expect(computeSnapTarget(1, -200, 0, SCREEN, 3)).toBe(2);
  });

  it("snaps to previous page when dragged past 40% of screen width to the right", () => {
    expect(computeSnapTarget(1, 200, 0, SCREEN, 3)).toBe(0);
  });

  it("snaps to next page when flicked fast left even with small translation", () => {
    expect(computeSnapTarget(1, -10, -800, SCREEN, 3)).toBe(2);
  });

  it("snaps to previous page when flicked fast right even with small translation", () => {
    expect(computeSnapTarget(1, 10, 800, SCREEN, 3)).toBe(0);
  });

  it("clamps to 0 when at first page and swiping right", () => {
    expect(computeSnapTarget(0, 300, 800, SCREEN, 3)).toBe(0);
  });

  it("clamps to pagesLength - 1 when at last page and swiping left", () => {
    expect(computeSnapTarget(2, -300, -800, SCREEN, 3)).toBe(2);
  });

  it("uses velocity sign when both thresholds cross with conflicting directions", () => {
    // Dragged right (translation > threshold) but flicked fast left at release.
    // The flick wins.
    expect(computeSnapTarget(1, 200, -800, SCREEN, 3)).toBe(2);
  });
});

describe("resolveInitialIndex", () => {
  const pages = [{ key: "a" }, { key: "b" }, { key: "c" }];

  it("returns the index of a matching page", () => {
    expect(resolveInitialIndex(pages, "b")).toBe(1);
  });

  it("returns -1 when no page matches", () => {
    expect(resolveInitialIndex(pages, "z")).toBe(-1);
  });

  it("returns 0 for the first page", () => {
    expect(resolveInitialIndex(pages, "a")).toBe(0);
  });
});
