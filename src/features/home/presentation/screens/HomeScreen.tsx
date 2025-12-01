import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Card, FAB, IconButton, Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { useCourses } from "@/src/features/courses/presentation/context/courseContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

export default function HomeScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { courses, getCoursesByTeacher, isLoading } = useCourses();
  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    // Obtener nombre del usuario
    if (user?.name) {
      setUserName(user.name);
    } else if (user?.email) {
      // Usar la parte antes del @ como nombre si no hay name
      setUserName(user.email.split('@')[0]);
    }

    // Cargar cursos del usuario si es profesor
    if (user?.uid || user?.id || user?._id) {
      const userId = user.uid || user.id || user._id;
      getCoursesByTeacher(userId);
    }
  }, [user]);

  const getCourseIcon = (index: number) => {
    const colors = ['#9C27B0', '#E91E63', '#00BCD4', '#4CAF50', '#FF9800'];
    return colors[index % colors.length];
  };

  const getRandomActivitiesCount = () => Math.floor(Math.random() * 20) + 1;
  const getRandomStudentsCount = () => Math.floor(Math.random() * 50) + 10;

  return (
    <View style={styles.container}>
      {/* Header con gradiente */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hola, {userName} 👋</Text>
              <Text style={styles.welcomeText}>Bienvenido de nuevo</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton}>
                <View style={styles.notificationContainer}>
                  <MaterialCommunityIcons name="bell-outline" size={24} color="#FFFFFF" />
                  <View style={styles.notificationBadge} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={logout}>
                <MaterialCommunityIcons name="logout" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Lista de cursos */}
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={styles.coursesHeader}>
            <Text style={styles.coursesTitle}>Mis Cursos</Text>
            <Text style={styles.coursesCount}>{courses.length} cursos</Text>
          </View>

          {isLoading ? (
            <Text style={styles.loadingText}>Cargando cursos...</Text>
          ) : courses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="book-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No tienes cursos aún</Text>
              <Text style={styles.emptySubtext}>Crea tu primer curso presionando el botón +</Text>
            </View>
          ) : (
            courses.map((course, index) => (
              <Card key={course._id || index} style={styles.courseCard} mode="elevated">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('CourseDetail', { id: course._id })}
                >
                  <Card.Content style={styles.courseContent}>
                    <View style={styles.courseRow}>
                      {/* Icono del curso */}
                      <View style={[styles.courseIcon, { backgroundColor: getCourseIcon(index) }]}>
                        <MaterialCommunityIcons name="book-open-page-variant" size={28} color="#FFFFFF" />
                      </View>

                      {/* Información del curso */}
                      <View style={styles.courseInfo}>
                        <Text style={styles.courseTitle} numberOfLines={1}>
                          {course.title}
                        </Text>
                        <View style={styles.roleBadge}>
                          <MaterialCommunityIcons name="school-outline" size={14} color="#8B5CF6" />
                          <Text style={styles.roleText}>Profesor</Text>
                        </View>
                        <View style={styles.courseStats}>
                          <View style={styles.statItem}>
                            <MaterialCommunityIcons name="account-group" size={16} color="#6B6B6B" />
                            <Text style={styles.statText}>
                              {course.studentsCount || getRandomStudentsCount()} estudiantes
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <MaterialCommunityIcons name="file-document-outline" size={16} color="#6B6B6B" />
                            <Text style={styles.statText}>
                              {getRandomActivitiesCount()} actividades
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Barra de progreso (solo si es estudiante) */}
                    {course.showProgress && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>Progreso</Text>
                          <Text style={styles.progressPercentage}>68%</Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: '68%' }]} />
                        </View>
                      </View>
                    )}
                  </Card.Content>
                </TouchableOpacity>
              </Card>
            ))
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Botón flotante para crear curso */}
      <View style={styles.fabWrapper}>
        <FAB
          icon="plus"
          style={styles.fab}
          color="#FFFFFF"
          onPress={() => navigation.navigate('AddCourse')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  headerWrapper: {
    width: '100%',
    backgroundColor: '#5C6BC0',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#5C6BC0',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#E8EAF6',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    borderWidth: 1,
    borderColor: '#5C6BC0',
  },
  scrollContent: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 20,
  },
  coursesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  coursesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  coursesCount: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B6B6B',
    marginTop: 40,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 8,
  },
  courseCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  courseContent: {
    padding: 16,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  courseIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 4,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  progressContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B6B6B',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C6BC0',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0F0F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5C6BC0',
    borderRadius: 3,
  },
  bottomPadding: {
    height: 80,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  fab: {
    backgroundColor: '#5C6BC0',
    borderRadius: 16,
  },
});
