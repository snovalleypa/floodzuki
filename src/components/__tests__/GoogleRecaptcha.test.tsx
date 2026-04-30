import React from "react";
import { render } from "@testing-library/react-native";
import GoogleRecaptcha from "../GoogleRecaptcha";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { recaptchaKey: "test-key" },
    },
  },
}));

jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("react-native-recaptcha-that-works", () => "Recaptcha");

jest.mock("@common-ui/components/Conditional", () => ({
  Ternary: ({ condition, children }: { condition: boolean; children: React.ReactNode[] }) =>
    condition ? children[0] : children[1],
}));

jest.mock("@common-ui/utils/responsive", () => ({
  isWeb: false,
}));

jest.mock("@utils/sentry", () => ({
  logError: jest.fn(),
}));

describe("GoogleRecaptcha", () => {
  it("renders without crashing", () => {
    const onVerify = jest.fn();
    const onExpire = jest.fn();
    expect(() => render(<GoogleRecaptcha onVerify={onVerify} onExpire={onExpire} />)).not.toThrow();
  });
});
