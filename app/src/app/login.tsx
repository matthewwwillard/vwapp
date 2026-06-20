import { orpc } from "@/rpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Button, H1, Input, Paragraph, Text, YStack } from "tamagui";

export default function Login() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [spin, setSpin] = useState("");

  const login = useMutation(
    orpc.auth.login.mutationOptions({
      onSuccess: async () => {
        // Flipping auth.me to logged-in makes the layout guard swap to the dashboard.
        await queryClient.invalidateQueries();
      },
    }),
  );

  const canSubmit =
    username !== "" &&
    password !== "" &&
    /^\d{4,6}$/.test(spin) &&
    !login.isPending;
  const submit = () => {
    if (canSubmit) login.mutate({ username, password, spin });
  };

  return (
    <YStack flex={1} bg="$background">
      {/* mode="layout" sizes a spacer to the keyboard instead of growing the
          scrollable area, so the centered form reflows into the remaining
          space with no excess scroll range above or below. */}
      {/* No contentInsetAdjustmentBehavior here: on iOS "automatic" also
          counts the keyboard as an inset, stacking a second scroll range on
          top of the layout spacer. No header on this screen, so nothing else
          needs it. */}
      <KeyboardAwareScrollView
        mode="layout"
        bottomOffset={16}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 16,
          gap: 16,
        }}
      >
        <H1 color="$color">My ID. Buzz</H1>
        <Paragraph color="$color10">
          Sign in with your Volkswagen (myVW) account.
        </Paragraph>
        <Input
          size="$5"
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={username}
          onChangeText={setUsername}
        />
        <Input
          size="$5"
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
        />
        <Input
          size="$5"
          placeholder="S-PIN (4-digit)"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          returnKeyType="go"
          onSubmitEditing={submit}
          value={spin}
          onChangeText={setSpin}
        />
        <Paragraph color="$color10" fontSize="$2">
          Your myVW security PIN — needed to lock and unlock the doors remotely.
        </Paragraph>
        {login.error ? (
          <Text
            selectable
            color="$red10"
            transition="quick"
            animateOnly={["opacity"]}
            enterStyle={{ opacity: 0 }}
          >
            {login.error.message}
          </Text>
        ) : null}
        <Button size="$5" theme="blue" disabled={!canSubmit} onPress={submit}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </KeyboardAwareScrollView>
    </YStack>
  );
}
