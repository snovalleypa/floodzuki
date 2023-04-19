/* eslint-disable camelcase */
import { TextStyle } from "react-native"
import { Colors } from "./colors"

import {
  OpenSans_300Light,
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from "@expo-google-fonts/open-sans"

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat"

export const customFontsToLoad = {
  OpenSans_300Light,
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
}

export const Fonts = {
  openSans: {
    // Cross-platform Google font.
    light: "OpenSans_300Light",
    normal: "OpenSans_400Regular",
    medium: "OpenSans_500Medium",
    semiBold: "OpenSans_600SemiBold",
    bold: "OpenSans_700Bold",
  },
  montserrat: {
    // Main Google font.
    normal: "Montserrat_400Regular",
    medium: "Montserrat_500Medium",
    semibold: "Montserrat_600SemiBold",
    bold: "Montserrat_700Bold",
  },
}

/**
 * Collection of text styles used in Text components.
 */

type TypographyType = {
  [key: string]: TextStyle
}

export const Typography: TypographyType = {
  hugeTitle: {
    fontFamily: Fonts.montserrat.bold,
    fontWeight: "700",
    fontSize: 32,
    lineHeight: 36,
    color: Colors.dark,
  },

  extraLargeTitle: {
    fontFamily: Fonts.montserrat.bold,
    fontWeight: "700",
    fontSize: 26,
    lineHeight: 30,
    color: Colors.dark,
  },

  largerTitle: {
    fontFamily: Fonts.montserrat.bold,
    fontWeight: "700",
    fontSize: 20,
    lineHeight: 24,
    color: Colors.dark,
  },

  largeTitle: {
    fontFamily: Fonts.montserrat.semibold,
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 22,
    color: Colors.dark,
  },

  mediumTitle: {
    fontFamily: Fonts.montserrat.semibold,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 20,
    color: Colors.dark,
  },

  smallTitle: {
    fontFamily: Fonts.montserrat.bold,
    fontWeight: "700",
    fontSize: 14,
    lineHeight: 18,
    color: Colors.dark,
  },

  mediumText: {
    fontFamily: Fonts.openSans.bold,
    fontWeight: "400",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.dark,
  },

  regularLargeText: {
    fontFamily: Fonts.openSans.normal,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: Colors.dark,
  },

  regularText: {
    fontFamily: Fonts.openSans.normal,
    fontWeight: "300",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.dark,
  },

  smallerText: {
    fontFamily: Fonts.openSans.normal,
    fontWeight: "300",
    fontSize: 12,
    lineHeight: 16,
    color: Colors.dark,
  },

  smallText: {
    fontFamily: Fonts.openSans.normal,
    fontWeight: "300",
    fontSize: 10,
    lineHeight: 14,
    color: Colors.dark,
  },

  tinyText: {
    fontFamily: Fonts.openSans.normal,
    fontWeight: "300",
    fontSize: 8,
    lineHeight: 10,
    color: Colors.dark,
  },

  labelText: {
    fontFamily: Fonts.openSans.bold,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
    color: Colors.darkGrey,
  },

  noLineHeight: {
    lineHeight: 1,
  },

  textLeft: {
    textAlign: "left",
  },

  textRight: {
    textAlign: "right",
  },

  textCenter: {
    textAlign: "center",
  },

  mutedText: {
    color: Colors.darkGrey,
  },

  disabledText: {
    color: Colors.darkGrey,
    opacity: 0.5,
  },
}
