import { useId } from 'react';
import Svg, { Defs, FeDropShadow, Filter, Path } from 'react-native-svg';

interface BottomNavSurfaceProps {
  width: number;
  height: number;
}

export function BottomNavSurface({ width, height }: BottomNavSurfaceProps) {
  const shadowId = useId();
  const sideWidth = width / 2 - 48;
  // Relative coordinates retain the web's 96 × 84 notch at every screen width.
  const topEdge = `M0 35 H${sideWidth} c4 0 8.2 -1.1 9.59 6.77 c3.29 18.63 19.48 32.23 38.41 32.23 c18.93 0 35.12 -13.6 38.41 -32.23 c1.39 -7.87 5.59 -6.77 9.59 -6.77 H${width}`;

  return (
    <Svg
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      width={width}
      height={height}
      style={{ position: 'absolute' }}
    >
      <Defs>
        <Filter id={shadowId} x="-10%" y="-50%" width="120%" height="200%">
          <FeDropShadow
            dx={0}
            dy={-4}
            stdDeviation={3.5}
            floodColor="#000000"
            floodOpacity={0.17}
          />
        </Filter>
      </Defs>
      <Path
        d={`${topEdge} V${height} H0 Z`}
        fill="#FFFFFF"
        filter={`url(#${shadowId})`}
      />
      <Path d={topEdge} fill="none" stroke="#E5E7EB" strokeWidth={1} />
    </Svg>
  );
}
