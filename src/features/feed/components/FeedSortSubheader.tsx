import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeedSortMode } from '@/lib/api/feed';
import { spacing } from '@/theme';

const SORT_OPTIONS: { label: string; value: FeedSortMode }[] = [
  { label: '최신순', value: 'latest' },
  { label: '추천순', value: 'recommended' },
];

interface FeedSortSubheaderProps {
  selectedSort: FeedSortMode;
  onSortChange: (sort: FeedSortMode) => void;
}

export function FeedSortSubheader({
  selectedSort,
  onSortChange,
}: FeedSortSubheaderProps) {
  return (
    <View style={styles.container} testID="feed-sort-subheader">
      {SORT_OPTIONS.map((option) => {
        const isSelected = selectedSort === option.value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => onSortChange(option.value)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            testID={`feed-sort-${option.value}`}>
            <Text style={[styles.label, isSelected ? styles.selectedLabel : styles.unselectedLabel]}>
              {option.label}
            </Text>
            {isSelected ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginHorizontal: -spacing['2xl'],
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  option: {
    height: 40,
    justifyContent: 'center',
    paddingBottom: 6,
  },
  pressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectedLabel: {
    color: '#171717',
    fontWeight: '700',
  },
  unselectedLabel: {
    color: '#a3aab5',
    fontWeight: '400',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 39,
    height: 2,
    backgroundColor: '#171717',
  },
});
