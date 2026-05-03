import api from './api';

export interface SOSRequestData {
  location: {
    latitude: number;
    longitude: number;
  };
  note?: string;
}

export interface SOSResponse {
  success: boolean;
  message: string;
  sosId?: string;
  timestamp: string;
}

export interface SOSHistoryItem {
  _id: string;
  userId: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggerType: 'button' | 'shake';
  location: {
    latitude: number;
    longitude: number;
  };
  note?: string;
  acknowledgedAt?: string;
  respondedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sends a high-priority SOS alert to the backend with the user's current GPS coordinates.
 */
export const sendSOSAlert = async (latitude: number, longitude: number, note?: string, triggerType: 'button' | 'shake' = 'button'): Promise<SOSResponse> => {
  try {
    const response = await api.post<SOSResponse>('/sos/trigger', {
      location: { latitude, longitude },
      note,
      triggerType
    });
    return response.data;
  } catch (error: any) {
    // We throw the error so that the component can catch it and 
    // use utils/errorhandling.ts (handleApiError)
    throw error;
  }
};

export const getSOSHistory = async (): Promise<SOSHistoryItem[]> => {
  try {
    const response = await api.get<{ success: boolean; data: SOSHistoryItem[] }>('/sos/history');
    return response.data.data;
  } catch (error: any) {
    throw error;
  }
};

export const getSOSDetails = async (id: string): Promise<SOSHistoryItem> => {
  try {
    const response = await api.get<{ success: boolean; data: SOSHistoryItem }>(`/sos/${id}`);
    return response.data.data;
  } catch (error: any) {
    throw error;
  }
};

export const getMyAssignments = async (): Promise<any> => {
  try {
    const response = await api.get('/sos/my-assignments');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const respondToAssignment = async (sosId: string, response: string, note?: string): Promise<any> => {
  try {
    const res = await api.post('/sos/respond', { sosId, response, note });
    return res.data;
  } catch (error: any) {
    throw error;
  }
};

export const sosService = {
  triggerSOS: sendSOSAlert,
  getSOSHistory,
  getSOSDetails,
  getMyAssignments,
  respondToAssignment
};
