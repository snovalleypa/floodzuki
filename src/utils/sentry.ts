import * as Sentry from "@sentry/react-native";

export const initSentry = () => {
  Sentry.init({
    dsn: "https://7580ac526eb64f2f811ba952bb9409f1@o4505126543360000.ingest.sentry.io/4505132726681600",
    debug: false,
  });
};

export const logError = (
  error: unknown,
  errorInfo: string | Record<string, unknown> | null = null
) => {
  Sentry.captureException(error, {
    extra: errorInfo as Record<string, unknown>,
  });
};
