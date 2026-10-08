import Svg, { Circle, Path, Polygon } from 'react-native-svg';

export type BottomNavIconName = 'home' | 'feed' | 'search' | 'more';

interface BottomNavIconProps {
  name: BottomNavIconName;
  color: string;
  testID?: string;
}

export function BottomNavIcon({ name, color, testID }: BottomNavIconProps) {
  return (
    <Svg
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      width={25}
      height={25}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      testID={testID}
    >
      {name === 'home' ? (
        <>
          <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
          <Path d="M9 21v-8h6v8" />
        </>
      ) : null}
      {name === 'feed' ? (
        <>
          <Circle cx={12} cy={12} r={10} />
          <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </>
      ) : null}
      {name === 'search' ? (
        <>
          <Circle cx={11} cy={11} r={8} />
          <Path d="m21 21-4.3-4.3" />
        </>
      ) : null}
      {name === 'more' ? (
        <>
          <Circle cx={5} cy={12} r={1} />
          <Circle cx={12} cy={12} r={1} />
          <Circle cx={19} cy={12} r={1} />
        </>
      ) : null}
    </Svg>
  );
}
