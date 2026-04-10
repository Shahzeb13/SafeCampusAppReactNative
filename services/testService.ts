import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const testService = {
  checkServer: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/test-server`);
      return response.data;
    } catch (error: any) {
      // Re-throw to be handled by handleApiError in the UI
      throw error;
    }
  }
};
