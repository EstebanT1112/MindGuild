import * as Device from 'expo-device';
import Constants from 'expo-constants';

const getExpoProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId;

const isExpoGo = () => {
  const constants = Constants as typeof Constants & {
    appOwnership?: string | null;
    executionEnvironment?: string | null;
  };

  return (
    constants.appOwnership === 'expo' ||
    constants.executionEnvironment === 'storeClient'
  );
};

export async function registerForPushNotifications() {
  if (isExpoGo()) {
    console.log(
      'Push notifications remotas requieren development build'
    );

    return null;
  }

  if (!Device.isDevice) {
    console.log(
      'Push notifications requieren dispositivo físico'
    );

    return null;
  }

  const Notifications = await import('expo-notifications');

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
