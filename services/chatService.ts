import api from './api';

export const chatService = {
  /**
   * Fetch chat history between a user and admin
   */
  getChatHistory: async (userId: string, adminId: string) => {
    try {
      const response = await api.get(`/chat/history/${userId}/${adminId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Fetch all conversations (Admin only)
   */
  getAllConversations: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
};
