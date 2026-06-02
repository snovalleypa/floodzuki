export type FlexProp = boolean | number | string;

export function resolveFlexValue(flex: FlexProp): number {
  if (typeof flex === "boolean") {
    return 1;
  }
  if (typeof flex === "string") {
    return parseFloat(flex);
  }
  return flex;
}
