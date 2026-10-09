import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, typography } from '@/theme';

interface AvatarProps {
  source?: ImageSourcePropType | string | null;
  name?: string;
  size?: number;
  isAnonymous?: boolean;
}

const getInitials = (name?: string) => {
  if (!name) {
    return '?';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export function Avatar({ source, name, size = 44, isAnonymous = false }: AvatarProps) {
  const imageSource =
    typeof source === 'string' ? { uri: source } : source ?? undefined;

  if (isAnonymous) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel="익명 프로필 아이콘"
        style={[
          styles.anonymous,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}>
        <Svg
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          width={size / 2}
          height={size / 2}
          viewBox="0 0 24 24"
          fill="none"
          stroke={styles.anonymousIcon.color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx={12} cy={7} r={4} />
        </Svg>
      </View>
    );
  }

  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      <Text style={styles.initials}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceMuted,
  },
  anonymous: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  anonymousIcon: {
    color: colors.mutedText,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
  },
});
