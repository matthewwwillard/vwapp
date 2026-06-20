import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useTheme } from "tamagui";

/**
 * SF Symbol with Tamagui color resolution: `color` takes one of the theme
 * tokens below (native views can't consume tokens, so they resolve through
 * the current theme) or any plain color string. Tamagui's Button injects
 * resolved `color`/`size` props into its icon element, so this also works as
 * `Button icon={<SfIcon …/>}` (the injected values just win).
 */
export function SfIcon({
  name,
  size = 24,
  color = "$color",
  mt,
}: {
  name: SymbolViewProps["name"];
  size?: number;
  color?: string;
  mt?: number;
}) {
  const theme = useTheme();
  const tokens: Record<string, string> = {
    $color: theme.color.val,
    $color10: theme.color10.val,
    $green10: theme.green10.val,
    $red10: theme.red10.val,
    $yellow10: theme.yellow10.val,
    $blue10: theme.blue10.val,
  };
  // Despite the prop type, Button's icon cloning injects a theme Variable
  // object here, not a string — unwrap its .val rather than crashing.
  const c: unknown = color;
  let resolved: string;
  if (typeof c === "string") {
    resolved = tokens[c] ?? (c.startsWith("$") ? theme.color.val : c);
  } else if (
    c !== null &&
    typeof c === "object" &&
    "val" in c &&
    typeof c.val === "string"
  ) {
    resolved = c.val;
  } else {
    resolved = theme.color.val;
  }
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={resolved}
      style={{ marginTop: mt }}
    />
  );
}
