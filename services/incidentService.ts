import api from './api';
import { Incident, CreateIncidentBody } from '../types/incident';

export const incidentService = {
  createIncident: async (incidentData: CreateIncidentBody): Promise<Incident> => {
    console.log("Incident Form data " , incidentData)
    const response = await api.post('/incidents/uploadIncident', incidentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for large media uploads
    });
    return response.data;
  },

  getMyIncidents: async (): Promise<Incident[]> => {
    const response = await api.get('/incidents/my');
    return response.data;
  },

  getIncidentById: async (id: string): Promise<Incident> => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },
};
