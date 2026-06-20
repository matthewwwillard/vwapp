import { SfIcon } from "@/components/sf-icon";
import { db } from "@/db";
import { agoLabel, useNow } from "@/hooks/use-now";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Stack } from "expo-router";
import { lazy, Suspense, type ReactNode } from "react";
import { Linking, Platform, ScrollView } from "react-native";
import { Button, Paragraph, Spinner, Text, XStack, YStack } from "tamagui";

// expo-maps is a native module absent from Expo Go, so it can only render in a
// dev/TestFlight build (and on iOS — it wraps MapKit). Loaded lazily so the
// module is never evaluated where it would throw; Expo Go gets a placeholder.
const ParkedMap = lazy(() => import("@/components/parked-map"));
const nativeMapAvailable =
  Platform.OS === "ios" &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/**
 * Where the car last parked: the location details we have from VW (a mini-map
 * embed is a likely future addition), with handoff buttons to Apple Maps and
 * Google Maps.
 */
export default function ParkedScreen() {
  const now = useNow();
  // Same live-query pair as the dashboard.
  const vehiclesQuery = db.useQuery({ vehicles: {} });
  const vehicle = vehiclesQuery.data?.vehicles[0];
  const snapshotQuery = db.useQuery(
    vehicle === undefined
      ? null
      : {
          snapshots: {
            $: {
              where: { "vehicle.id": vehicle.id },
              order: { createdAt: "desc" },
              limit: 1,
            },
          },
        },
  );
  const snapshot = snapshotQuery.data?.snapshots[0];
  // A skipped (null) query reports isLoading forever — only consult it once
  // there's a vehicle and the query actually runs.
  const isLoading =
    vehiclesQuery.isLoading ||
    (vehicle !== undefined && snapshotQuery.isLoading);
  const errorMessage = (vehiclesQuery.error ?? snapshotQuery.error)?.message;

  const parked =
    snapshot?.parkedLat != null && snapshot.parkedLng != null
      ? {
          lat: snapshot.parkedLat,
          lng: snapshot.parkedLng,
          at: snapshot.parkedAt ?? null,
        }
      : null;

  return (
    <>
      <Stack.Screen
        options={{ title: "Parked location", headerBackTitle: "Home" }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        {isLoading ? (
          <Spinner
            color="$color"
            transition="quick"
            enterStyle={{ opacity: 0 }}
          />
        ) : null}
        {errorMessage != null ? (
          <Text selectable color="$red10">
            {errorMessage}
          </Text>
        ) : null}
        {!isLoading && errorMessage == null && parked === null ? (
          <Paragraph color="$color10">
            No parked location stored. The car reports where it parked when it’s
            switched off; it should appear after the next check-in.
          </Paragraph>
        ) : null}

        {parked !== null ? (
          <YStack
            gap="$4"
            transition="quick"
            animateOnly={["opacity", "transform"]}
            enterStyle={{ opacity: 0, y: 20 }}
          >
            <MapPanel lat={parked.lat} lng={parked.lng} />

            <YStack
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$6"
              p="$4"
              gap="$3"
            >
              <XStack items="center" gap="$3">
                <SfIcon name="mappin.and.ellipse" color="$blue10" size={26} />
                <YStack flex={1}>
                  <Paragraph color="$color" fontWeight="700" fontSize="$6">
                    Last parked
                  </Paragraph>
                  {parked.at !== null ? (
                    <Paragraph color="$color10" fontSize="$2">
                      {`${clockLabel(parked.at, now)} · ${agoLabel(parked.at, now)}`}
                    </Paragraph>
                  ) : null}
                </YStack>
              </XStack>
              <XStack justify="space-between" items="center" gap="$3">
                <Paragraph color="$color10">Coordinates</Paragraph>
                <Paragraph
                  selectable
                  color="$color"
                  fontWeight="600"
                  fontVariant={["tabular-nums"]}
                >
                  {`${parked.lat.toFixed(5)}, ${parked.lng.toFixed(5)}`}
                </Paragraph>
              </XStack>
            </YStack>

            <YStack gap="$3">
              <Button
                size="$5"
                theme="blue"
                icon={<SfIcon name="map.fill" />}
                onPress={() => {
                  void Linking.openURL(appleMapsUrl(parked.lat, parked.lng));
                }}
              >
                Open in Apple Maps
              </Button>
              <Button
                size="$5"
                icon={<SfIcon name="map" />}
                onPress={() => {
                  void openGoogleMaps(parked.lat, parked.lng);
                }}
              >
                Open in Google Maps
              </Button>
            </YStack>
          </YStack>
        ) : null}
      </ScrollView>
    </>
  );
}

/** Centered fill used both as the map's loading state and its fallback box. */
function MapBox({ children }: { children?: ReactNode }) {
  return (
    <YStack flex={1} bg="$color2" items="center" justify="center" gap="$2">
      {children}
    </YStack>
  );
}

/**
 * The inline map. Renders the native Apple Maps view where it's available
 * (iOS dev/TestFlight build), and a graceful placeholder elsewhere (Expo Go,
 * Android) — the Open-in-Maps buttons below cover those cases.
 */
function MapPanel({ lat, lng }: { lat: number; lng: number }) {
  return (
    <YStack
      height={200}
      rounded="$6"
      overflow="hidden"
      borderWidth={1}
      borderColor="$borderColor"
    >
      {nativeMapAvailable ? (
        <Suspense
          fallback={
            <MapBox>
              <Spinner color="$color10" />
            </MapBox>
          }
        >
          <ParkedMap lat={lat} lng={lng} />
        </Suspense>
      ) : (
        <MapBox>
          <SfIcon name="map" color="$color10" size={28} />
          <Paragraph color="$color10" fontSize="$2">
            Map preview unavailable here
          </Paragraph>
        </MapBox>
      )}
    </YStack>
  );
}

const PIN_LABEL = encodeURIComponent("My vehicle");

function appleMapsUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?ll=${String(lat)},${String(lng)}&q=${PIN_LABEL}`;
}

/**
 * Prefer the Google Maps app over its website. openURL (unlike canOpenURL)
 * needs no LSApplicationQueriesSchemes entry, so try the app's scheme and fall
 * back to the web URL when it rejects (app not installed).
 */
async function openGoogleMaps(lat: number, lng: number): Promise<void> {
  const q = `${String(lat)},${String(lng)}`;
  try {
    await Linking.openURL(`comgooglemaps://?q=${q}`);
  } catch {
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
    );
  }
}

/** "8:40 PM" today; otherwise prefixed with the day ("Jun 9, 8:40 PM"). */
function clockLabel(epochMs: number, now: number): string {
  const d = new Date(epochMs);
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (d.toDateString() === new Date(now).toDateString()) return time;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}
