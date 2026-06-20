import { snapshotUpdates, type UpdateEvent } from "@/activity-events";
import { SfIcon } from "@/components/sf-icon";
import { db } from "@/db";
import { orpc } from "@/rpc";
import { useQuery } from "@tanstack/react-query";
import type { ActivityEventDTO } from "@vwapp/contract";
import { Stack } from "expo-router";
import { RefreshControl, ScrollView } from "react-native";
import { Paragraph, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

/** How many stored snapshots to diff for data-update events. */
const SNAPSHOT_WINDOW = 500;

/**
 * Recent vehicle activity: VW's own event log (remote command requests) is
 * only half the story, so it's merged with data-update events diffed from our
 * stored snapshots (lock/doors/windows/plug/charging — what the car did on
 * its own). The snapshots arrive via live query, so updates stream in without
 * a refresh.
 */
export default function ActivityScreen() {
  // Native RefreshControl needs a resolved color string, not a Tamagui token.
  const theme = useTheme();
  const query = useQuery(orpc.vehicle.activity.queryOptions({ input: {} }));

  const vehiclesQuery = db.useQuery({ vehicles: {} });
  const vehicle = vehiclesQuery.data?.vehicles[0];
  const snapshotsQuery = db.useQuery(
    vehicle === undefined
      ? null
      : {
          snapshots: {
            $: {
              where: { "vehicle.id": vehicle.id },
              order: { createdAt: "desc" },
              limit: SNAPSHOT_WINDOW,
            },
          },
        },
  );

  const events = mergeEvents(
    query.data?.events ?? [],
    snapshotUpdates(snapshotsQuery.data?.snapshots ?? []),
  );

  // A skipped (null) query reports isLoading forever — only consult the
  // snapshot query once there's a vehicle and it actually runs.
  const isPending =
    query.isPending ||
    vehiclesQuery.isLoading ||
    (vehicle !== undefined && snapshotsQuery.isLoading);
  const errorMessage = (
    query.error ??
    vehiclesQuery.error ??
    snapshotsQuery.error
  )?.message;

  return (
    <>
      <Stack.Screen options={{ title: "Activity", headerBackTitle: "Home" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
            }}
            tintColor={theme.color.val}
          />
        }
      >
        {isPending ? <Spinner color="$color" /> : null}
        {errorMessage !== undefined ? (
          <Text selectable color="$red10">
            {errorMessage}
          </Text>
        ) : null}
        {!isPending && errorMessage === undefined && events.length === 0 ? (
          <Paragraph color="$color10">No recent activity.</Paragraph>
        ) : null}
        {events.map((e, i) => (
          <ActivityRow key={`${String(e.at)}-${String(i)}`} e={e} />
        ))}
      </ScrollView>
    </>
  );
}

interface Row {
  at: number | null;
  title: string;
  description: string | null;
  icon: UpdateEvent["icon"];
}

/** Both sources in one stream, newest first (VW events without a time sink). */
function mergeEvents(
  vwEvents: ActivityEventDTO[],
  updates: UpdateEvent[],
): Row[] {
  const rows: Row[] = [
    ...vwEvents.map((e) => ({
      at: e.at,
      title: e.title,
      description: e.description,
      icon: iconForVwType(e.type),
    })),
    ...updates,
  ];
  return rows.sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
}

function iconForVwType(type: string | null): Row["icon"] {
  switch (type) {
    case "Trip":
      return "location.fill";
    case "Alert":
      return "exclamationmark.triangle.fill";
    case "Commands":
      return "bolt.fill";
    default:
      return "bell.fill";
  }
}

function ActivityRow({ e }: { e: Row }) {
  return (
    <XStack gap="$3" items="flex-start">
      <SfIcon name={e.icon} color="$color10" size={20} mt={2} />
      <YStack flex={1} gap="$0.5">
        <Paragraph color="$color" fontWeight="600">
          {e.title}
        </Paragraph>
        {e.description != null && e.description !== "" ? (
          <Paragraph color="$color10" fontSize="$2">
            {e.description}
          </Paragraph>
        ) : null}
      </YStack>
      {e.at != null ? (
        <Paragraph
          color="$color10"
          fontSize="$2"
          fontVariant={["tabular-nums"]}
        >
          {formatWhen(e.at)}
        </Paragraph>
      ) : null}
    </XStack>
  );
}

function formatWhen(epochMs: number): string {
  return new Date(epochMs).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
