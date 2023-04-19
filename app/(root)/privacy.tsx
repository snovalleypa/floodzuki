import React from "react"
import { ErrorBoundaryProps, Stack } from "expo-router"
import { t } from "@i18n/translate"

import { Screen, Content } from "@common-ui/components/Screen"
import { HugeTitle, MediumTitle, RegularText } from "@common-ui/components/Text"
import { SimpleLinkButton } from "@common-ui/components/Button"
import { openLinkInBrowser } from "@utils/navigation"
import { ErrorDetails } from "@components/ErrorDetails"
import { Separator } from "@common-ui/components/Common"
import { Spacing } from "@common-ui/constants/spacing"

// We use this to wrap each screen with an error boundary
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorDetails {...props} />;
}

export const SVPALink = () => {
  return (
    <SimpleLinkButton text="svpa.us" onPress={() => openLinkInBrowser("https://svpa.us")} />
  )
}

export const FloodzillaLink = () => {
  return (
    <SimpleLinkButton text="floodzilla.com" onPress={() => openLinkInBrowser("https://floodzilla.com")} />
  )
}

const PrivacyPolicyScreen = () => {
  return (
    <Screen>
      <Stack.Screen options={{ title: `${t("common.title")} - ${t("homeScreen.title")}` }} />
      <Content scrollable>
        {/* SECTION */}
        <HugeTitle>Privacy Policy</HugeTitle>
        <Separator size={Spacing.small} />
        <RegularText>
          The Snoqualmie Valley Preservation Alliance (SVPA) places a high priority on protecting your privacy.
          This privacy policy was created in order to demonstrate the SVPA's firm commitment to the privacy of our website users.
          This policy explains what types of information is collected by the SVPA's <SVPALink /> and <FloodzillaLink /> websites, and how this information is used.{"\n\n"}
          
          What Personally Identifiable Information is Collected SVPA supporters and website users that register for our web services, events and individuals that sign up to receive SVPA e-communications voluntarily provide us with contact information (such as name, address, phone, and e-mail address).
          We may use this information for specific, limited purposes. You may always "opt out," either now or at any time in the future, if you do not wish to receive our messages.
        </RegularText>
        <Separator size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>
          IP addresses
        </MediumTitle>
        <Separator size={Spacing.small} />
        <RegularText>
          The SVPA uses your IP address to help diagnose problems with our server, to administer <SVPALink /> and <FloodzillaLink />, and for statistical metrics used to track website visitor traffic.
        </RegularText>
        <Separator size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>
          Cookies
        </MediumTitle>
        <Separator size={Spacing.small} />
        <RegularText>
          <SVPALink /> and <FloodzillaLink /> uses "cookie" messages to automatically help provide better services.
          They remind us who you are and your preferences for our website based on what you've done and told us before.
          The "cookie" is placed in your computer and is read when you come back to our website.
          Cookies let us take you to the information and features you're particularly interested in.
          They also let us track your usage of <SVPALink /> and <FloodzillaLink /> so we know which parts of our sites are most popular.
          You can reject cookies or cancel them by instructing your Web browser accordingly.
        </RegularText>
        <Separator size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>
          How Your Information May Be Used
        </MediumTitle>
        <Separator size={Spacing.small} />
        <RegularText>
          We use your personal information to provide you with personalized service; to send e-mail alerts to you; to answer your requests; etc.
          You may choose to opt out at any time, which will cease all communications from us. We may also use your information to track visitor of our website.
          This lets us see which of our features are the most popular so we can better serve our users' needs.
          It also lets us provide aggregate data about our traffic (not identifying you personally, but showing how many visitors used which features, for example) to outside parties.
        </RegularText>
        <Separator size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>
          Email Privacy
        </MediumTitle>
        <Separator size={Spacing.small} />
        <RegularText>
          The SVPA does not provide, sell, or rent email addresses to anyone outside the organization.
        </RegularText>
        <Separator size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>
          External Links
        </MediumTitle>
        <Separator size={Spacing.small} />
        <RegularText>
          <SVPALink /> and <FloodzillaLink /> include links to external websites.
          These links do not fall under the <SVPALink /> and <FloodzillaLink /> domain, and the SVPA is not responsible for the privacy practices or the content of external websites.
          Your use of any linked website is solely at your own risk.
        </RegularText>
        <Separator size={Spacing.large} />
        {/* SECTION */}
        <MediumTitle>
          Modifications
        </MediumTitle>
        <Separator size={Spacing.small} />
        <RegularText>
          We may amend this privacy policy from time to time; please review it periodically.
          We maintain the option to modify this privacy at any time by electronic notice posted on our website.
          Your continued use of our website after the date that such notices are posted will be deemed to be your agreement to the changed terms.
        </RegularText>
        <Separator size={Spacing.large} />
      </Content>
    </Screen>
  )
}

export default PrivacyPolicyScreen
