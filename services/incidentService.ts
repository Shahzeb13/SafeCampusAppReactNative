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
    const response = await api.get('/incidents/myIncidents');
    return response.data;
  },

  getIncidentById: async (id: string): Promise<Incident> => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  // Security Personnel: Get assigned incidents
  getMyAssignments: async (): Promise<any> => {
    const response = await api.get('/incidents/my-assignments');
    return response.data;
  },

  // Security Personnel: Respond to an assignment
  respondToAssignment: async (incidentId: string, responseType: string, note?: string): Promise<any> => {
    const response = await api.post('/incidents/respond-assignment', {
      incidentId,
      response: responseType,
      note,
    });
    return response.data;
  },
};
