/**
 * 🗺️ MapLibre GL Quick Reference for SafeCampus
 * 
 * ACTUAL EXPORT NAMES (verified from node_modules):
 *   Map, Camera, Marker, Callout, UserLocation
 * 
 * ⚠️ NOT MapView, NOT PointAnnotation — those don't exist in this library!
 */

import { Map as MapLibreMap, Camera, Marker, UserLocation, Callout } from '@maplibre/maplibre-react-native';

// ============================================================================
// 1. BASIC MAP
// ============================================================================
// <MapLibreMap styleURL="https://tiles.openfreemap.org/styles/liberty">
//   <Camera zoomLevel={12} centerCoordinate={[73.0479, 33.6844]} />
// </MapLibreMap>

// ============================================================================
// 2. LIVE USER TRACKING
// ============================================================================
// <MapLibreMap styleURL="...">
//   <Camera followUserLocation={true} followUserMode="compass" followZoomLevel={16} />
//   <UserLocation visible={true} />
// </MapLibreMap>

// ============================================================================
// 3. MARKERS
// ============================================================================
// <Marker id="my-marker" coordinate={[longitude, latitude]}>
//   <View>...</View>
//   <Callout title="Name" />
// </Marker>

// ============================================================================
// 🚨 COORDINATE ORDER IS [longitude, latitude] — ALWAYS!
// ============================================================================
