// src/services/mockReplay/__tests__/timestamps.test.ts
import localDayJs from "@services/localDayJs";
import { toGaugeLocalString } from "../timestamps";

const TZ = "America/Los_Angeles";

describe("toGaugeLocalString", () => {
  it("formats an instant as naive gauge-local wall time", () => {
    // 2022-03-01 08:00 PST is 16:00 UTC.
    const ms = localDayJs.tz("2022-03-01T08:00:00", "YYYY-MM-DDTHH:mm:ss", TZ).valueOf();
    expect(toGaugeLocalString(ms, TZ)).toBe("2022-03-01T08:00:00");
  });
});
