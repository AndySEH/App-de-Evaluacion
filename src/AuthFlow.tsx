import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { IconButton } from "react-native-paper";

import { useAuth } from "./features/auth/presentation/context/authContext";
import LoginScreen from "./features/auth/presentation/screens/LoginScreen";
import SignupScreen from "./features/auth/presentation/screens/SignupScreen";
import TeacherCoursesScreen from "./features/courses/presentation/screens/TeacherCoursesScreen";
import HomeScreen from "./features/home/presentation/screens/HomeScreen";
import AddProductScreen from "./features/products/presentation/screens/AddProductScreen";
import UpdateProductScreen from "./features/products/presentation/screens/UpdateProductScreen";
import SettingScreen from "./features/settings/SettingScreen";


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function AuthFlow() {
  const { isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    return (
      <Stack.Navigator>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  function ContentTabs() {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerTitle: "Auth demo with React Navigation",
          headerRight: () => (
            <IconButton icon="logout" onPress={() => logout()} />
          ),
          headerTitleAlign: "left",
          headerStyle: {
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
          },
        }}

      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="house" size={24} color={color} iconStyle="solid" />
            )
          }}
        />
        <Tab.Screen
          name="Profile"
          component={SettingScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="user" size={24} color={color} />
            )
          }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="App" component={ContentTabs} />
          <Stack.Screen
            name="AddProductScreen"
            component={AddProductScreen}
            options={{
              title: "Add Product",
              headerShown: true,
              presentation: 'modal' // Optional: makes it slide up from bottom
            }}
          />
          <Stack.Screen
            name="UpdateProductScreen"
            component={UpdateProductScreen}
            options={{
              title: "Update Product",
              headerShown: true,
              presentation: 'modal' // Optional: makes it slide up from bottom
            }}
          />
            <Stack.Screen
              name="TeacherCourses"
              component={TeacherCoursesScreen}
              options={{
                title: "Mis Cursos",
                headerShown: true,
              }}
            />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}