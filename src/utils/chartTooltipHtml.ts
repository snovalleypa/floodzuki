import localDayJs from "@services/localDayJs";
import { Gage } from "@models/Gage";

type TFn = (key: string, vars?: Record<string, any>) => string;

export function buildForecastTooltipHtml(args: {
  tz: string;
  seriesName: string;
  x: number;
  y: number;
  stage?: number;
}): string {
  const { tz, seriesName, x, y, stage } = args;

  const stageDisplay = stage != null ? `/ ${stage} ft` : "";
  const timeLabel = localDayJs(x).tz(tz).format("MMM D, h:mm A");

  return `<b>${seriesName}</b><br/>${timeLabel}: ${y} cfs ${stageDisplay}`;
}

export function buildGageTooltipHtml(args: {
  gage: Gage;
  t: TFn;
  tz: string;
  x: number;
  waterLevel?: number | null;
  waterDischarge?: number | null;
  isPrediction: boolean;
  /** Overrides the level-line title (e.g. "Trending" for the trend nowcast line). */
  levelTitle?: string;
}): string {
  const { gage, t, tz, x, waterLevel, waterDischarge, isPrediction, levelTitle } = args;

  const roadStatus = waterLevel != null ? gage?.getCalculatedRoadStatus(waterLevel) : null;

  let roadDesc = "";
  if (roadStatus) {
    roadDesc = `<br />
      <span class="data-point-content">${roadStatus.delta.toFixed(1)} ${t("measure.ft")}</span>
      <span class="data-point-title"> ${t(`${roadStatus.preposition}`)} ${t(
      "calloutReading.roadSmall"
    )}</span>`;
  }

  const titleKey =
    levelTitle ?? (isPrediction ? t("statusLevelsCard.predicted") : t("statusLevelsCard.water"));

  let levelLine = "";
  if (waterLevel != null) {
    levelLine = `
      <span class="data-point-title">${titleKey} ${t("statusLevelsCard.level")}: </span>
      <span class="data-point-content">
        ${waterLevel.toFixed(2)} ${t("measure.ft")}
      </span>
      <br />`;
  }

  let flowLine = "";
  if (waterDischarge != null) {
    const flowFormatted = waterDischarge.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
    flowLine = `
      <span class="data-point-title">${t("gageChart.flow")}: </span>
      <span class="data-point-content">
        ${flowFormatted} ${t("measure.cfs")}
      </span>
      <br />`;
  }

  return ` <div class="data-point">
      ${levelLine}
      ${flowLine}
      <span class="data-point-content">
        ${localDayJs(x).tz(tz).format("ddd, MMM D, h:mm A")}
      </span>
      ${roadDesc}
    </div>`;
}
