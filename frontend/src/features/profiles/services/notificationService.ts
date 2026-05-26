import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const getExpoProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId;

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log(
      'Push notifications requieren dispositivo físico'
    );

    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = getExpoProjectId();
  const tokenData =
    await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

  return tokenData.data;
}
