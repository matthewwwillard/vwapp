const KM_PER_MILE = 1.609344;

export function kmToMiles(km: number): number {
  return Math.round(km / KM_PER_MILE);
}

/** Format a distance stored in km as US miles, e.g. 329 -> "204 mi". */
export function formatMiles(km: number | null | undefined): string {
  return km == null ? "—" : `${String(kmToMiles(km))} mi`;
}
