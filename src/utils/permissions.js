import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Request all required Android permissions smoothly on initial app launch.
 */
export async function requestAppPermissions() {
  if (Platform.OS !== 'android') return;

  try {
    const permissionsToRequest = [];

    // Notifications (Android 13+ / API 33+)
    if (Platform.Version >= 33) {
      if (PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      if (PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO);
      }
      if (PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      }
    } else {
      // Storage permissions for Android 12 and below
      if (PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      }
      if (PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }
    }

    if (permissionsToRequest.length > 0) {
      const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);
      console.log('[Permissions] Requested initial permissions:', results);
    }
  } catch (err) {
    console.warn('[Permissions] Permission request error:', err);
  }
}
