import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  type PanResponderGestureState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { moveComposePhoto } from '@/features/diary/lib/compose';
import type { ComposePhoto } from '@/types/diary';
import { colors, radius, spacing, typography } from '@/theme';

const PHOTO_COLUMNS = 3;
const GRID_GAP = spacing.md;
const DRAG_ACTIVATION_DELAY = 220;

export function getComposePhotoSlot(index: number, itemSize: number) {
  const column = index % PHOTO_COLUMNS;
  const row = Math.floor(index / PHOTO_COLUMNS);

  return {
    x: column * (itemSize + GRID_GAP),
    y: row * (itemSize + GRID_GAP),
  };
}

export function getComposePhotoDropIndex(params: {
  x: number;
  y: number;
  count: number;
  itemSize: number;
}) {
  const { x, y, count, itemSize } = params;

  if (count <= 1) {
    return 0;
  }

  const stride = itemSize + GRID_GAP;
  const column = Math.max(0, Math.min(PHOTO_COLUMNS - 1, Math.round(x / stride)));
  const row = Math.max(0, Math.round(y / stride));
  const candidate = row * PHOTO_COLUMNS + column;

  return Math.max(0, Math.min(count - 1, candidate));
}

function getGridHeight(itemSize: number, count: number) {
  if (count === 0) {
    return 0;
  }

  const rows = Math.ceil(count / PHOTO_COLUMNS);
  return rows * itemSize + Math.max(0, rows - 1) * GRID_GAP;
}

interface ComposePhotoReorderGridProps {
  photos: ComposePhoto[];
  onChange: (photos: ComposePhoto[]) => void;
  onPreview: (uri: string) => void;
  onRemove: (photoId: string) => void;
}

export function ComposePhotoReorderGrid({
  photos,
  onChange,
  onPreview,
  onRemove,
}: ComposePhotoReorderGridProps) {
  const windowDimensions = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(
    Math.max(0, windowDimensions.width - spacing['2xl'] * 2),
  );
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);

  const itemSize = useMemo(() => {
    if (containerWidth <= 0) {
      return 0;
    }

    return Math.floor((containerWidth - GRID_GAP * (PHOTO_COLUMNS - 1)) / PHOTO_COLUMNS);
  }, [containerWidth]);

  const gridHeight = useMemo(
    () => getGridHeight(itemSize, photos.length),
    [itemSize, photos.length],
  );

  const positionValuesRef = useRef<Record<string, Animated.ValueXY>>({});
  const panRespondersRef = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});
  const currentOrderRef = useRef(photos);
  const activePhotoIdRef = useRef<string | null>(null);
  const dragOriginSlotRef = useRef<{ x: number; y: number } | null>(null);
  const dragCurrentIndexRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<Record<string, boolean>>({});

  const animatePhotoToSlot = useCallback((photoId: string, index: number, animated = true) => {
    const position = positionValuesRef.current[photoId];
    if (!position || itemSize <= 0) {
      return;
    }

    const nextSlot = getComposePhotoSlot(index, itemSize);

    if (!animated) {
      position.setValue(nextSlot);
      return;
    }

    Animated.spring(position, {
      toValue: nextSlot,
      damping: 18,
      mass: 0.7,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [itemSize]);

  const syncPositionsToOrder = useCallback((order: ComposePhoto[], animated = true) => {
    if (itemSize <= 0) {
      return;
    }

    order.forEach((photo, index) => {
      if (activePhotoIdRef.current === photo.id) {
        return;
      }

      animatePhotoToSlot(photo.id, index, animated);
    });
  }, [animatePhotoToSlot, itemSize]);

  useEffect(() => {
    Object.keys(positionValuesRef.current).forEach((photoId) => {
      if (!photos.some((photo) => photo.id === photoId)) {
        delete positionValuesRef.current[photoId];
        delete panRespondersRef.current[photoId];
        delete longPressTriggeredRef.current[photoId];
      }
    });

    currentOrderRef.current = photos;
    syncPositionsToOrder(photos, true);
  }, [itemSize, photos, syncPositionsToOrder]);

  const finishDrag = (photoId: string) => {
    if (activePhotoIdRef.current !== photoId) {
      return;
    }

    const finalOrder = currentOrderRef.current;
    const finalIndex = finalOrder.findIndex((photo) => photo.id === photoId);
    if (finalIndex >= 0) {
      animatePhotoToSlot(photoId, finalIndex, true);
      onChange(finalOrder);
    }

    activePhotoIdRef.current = null;
    dragOriginSlotRef.current = null;
    dragCurrentIndexRef.current = null;
    setActivePhotoId(null);
  };

  const cancelDrag = (photoId: string) => {
    if (activePhotoIdRef.current !== photoId) {
      return;
    }

    currentOrderRef.current = photos;
    const originalIndex = photos.findIndex((photo) => photo.id === photoId);
    if (originalIndex >= 0) {
      animatePhotoToSlot(photoId, originalIndex, true);
    }

    activePhotoIdRef.current = null;
    dragOriginSlotRef.current = null;
    dragCurrentIndexRef.current = null;
    setActivePhotoId(null);
  };

  const startDrag = (photoId: string) => {
    if (itemSize <= 0) {
      return;
    }

    const startIndex = currentOrderRef.current.findIndex((photo) => photo.id === photoId);
    if (startIndex < 0) {
      return;
    }

    longPressTriggeredRef.current[photoId] = true;
    activePhotoIdRef.current = photoId;
    dragCurrentIndexRef.current = startIndex;
    dragOriginSlotRef.current = getComposePhotoSlot(startIndex, itemSize);
    setActivePhotoId(photoId);
  };

  const handleDragMove = (photoId: string, gestureState: PanResponderGestureState) => {
    const activeId = activePhotoIdRef.current;
    const dragOrigin = dragOriginSlotRef.current;
    const currentIndex = dragCurrentIndexRef.current;

    if (activeId !== photoId || !dragOrigin || currentIndex === null || itemSize <= 0) {
      return;
    }

    const position = positionValuesRef.current[photoId];
    if (!position) {
      return;
    }

    const nextX = dragOrigin.x + gestureState.dx;
    const nextY = dragOrigin.y + gestureState.dy;
    position.setValue({ x: nextX, y: nextY });

    const nextIndex = getComposePhotoDropIndex({
      x: nextX,
      y: nextY,
      count: currentOrderRef.current.length,
      itemSize,
    });

    if (nextIndex === currentIndex) {
      return;
    }

    const nextOrder = moveComposePhoto(currentOrderRef.current, currentIndex, nextIndex);
    currentOrderRef.current = nextOrder;
    dragCurrentIndexRef.current = nextIndex;
    syncPositionsToOrder(nextOrder, true);
  };

  const getPanResponder = (photoId: string) => {
    if (panRespondersRef.current[photoId]) {
      return panRespondersRef.current[photoId];
    }

    panRespondersRef.current[photoId] = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        activePhotoIdRef.current === photoId &&
        (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
      onPanResponderMove: (_, gestureState) => {
        handleDragMove(photoId, gestureState);
      },
      onPanResponderRelease: () => {
        finishDrag(photoId);
      },
      onPanResponderTerminate: () => {
        cancelDrag(photoId);
      },
      onPanResponderTerminationRequest: () => false,
    });

    return panRespondersRef.current[photoId];
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View onLayout={handleLayout} style={[styles.container, gridHeight > 0 && { height: gridHeight }]}>
      {photos.map((photo, index) => {
        if (!positionValuesRef.current[photo.id] && itemSize > 0) {
          positionValuesRef.current[photo.id] = new Animated.ValueXY(
            getComposePhotoSlot(index, itemSize),
          );
        }

        const position = positionValuesRef.current[photo.id];
        if (!position || itemSize <= 0) {
          return null;
        }

        const panResponder = getPanResponder(photo.id);
        const isCover = index === 0;
        const isActive = activePhotoId === photo.id;

        return (
          <Animated.View
            key={photo.id}
            style={[
              styles.photoCard,
              {
                width: itemSize,
                height: itemSize,
                transform: position.getTranslateTransform(),
                zIndex: isActive ? 30 : 1,
              },
            ]}
            testID={`compose-photo-card-${photo.id}`}>
            <Pressable
              accessibilityRole="button"
              delayLongPress={DRAG_ACTIVATION_DELAY}
              onLongPress={() => startDrag(photo.id)}
              onPress={() => {
                if (longPressTriggeredRef.current[photo.id]) {
                  longPressTriggeredRef.current[photo.id] = false;
                  return;
                }

                if (index === 0) {
                  onPreview(photo.previewUri);
                  return;
                }

                onChange(moveComposePhoto(photos, index, 0));
              }}
              onPressOut={() => {
                if (activePhotoIdRef.current === photo.id) {
                  cancelDrag(photo.id);
                }
              }}
              style={({ pressed }) => [
                styles.photoPreviewFrame,
                {
                  width: itemSize,
                  height: itemSize,
                },
                pressed && !isActive && styles.pressed,
                isActive && styles.activePhotoFrame,
              ]}
              testID={`compose-photo-preview-${photo.id}`}
              {...panResponder.panHandlers}>
              <Animated.Image source={{ uri: photo.previewUri }} style={styles.photoPreviewImage} />
              {isCover ? (
                <View
                  style={styles.coverBadge}
                  testID={`compose-photo-cover-badge-${photo.id}`}>
                  <Text style={styles.coverBadgeLabel}>대표 사진</Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => onRemove(photo.id)}
              style={({ pressed }) => [styles.photoRemoveButton, pressed && styles.pressed]}
              testID={`compose-photo-remove-${photo.id}`}>
              <Ionicons color={colors.white} name="close" size={16} />
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  photoCard: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  photoPreviewFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoRemoveButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  coverBadge: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  coverBadgeLabel: {
    ...typography.caption,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '700',
  },
  activePhotoFrame: {
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  pressed: {
    opacity: 0.82,
  },
});
