import api from './api';
import { Notification } from '../types/notification';

export const notificationService = {
  getMyNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
};
