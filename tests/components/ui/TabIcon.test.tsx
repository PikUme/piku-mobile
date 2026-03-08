import React from 'react';
import { render } from '@testing-library/react-native';

import { TabIcon } from '@/components/ui/TabIcon';

describe('TabIcon', () => {
  it('renders icon name from mocked icon set', () => {
    const screen = render(<TabIcon name="home" />);

    expect(screen.getByText('home')).toBeTruthy();
  });

  it('renders badge count when provided', () => {
    const screen = render(<TabIcon badgeCount={4} name="notifications" />);

    expect(screen.getByText('4')).toBeTruthy();
  });
});
