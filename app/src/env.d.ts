/**
 * EXPO_PUBLIC_* vars inlined by babel-preset-expo. Declared explicitly so dot
 * access typechecks under noPropertyAccessFromIndexSignature (Expo's lint
 * rule forbids the bracket-access workaround).
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_INSTANT_APP_ID?: string;
    }
  }
}

export {};
