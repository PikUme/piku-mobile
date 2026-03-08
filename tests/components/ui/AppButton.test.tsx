import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { AppButton } from '@/components/ui/AppButton';

describe('AppButton', () => {
  it('fires onPress when tapped', () => {
    const onPress = jest.fn();
    const screen = render(<AppButton label="저장" onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when loading', () => {
    const onPress = jest.fn();
    const screen = render(
      <AppButton label="저장" loading onPress={onPress} />,
    );

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
