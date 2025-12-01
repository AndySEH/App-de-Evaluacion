import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { PaperProvider } from "react-native-paper";
import AuthFlow from "./src/AuthFlow";

import { DIProvider } from "./src/core/di/DIProvider";
import { AuthProvider } from "./src/features/auth/presentation/context/authContext";
import { CourseProvider } from "./src/features/courses/presentation/context/courseContext";
import { darkTheme, lightTheme } from "./src/theme/theme";



export default function App() {
  console.log("App component rendering...");
  try {
    const scheme = useColorScheme();
    const theme = scheme === "dark" ? darkTheme : lightTheme;
    console.log("Current theme:", scheme);
    //console.log("Using theme:", theme);

  const navigationTheme = {
    ...(scheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
      primary: theme.colors.primary,
      notification: theme.colors.error,
    },
  };

    return (
      <PaperProvider theme={theme}>
        <DIProvider>
          <AuthProvider>
            <CourseProvider>
              <NavigationContainer theme={navigationTheme}>
                <AuthFlow />
              </NavigationContainer>
            </CourseProvider>
          </AuthProvider>
        </DIProvider>
      </PaperProvider>
    );
  } catch (error) {
    console.error("Error in App component:", error);
    return null;
  }
}