import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/theme';

interface AvatarProps {
  source?: ImageSourcePropType | string | null;
  name?: string;
  size?: number;
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

export function Avatar({ source, name, size = 44 }: AvatarProps) {
  const imageSource =
    typeof source === 'string' ? { uri: source } : source ?? undefined;

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
