import React from "react"
import { Redirect } from "expo-router";
import { ROUTES } from "app/_layout";

export default function Index() {
  return <Redirect href={ROUTES.Gages} />;
};
