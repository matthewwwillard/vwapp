/**
 * Naming for vehicle closures (doors/windows). The backend stores VW's
 * positional names ("front left", "trunk", …) in `openDoors`/`openWindows`;
 * this maps them to ID. Buzz-appropriate labels (sliders, tailgate).
 */

/** The four side positions VW reports for both doors and windows. */
export const DOOR_SIDES = [
  "front left",
  "front right",
  "rear left",
  "rear right",
] as const;
export type DoorSide = (typeof DOOR_SIDES)[number];

const DOOR_LABELS: Partial<Record<string, string>> = {
  "front left": "Front left door",
  "front right": "Front right door",
  "rear left": "Left sliding door",
  "rear right": "Right sliding door",
  trunk: "Tailgate",
  hood: "Hood",
};

export function doorLabel(name: string): string {
  return DOOR_LABELS[name] ?? capitalize(name);
}

export function windowLabel(name: string): string {
  return name === "sun roof" ? "Sunroof" : capitalize(name);
}

/** All door positions to list, with any unrecognized open names appended. */
export function doorList(openDoors: string[]): string[] {
  const known: string[] = [...DOOR_SIDES, "trunk", "hood"];
  return [...known, ...openDoors.filter((d) => !known.includes(d))];
}

/** All window positions to list, with any unrecognized open names appended. */
export function windowList(openWindows: string[]): string[] {
  const known: string[] = [...DOOR_SIDES];
  return [...known, ...openWindows.filter((w) => !known.includes(w))];
}

/**
 * Compact one-line summary of open closures: a single one is named
 * ("Tailgate open"), more are counted ("2 doors, 1 window open") so the
 * dashboard row never wraps. Null when nothing is open.
 */
export function openSummary(
  openDoors: string[],
  openWindows: string[],
): string | null {
  const total = openDoors.length + openWindows.length;
  if (total === 0) return null;
  if (total === 1) {
    const [door] = openDoors;
    if (door !== undefined) return `${doorLabel(door)} open`;
    const [window] = openWindows;
    if (window !== undefined) {
      return window === "sun roof"
        ? "Sunroof open"
        : `${windowLabel(window)} window open`;
    }
  }
  const parts: string[] = [];
  if (openDoors.length > 0) {
    parts.push(
      `${String(openDoors.length)} door${openDoors.length > 1 ? "s" : ""}`,
    );
  }
  if (openWindows.length > 0) {
    parts.push(
      `${String(openWindows.length)} window${openWindows.length > 1 ? "s" : ""}`,
    );
  }
  return `${parts.join(", ")} open`;
}

/**
 * Compact unlocked-doors summary: one is named, a few are counted, and all
 * four side doors collapse to just "Unlocked". Null when none are unlocked.
 */
export function unlockedSummary(unlockedDoors: string[]): string | null {
  const [first] = unlockedDoors;
  if (first === undefined) return null;
  if (unlockedDoors.length === 1) return `${doorLabel(first)} unlocked`;
  if (unlockedDoors.length >= DOOR_SIDES.length) return "Unlocked";
  return `${String(unlockedDoors.length)} doors unlocked`;
}

/** json fields come back loosely typed; coerce to a clean string[]. */
export function strArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
