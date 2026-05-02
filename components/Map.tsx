import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Map, Camera, UserLocation, Images, Layer, GeoJSONSource, type TrackUserLocation } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLocationPermission } from '@/services/locationService';
import arrowIcon from '@/assets/images/gps.png';

interface MapLiveProps {
    mapStyle?: string;
    points?: any; 
    showUserLocation?: boolean;
    height?: number;
    id?: string;
    initialLocation?: [number, number]; // [longitude, latitude]
    onLocationChange?: (lat: number, lng: number, address: string) => void;
    interactive?: boolean;
    lockLocation?: boolean; // If true, don't follow user
}

const EMPTY_DATA = { type: 'FeatureCollection', features: [] };

const MapLive = (props: MapLiveProps) => {
    const { 
        mapStyle, points, showUserLocation = true, 
        height = 280, id: mapInstanceId = 'default',
        initialLocation, onLocationChange, interactive = true,
        lockLocation = false
    } = props;

    const [userLocation, setUserLocation] = useState<[number, number] | null>(initialLocation || null);
    const [locationName, setLocationName] = useState<string>('Locating...');
    const [trackingMode, setTrackingMode] = useState<TrackUserLocation>(points || lockLocation ? undefined : 'heading');
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

    const sourceId = useMemo(() => `source-${mapInstanceId}`, [mapInstanceId]);
    const layerId = useMemo(() => `layer-${mapInstanceId}`, [mapInstanceId]);

    const handleLocationUpdate = async (lng: number, lat: number) => {
        setUserLocation([lng, lat]);
        setIsReverseGeocoding(true);
        try {
            const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (address) {
                const name = `${address.street || address.name || ''}, ${address.district || address.city || ''}`.trim() || 'Selected Location';
                setLocationName(name);
                if (onLocationChange) onLocationChange(lat, lng, name);
            }
        } catch (e) {
            console.warn("Geocode error:", e);
        } finally {
            setIsReverseGeocoding(false);
        }
    };

    useEffect(() => {
        let locationSubscription: Location.LocationSubscription | null = null;

        const initMap = async () => {
            if (lockLocation && initialLocation) {
                handleLocationUpdate(initialLocation[0], initialLocation[1]);
                return;
            }

            const isPermissionGranted = await getLocationPermission();
            if (isPermissionGranted) {
                try {
                    const initial = await Location.getCurrentPositionAsync({});
                    if (!initialLocation) {
                        handleLocationUpdate(initial.coords.longitude, initial.coords.latitude);
                    }

                    locationSubscription = await Location.watchPositionAsync(
                        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 20 },
                        (location) => {
                            if (trackingMode === 'heading' && !lockLocation) {
                                handleLocationUpdate(location.coords.longitude, location.coords.latitude);
                            }
                        }
                    );
                } catch (error) {}
            }
        };

        initMap();
        return () => { if (locationSubscription) locationSubscription.remove(); };
    }, [initialLocation, lockLocation]);

    const handleMapPress = (e: any) => {
        if (!interactive || !onLocationChange) return;
        
        // Handle different event structures across MapLibre versions
        const geometry = e.geometry || e.nativeEvent?.geometry;
        if (!geometry || !geometry.coordinates) {
            console.warn("Map press event missing geometry data");
            return;
        }

        const [lng, lat] = geometry.coordinates;
        setTrackingMode(undefined as any);
        handleLocationUpdate(lng, lat);
    };

    return (
        <View style={[styles.container, { height }]}>
            <Map
                style={styles.map}
                mapStyle={mapStyle || "https://demotiles.maplibre.org/style.json"}
                onPress={handleMapPress}
            >
                <Camera
                    trackUserLocation={trackingMode}
                    onTrackUserLocationChange={(e) => {
                        if (e.nativeEvent.trackUserLocation === null) setTrackingMode(undefined as any);
                    }}
                    centerCoordinate={userLocation || [73.0479, 33.6844]}
                    zoomLevel={points ? 12 : 15}
                    animationDuration={1000}
                />
                
                <Images images={{ 'user-arrow': arrowIcon }} />

                {points && (
                    <GeoJSONSource id={sourceId} shape={points || EMPTY_DATA}>
                        <Layer
                            id={layerId}
                            type="circle"
                            paint={{
                                'circle-radius': 10,
                                'circle-color': '#FF3B70',
                                'circle-opacity': 0.6,
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#FFFFFF',
                            }}
                        />
                    </GeoJSONSource>
                )}

                {showUserLocation && !lockLocation && (
                    <UserLocation visible={true}>
                        <Layer
                            id={`user-puck-${mapInstanceId}`}
                            type="symbol"
                            layout={{
                                'icon-image': 'user-arrow',
                                'icon-size': 0.2,
                                'icon-rotation-alignment': 'viewport',
                                'icon-allow-overlap': true,
                            }}
                        />
                    </UserLocation>
                )}

                {lockLocation && userLocation && (
                    <GeoJSONSource id={`lock-source-${mapInstanceId}`} shape={{
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: userLocation },
                        properties: {}
                    }}>
                        <Layer
                            id={`lock-marker-${mapInstanceId}`}
                            type="circle"
                            paint={{
                                'circle-radius': 8,
                                'circle-color': '#FF3B70',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#FFF',
                            }}
                        />
                    </GeoJSONSource>
                )}
            </Map>

            {!points && (
                <View style={styles.locationOverlay}>
                    <View style={styles.liveIndicator}>
                        <View style={[styles.liveDot, isReverseGeocoding && { backgroundColor: '#FFB300' }, lockLocation && { backgroundColor: '#FF3B70' }]} />
                        <Text style={[styles.liveText, isReverseGeocoding && { color: '#FFB300' }, lockLocation && { color: '#FF3B70' }]}>
                            {isReverseGeocoding ? 'GEOCODING...' : (lockLocation ? 'FIXED' : 'LIVE')}
                        </Text>
                    </View>
                    <Text style={styles.locationTitle} numberOfLines={1}>{locationName}</Text>
                    <Text style={styles.locationSubtitle}>
                        {userLocation ? `${userLocation[1].toFixed(5)}, ${userLocation[0].toFixed(5)}` : 'Scanning GPS...'}
                    </Text>
                </View>
            )}

            {!trackingMode && !lockLocation && (
                <TouchableOpacity 
                    style={styles.recenterButton} 
                    onPress={() => setTrackingMode('heading')}
                >
                    <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#FF3B70" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', borderRadius: 30, overflow: 'hidden', marginVertical: 10, backgroundColor: '#f0f0f0', elevation: 10 },
    map: { flex: 1 },
    locationOverlay: { 
        position: 'absolute', 
        bottom: 20, 
        left: 20, 
        right: 85, 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        padding: 12, 
        borderRadius: 15, 
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 6 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
    liveText: { fontSize: 9, fontWeight: '900', color: '#4CAF50', letterSpacing: 1 },
    locationTitle: { fontSize: 13, fontWeight: '700', color: '#1A237E' },
    locationSubtitle: { fontSize: 9, color: '#757575', fontWeight: '500' },
    recenterButton: { 
        position: 'absolute', 
        bottom: 20, 
        right: 20, 
        backgroundColor: 'white', 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        justifyContent: 'center', 
        alignItems: 'center', 
        elevation: 8,
    },
});

export default MapLive;