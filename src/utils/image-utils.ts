import * as ImageManipulator from 'expo-image-manipulator';

type CompressOptions = {
  maxSizeKB?: number;
  quality?: number;
};

export async function compressImage(
  uri: string,
  options: CompressOptions = {}
): Promise<{ uri: string; blob: Blob }> {
  const { maxSizeKB = 200, quality: initialQuality = 0.8 } = options;

  let quality = initialQuality;
  let result = await ImageManipulator.manipulateAsync(
    uri,
    [],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );

  let response = await fetch(result.uri);
  let blob = await response.blob();

  while (blob.size > maxSizeKB * 1024 && quality > 0.1) {
    quality = Math.max(quality - 0.1, 0.1);

    result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    response = await fetch(result.uri);
    blob = await response.blob();
  }

  console.log(`[image] ${(blob.size / 1024).toFixed(1)}KB — qualidade ${quality.toFixed(1)}`);

  return { uri: result.uri, blob };
}