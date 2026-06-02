import { buildGageTooltipHtml, buildForecastTooltipHtml } from "../chartTooltipHtml";

const t = (key: string) => key;
const TZ = "America/New_York";

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
      waterLevel: 10.872,
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
      waterLevel: 4.5,
      isPrediction: true,
    });

    expect(html).toContain("statusLevelsCard.predicted");
    expect(html).not.toContain("statusLevelsCard.water");
  });

  it("includes the road status when getCalculatedRoadStatus returns one", () => {
    const html = buildGageTooltipHtml({
      gage: makeGage({ delta: 1.5, preposition: "statusLevelsCard.above" }),
      t,
      tz: TZ,
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      waterLevel: 10.0,
      isPrediction: false,
    });

    expect(html).toContain("1.5");
    expect(html).toContain("measure.ft");
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
      waterLevel: 10,
      isPrediction: false,
    });

    expect(html).toContain("11:15 AM");
    expect(html).toContain("Sun, May 17");
  });

  it("uses the .data-point CSS class so the WebView stylesheet can target it", () => {
    const html = buildGageTooltipHtml({
      gage: makeGage(),
      t,
      tz: TZ,
      x: Date.now(),
      waterLevel: 5,
      isPrediction: false,
    });

    expect(html).toContain('class="data-point"');
    expect(html).toContain('class="data-point-title"');
    expect(html).toContain('class="data-point-content"');
  });

  it("includes both water level and flow lines when both values are provided", () => {
    const html = buildGageTooltipHtml({
      gage: makeGage(),
      t,
      tz: TZ,
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      waterLevel: 10.5,
      waterDischarge: 5678,
      isPrediction: false,
    });

    expect(html).toContain("10.50");
    expect(html).toContain("measure.ft");
    expect(html).toContain("gageChart.flow");
    expect(html).toContain("5,678");
    expect(html).toContain("measure.cfs");
  });

  it("omits the flow line when waterDischarge is undefined", () => {
    const html = buildGageTooltipHtml({
      gage: makeGage(),
      t,
      tz: TZ,
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      waterLevel: 10.5,
      isPrediction: false,
    });

    expect(html).not.toContain("gageChart.flow");
    expect(html).not.toContain("measure.cfs");
  });

  it("uses waterLevel (not waterDischarge) to compute road status", () => {
    const getCalculatedRoadStatus = jest.fn(() => ({
      delta: 1.0,
      preposition: "statusLevelsCard.above",
    }));
    const gage: any = { getCalculatedRoadStatus };

    buildGageTooltipHtml({
      gage,
      t,
      tz: TZ,
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      waterLevel: 12.34,
      waterDischarge: 5000,
      isPrediction: false,
    });

    expect(getCalculatedRoadStatus).toHaveBeenCalledWith(12.34);
  });
});

describe("buildForecastTooltipHtml", () => {
  it("renders a forecast point without stage", () => {
    const html = buildForecastTooltipHtml({
      tz: TZ,
      seriesName: "Observed: Below the Falls",
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      y: 258,
    });

    expect(html).toContain("<b>Observed: Below the Falls</b>");
    expect(html).toContain("258");
    expect(html).toContain("cfs");
    expect(html).not.toContain("ft");
  });

  it("renders a forecast point with stage when provided", () => {
    const html = buildForecastTooltipHtml({
      tz: TZ,
      seriesName: "Forecast: Carnation",
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      y: 461.79,
      stage: 44.77,
    });

    expect(html).toContain("461.79");
    expect(html).toContain("44.77");
    expect(html).toContain("cfs");
    expect(html).toContain("ft");
  });

  it("formats the timestamp in the given timezone", () => {
    const html = buildForecastTooltipHtml({
      tz: TZ,
      seriesName: "Observed: Boston",
      x: new Date("2026-05-17T15:15:00Z").valueOf(),
      y: 100,
    });

    expect(html).toContain("May 17");
    expect(html).toContain("11:15 AM");
  });
});
