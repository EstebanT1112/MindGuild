export async function sendExpoPushNotification(
  expoPushToken: string,
  title: string,
  body: string
) {

 if (
    !expoPushToken.startsWith(
        'ExponentPushToken'
    ) &&
    !expoPushToken.startsWith(
        'ExpoPushToken'
    )
    ){
    throw new Error(
      'Expo push token invalido'
    );
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
  };

  const response = await fetch(
    'https://exp.host/--/api/v2/push/send',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding':
          'gzip, deflate',
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `Error enviando push notification: ${errorText}`
    );
  }

  return response.json();
}