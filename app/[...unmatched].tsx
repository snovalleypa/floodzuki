import React from "react";
import { Redirect } from "expo-router";
import { ROUTES } from "./_layout";

/**
 * Expo router handler for any 404s
 * just redirects to the home page
 */

export default function Unmatched() {
  return <Redirect href={ROUTES.Home} />;
};
