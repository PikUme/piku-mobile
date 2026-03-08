import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { AppModal } from '@/components/ui/AppModal';

describe('AppModal', () => {
  it('renders title, description, and content when visible', () => {
    const screen = render(
      <AppModal
        description="보조 설명"
        onClose={jest.fn()}
        title="모달 제목"
        visible>
        <Text>모달 본문</Text>
      </AppModal>,
    );

    expect(screen.getByText('모달 제목')).toBeTruthy();
    expect(screen.getByText('보조 설명')).toBeTruthy();
    expect(screen.getByText('모달 본문')).toBeTruthy();
  });

  it('calls onClose when the backdrop is pressed', () => {
    const onClose = jest.fn();
    const screen = render(
      <AppModal onClose={onClose} visible>
        <Text>모달 본문</Text>
      </AppModal>,
    );

    fireEvent.press(screen.getByLabelText('모달 닫기 배경'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
