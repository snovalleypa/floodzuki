import React from "react"
import { observer } from "mobx-react-lite";
import { Image, ImageStyle } from "expo-image";

import { Card } from "@common-ui/components/Card";
import { Gage } from "@models/Gage";

import Config from "@config/config";

const GageImageCard = observer(
  function GageImageCard({ gage }: { gage: Gage }) {
    if (!gage?.locationInfo?.locationImages?.length) return null

    const imageUrl = Config.GAGE_IMAGE_BASE_URL + "medium/" + gage?.locationInfo?.locationImages[0]

    return (
      <Card flex minHeight={200} height={"100%"}>
        <Image
          style={$imageStyle}
          source={imageUrl}
          contentFit="contain"
          transition={1000}
        />
      </Card>
    )
  }
)

const $imageStyle: ImageStyle = {
  flex: 1,
  width: "100%",
  maxHeight: 400,
}

export default GageImageCard
