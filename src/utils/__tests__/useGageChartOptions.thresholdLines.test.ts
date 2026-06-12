import { Colors } from "@common-ui/constants/colors";
import { buildThresholdPlotLines } from "../useGageChartOptions";

const t = (key: string) => key;

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
    const lines = buildThresholdPlotLines(roadGage, t);
    expect(lines).toHaveLength(1);
    expect(lines[0].value).toBe(66.34);
    expect(lines[0].color).toBe(Colors.primary);
    expect(lines[0].label.text).toBe("NE Carnation Farm Road");
  });

  it("renders a red Flooding line at the red stage for gauges without a road", () => {
    const lines = buildThresholdPlotLines(noRoadGage, t);
    expect(lines).toHaveLength(1);
    expect(lines[0].value).toBe(54.2);
    expect(lines[0].color).toBe(Colors.red);
    expect(lines[0].label.text).toBe("gageChart.flooding");
  });

  it("styles the flooding line identically to the road line apart from color/label", () => {
    const [road] = buildThresholdPlotLines(roadGage, t);
    const [flooding] = buildThresholdPlotLines(noRoadGage, t);
    expect(flooding.dashStyle).toBe(road.dashStyle);
    expect(flooding.label.align).toBe(road.label.align);
    expect(flooding.label.x).toBe(road.label.x);
    expect(flooding.label.style.fontSize).toBe(road.label.style.fontSize);
    expect(flooding.label.style.fontFamily).toBe(road.label.style.fontFamily);
  });

  it("renders nothing when the gauge has neither a road nor a red stage", () => {
    expect(buildThresholdPlotLines(noThresholdGage, t)).toHaveLength(0);
  });

  it("renders nothing for a missing gage", () => {
    expect(buildThresholdPlotLines(undefined, t)).toHaveLength(0);
  });
});
