import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { overpassService, NearbyPlace } from '../services/overpassService';

export const LiveMapCard = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [hospitals, setHospitals] = useState<NearbyPlace[]>([]);
  const [policeStations, setPoliceStations] = useState<NearbyPlace[]>([]);
  const [fetchingPlaces, setFetchingPlaces] = useState(false);
  const mapRef = React.useRef<MapView>(null);

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
        // High accuracy live tracking
        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 1,
          },
          (newLocation) => {
            setLocation(newLocation);
            
            // Fetch data from Overpass API (OpenStreetMap)
            if (hospitals.length === 0 && policeStations.length === 0 && !fetchingPlaces) {
              fetchNearbyEmergencyServices(newLocation.coords.latitude, newLocation.coords.longitude);
            }

            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }, 1000);
            }
          }
        );

        // REAL-TIME COMPASS (Points where device points)
        headingSubscription = await Location.watchHeadingAsync((h) => {
          setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading);
        });

      } else {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
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
    setErrorMsg(null);
    try {
      // Use the optimized combined fetcher
      const places = await overpassService.getNearbyEmergencyPlaces(lat, lng);

      setHospitals(places.filter(p => p.type === 'hospital'));
      setPoliceStations(places.filter(p => p.type === 'police'));

      if (places.length === 0) {
        console.log("No nearby facilities found.");
      }
    } catch (error: any) {
      console.error("Failed to fetch Overpass data:", error.message);
      setErrorMsg("Failed to load nearby services. Please check connection.");
    } finally {
      setFetchingPlaces(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Location</Text>
        <View style={styles.headerRight}>
          <View style={[styles.liveBadge, !isLive && styles.liveBadgeInactive]}>
             <View style={[styles.liveDot, !isLive && { backgroundColor: '#757575' }]} />
             <Text style={[styles.liveText, !isLive && { color: '#757575' }]}>
               {isLive ? 'Live Tracking' : 'Standby'}
             </Text>
          </View>
          <Switch 
            value={isLive} 
            onValueChange={(val) => setIsLive(val)}
            trackColor={{ false: "#767577", true: "#673AB7" }} 
            thumbColor="#fff" 
          />
        </View>
      </View>

      <View style={styles.mapWrapper}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={false} // Custom marker for better control
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              rotation={heading} // Real-time compass heading
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true} 
            >
              <View style={styles.arrowContainer}>
                 <MaterialCommunityIcons 
                    name="navigation" 
                    size={32} 
                    color="#2196F3" 
                    style={{ transform: [{ rotate: '0deg' }] }} // Base rotation for the icon itself
                 />
              </View>
            </Marker>

            {/* Emergency Facilities Markers (Hospitals & Police) */}
            {[...hospitals, ...policeStations].map((point) => {
              const isHospital = point.type === 'hospital';
              const color = isHospital ? '#4CAF50' : '#1A237E';
              const icon = isHospital ? 'hospital-building' : 'police-badge';
              
              return (
                <Marker
                  key={point.id}
                  coordinate={{ 
                    latitude: point.latitude, 
                    longitude: point.longitude 
                  }}
                  title={`${isHospital ? 'Hospital' : 'Police'} - ${point.name}`}
                >
                  <View style={[styles.facilityBadge, { backgroundColor: color + '20', borderColor: color }]}>
                     <MaterialCommunityIcons 
                        name={icon as any} 
                        size={20} 
                        color={color} 
                     />
                  </View>
                  <Callout tooltip>
                    <View style={styles.calloutContainer}>
                      <View style={styles.calloutBubble}>
                        <Text style={styles.calloutTitle} numberOfLines={1}>{point.name}</Text>
                        <Text style={styles.calloutSubtitle}>{isHospital ? 'Hospital' : 'Police Station'}</Text>
                        <View style={styles.calloutDivider} />
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
                      <View style={styles.calloutArrow} />
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>
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
  map: {
    width: '100%',
    height: '100%',
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
  arrowContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
