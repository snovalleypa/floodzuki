import { Card } from "@common-ui/components/Card";
import { SmallTitle } from "@common-ui/components/Text";
import { Gage } from "@models/Gage";
import React from "react";

interface GageSummaryProps {
  gage: Gage
}

export const GageSummary = (props: GageSummaryProps) => {
  const { gage } = props

  const gageTitle = "Gage Title"

  return (
    <Card height={100}>
      <SmallTitle>{gageTitle}</SmallTitle>
    </Card>
  )
}