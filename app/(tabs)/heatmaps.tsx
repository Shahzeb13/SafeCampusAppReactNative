import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapLive from '../../components/Map';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HeatmapsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Safety Radar & Heatmaps</Text>
                <Text style={styles.subtitle}>Real-time emergency monitoring</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.mapWrapper}>
                    <MapLive id="radar-dummy-map" height={SCREEN_HEIGHT * 0.5} />
                    
                    {/* Construction Overlay */}
                    <View style={styles.overlay}>
                        <View style={styles.constructionCard}>
                            <View style={styles.iconCircle}>
                                <MaterialCommunityIcons name="crane" size={40} color="#FF3B70" />
                            </View>
                            <Text style={styles.constructionTitle}>Under Construction</Text>
                            <Text style={styles.constructionText}>
                                This Feature is pretty complex to implement! It will take Some Time! Hang On
                            </Text>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar} />
                                <Text style={styles.progressText}>30% Calibrated</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        Safety Radar uses anonymized data to protect user privacy while ensuring campus-wide awareness.
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#666',
        marginTop: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    mapWrapper: {
        position: 'relative',
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    constructionCard: {
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        width: '100%',
        elevation: 5,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    constructionTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#1A237E',
        marginBottom: 10,
    },
    constructionText: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
    },
    progressBar: {
        width: '80%',
        height: 6,
        backgroundColor: '#F5F5F5',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
        // We simulate a 85% progress with a border
        borderLeftWidth: 200, 
        borderLeftColor: '#FF3B70',
    },
    progressText: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FF3B70',
    },
    infoBox: {
        flexDirection: 'row',
        marginTop: 20,
        padding: 15,
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        gap: 10,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        fontFamily: 'Inter_400Regular',
        lineHeight: 18,
    }
});
