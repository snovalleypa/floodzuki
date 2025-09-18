import { isWeb } from '@common-ui/utils/responsive';
import * as Sentry from 'sentry-expo';

export const initSentry = () => {
  Sentry.init({
    dsn: "https://7580ac526eb64f2f811ba952bb9409f1@o4505126543360000.ingest.sentry.io/4505132726681600",
    enableInExpoDevelopment: false,
    debug: false, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  });
}

export const logError = (error, errorInfo = null) => {
  if (isWeb) {
    Sentry.Browser.captureException(error, {
      extra: errorInfo,
    });
  }
  else {
    Sentry.Native.captureException(error, {
      extra: errorInfo,
    });
  }
}
