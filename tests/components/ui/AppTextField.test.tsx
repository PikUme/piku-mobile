import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { AppTextField } from '@/components/ui/AppTextField';

describe('AppTextField', () => {
  it('renders label and helper text', () => {
    const screen = render(
      <AppTextField helperText="학교 이메일을 입력해 주세요." label="이메일" />,
    );

    expect(screen.getByText('이메일')).toBeTruthy();
    expect(screen.getByText('학교 이메일을 입력해 주세요.')).toBeTruthy();
  });

  it('calls onChangeText and shows the error text', () => {
    const onChangeText = jest.fn();
    const screen = render(
      <AppTextField
        errorText="이메일 형식이 올바르지 않습니다."
        label="이메일"
        onChangeText={onChangeText}
        value=""
      />,
    );

    fireEvent.changeText(screen.getByLabelText('이메일'), 'wrong');

    expect(onChangeText).toHaveBeenCalledWith('wrong');
    expect(screen.getByText('이메일 형식이 올바르지 않습니다.')).toBeTruthy();
  });
});
