import { getBottomNavCharacterImage } from '@/components/shell/bottomNavCharacter';

jest.mock('../../../assets/bottom-nav/fox.webp', () => 101);
jest.mock('../../../assets/bottom-nav/pencil.webp', () => 102);
jest.mock('../../../assets/bottom-nav/bread.webp', () => 103);
jest.mock('../../../assets/bottom-nav/cat.webp', () => 104);

describe('bottom navigation character', () => {
  it.each([
    ['base_image_1.png', 101],
    ['base_image_1.webp', 101],
    ['base_image_2.png', 102],
    ['base_image_2.webp', 102],
    ['base_image_3.png', 103],
    ['base_image_3.webp', 103],
    ['base_image_4.png', 104],
    ['base_image_4.webp', 104],
  ])(
    'maps avatar filename %s to the local navigation asset',
    (filename, expected) => {
      expect(
        getBottomNavCharacterImage(`https://cdn.test/characters/${filename}`),
      ).toEqual(expected);
    },
  );

  it.each([
    ['characters/base_image_4.png?size=100#preview', 104],
    ['/characters/base_image_2.webp#preview?cache=1', 102],
    ['https://cdn.test/base_image_3.webp?name=base_image_4.png', 103],
    [undefined, 101],
    [null, 101],
    ['', 101],
    ['https://cdn.test/custom.png', 101],
    ['/base_image_4.jpg', 101],
    ['/base_image_40.png', 101],
    ['/base_image_4.png/unknown', 101],
  ])('handles query/hash and fallback for %s', (avatar, expected) => {
    expect(getBottomNavCharacterImage(avatar)).toEqual(expected);
  });
});
