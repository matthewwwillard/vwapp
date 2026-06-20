import { orpc } from "@/rpc";
import { useQuery } from "@tanstack/react-query";
import type { InboxMessageDTO } from "@vwapp/contract";
import { Stack } from "expo-router";
import { RefreshControl, ScrollView } from "react-native";
import {
  Circle,
  Paragraph,
  Spinner,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

/** myVW message-center inbox (notices from VW). */
export default function MessagesScreen() {
  // Native RefreshControl needs a resolved color string, not a Tamagui token.
  const theme = useTheme();
  const query = useQuery(orpc.vehicle.messages.queryOptions({ input: {} }));
  const messages = query.data?.messages ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Messages", headerBackTitle: "Home" }} />
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
        {query.isPending ? <Spinner color="$color" /> : null}
        {query.error ? (
          <Text selectable color="$red10">
            {query.error.message}
          </Text>
        ) : null}
        {!query.isPending && query.error === null && messages.length === 0 ? (
          <Paragraph color="$color10">No messages.</Paragraph>
        ) : null}
        {messages.map((m) => (
          <MessageCard key={m.id} m={m} />
        ))}
      </ScrollView>
    </>
  );
}

function MessageCard({ m }: { m: InboxMessageDTO }) {
  return (
    <YStack
      bg="$color2"
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$6"
      p="$4"
      gap="$2"
    >
      <XStack items="center" gap="$2">
        {!m.read ? <Circle size={8} bg="$blue10" /> : null}
        <Paragraph flex={1} color="$color" fontWeight="700">
          {m.title}
        </Paragraph>
        {m.at != null ? (
          <Paragraph color="$color10" fontSize="$2">
            {formatDate(m.at)}
          </Paragraph>
        ) : null}
      </XStack>
      {m.body != null && m.body !== "" ? (
        <Paragraph selectable color="$color10" fontSize="$3">
          {m.body}
        </Paragraph>
      ) : null}
    </YStack>
  );
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
