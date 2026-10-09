import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { Avatar } from '@/components/ui/Avatar';

describe('Avatar', () => {
  it('renders the shared gray person icon for an explicitly anonymous author at the requested size', () => {
    const screen = render(
      <Avatar isAnonymous name="익명" size={36} source="https://example.com/avatar.png" />,
    );

    const avatar = screen.getByRole('image', { name: '익명 프로필 아이콘' });
    expect(avatar).toHaveStyle({ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb' });
    expect(screen.queryByText('익')).toBeNull();
    expect(screen.UNSAFE_queryByType(Text)).toBeNull();
    expect(screen.UNSAFE_queryByType(Image)).toBeNull();
  });

  it('keeps a normal account named 익명 on the regular initials path', () => {
    const screen = render(<Avatar name="익명" size={36} />);

    expect(screen.getByText('익')).toBeTruthy();
    expect(screen.queryByRole('image', { name: '익명 프로필 아이콘' })).toBeNull();
    expect(StyleSheet.flatten(screen.getByText('익').parent?.props.style)).not.toMatchObject({
      backgroundColor: '#e5e7eb',
    });
  });
});
