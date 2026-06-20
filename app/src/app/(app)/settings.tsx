import { useThemeToggle } from "@/providers/theme-provider";
import { API_URL } from "@/rpc";
import { Host, Toggle } from "@expo/ui/swift-ui";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { ScrollView } from "react-native";
import { Paragraph, XStack, YStack } from "tamagui";

/**
 * App settings: appearance, plus the connection/build facts that matter when
 * debugging "which app am I talking to?" (API host differs between dev and
 * prod; version identifies the build a bug report came from).
 */
export default function SettingsScreen() {
  const { pref, toggle } = useThemeToggle();
  const dark = pref === "dark";

  return (
    <>
      <Stack.Screen options={{ title: "Settings", headerBackTitle: "Home" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        <YStack
          bg="$color2"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$6"
          p="$4"
          gap="$2"
        >
          <XStack items="center" justify="space-between">
            <Paragraph color="$color">Dark mode</Paragraph>
            <Host matchContents colorScheme={pref}>
              <Toggle
                isOn={dark}
                onIsOnChange={(isOn) => {
                  if (isOn !== dark) toggle();
                }}
              />
            </Host>
          </XStack>
        </YStack>

        <YStack
          bg="$color2"
          borderWidth={1}
          borderColor="$borderColor"
          rounded="$6"
          p="$4"
          gap="$2"
        >
          {/* Not new URL(...).origin — Hermes' URL support is spotty. */}
          <InfoRow label="API host" value={API_URL.replace(/\/rpc\/?$/, "")} />
          <InfoRow
            label="Version"
            value={Constants.expoConfig?.version ?? "unknown"}
          />
        </YStack>
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack justify="space-between" items="center" gap="$3">
      <Paragraph color="$color10">{label}</Paragraph>
      <Paragraph
        selectable
        flex={1}
        color="$color"
        fontWeight="600"
        text="right"
      >
        {value}
      </Paragraph>
    </XStack>
  );
}
