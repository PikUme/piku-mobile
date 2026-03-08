import React from 'react';
import { render } from '@testing-library/react-native';

import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders the count when provided', () => {
    const screen = render(<Badge count={7} tone="danger" />);

    expect(screen.getByText('7')).toBeTruthy();
  });

  it('renders nothing when neither label nor count is provided', () => {
    const screen = render(<Badge />);

    expect(screen.toJSON()).toBeNull();
  });
});
