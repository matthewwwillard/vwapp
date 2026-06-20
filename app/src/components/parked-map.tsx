import { AppleMaps } from "expo-maps";

/**
 * Native Apple Maps (MapKit) preview of a single coordinate.
 *
 * Isolated in its own module and loaded LAZILY by the parked screen, and only
 * outside Expo Go: expo-maps calls `requireNativeModule('ExpoMaps')` at import
 * time, which throws in Expo Go (the native module isn't in the Go client). The
 * caller gates on platform + execution environment and renders a fallback
 * otherwise — so this file is never evaluated where it can't load. iOS only.
 */
export default function ParkedMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <AppleMaps.View
      style={{ flex: 1 }}
      cameraPosition={{
        coordinates: { latitude: lat, longitude: lng },
        zoom: 15,
      }}
      markers={[
        {
          coordinates: { latitude: lat, longitude: lng },
          title: "My vehicle",
          systemImage: "car.fill",
          tintColor: "#0a84ff",
        },
      ]}
    />
  );
}
