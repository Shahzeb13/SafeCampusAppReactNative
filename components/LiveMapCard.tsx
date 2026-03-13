import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const LiveMapCard = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Location</Text>
        <View style={styles.headerRight}>
          <View style={styles.liveBadge}>
             <View style={styles.liveDot} />
             <Text style={styles.liveText}>Live</Text>
          </View>
          <Switch value={true} trackColor={{ false: "#767577", true: "#673AB7" }} thumbColor="#fff" />
        </View>
      </View>

      <View style={styles.mapWrapper}>
        {location ? (
          <MapView
            style={styles.map}
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
              title="You are here"
            />
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
          <MaterialCommunityIcons name="map-marker" size={16} color="#757575" />
          <Text style={styles.footerText}>Nearby units: 2 Active</Text>
        </View>
        <Text style={styles.gpsActive}>GPS Active</Text>
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
});
