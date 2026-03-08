import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';

describe('BottomSheet', () => {
  it('renders title, description, content, and footer when visible', () => {
    const screen = render(
      <BottomSheet
        description="상세 설명"
        footer={<Text>푸터 액션</Text>}
        onClose={jest.fn()}
        title="바텀시트 제목"
        visible>
        <Text>본문 내용</Text>
      </BottomSheet>,
    );

    expect(screen.getByText('바텀시트 제목')).toBeTruthy();
    expect(screen.getByText('상세 설명')).toBeTruthy();
    expect(screen.getByText('본문 내용')).toBeTruthy();
    expect(screen.getByText('푸터 액션')).toBeTruthy();
  });

  it('calls onClose when the scrim is pressed', () => {
    const onClose = jest.fn();
    const screen = render(
      <BottomSheet onClose={onClose} visible>
        <Text>본문</Text>
      </BottomSheet>,
    );

    fireEvent.press(screen.getByTestId('bottom-sheet-scrim'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
