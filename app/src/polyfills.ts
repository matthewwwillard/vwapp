/**
 * Must be imported before @instantdb/react-native: Instant side-effect-imports
 * react-native-get-random-values, whose only working backends (the
 * RNGetRandomValues native module, pre-SDK-48 Expo fallbacks) don't exist in
 * Expo Go — every crypto.getRandomValues call then throws "Native module not
 * found". Installing expo-crypto's implementation first makes that polyfill a
 * no-op (it only installs when crypto.getRandomValues is missing).
 */
import { getRandomValues } from "expo-crypto";

const g = globalThis as { crypto?: { getRandomValues?: unknown } };
g.crypto ??= {};
g.crypto.getRandomValues ??= getRandomValues;
