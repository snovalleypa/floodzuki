import * as Sentry from "@sentry/react-native";

type CaptureExceptionError = Parameters<typeof Sentry.captureException>[0];
type CaptureExceptionHint = NonNullable<Parameters<typeof Sentry.captureException>[1]>;
type CaptureExceptionExtraFromHint<T> = T extends { extra?: infer Extra } ? Extra : never;
type CaptureExceptionExtra = NonNullable<CaptureExceptionExtraFromHint<CaptureExceptionHint>>;

export const initSentry = () => {
  Sentry.init({
    dsn: "https://7580ac526eb64f2f811ba952bb9409f1@o4505126543360000.ingest.sentry.io/4505132726681600",
    debug: false,
  });
};

export const logError = (
  error: CaptureExceptionError,
  errorInfo: string | CaptureExceptionExtra | null = null
) => {
  Sentry.captureException(error, {
    extra: errorInfo as CaptureExceptionExtra,
  });
};
