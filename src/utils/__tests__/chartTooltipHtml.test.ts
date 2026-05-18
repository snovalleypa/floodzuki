import { buildGageTooltipHtml } from "../chartTooltipHtml";

const t = (key: string) => key;
const TZ = "America/Los_Angeles";

function makeGage(roadStatus: any = null): any {
  return {
    getCalculatedRoadStatus: () => roadStatus,
  };
}

describe("buildGageTooltipHtml", () => {
  it("renders an actual reading with no road status", () => {
    const html = buildGageTooltipHtml({
      gage: makeGage(),
      t,
      tz: TZ,
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      y: 10.872,
      isPrediction: false,
    });

    expect(html).toContain("statusLevelsCard.water");
    expect(html).toContain("statusLevelsCard.level");
    expect(html).toContain("10.87");
    expect(html).toContain("measure.ft");
    expect(html).not.toContain("statusLevelsCard.predicted");
    expect(html).not.toContain("calloutReading.roadSmall");
  });

  it("renders a predicted reading", () => {
    const html = buildGageTooltipHtml({
      gage: makeGage(),
      t,
      tz: TZ,
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      y: 4.5,
      isPrediction: true,
    });

    expect(html).toContain("statusLevelsCard.predicted");
    expect(html).not.toContain("statusLevelsCard.water");
  });

  it("includes the road status when getCalculatedRoadStatus returns one", () => {
    const html = buildGageTooltipHtml({
      gage: makeGage({ deltaFormatted: "1.5 ft.", preposition: "above" }),
      t,
      tz: TZ,
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      y: 10.0,
      isPrediction: false,
    });

    expect(html).toContain("1.5 ft.");
    expect(html).toContain("statusLevelsCard.above");
    expect(html).toContain("calloutReading.roadSmall");
  });

  it("formats the timestamp in the given timezone, not the system timezone", () => {
    // 2026-05-17T15:15:00Z is 08:15 in America/Los_Angeles.
    const html = buildGageTooltipHtml({
      gage: makeGage(),
      t,
      tz: TZ,
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      y: 10,
      isPrediction: false,
    });

    expect(html).toContain("8:15 AM");
    expect(html).toContain("Sun, May 17");
  });

  it("uses the .data-point CSS class so the WebView stylesheet can target it", () => {
    const html = buildGageTooltipHtml({
      gage: makeGage(),
      t,
      tz: TZ,
      x: Date.now(),
      y: 5,
      isPrediction: false,
    });

    expect(html).toContain('class="data-point"');
    expect(html).toContain('class="data-point-title"');
    expect(html).toContain('class="data-point-content"');
  });
});
