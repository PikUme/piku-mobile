import type { ImageSourcePropType } from 'react-native';

const FOX: ImageSourcePropType = require('../../../assets/bottom-nav/fox.webp');
const CHARACTER_IMAGES: Record<string, ImageSourcePropType> = {
  base_image_1: FOX,
  base_image_2: require('../../../assets/bottom-nav/pencil.webp'),
  base_image_3: require('../../../assets/bottom-nav/bread.webp'),
  base_image_4: require('../../../assets/bottom-nav/cat.webp'),
};

export function getBottomNavCharacterImage(
  avatar?: string | null,
): ImageSourcePropType {
  const filename = avatar?.split(/[?#]/, 1)[0].split('/').pop();
  const character = filename?.match(/^(base_image_[1-4])\.(?:png|webp)$/)?.[1];
  return character ? CHARACTER_IMAGES[character] : FOX;
}
