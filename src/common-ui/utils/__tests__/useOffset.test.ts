import { useOffsetStyles } from "../useOffset";
import { ViewStyle } from "react-native";

describe("useOffsetStyles", () => {
  it("returns input styles unchanged when no offset props given", () => {
    const base: ViewStyle[] = [{ flexDirection: "row" }];
    const result = useOffsetStyles([...base], {});
    expect(result).toEqual(base);
  });

  it("appends marginTop for top prop", () => {
    expect(useOffsetStyles([], { top: 8 })).toContainEqual({ marginTop: 8 });
  });

  it("appends marginBottom for bottom prop", () => {
    expect(useOffsetStyles([], { bottom: 16 })).toContainEqual({ marginBottom: 16 });
  });

  it("appends marginLeft and marginRight for horizontal prop", () => {
    const result = useOffsetStyles([], { horizontal: 12 });
    expect(result).toContainEqual({ marginLeft: 12, marginRight: 12 });
  });

  it("appends paddingTop and paddingBottom for innerVertical prop", () => {
    const result = useOffsetStyles([], { innerVertical: 12 });
    expect(result).toContainEqual({ paddingTop: 12, paddingBottom: 12 });
  });

  it("appends paddingLeft and paddingRight for innerHorizontal prop", () => {
    const result = useOffsetStyles([], { innerHorizontal: 8 });
    expect(result).toContainEqual({ paddingLeft: 8, paddingRight: 8 });
  });

  it("appends height for numeric height prop", () => {
    expect(useOffsetStyles([], { height: 100 })).toContainEqual({ height: 100 });
  });

  it("appends height for string height prop (e.g. percentage)", () => {
    expect(useOffsetStyles([], { height: "50%" })).toContainEqual({ height: "50%" });
  });

  it("appends width for width prop", () => {
    expect(useOffsetStyles([], { width: 200 })).toContainEqual({ width: 200 });
  });

  it("appends minHeight and maxHeight props", () => {
    const result = useOffsetStyles([], { minHeight: 40, maxHeight: 200 });
    expect(result).toContainEqual({ minHeight: 40 });
    expect(result).toContainEqual({ maxHeight: 200 });
  });

  it("preserves existing styles while appending new ones", () => {
    const base: ViewStyle[] = [{ backgroundColor: "red" }];
    const result = useOffsetStyles([...base], { top: 8, left: 4 });
    expect(result[0]).toEqual({ backgroundColor: "red" });
    expect(result).toContainEqual({ marginTop: 8 });
    expect(result).toContainEqual({ marginLeft: 4 });
  });
});
