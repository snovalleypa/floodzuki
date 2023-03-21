# Collection of common UI components

This folder `common-ui/` contains a set of commonly used components and utilities for building UIs in React Native apps.

## Constants
### Colors
The `Colors` object contains a set of commonly used colors in the app. It is used to define the colors of the components and to make sure that the colors are consistent across the app.

### Spacing
The `Spacing` object contains a set of commonly used spacing values in the app. It is used to define the spacing of the components and to make sure that the spacing is consistent across the app.

### Typography
The `Typography` object contains a set of styles that are later used in available Text components. It is used to define the fonts of the components and to make sure that the fonts are consistent across the app.

## Components
Provides access to the common components.


### Buttons

**SolidButton** component - a button with a solid background color, used for primary actions

```js
  import SolidButton from 'common-ui/components/Button';
  
  <SolidButton title="Primary Button" onPress={pressHandler} />
```

**LinkButton** component - a button with a solid background color, used for primary actions

```js
  import { LinkButton } from 'common-ui/components/Button';
  
  <LinkButton title="Primary Button" onPress={pressHandler} />
```

### Text
Generic Text components with a set of predefined styles

```js
  import {
    HugeTitle,
    ExtraLargeTitle,
    LargeTitle,
    MediumTitle,
    SmallTitle,
    RegularLargeText,
    MediumText,
    RegularText,
    SmallText,
    TinyText,
    LabelText,
    SmallerText,
  } from "common-ui/components/Text"
  
  <HugeTitle>Extra Large Title</HugeTitle>
  <ExtraLargeTitle>Extra Large Title</ExtraLargeTitle>
  <LargeTitle>Large Title</LargeTitle>
  <MediumTitle>Medium Title</MediumTitle>
  <SmallTitle>Small Title</SmallTitle>
  <MediumText>Medium Text</MediumText>
  <RegularLargeText>Regular Large Text</RegularLargeText>
  <RegularText>Regular Text</RegularText>
  <SmallerText>Smaller Text</SmallerText>
  <SmallText>Small Text</SmallText>
  <TinyText>Tiny Text</TinyText>
  <LabelText>Label Text</LabelText>
```

### Conditional Components
**If** is a container that decides whether content should be displayed.

```js
  import { If } from 'common-ui/components/Conditional';
  
  <If condition={truthyCondition}>
    <Text>Some content</Text>
  </If>
```

```js
  import { If } from 'common-ui/components/Ternary';
  
  <Ternary condition={truthyCondition}>
    <Text>Text rendered when truthy</Text>
    <Text>Text rendered when falsey</Text>
  </Ternary>
```

### Common Components
**Row** is a flexbox container that lays out its children in a row.

```js
  import { Row } from 'common-ui/components/Common';
  
  <Row align="space-between">
    <Text>Some content</Text>
    <Text>Some content</Text>
  </Row>
```

**Cell** is a flexbox container lays out children in a stack
  
```js
  import { Cell } from 'common-ui/components/Common';
  
  <Cell align="center">
    <Text>Some content</Text>
    <Text>Some content</Text>
  </Cell>
```

**Spacer** is an empty block that can be used to add space between content.

```js
  import { Spacer } from 'common-ui/components/Common';
  
  <Text>Some content</Text>
  <Spacer height={10} />
  <Text>Some content</Text>
```

**Separator** is a thin horizontal line that can be used to separate content.

```js
  import { Separator } from 'common-ui/components/Common';
  
  <Text>Some content</Text>
  <Separator />
```

### Icons
Icon - is a common component to use icons in the app. It is based on Feather Icons https://feathericons.com/

```js
  import { Icon } from 'common-ui/components/Icon';
  
  <Icon name="account" size={24} color="black" />
```

### Screen
Common components that are used when constructing new screens

**Screen** - generic wrapper for screens. Includes SafeAreaView and ErrorBoundary

```js
  import { Screen, Content } from 'common-ui/components/Screen';
  
  <Screen>
    <Content>
      <Text>Some Text</Text>
    </Content>
  </Screen>
```

**Content** - Content wrapper for Screens with default padding. It can either be scrollable or not.

```js
  import { Content } from 'common-ui/components/Screen';
  
  <Content scrollable>
    <Text>Some Text</Text>
  </Content>
```

## Utils
**adjustColor** - a function to adjust color to make it brighter or darker

**useOffset** - A hook to extend any component with offset styles.
