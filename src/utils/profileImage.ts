/**
 * Profile image handling - pick, compress, and encode as base64 for Firestore
 */

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

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
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const uri = result.assets[0].uri;

  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_SIZE, height: MAX_SIZE } }],
    {
      compress: COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: 'base64',
  });

  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Returns true if the given string is a base64 data URI (e.g. from profile photoURL).
 */
export function isDataUri(uri: string | null): uri is string {
  return typeof uri === 'string' && uri.startsWith('data:');
}
