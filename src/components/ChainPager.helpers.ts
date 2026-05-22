const VELOCITY_THRESHOLD = 500;
const POSITION_FRACTION = 0.4;

export function computeSnapTarget(
  currentIndex: number,
  translationX: number,
  velocityX: number,
  screenWidth: number,
  pagesLength: number
): number {
  "worklet";
  const positionThreshold = screenWidth * POSITION_FRACTION;
  const flickedFast = Math.abs(velocityX) > VELOCITY_THRESHOLD;
  const draggedFar = Math.abs(translationX) > positionThreshold;

  let target = currentIndex;
  if (draggedFar || flickedFast) {
    // Velocity wins if available — matches typical iOS pager feel.
    const driver = flickedFast ? velocityX : translationX;
    const direction = driver < 0 ? 1 : -1;
    target = currentIndex + direction;
  }
  return Math.max(0, Math.min(pagesLength - 1, target));
}

export function resolveInitialIndex<T extends { key: string }>(
  pages: T[],
  currentKey: string
): number {
  return pages.findIndex((p) => p.key === currentKey);
}
