import api from './api';
import { Incident, CreateIncidentBody } from '../types/incident';

export const incidentService = {
  createIncident: async (incidentData: CreateIncidentBody): Promise<Incident> => {
    const response = await api.post('/incidents', incidentData);
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
