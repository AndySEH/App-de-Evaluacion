
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Surface, Text, TextInput, useTheme } from "react-native-paper";
import { useAuth } from "../context/authContext";

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { login } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validaciones
      if (!email || !password) {
        setError("Por favor, ingresa tu email y contraseña");
        return;
      }

      await login(email, password);
    } catch (err) {
      console.error("Login failed", err);
      setError("No se pudo iniciar sesión. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface style={styles.container}>
      {/* Error Message Box */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#FFFFFF" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.contentContainer}>
          {/* Logo Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#FFFFFF" />
          </View>

          {/* Title and Subtitle */}
          <Text variant="headlineMedium" style={styles.title}>
            Bienvenido
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Inicia sesión para continuar
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text variant="bodyMedium" style={styles.label}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="tu@email.com"
              mode="flat"
              style={styles.input}
              underlineStyle={{ display: 'none' }}
              contentStyle={styles.inputContent}
              textColor="#000000"
              placeholderTextColor="#999999"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text variant="bodyMedium" style={styles.label}>
              Contraseña
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              placeholder="••••••••"
              mode="flat"
              style={styles.input}
              underlineStyle={{ display: 'none' }}
              contentStyle={styles.inputContent}
              textColor="#000000ff"
              placeholderTextColor="#999999"
            />
          </View>

          {/* Forgot Password Link */}
          <Button
            mode="text"
            onPress={() => {}}
            style={styles.forgotButton}
            labelStyle={styles.forgotButtonLabel}
          >
            ¿Olvidaste tu contraseña?
          </Button>

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            labelStyle={styles.loginButtonLabel}
            buttonColor="#1C1C1E"
          >
            Iniciar sesión
          </Button>

          {/* Signup Button */}
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Signup')}
            style={styles.signupButton}
            labelStyle={styles.signupButtonLabel}
          >
            Registrarse
          </Button>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: '#DC3545',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    maxWidth: 500,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    maxWidth: 500,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#5C6BC0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B6B6B',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    color: '#1C1C1E',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F0F0F5',
    borderRadius: 12,
  },
  inputContent: {
    backgroundColor: '#F0F0F5',
    paddingHorizontal: 16,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotButtonLabel: {
    color: '#5C6BC0',
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 6,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signupButton: {
    width: '100%',
    marginTop: 24,
    borderRadius: 12,
    borderColor: '#5C6BC0',
    paddingVertical: 6,
  },
  signupButtonLabel: {
    color: '#5C6BC0',
    fontSize: 16,
    fontWeight: '600',
  },
});
