import { supabase }
  from '../../../common/config/supabase.js';
import type {
  Notification,
  CreateNotificationInput
} from '../types/notification.types.js';

export const notificationRepository = {
  async createNotification(data: CreateNotificationInput):Promise<Notification> {
    const { data: notification, error } =
      await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          body: data.body,
          reference_type:
            data.reference_type ?? null,
          reference_id:
            data.reference_id ?? null,
          read: false,
        })
        .select()
        .single();

    if (error) {
      throw new Error(error.message);
    }

    return notification;
  },
  //Funcion para obtener el token
  async getUserExpoPushToken(userId: string): Promise<string | null> {
    const { data, error } =
      await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', userId)
        //single se usa porque 1 user_id → 1 profile
        .single();

    if (error) {
      throw error;
    }

    return data?.expo_push_token ?? null;
    }

};