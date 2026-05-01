import { Linking, Alert, Platform } from 'react-native';
import { getUserLocation as getLoc } from '../utils/locationUtils';
import { generateSosTemplate } from '../utils/generateTemplate';
import { emergencyService } from './emergencyService';

/**
 * Service to handle SOS message logic including location fetching,
 * message generation, and opening WhatsApp.
 */
export const SosMessageSendingService = {
    /**
     * Gets the current user location.
     */
    getUserLocation: async () => {
        return await getLoc();
    },

    /**
     * Generates the SOS message template.
     */
    generateMessage: (lat: number, lng: number) => {
        return generateSosTemplate(lat, lng);
    },

    /**
     * Sends an SOS message via WhatsApp. If coordinates are provided, it uses them; otherwise, it fetches current ones.
     */
    sendWhatsAppSos: async (personalContacts: any[], latitude?: number, longitude?: number) => {
        try {
            let finalLat = latitude;
            let finalLng = longitude;

            // 1. Get User Location if not provided
            if (finalLat === undefined || finalLng === undefined) {
                const location = await getLoc();
                finalLat = location.latitude;
                finalLng = location.longitude;
            }

            // 2. Generate Message Template
            const message = generateSosTemplate(finalLat, finalLng);

            // 3. Get Emergency Contacts
            // Note: We combine your personal contacts with the official rescue number 1122
            const primaryContact = personalContacts[0]; // Assuming the first one is the priority
            
            // 4. Send to WhatsApp (Primary Personal Contact)
            if (primaryContact) {
                const cleanPhone = primaryContact.phoneNumber.replace(/\D/g, '');
                const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
                try {
                    const supported = await Linking.canOpenURL(url);
                    if (supported) {
                        await Linking.openURL(url);
                        // We return here because WhatsApp is now open for the family member
                        return; 
                    }
                } catch (e) {
                    console.warn("WhatsApp open failed, falling back to multi-SMS...");
                }

                // 5. Fallback to Multi-Recipient SMS (Family + 1122)
                try {
                    const recipients = [cleanPhone, '1122'].join(',');
                    const smsUrl = `sms:${recipients}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
                    await Linking.openURL(smsUrl);
                } catch (e) {
                    Alert.alert("Emergency Error", "Could not open messaging. Please call 1122 directly.");
                }
            } else {
                // If no personal contacts, just try to message 1122
                const smsUrl = `sms:1122${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
                Linking.openURL(smsUrl);
            }


        } catch (error: any) {
            console.error('SOS Service Error:', error);
            Alert.alert("SOS Error", "Failed to send SOS message. Please try again.");
        }
    }
};

