import { defaultConfig } from "@tamagui/config/v4";
import { defaultThemes } from "@tamagui/themes/v4";
import { createTamagui } from "tamagui";

// defaultConfig.themes is typed via `import("@tamagui/themes/types/generated-v4")`,
// a subpath the @tamagui/themes exports map doesn't expose, so under
// moduleResolution "bundler" it silently degrades to `any` (and with it every
// `useTheme()` value). defaultThemes is the same object reached through a
// resolvable type path.
export const config = createTamagui({
  ...defaultConfig,
  themes: defaultThemes,
  settings: { ...defaultConfig.settings, styleCompat: "react-native" },
});

type Conf = typeof config;

declare module "tamagui" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends Conf {}
}
