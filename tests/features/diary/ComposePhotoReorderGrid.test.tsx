import {
  getComposePhotoDropIndex,
  getComposePhotoSlot,
} from '@/features/diary/components/ComposePhotoReorderGrid';

describe('ComposePhotoReorderGrid', () => {
  it('returns grid slot coordinates for the 3-column layout', () => {
    expect(getComposePhotoSlot(0, 100)).toEqual({ x: 0, y: 0 });
    expect(getComposePhotoSlot(1, 100)).toEqual({ x: 112, y: 0 });
    expect(getComposePhotoSlot(2, 100)).toEqual({ x: 224, y: 0 });
    expect(getComposePhotoSlot(3, 100)).toEqual({ x: 0, y: 112 });
  });

  it('maps drag coordinates to the nearest valid drop index', () => {
    expect(
      getComposePhotoDropIndex({
        x: 2,
        y: 4,
        count: 5,
        itemSize: 100,
      }),
    ).toBe(0);

    expect(
      getComposePhotoDropIndex({
        x: 120,
        y: 10,
        count: 5,
        itemSize: 100,
      }),
    ).toBe(1);

    expect(
      getComposePhotoDropIndex({
        x: 260,
        y: 120,
        count: 5,
        itemSize: 100,
      }),
    ).toBe(4);
  });
});
