import api from './api';

export const userService = {
  getPersonalContacts: async (): Promise<any> => {
    const response = await api.get('/users/emergency-contacts');
    return response.data;
  },

  addPersonalContact: async (name: string, phoneNumber: string): Promise<any> => {
    const response = await api.post('/users/emergency-contacts', { name, phoneNumber });
    return response.data;
  },

  removePersonalContact: async (index: number): Promise<any> => {
    const response = await api.delete(`/users/emergency-contacts/${index}`);
    return response.data;
  },
  
  saveFcmToken: async (userId: string, token: string): Promise<any> => {
    const response = await api.post('/users/save-fcm-token', { userId, token });
    return response.data;
  },
  
  updateProfile: async (formData: FormData): Promise<any> => {
    const response = await api.put('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
