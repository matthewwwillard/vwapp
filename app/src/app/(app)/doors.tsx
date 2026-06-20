import {
  doorLabel,
  doorList,
  strArr,
  windowLabel,
  windowList,
} from "@/closures";
import { SfIcon } from "@/components/sf-icon";
import { VehicleVisual } from "@/components/vehicle-visual";
import { db } from "@/db";
import { agoLabel, useNow } from "@/hooks/use-now";
import { Stack } from "expo-router";
import { ScrollView } from "react-native";
import { Paragraph, Spinner, Text, View, XStack, YStack } from "tamagui";

/** Per-closure door/window status with the vehicle drawn live from the snapshot. */
export default function DoorsScreen() {
  const now = useNow();
  // Same live-query pair as the dashboard: snapshots stream in from the
  // Worker, so an opened door shows up here within a cron tick.
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

  const openDoors = strArr(snapshot?.openDoors);
  const openWindows = strArr(snapshot?.openWindows);
  const unlockedDoors = strArr(snapshot?.unlockedDoors);

  return (
    <>
      <Stack.Screen
        options={{ title: "Doors & windows", headerBackTitle: "Home" }}
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
        {!isLoading && errorMessage == null && snapshot === undefined ? (
          <Paragraph color="$color10">No status stored yet.</Paragraph>
        ) : null}
        {snapshot !== undefined ? (
          <YStack
            gap="$3"
            transition="quick"
            animateOnly={["opacity", "transform"]}
            enterStyle={{ opacity: 0, y: 20 }}
          >
            <View width="76%" self="center">
              <VehicleVisual openDoors={openDoors} openWindows={openWindows} />
            </View>
            {/* The art only depicts physical state (open/closed); lock state
                gets a badge instead. Yellow matches the per-door "Unlocked"
                rows — red stays reserved for open. */}
            {typeof snapshot.locked === "boolean" ? (
              <XStack self="center" items="center" gap="$1.5">
                {snapshot.locked ? (
                  <SfIcon name="lock.fill" size={14} color="$green10" />
                ) : (
                  <SfIcon name="lock.open.fill" size={14} color="$yellow10" />
                )}
                <Paragraph
                  color={snapshot.locked ? "$green10" : "$yellow10"}
                  fontWeight="600"
                >
                  {snapshot.locked ? "Locked" : "Unlocked"}
                </Paragraph>
              </XStack>
            ) : null}
            <YStack
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$6"
              p="$4"
              gap="$2"
            >
              <Paragraph fontWeight="700">Doors</Paragraph>
              {doorList(openDoors).map((name) => (
                <StatusRow
                  key={name}
                  label={doorLabel(name)}
                  status={
                    openDoors.includes(name)
                      ? "open"
                      : unlockedDoors.some((u) => u.startsWith(name))
                        ? "unlocked"
                        : "closed"
                  }
                />
              ))}
            </YStack>
            <YStack
              bg="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$6"
              p="$4"
              gap="$2"
            >
              <Paragraph fontWeight="700">Windows</Paragraph>
              {windowList(openWindows).map((name) => (
                <StatusRow
                  key={name}
                  label={windowLabel(name)}
                  status={openWindows.includes(name) ? "open" : "closed"}
                />
              ))}
            </YStack>
            <Paragraph color="$color10" fontSize="$2" self="center">
              Updated {agoLabel(snapshot.capturedAt ?? snapshot.createdAt, now)}
            </Paragraph>
          </YStack>
        ) : null}
      </ScrollView>
    </>
  );
}

const STATUS_STYLES = {
  open: { text: "Open", color: "$red10", weight: "600" },
  unlocked: { text: "Unlocked", color: "$yellow10", weight: "600" },
  closed: { text: "Closed", color: "$color10", weight: "400" },
} as const;

function StatusRow({
  label,
  status,
}: {
  label: string;
  status: keyof typeof STATUS_STYLES;
}) {
  const s = STATUS_STYLES[status];
  return (
    <XStack justify="space-between" items="center" gap="$3">
      <Paragraph color="$color">{label}</Paragraph>
      <Paragraph color={s.color} fontWeight={s.weight}>
        {s.text}
      </Paragraph>
    </XStack>
  );
}
