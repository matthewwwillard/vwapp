import { Stack } from "expo-router";
import { useTheme } from "tamagui";

export default function AppLayout() {
  // Native headers can't consume Tamagui tokens; resolve them so the header
  // follows the in-app theme override (PlatformColor would track the system).
  const theme = useTheme();
  const color = theme.color.val;

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
        headerTitleStyle: { color },
        headerLargeTitleStyle: { color },
        headerTintColor: color,
        // Screens paint their background here so each route can keep a
        // ScrollView as its first child — UIKit requires that to drive
        // large-title collapse on scroll.
        contentStyle: { backgroundColor: theme.background.val },
        // Standard iOS bar: invisible while the large title rests over the
        // content; once scrolled, the system's scroll-edge effect takes over
        // (no headerBlurEffect — it overlaps that effect on iOS 26).
        // Android supports no transparency — give it a solid bar.
        ...(process.env.EXPO_OS === "ios"
          ? {
              headerTransparent: true,
              headerLargeStyle: { backgroundColor: "transparent" },
            }
          : {
              headerStyle: { backgroundColor: theme.background.val },
            }),
      }}
    >
      {/* Climate Start/Adjust as a native iOS form sheet (UIKit sheet) so its
          drag-to-dismiss coordinates with the native time wheel inside — an
          RN-gesture-handler sheet fights it. fitToContents sizes it to the
          form; contentStyle paints the surface (native sheets don't inherit
          the Tamagui theme). */}
      <Stack.Screen
        name="climate"
        options={{
          headerShown: false,
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          contentStyle: { backgroundColor: theme.background.val },
        }}
      />
    </Stack>
  );
}
