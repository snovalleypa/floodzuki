import localDayJs from "@services/localDayJs";
import { Gage } from "@models/Gage";

type TFn = (key: string, vars?: Record<string, any>) => string;

export function buildGageTooltipHtml(args: {
  gage: Gage;
  t: TFn;
  tz: string;
  x: number;
  y: number;
  isPrediction: boolean;
}): string {
  const { gage, t, tz, x, y, isPrediction } = args;

  const roadStatus = gage?.getCalculatedRoadStatus(y);

  let roadDesc = "";
  if (roadStatus) {
    roadDesc = `<br />
      <span class="data-point-content">${roadStatus.deltaFormatted}</span>
      <span class="data-point-title"> ${t(`statusLevelsCard.${roadStatus.preposition}`)} ${t(
      "calloutReading.roadSmall"
    )}</span>`;
  }

  const titleKey = isPrediction ? t("statusLevelsCard.predicted") : t("statusLevelsCard.water");

  return ` <div class="data-point">
      <span class="data-point-title">${titleKey} ${t("statusLevelsCard.level")}: </span>
      <span class="data-point-content">
        ${y?.toFixed(2)} ${t("measure.ft")}.
      </span>
      <br />
      <span class="data-point-content">
        ${localDayJs(x).tz(tz).format("ddd, MMM D, h:mm A")}
      </span>
      ${roadDesc}
    </div>`;
}
