import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

import type { ComposePhoto, UploadablePhotoFile } from '@/types/diary';

const MAX_IMAGE_WIDTH = 1600;
const JPEG_COMPRESS_QUALITY = 0.82;

function getFileName(uri: string, fallbackPrefix: string) {
  const candidate = uri.split('/').pop();
  return candidate && candidate.includes('.')
    ? candidate
    : `${fallbackPrefix}-${Date.now()}.jpg`;
}

function createUploadFile(uri: string, asset?: ImagePickerAsset): UploadablePhotoFile {
  return {
    uri,
    name: asset?.fileName ?? getFileName(uri, 'compose-photo'),
    type: asset?.mimeType ?? 'image/jpeg',
  };
}

export async function compressPickedImage(
  asset: ImagePickerAsset,
): Promise<ComposePhoto> {
  const shouldResize = asset.width > MAX_IMAGE_WIDTH;
  const manipulated = await manipulateAsync(
    asset.uri,
    shouldResize ? [{ resize: { width: MAX_IMAGE_WIDTH } }] : [],
    {
      compress: JPEG_COMPRESS_QUALITY,
      format: SaveFormat.JPEG,
    },
  );

  return {
    id: asset.assetId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'user',
    previewUri: manipulated.uri,
    uploadFile: createUploadFile(manipulated.uri, asset),
  };
}

export function createAiComposePhoto(result: { id: number; url: string }): ComposePhoto {
  return {
    id: `ai-${result.id}`,
    type: 'ai',
    previewUri: result.url,
    aiPhotoId: result.id,
  };
}
