import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { FeedbackScreen } from '@/features/settings/screens/FeedbackScreen';
import * as inquiryApi from '@/lib/api/inquiry';
import * as feedback from '@/lib/ui/feedback';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

describe('FeedbackScreen', () => {
  beforeEach(() => {
    routerMock.back.mockClear();
    routerMock.replace.mockClear();
    routerMock.canGoBack.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('submits feedback content without an image', async () => {
    const submitSpy = jest.spyOn(inquiryApi, 'submitInquiry').mockResolvedValue();
    const alertSpy = jest.spyOn(feedback, 'showAlert').mockImplementation(() => undefined);

    const screen = renderWithProviders(<FeedbackScreen />);

    fireEvent.changeText(screen.getByTestId('feedback-content-input'), '앱 사용 중 개선 의견입니다.');
    fireEvent.press(screen.getByTestId('feedback-submit-button'));

    await waitFor(() =>
      expect(submitSpy).toHaveBeenCalledWith({
        content: '앱 사용 중 개선 의견입니다.',
        image: null,
      }),
    );
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
    expect(alertSpy).toHaveBeenCalledWith('피드백 제출 완료', '보내주신 내용을 확인한 뒤 반영하겠습니다.');
  });

  it('picks an image and includes it in the feedback payload', async () => {
    const submitSpy = jest.spyOn(inquiryApi, 'submitInquiry').mockResolvedValue();
    jest.spyOn(feedback, 'showAlert').mockImplementation(() => undefined);
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///feedback.png',
          fileName: 'feedback.png',
          mimeType: 'image/png',
        },
      ],
    });

    const screen = renderWithProviders(<FeedbackScreen />);

    fireEvent.press(screen.getByTestId('feedback-pick-image-button'));
    await waitFor(() => expect(screen.getByTestId('feedback-image-preview')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('feedback-content-input'), '이미지와 함께 보냅니다.');
    fireEvent.press(screen.getByTestId('feedback-submit-button'));

    await waitFor(() =>
      expect(submitSpy).toHaveBeenCalledWith({
        content: '이미지와 함께 보냅니다.',
        image: {
          uri: 'file:///feedback.png',
          name: 'feedback.png',
          type: 'image/png',
        },
      }),
    );
  });
});
