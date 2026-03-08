import React from 'react';
import { Text } from 'react-native';
import { renderWithProviders } from '../test-utils/renderWithProviders';

describe('renderWithProviders', () => {
  it('renders children with default providers', () => {
    const screen = renderWithProviders(<Text>Smoke test</Text>);

    expect(screen.getByText('Smoke test')).toBeTruthy();
  });
});
