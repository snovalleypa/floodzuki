import { Colors } from "@common-ui/constants/colors";
import { GageChartDataType } from "@models/Gage";
import { buildThresholdPlotLines } from "../useGageChartOptions";

const t = (key: string) => key;
const LEVEL = GageChartDataType.LEVEL;
const DISCHARGE = GageChartDataType.DISCHARGE;

const roadGage: any = {
  hasRoads: true,
  roads: [{ elevation: 66.34, name: "NE Carnation Farm Road" }],
  redStage: 60,
};

const noRoadGage: any = {
  hasRoads: false,
  roads: [{ elevation: undefined, name: undefined }],
  redStage: 54.2,
};

const noThresholdGage: any = {
  hasRoads: false,
  roads: [{ elevation: undefined, name: undefined }],
  redStage: undefined,
};

describe("buildThresholdPlotLines", () => {
  it("renders the road line for gauges with a road", () => {
    const lines = buildThresholdPlotLines(roadGage, t, LEVEL);
    expect(lines).toHaveLength(1);
    expect(lines[0].value).toBe(66.34);
    expect(lines[0].color).toBe(Colors.primary);
    expect(lines[0].label.text).toBe("NE Carnation Farm Road");
  });

  it("renders a Flooding line at the red stage for gauges without a road", () => {
    const lines = buildThresholdPlotLines(noRoadGage, t, LEVEL);
    expect(lines).toHaveLength(1);
    expect(lines[0].value).toBe(54.2);
    expect(lines[0].color).toBe(Colors.primary);
    expect(lines[0].label.text).toBe("gageChart.flooding");
  });

  it("styles the flooding line identically to the road line, color included", () => {
    const [road] = buildThresholdPlotLines(roadGage, t, LEVEL);
    const [flooding] = buildThresholdPlotLines(noRoadGage, t, LEVEL);
    expect(flooding.color).toBe(road.color);
    expect(flooding.dashStyle).toBe(road.dashStyle);
    expect(flooding.label.align).toBe(road.label.align);
    expect(flooding.label.x).toBe(road.label.x);
    expect(flooding.label.style.color).toBe(road.label.style.color);
    expect(flooding.label.style.fontSize).toBe(road.label.style.fontSize);
    expect(flooding.label.style.fontFamily).toBe(road.label.style.fontFamily);
  });

  it("keeps the line but drops the label on flow (discharge) charts", () => {
    const road = buildThresholdPlotLines(roadGage, t, DISCHARGE);
    expect(road).toHaveLength(1);
    expect(road[0].value).toBe(66.34);
    expect(road[0].color).toBe(Colors.primary);
    expect(road[0].label).toBeUndefined();

    const flooding = buildThresholdPlotLines(noRoadGage, t, DISCHARGE);
    expect(flooding).toHaveLength(1);
    expect(flooding[0].label).toBeUndefined();
  });

  it("renders nothing when the gauge has neither a road nor a red stage", () => {
    expect(buildThresholdPlotLines(noThresholdGage, t, LEVEL)).toHaveLength(0);
  });

  it("renders nothing for a missing gage", () => {
    expect(buildThresholdPlotLines(undefined, t, LEVEL)).toHaveLength(0);
  });
});
