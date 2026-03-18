import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';

import { SearchScreen } from '@/features/search/screens/SearchScreen';
import * as searchApi from '@/lib/api/search';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const buildPage = (
  content: Array<{ userId: string; nickname: string; avatar: string }>,
  page: number,
  last: boolean,
) => ({
  content,
  last,
  totalElements: last ? content.length : content.length + 1,
  number: page,
  size: 10,
});

describe('SearchScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    routerMock.push.mockReset();
  });

  it('shows only the search input before a query is entered', () => {
    const screen = renderWithProviders(<SearchScreen />);

    expect(screen.getByTestId('search-input')).toBeTruthy();
    expect(screen.queryByTestId('shell-brand-title')).toBeNull();
    expect(screen.queryByText('검색어를 입력해주세요.')).toBeNull();
    expect(screen.queryByText('검색어를 입력하면 사용자를 바로 찾을 수 있습니다.')).toBeNull();
    expect(screen.queryByText('닉네임을 입력하면 결과가 자동으로 갱신됩니다.')).toBeNull();
  });

  it('debounces input before requesting search results', async () => {
    jest.useFakeTimers();
    const searchSpy = jest.spyOn(searchApi, 'searchUsers').mockResolvedValue(
      buildPage(
        [
          {
            userId: 'user-2',
            nickname: '도리',
            avatar: '',
          },
        ],
        0,
        true,
      ),
    );

    const screen = renderWithProviders(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), '도');

    expect(searchSpy).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith('도', 0, 10));
    await waitFor(() => expect(screen.getByText('도리')).toBeTruthy());
  });

  it('loads the next page and opens a profile from the result list', async () => {
    jest.useFakeTimers();
    const searchSpy = jest.spyOn(searchApi, 'searchUsers').mockImplementation(async (_keyword, page) => {
      if (page === 0) {
        return {
          content: [
            {
              userId: 'user-2',
              nickname: '도리',
              avatar: '',
            },
            {
              userId: 'user-3',
              nickname: '도영',
              avatar: '',
            },
          ],
          last: false,
          totalElements: 3,
          number: 0,
          size: 10,
        };
      }

      return {
        content: [
          {
            userId: 'user-4',
            nickname: '도하',
            avatar: '',
          },
        ],
        last: true,
        totalElements: 3,
        number: 1,
        size: 10,
      };
    });

    const screen = renderWithProviders(<SearchScreen />);
    fireEvent.changeText(screen.getByTestId('search-input'), '도');

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => expect(screen.getByText('도리')).toBeTruthy());

    fireEvent(screen.getByTestId('search-results-list'), 'onEndReached');

    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith('도', 1, 10));
    await waitFor(() => expect(screen.getByText('도하')).toBeTruthy());

    fireEvent.press(screen.getByTestId('search-result-item-user-4'));
    expect(routerMock.push).toHaveBeenCalledWith('/profile/user-4');
  });

  it('shows empty and error states for search results', async () => {
    jest.useFakeTimers();
    const searchSpy = jest.spyOn(searchApi, 'searchUsers');
    searchSpy.mockResolvedValueOnce({
      content: [],
      last: true,
      totalElements: 0,
      number: 0,
      size: 10,
    });
    searchSpy.mockRejectedValueOnce(new Error('검색 실패'));

    const screen = renderWithProviders(<SearchScreen />);

    fireEvent.changeText(screen.getByTestId('search-input'), '없는사용자');
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    await waitFor(() => expect(screen.getByText('검색 결과가 없습니다.')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('search-input'), '에러');
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    await waitFor(() => expect(screen.getByText('검색 결과를 불러오지 못했습니다.')).toBeTruthy());
    expect(screen.getByText('검색 실패')).toBeTruthy();
  });
});
