import { StatusBar } from "expo-status-bar";
import { createContext, use, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { TamaguiProvider, Theme } from "tamagui";
import { config } from "../../tamagui.config";

type ThemePref = "light" | "dark";

const ThemeToggleContext = createContext<{
  pref: ThemePref;
  toggle: () => void;
} | null>(null);

export function useThemeToggle(): { pref: ThemePref; toggle: () => void } {
  const ctx = use(ThemeToggleContext);
  if (ctx === null)
    throw new Error("useThemeToggle must be used within ThemeProvider");
  return ctx;
}

/** Wraps Tamagui theming; defaults to the system theme with an in-app override. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [override, setOverride] = useState<ThemePref | null>(null);
  const pref: ThemePref = override ?? (scheme === "dark" ? "dark" : "light");
  const toggle = () => {
    setOverride(pref === "dark" ? "light" : "dark");
  };

  return (
    <ThemeToggleContext.Provider value={{ pref, toggle }}>
      {/* defaultTheme is the *initial* theme; runtime switches go through the
          dynamic <Theme> wrapper — mutating defaultTheme leaves memoized
          component text with the old theme's colors. */}
      <TamaguiProvider config={config} defaultTheme={pref}>
        <Theme name={pref}>
          <StatusBar style={pref === "dark" ? "light" : "dark"} />
          {children}
        </Theme>
      </TamaguiProvider>
    </ThemeToggleContext.Provider>
  );
}
