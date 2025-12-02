import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";

import { useAuth } from "./features/auth/presentation/context/authContext";
import LoginScreen from "./features/auth/presentation/screens/LoginScreen";
import SignupScreen from "./features/auth/presentation/screens/SignupScreen";
import AddCourseScreen from "./features/courses/presentation/screens/AddCourseScreen";
import CourseDetailScreen from "./features/courses/presentation/screens/CourseDetailScreen";
import TeacherCoursesScreen from "./features/courses/presentation/screens/TeacherCoursesScreen";
import HomeScreen from "./features/home/presentation/screens/HomeScreen";
import NotificationsScreen from "./features/notifications/NotificationsScreen";
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
          headerShown: false,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
            elevation: 0,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: "Inicio",
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="house" size={24} color={color} iconStyle="solid" />
            )
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarLabel: "Notificaciones",
            tabBarIcon: ({ color }) => (
              <FontAwesome6 name="bell" size={24} color={color} />
            )
          }}
        />
        <Tab.Screen
          name="Profile"
          component={SettingScreen}
          options={{
            tabBarLabel: "Perfil",
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
            name="TeacherCourses"
            component={TeacherCoursesScreen}
            options={{
              title: "Mis Cursos",
              headerShown: true,
            }}
          />
          <Stack.Screen
            name="AddCourse"
            component={AddCourseScreen}
            options={{
              title: "Crear Curso",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="CourseDetail"
            component={CourseDetailScreen}
            options={{
              title: "Detalles del Curso",
              headerShown: false,
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