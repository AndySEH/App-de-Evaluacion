import { createStackNavigator } from "@react-navigation/stack";

import ActivityDetailScreen from "./features/activities/presentation/screens/ActivityDetailScreen";
import AssessmentGradesScreen from "./features/activities/presentation/screens/AssessmentGradesScreen";
import PeerEvaluationFormScreen from "./features/activities/presentation/screens/PeerEvaluationFormScreen";
import PeerEvaluationScreen from "./features/activities/presentation/screens/PeerEvaluationScreen";
import StudentGradesScreen from "./features/activities/presentation/screens/StudentGradesScreen";
import TeacherGradesTableScreen from "./features/activities/presentation/screens/TeacherGradesTableScreen";
import { useAuth } from "./features/auth/presentation/context/authContext";
import LoginScreen from "./features/auth/presentation/screens/LoginScreen";
import SignupScreen from "./features/auth/presentation/screens/SignupScreen";
import AddCourseScreen from "./features/courses/presentation/screens/AddCourseScreen";
import CategoryDetailScreen from "./features/courses/presentation/screens/CategoryDetailScreen";
import CourseDetailScreen from "./features/courses/presentation/screens/CourseDetailScreen";
import TeacherCoursesScreen from "./features/courses/presentation/screens/TeacherCoursesScreen";
import HomeScreen from "./features/home/presentation/screens/HomeScreen";
import NotificationsScreen from "./features/notifications/NotificationsScreen";
import SettingScreen from "./features/settings/SettingScreen";


const Stack = createStackNavigator();

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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingScreen} />
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
          <Stack.Screen
            name="CategoryDetail"
            component={CategoryDetailScreen}
            options={{
              title: "Grupos - Categoría",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ActivityDetail"
            component={ActivityDetailScreen}
            options={{
              title: "Detalles de la Actividad",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="PeerEvaluationForm"
            component={PeerEvaluationFormScreen}
            options={{
              title: "Evaluar Compañeros",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="PeerEvaluation"
            component={PeerEvaluationScreen}
            options={{
              title: "Evaluar Compañeros",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AssessmentGrades"
            component={AssessmentGradesScreen}
            options={{
              title: "Calificaciones",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="StudentGrades"
            component={StudentGradesScreen}
            options={{
              title: "Mis Calificaciones",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="TeacherGradesTable"
            component={TeacherGradesTableScreen}
            options={{
              title: "Tabla de Calificaciones",
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