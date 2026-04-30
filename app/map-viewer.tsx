import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Linking, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapLive from '@/components/Map';

export default function MapViewerScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const lat = parseFloat(params.lat as string);
    const lng = parseFloat(params.lng as string);
    const title = params.title as string || 'Location Viewer';

    const openExternalMap = () => {
        const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const label = title;
        const url = Platform.select({
          ios: `${scheme}${label}@${latLng}`,
          android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url).catch(() => {
                // Fallback to web if the app isn't installed
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
            });
        }
    };

    if (isNaN(lat) || isNaN(lng)) {
        return (
            <View style={styles.errorContainer}>
                <Text>Invalid Coordinates</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#1A237E" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.headerSubtitle}>{lat.toFixed(5)}, {lng.toFixed(5)}</Text>
                </View>
            </View>

            <View style={styles.mapContainer}>
                <MapLive 
                    id="dedicated-viewer-map"
                    height={Dimensions.get('window').height}
                    initialLocation={[lng, lat]}
                    lockLocation={true}
                    interactive={false}
                />

                {/* Floating Navigation Button */}
                <View style={styles.actionOverlay}>
                    <TouchableOpacity 
                        style={styles.navigateButton} 
                        onPress={openExternalMap}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="google-maps" size={24} color="white" />
                        <Text style={styles.navigateButtonText}>NAVIGATE IN GOOGLE MAPS</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#1A237E',
        marginLeft: 10,
    },
    headerSubtitle: {
        fontSize: 10,
        fontFamily: 'Inter_600SemiBold',
        color: '#FF3B70',
        marginLeft: 10,
        letterSpacing: 1,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    actionOverlay: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 25,
        paddingVertical: 18,
        borderRadius: 35,
        gap: 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    navigateButtonText: {
        color: 'white',
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
