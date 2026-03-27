import api from './api';

export interface EmergencyContact {
    _id: string;
    name: string;
    phoneNumber: string;
    category: "security" | "ambulance" | "fire" | "admin" | "hostel" | "other";
    isPrimary: boolean;
}

export const emergencyService = {
    getContacts: async (): Promise<EmergencyContact[]> => {
        const response = await api.get('/emergency-contacts');
        return response.data;
    },
    
    createContact: async (contactData: Partial<EmergencyContact>): Promise<EmergencyContact> => {
        const response = await api.post('/emergency-contacts', contactData);
        return response.data;
    },
    
    updateContact: async (id: string, contactData: Partial<EmergencyContact>): Promise<EmergencyContact> => {
        const response = await api.put(`/emergency-contacts/${id}`, contactData);
        return response.data;
    },
    
    deleteContact: async (id: string): Promise<void> => {
        await api.delete(`/emergency-contacts/${id}`);
    }
};
