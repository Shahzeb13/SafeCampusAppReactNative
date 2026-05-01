/**
 * Generates a prefilled SOS message with location information.
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns A formatted message string
 */
export const generateSosTemplate = (latitude: number, longitude: number): string => {
    // Using the 'q' parameter drops a PIN. Adding it to the query ensures it shows up clearly.
    const googleMapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=18`;
    return `🚨 SOS EMERGENCY 🚨\nI need help immediately! My precise location is:\n${googleMapsUrl}`;
};
