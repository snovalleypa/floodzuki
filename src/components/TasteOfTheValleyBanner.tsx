import React from 'react';
import localDayJs from '@services/localDayJs';
import { Image } from 'expo-image';

import { Cell, Row } from '@common-ui/components/Common';
import { useAppAssets } from '@common-ui/contexts/AssetsContext';
import { Spacing } from '@common-ui/constants/spacing';
import { Card } from '@common-ui/components/Card';
import { Link } from 'expo-router';
import { If } from '@common-ui/components/Conditional';
import { useResponsive } from '@common-ui/utils/responsive';
import { ExtraLargeTitle, MediumTitle } from '@common-ui/components/Text';
import { SolidButton } from '@common-ui/components/Button';
import { openLinkInBrowser } from '@utils/navigation';

const TasteOfTheValleyBanner = () => {
  const today = localDayJs();
  const eventDate = localDayJs('2023-07-29');

  const { isMobile } = useResponsive();

  const { getAsset } = useAppAssets();

  const hideBanner = today.isAfter(eventDate);

  if (hideBanner) {
    return null;
  }

  return (
    <Cell align='center' height={200} width='100%'>
      <Card
        height={200}
        backgroundColor={'#9ed6f5'}
        maxWidth={Spacing.desktopLargeWidth - Spacing.larger}
        width={'100%'}
        innerHorizontal={Spacing.tiny}
        innerVertical={Spacing.tiny}
        top={Spacing.medium}
      >
        <Row flex>
          <Cell flex justify='center'>
            <Link style={{ height: 200 }} href='https://svpa.us/taste-of-the-valley-2023/'>
              <Image
                contentFit={isMobile ? 'contain' : 'cover'}
                source={isMobile ? getAsset('tasteOfTheValleyMobile') : getAsset('tasteOfTheValley')}
                style={{ width:'100%', height: '100%', marginTop: Spacing.tiny }}
              />
            </Link>
          </Cell>
          <If condition={!isMobile}>
            <Cell flex width={Spacing.larger}>
              <ExtraLargeTitle align='center'>
                Join us on July 29, 2023
              </ExtraLargeTitle>
              <Cell top={Spacing.medium}>
                <MediumTitle align='center'>
                  for our annual Taste of the Valley Farm Dinner and Benefit Auction!
                </MediumTitle>
              </Cell>
              <Cell top={Spacing.larger} flex align='center'>
                <SolidButton
                  selfAlign='center'
                  type='primary'
                  onPress={() => openLinkInBrowser('https://svpa.us/taste-of-the-valley-2023/')}
                  title='Find Out More'
                />
              </Cell>
            </Cell>
          </If>
        </Row>
      </Card>
    </Cell>
  )
}

export default TasteOfTheValleyBanner;
