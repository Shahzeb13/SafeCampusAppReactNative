import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { Map as MapLibreMap, Camera, Marker, Callout, UserLocation } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { overpassService, NearbyPlace } from '../services/overpassService';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// MapLibre is a fork of Mapbox. Some versions still need a "kickstart" call even if empty.
try {
  MapLibreMap.setAccessToken(null);
} catch (e) {}

export const LiveMapCard = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [hospitals, setHospitals] = useState<NearbyPlace[]>([]);
  const [policeStations, setPoliceStations] = useState<NearbyPlace[]>([]);
  const [lastFetchCoords, setLastFetchCoords] = useState<{lat: number, lng: number} | null>(null);
  const [fetchingPlaces, setFetchingPlaces] = useState(false);
  const mapRef = React.useRef<any>(null);

  // Helper to calculate distance in km between two points
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    let watchSubscription: Location.LocationSubscription | null = null;
    let headingSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      if (isLive) {
        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            const { latitude, longitude } = newLocation.coords;
            setLocation(newLocation);
            
            // Refetch if never fetched OR moved more than 500m from last fetch
            const shouldRefetch = !lastFetchCoords || getDistance(latitude, longitude, lastFetchCoords.lat, lastFetchCoords.lng) > 0.5;
            
            if (shouldRefetch && !fetchingPlaces) {
              fetchNearbyEmergencyServices(latitude, longitude);
              setLastFetchCoords({ lat: latitude, lng: longitude });
            }
          }
        );

        headingSubscription = await Location.watchHeadingAsync((h) => {
          setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
        });

      } else {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        fetchNearbyEmergencyServices(loc.coords.latitude, loc.coords.longitude);
      }
    };

    startTracking();

    return () => {
      if (watchSubscription) watchSubscription.remove();
      if (headingSubscription) headingSubscription.remove();
    };
  }, [isLive]);

  const fetchNearbyEmergencyServices = async (lat: number, lng: number) => {
    setFetchingPlaces(true);
    try {
      const places = await overpassService.getNearbyEmergencyPlaces(lat, lng);
      setHospitals(places.filter(p => p.type === 'hospital'));
      setPoliceStations(places.filter(p => p.type === 'police'));
    } catch (error: any) {
      console.warn("Overpass error:", error.message);
    } finally {
      setFetchingPlaces(false);
    }
  };

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Live Safety Radar</Text>
        <View style={styles.headerRight}>
          <View style={[styles.liveBadge, !isLive && styles.liveBadgeInactive]}>
             <View style={[styles.liveDot, !isLive && { backgroundColor: '#757575' }]} />
             <Text style={[styles.liveText, !isLive && { color: '#757575' }]}>
               {isLive ? 'Live' : 'Standby'}
             </Text>
          </View>
          <Switch 
            value={isLive} 
            onValueChange={(val) => setIsLive(val)}
            trackColor={{ false: "#767577", true: "#FF3B70" }} 
            thumbColor="#fff" 
          />
        </View>
      </View>

      <View style={[styles.mapWrapper, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
        {location ? (
          <MapLibreMap
            ref={mapRef}
            style={{ flex: 1 }} 
            styleURL={JSON.stringify({
              version: 8,
              sources: {
                osm: {
                  type: 'raster',
                  tiles: [
                    isDark 
                      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                  ],
                  tileSize: 256,
                  attribution: '© OpenStreetMap contributors',
                },
              },
              layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
            })}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <Camera
              zoomLevel={15}
              centerCoordinate={[location.coords.longitude, location.coords.latitude]}
              followUserLocation={isLive}
              followUserMode="compass"
              animationDuration={1500}
            />
            <UserLocation visible={true} />

            {/* Emergency Facilities Markers (Hospitals & Police) */}
            {[...hospitals, ...policeStations].map((point) => {
              const isHospital = point.type === 'hospital';
              const color = isHospital ? '#4CAF50' : '#1A237E';
              const icon = isHospital ? 'hospital-building' : 'police-badge';
              
              return (
                <Marker
                  key={point.id}
                  id={point.id}
                  coordinate={[point.longitude, point.latitude]}
                >
                  <View style={[styles.facilityBadge, { backgroundColor: color + '20', borderColor: color }]}>
                     <MaterialCommunityIcons 
                        name={icon as any} 
                        size={20} 
                        color={color} 
                     />
                  </View>
                  <Callout title={point.name}>
                    <View style={styles.calloutContainer}>
                      <View style={[styles.calloutBubble, { backgroundColor: theme.background, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                        <Text style={[styles.calloutTitle, { color: theme.text }]} numberOfLines={1}>{point.name}</Text>
                        <Text style={[styles.calloutSubtitle, { color: theme.icon }]}>{isHospital ? 'Hospital' : 'Police Station'}</Text>
                        <View style={[styles.calloutDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                        <View style={styles.calloutActionRow}>
                          <MaterialCommunityIcons 
                            name="information-outline" 
                            size={14} 
                            color="#FF3B70" 
                          />
                          <Text style={styles.calloutInfo}>
                            Nearby Emergency Service
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.calloutArrow, { borderBottomColor: theme.background }]} />
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapLibreMap>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FF3B70" />
            <Text style={styles.loadingText}>{errorMsg || 'Locating...'}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons 
            name={fetchingPlaces ? "loading" : "map-marker"} 
            size={16} 
            color="#757575" 
          />
          <Text style={styles.footerText}>
            {fetchingPlaces ? 'Fetching nearby units...' : `Nearby: ${hospitals.length} Hosp, ${policeStations.length} Police`}
          </Text>
        </View>
        <Text style={[styles.gpsActive, isLive && { color: '#2196F3' }]}>
          {isLive ? 'GPS Streaming' : 'GPS Standby'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2196F3',
    marginRight: 6,
  },
  liveBadgeInactive: {
    backgroundColor: '#F5F5F5',
  },
  liveText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  mapWrapper: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9E9E9E',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    marginTop: 5,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#757575',
    marginLeft: 6,
  },
  gpsActive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9E9E9E',
  },
  facilityBadge: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  calloutContainer: {
    alignItems: 'center',
    width: 220,
  },
  calloutBubble: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calloutArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
    transform: [{ rotate: '180deg' }],
    marginTop: -2,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A237E',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 11,
    color: '#757575',
    marginBottom: 8,
    lineHeight: 14,
  },
  calloutDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 8,
  },
  calloutActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calloutInfo: {
    fontSize: 11,
    color: '#FF3B70',
    fontWeight: '700',
  },
});
