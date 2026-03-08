import { useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { colors, radius, spacing } from '@/theme';

interface DiaryImageCarouselProps {
  imageUrls: string[];
  testIDPrefix: string;
  fullScreen?: boolean;
}

export function DiaryImageCarousel({
  imageUrls,
  testIDPrefix,
  fullScreen = false,
}: DiaryImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();
  const imageSize = fullScreen ? width : Math.max(width - spacing['2xl'] * 2, 280);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const measuredWidth = event.nativeEvent.layoutMeasurement.width;
    if (!measuredWidth) {
      return;
    }

    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / measuredWidth));
  };

  return (
    <View style={[styles.container, fullScreen && styles.fullScreenContainer]}>
      <ScrollView
        horizontal
        pagingEnabled
        onMomentumScrollEnd={handleMomentumEnd}
        showsHorizontalScrollIndicator={false}
        style={{ height: imageSize }}
        testID={`${testIDPrefix}-carousel`}>
        {imageUrls.map((imageUrl, index) => (
          <Pressable
            key={`${testIDPrefix}-${index}`}
            accessibilityRole="imagebutton"
            style={[styles.imageFrame, { width: imageSize, height: imageSize }]}
            testID={`${testIDPrefix}-image-${index + 1}`}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
          </Pressable>
        ))}
      </ScrollView>

      {imageUrls.length > 1 ? (
        <View style={styles.pagination}>
          {imageUrls.map((_, index) => (
            <View
              key={`${testIDPrefix}-dot-${index}`}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
                fullScreen && styles.dotOnDark,
                fullScreen && index === currentIndex && styles.dotOnDarkActive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fullScreenContainer: {
    backgroundColor: colors.black,
  },
  imageFrame: {
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  pagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
  dotOnDark: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotOnDarkActive: {
    backgroundColor: colors.white,
  },
});
