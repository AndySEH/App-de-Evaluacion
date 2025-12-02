import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { GetActivitiesCountByCourseUseCase } from "@/src/features/activities/domain/usecases/GetActivitiesCountByCourseUseCase";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { useCourses } from "@/src/features/courses/presentation/context/courseContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, FAB, Text, useTheme } from "react-native-paper";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

export default function HomeScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { courses, getAllCourses, isLoading } = useCourses();
  const di = useDI();
  const getActivitiesCountUC = di.resolve<GetActivitiesCountByCourseUseCase>(TOKENS.GetActivitiesCountByCourseUC);
  
  const [userName, setUserName] = useState("Usuario");
  const [activitiesCounts, setActivitiesCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    console.log('[HomeScreen] useEffect triggered - user:', user);
    
    // Obtener nombre del usuario
    if (user?.name) {
      setUserName(user.name);
    } else if (user?.email) {
      // Usar la parte antes del @ como nombre si no hay name
      setUserName(user.email.split('@')[0]);
    }

    // Cargar TODOS los cursos del usuario (como profesor y como estudiante)
    if (user?.uid || user?.id || user?._id) {
      const userId = user.uid || user.id || user._id;
      console.log('[HomeScreen] Calling getAllCourses with userId:', userId);
      getAllCourses(userId);
    } else {
      console.log('[HomeScreen] No user ID found, user object:', user);
    }
  }, [user]);

  // Cargar conteos de actividades cuando cambien los cursos
  useEffect(() => {
    const loadActivitiesCounts = async () => {
      if (courses.length === 0) return;
      
      console.log('[HomeScreen] Loading activities counts for courses:', courses.length);
      const counts: Record<string, number> = {};
      
      for (const course of courses) {
        const courseId = course.id || course._id;
        if (courseId) {
          try {
            const count = await getActivitiesCountUC.execute(courseId);
            counts[courseId] = count;
            console.log(`[HomeScreen] Course ${courseId} has ${count} activities`);
          } catch (error) {
            console.error(`[HomeScreen] Error loading activities count for course ${courseId}:`, error);
            counts[courseId] = 0;
          }
        }
      }
      
      setActivitiesCounts(counts);
    };
    
    loadActivitiesCounts();
  }, [courses]);

  const isTeacher = (course: any) => {
    const userId = user?.uid || user?.id || user?._id;
    return course.teacherId === userId;
  };

  const isStudent = (course: any) => {
    const userId = user?.uid || user?.id || user?._id;
    
    // Convertir studentIds a array si no lo es
    let studentIdsArray: string[] = [];
    
    if (Array.isArray(course.studentIds)) {
      studentIdsArray = course.studentIds;
    } else if (typeof course.studentIds === 'string') {
      try {
        studentIdsArray = JSON.parse(course.studentIds);
      } catch (e) {
        studentIdsArray = (course.studentIds as string).split(',').map((id: string) => id.trim());
      }
    } else if (course.studentIds && typeof course.studentIds === 'object') {
      studentIdsArray = Object.values(course.studentIds);
    }
    
    return studentIdsArray.includes(userId);
  };

  const getStudentCount = (course: any) => {
    if (course.studentsCount) return course.studentsCount;
    
    // Calcular a partir de studentIds
    if (Array.isArray(course.studentIds)) {
      return course.studentIds.length;
    } else if (typeof course.studentIds === 'string') {
      try {
        return JSON.parse(course.studentIds).length;
      } catch (e) {
        return (course.studentIds as string).split(',').length;
      }
    } else if (course.studentIds && typeof course.studentIds === 'object') {
      return Object.values(course.studentIds).length;
    }
    
    return getRandomStudentsCount();
  };

  const getActivitiesCount = (course: any) => {
    const courseId = course.id || course._id;
    
    // Si ya tenemos el conteo cargado, usarlo
    if (courseId && activitiesCounts[courseId] !== undefined) {
      return activitiesCounts[courseId];
    }
    
    // Si el curso tiene activitiesCount en la BD, usarlo
    if (course.activitiesCount !== undefined && course.activitiesCount !== null) {
      return course.activitiesCount;
    }
    
    // De lo contrario, mostrar 0 (se cargará después)
    return 0;
  };

  const getCourseIcon = (index: number) => {
    const colors = ['#9C27B0', '#E91E63', '#00BCD4', '#4CAF50', '#FF9800'];
    return colors[index % colors.length];
  };

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
              <Card key={course.id || course._id || index} style={styles.courseCard} mode="elevated">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('CourseDetail', { courseId: course.id || course._id })}
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
                          {course.name || course.title}
                        </Text>
                        {isTeacher(course) ? (
                          <View style={styles.roleBadge}>
                            <MaterialCommunityIcons name="school-outline" size={14} color="#8B5CF6" />
                            <Text style={styles.roleText}>Profesor</Text>
                          </View>
                        ) : (
                          <View style={[styles.roleBadge, styles.studentBadge]}>
                            <MaterialCommunityIcons name="account-outline" size={14} color="#059669" />
                            <Text style={[styles.roleText, styles.studentText]}>Estudiante</Text>
                          </View>
                        )}
                        <View style={styles.courseStats}>
                          <View style={styles.statItem}>
                            <MaterialCommunityIcons name="account-group" size={16} color="#6B6B6B" />
                            <Text style={styles.statText}>
                              {getStudentCount(course)} estudiantes
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <MaterialCommunityIcons name="file-document-outline" size={16} color="#6B6B6B" />
                            <Text style={styles.statText}>
                              {getActivitiesCount(course)} actividades
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Barra de progreso (solo si es estudiante) */}
                    {isStudent(course) && (
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

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <MaterialCommunityIcons name="home" size={24} color="#5C6BC0" />
          <Text style={styles.navButtonTextActive}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Notifications')}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#636E72" />
          <Text style={styles.navButtonText}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
          <MaterialCommunityIcons name="account-outline" size={24} color="#636E72" />
          <Text style={styles.navButtonText}>Perfil</Text>
        </TouchableOpacity>
      </View>

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
  studentBadge: {
    backgroundColor: '#D1FAE5',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 4,
  },
  studentText: {
    color: '#059669',
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
  bottomNav: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    gap: 4,
  },
  navButtonText: {
    fontSize: 12,
    color: '#636E72',
  },
  navButtonTextActive: {
    fontSize: 12,
    color: '#5C6BC0',
    fontWeight: '600',
  },
  fabWrapper: {
    position: 'absolute',
    bottom: 110,
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
