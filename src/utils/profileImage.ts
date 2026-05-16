/**
 * Profile image handling - pick, compress, and encode as base64
 *
 * Uses expo-image-manipulator's built-in base64 output instead of
 * the deprecated FileSystem.readAsStringAsync.
 */

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_SIZE = 400;
const COMPRESS_QUALITY = 0.7;

export type ProfileImageDataUri = string;

/**
 * Picks an image from the library, compresses/resizes it, and returns a data URI
 * suitable for storing in Firestore (photoURL field).
 */
export async function pickAndEncodeProfileImage(): Promise<ProfileImageDataUri | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission is required to choose a photo.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const uri = result.assets[0].uri;

  // Use manipulateAsync with base64: true to avoid deprecated FileSystem API
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_SIZE, height: MAX_SIZE } }],
    {
      compress: COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!manipulated.base64) {
    throw new Error('Failed to encode image as base64');
  }

  return `data:image/jpeg;base64,${manipulated.base64}`;
}

/**
 * Returns true if the given string is a base64 data URI.
 */
export function isDataUri(uri: string | null): uri is string {
  return typeof uri === 'string' && uri.startsWith('data:');
}
