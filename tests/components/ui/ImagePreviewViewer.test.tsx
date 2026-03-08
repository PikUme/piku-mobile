import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { ImagePreviewViewer } from '@/components/ui/ImagePreviewViewer';

describe('ImagePreviewViewer', () => {
  it('renders the provided title and image', () => {
    const screen = render(
      <ImagePreviewViewer
        imageUri="https://example.com/image.png"
        onClose={jest.fn()}
        title="대표 이미지"
        visible
      />,
    );

    expect(screen.getByText('대표 이미지')).toBeTruthy();
    expect(screen.queryByText('이미지를 불러올 수 없습니다.')).toBeNull();
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({
      uri: 'https://example.com/image.png',
    });
  });

  it('renders an empty state when no image uri is provided', () => {
    const screen = render(
      <ImagePreviewViewer onClose={jest.fn()} title="대표 이미지" visible />,
    );

    expect(screen.getByText('이미지를 불러올 수 없습니다.')).toBeTruthy();
  });

  it('calls onClose when the close button is pressed', () => {
    const onClose = jest.fn();
    const screen = render(
      <ImagePreviewViewer
        imageUri="https://example.com/image.png"
        onClose={onClose}
        visible
      />,
    );

    fireEvent.press(screen.getByTestId('image-preview-close-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
