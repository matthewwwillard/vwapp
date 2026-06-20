import { useTransientError } from "@/hooks/use-transient-error";
import { orpc } from "@/rpc";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";
import {
  AnimatePresence,
  Button,
  Paragraph,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { SfIcon } from "./sf-icon";

/**
 * Lock/unlock control for one vehicle. State comes from the latest snapshot
 * (`locked`); the command RPC waits for VW to confirm before resolving, so a
 * fresh snapshot — and the true state — has landed by the time the spinner
 * stops. Unlocking asks for confirmation since it exposes the car.
 */
export function LockControl({
  uuid,
  locked,
}: {
  uuid: string;
  locked: boolean | null;
}) {
  const command = useMutation(orpc.vehicle.command.mutationOptions());
  const shownError = useTransientError(command.error);

  const pending = command.isPending;
  const inFlight = pending ? command.variables.action : undefined;
  // While a command runs, show its intended outcome; otherwise the snapshot.
  const shownLocked = inFlight !== undefined ? inFlight === "lock" : locked;

  const run = (action: "lock" | "unlock") => {
    command.mutate({ uuid, action });
  };

  // Native UIAlertController; unlocking exposes the car, so it's worth a
  // second tap.
  const confirmUnlock = () => {
    Alert.alert(
      "Unlock the doors?",
      "Anyone nearby will be able to open your vehicle until it's locked again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlock",
          onPress: () => {
            run("unlock");
          },
        },
      ],
    );
  };

  const stateLabel =
    inFlight === "lock"
      ? "Locking…"
      : inFlight === "unlock"
        ? "Unlocking…"
        : shownLocked === null
          ? "Status unknown"
          : shownLocked
            ? "Locked"
            : "Unlocked";

  const iconName =
    shownLocked === false
      ? ("lock.open.fill" as const)
      : ("lock.fill" as const);
  const iconColor =
    shownLocked === false ? "$red10" : shownLocked ? "$green10" : "$color10";

  return (
    <YStack
      bg="$color2"
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$6"
      p="$4"
      gap="$3"
    >
      {/* Single row: state on the left, the opposite action inline on the
          right (both actions when the state is unknown, so the user is never
          stuck). */}
      <XStack items="center" gap="$3">
        <SfIcon name={iconName} color={iconColor} size={26} />
        <Paragraph flex={1} color="$color" fontWeight="700" fontSize="$6">
          {stateLabel}
        </Paragraph>
        {pending ? <Spinner color="$color10" /> : null}
        {shownLocked !== false ? (
          <Button
            size="$4"
            theme="blue"
            disabled={pending}
            opacity={pending ? 0.6 : 1}
            icon={<SfIcon name="lock.open.fill" />}
            onPress={confirmUnlock}
          >
            Unlock
          </Button>
        ) : null}
        {shownLocked !== true ? (
          <Button
            size="$4"
            theme="green"
            disabled={pending}
            opacity={pending ? 0.6 : 1}
            icon={<SfIcon name="lock.fill" />}
            onPress={() => {
              run("lock");
            }}
          >
            Lock
          </Button>
        ) : null}
      </XStack>

      <AnimatePresence>
        {shownError ? (
          <Text
            key="cmd-error"
            selectable
            color="$red10"
            fontSize="$2"
            transition="quick"
            animateOnly={["opacity"]}
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          >
            {shownError.message}
          </Text>
        ) : null}
      </AnimatePresence>
    </YStack>
  );
}
