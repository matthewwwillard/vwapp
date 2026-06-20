/**
 * Full-screen states shown before the navigator mounts: the spinner that sits
 * under the native splash while the session resolves, and the error state
 * when it can't be resolved (server or Instant unreachable).
 */
import { Button, H2, Paragraph, Spinner, YStack } from "tamagui";

export function BootLoading() {
  return (
    <YStack flex={1} bg="$background" items="center" justify="center">
      <Spinner size="large" color="$color" />
    </YStack>
  );
}

export function BootError({
  message,
  retrying,
  onRetry,
  onDiscardLocalAuth,
}: {
  message: string;
  retrying: boolean;
  onRetry: () => void;
  onDiscardLocalAuth: () => void;
}) {
  return (
    <YStack
      flex={1}
      bg="$background"
      items="center"
      justify="center"
      p="$5"
      gap="$4"
    >
      <H2 color="$color" text="center">
        Can&apos;t reach the server
      </H2>
      <Paragraph selectable color="$color10" text="center">
        {message}
      </Paragraph>
      <Button
        theme="blue"
        size="$4"
        disabled={retrying}
        opacity={retrying ? 0.6 : 1}
        onPress={onRetry}
      >
        {retrying ? <Spinner color="$color" /> : "Try again"}
      </Button>
      {/* Escape hatch: forget this device's identity (server session survives). */}
      <Button chromeless size="$3" onPress={onDiscardLocalAuth}>
        Log out on this device
      </Button>
    </YStack>
  );
}
