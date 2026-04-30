import api from './api';
import { SOSHistoryItem } from './sosService';
import { Incident } from '../types/incident';

export interface HeatmapPoint {
    latitude: number;
    longitude: number;
    weight: number; // For heatmap intensity
}

export const heatmapService = {
    /**
     * Gets all active and historical SOS locations for the heatmap
     */
    getSOSHeatmapData: async (): Promise<HeatmapPoint[]> => {
        try {
            // Using the active SOS route seen in HomeScreen, assuming it returns multiple
            const response = await api.get<{ success: boolean; data: SOSHistoryItem[] }>('/sos/active');
            
            // Map to heatmap points
            return (response.data.data || []).map(item => ({
                latitude: item.location.latitude,
                longitude: item.location.longitude,
                weight: item.status === 'active' ? 5 : 2 // Active SOS are "hotter"
            }));
        } catch (error) {
            console.error("Heatmap SOS error:", error);
            return [];
        }
    },

    /**
     * Gets all incident locations for the heatmap
     */
    getIncidentHeatmapData: async (): Promise<HeatmapPoint[]> => {
        try {
            // Using the new /radar endpoint which is open to all users
            const response = await api.get<Incident[]>('/incidents/radar');
            
            return (response.data || []).filter(i => i.latitude && i.longitude).map(item => ({
                latitude: item.latitude!,
                longitude: item.longitude!,
                weight: item.status === 'pending' ? 3 : 1 // Newer/Unresolved incidents are hotter
            }));
        } catch (error) {
            console.error("Heatmap Incident error:", error);
            return [];
        }
    }
};
