
import { useState } from "react";
import { Button, Surface, Text, TextInput } from "react-native-paper";
import { useAuth } from "../context/authContext";

export default function SignupScreen({ navigation }: { navigation: any }) {
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    try {
      setLoading(true);
      await signup(email, password);
    } catch (err) {
      console.error("Signup failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text variant="headlineMedium" style={{ marginBottom: 20, textAlign: "center" }}>
        Create an Account
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: 12 }}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: 20 }}
      />

      <Button
        mode="contained"
        onPress={handleSignup}
        loading={loading}
        disabled={loading}
        style={{ marginBottom: 10 }}
      >
        Sign Up
      </Button>

      <Button mode="text" onPress={() => navigation.goBack()}>
        Already have an account? Log In
      </Button>


    </Surface>
  );
}
