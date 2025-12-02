import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { CourseDataSource } from "@/src/features/courses/data/datasources/CourseDataSource";
import { Course } from "@/src/features/courses/domain/entities/Course";
import { GetCoursesByTeacherUseCase } from "@/src/features/courses/domain/usecases/GetCoursesByTeacherUseCase";
import { useCourses } from "@/src/features/courses/presentation/context/courseContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text } from "react-native-paper";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

interface CourseInvitation {
  courseId: string;
  courseName: string;
  teacherName?: string;
  studentEmail: string;
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { joinCourseByCode, refreshCourses } = useCourses();
  const di = useDI();
  const getCoursesByTeacherUC = di.resolve<GetCoursesByTeacherUseCase>(TOKENS.GetCoursesByTeacherUC);
  const courseDataSource = di.resolve<CourseDataSource>(TOKENS.CourseRemoteDS);
  
  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, [user]);

  const loadInvitations = async () => {
    console.log('\n========== INICIO PROCESO DE CARGA DE INVITACIONES ==========');
    
    if (!user?.email) {
      console.log('❌ ERROR: No user email found');
      setIsLoading(false);
      return;
    }

    const userId = user?.uid || user?.id || user?._id;
    if (!userId) {
      console.log('❌ ERROR: No user ID found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('📧 Email del usuario:', user.email);
      console.log('🆔 ID del usuario:', userId);
      console.log('\n--- PASO 1: OBTENER TODOS LOS CURSOS ---');
      
      const allCourses = await getAllCoursesWithInvitations();
      console.log(`✅ Total de cursos obtenidos: ${allCourses.length}`);
      
      console.log('\n--- PASO 2: FILTRAR CURSOS DONDE NO ESTÁ INSCRITO ---');
      const coursesNotEnrolled: any[] = [];
      const coursesEnrolled: any[] = [];
      
      for (const course of allCourses) {
        console.log(`\n📚 Procesando curso: "${course.name}"`);
        console.log(`   ID del curso: ${course.id || course._id}`);
        console.log(`   studentIds (raw):`, course.studentIds);
        
        // Parsear studentIds
        let studentIdsArray: string[] = [];
        if (Array.isArray(course.studentIds)) {
          studentIdsArray = course.studentIds;
          console.log('   Tipo: Array');
        } else if (typeof course.studentIds === 'string') {
          console.log('   Tipo: String - intentando parsear JSON');
          try {
            studentIdsArray = JSON.parse(course.studentIds);
            console.log('   ✅ JSON parseado exitosamente');
          } catch (e) {
            console.log('   ❌ Error al parsear JSON:', e);
            studentIdsArray = [];
          }
        } else {
          console.log('   Tipo desconocido o null/undefined');
        }

        console.log('   studentIds parseados:', studentIdsArray);
        console.log(`   ¿Incluye userId "${userId}"?`, studentIdsArray.includes(userId));
        
        const isStudentInCourse = studentIdsArray.includes(userId);
        
        if (isStudentInCourse) {
          console.log('   ✅ Usuario SÍ está inscrito - IGNORANDO este curso');
          coursesEnrolled.push(course.name);
        } else {
          console.log('   ⭐ Usuario NO está inscrito - REVISANDO invitaciones');
          coursesNotEnrolled.push(course);
        }
      }
      
      console.log('\n--- RESUMEN PASO 2 ---');
      console.log(`Cursos donde SÍ está inscrito: ${coursesEnrolled.length}`, coursesEnrolled);
      console.log(`Cursos donde NO está inscrito: ${coursesNotEnrolled.length}`, coursesNotEnrolled.map(c => c.name));
      
      console.log('\n--- PASO 3: REVISAR INVITACIONES EN CURSOS NO INSCRITOS ---');
      const userInvitations: CourseInvitation[] = [];

      for (const course of coursesNotEnrolled) {
        console.log(`\n📋 Revisando invitaciones del curso: "${course.name}"`);
        console.log(`   invitations (raw):`, course.invitations);
        
        // Parsear invitations
        const invitationsArray = Array.isArray(course.invitations) ? course.invitations : [];
        console.log('   invitations parseadas:', invitationsArray);
        console.log(`   ¿Incluye email "${user.email}"?`, invitationsArray.includes(user.email));
        
        if (invitationsArray.includes(user.email)) {
          console.log('   🎉 INVITACIÓN ENCONTRADA - Agregando a la lista');
          userInvitations.push({
            courseId: course.id || course._id || '',
            courseName: course.name,
            teacherName: undefined,
            studentEmail: user.email,
          });
        } else {
          console.log('   ❌ Usuario no está invitado a este curso');
        }
      }

      console.log('\n--- RESULTADO FINAL ---');
      console.log(`Total de invitaciones encontradas: ${userInvitations.length}`);
      if (userInvitations.length > 0) {
        console.log('Detalles de invitaciones:');
        userInvitations.forEach((inv, index) => {
          console.log(`  ${index + 1}. Curso: "${inv.courseName}" (ID: ${inv.courseId})`);
        });
      }
      console.log('========== FIN PROCESO DE CARGA DE INVITACIONES ==========\n');
      
      setInvitations(userInvitations);
    } catch (error) {
      console.error('❌ ERROR CRÍTICO al cargar invitaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllCoursesWithInvitations = async (): Promise<Course[]> => {
    try {
      console.log('🔐 Obteniendo cursos con autenticación...');
      const courses = await courseDataSource.getAllCourses();
      console.log(`✅ Cursos obtenidos exitosamente: ${courses.length}`);
      return courses;
    } catch (error) {
      console.error('❌ Error al obtener cursos:', error);
      return [];
    }
  };

  const handleAcceptInvitation = async (courseId: string, courseName: string) => {
    const userId = user?.uid || user?.id || user?._id;
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    try {
      setProcessingInvitation(courseId);
      console.log('[NotificationsScreen] Accepting invitation for course:', courseId);
      
      // Agregar al estudiante al curso
      await addStudentToCourse(courseId, userId);
      
      // Eliminar la invitación
      await removeInvitation(courseId, user.email!);
      
      // Refrescar cursos del usuario
      await refreshCourses(userId);
      
      // Refrescar invitaciones
      await loadInvitations();
      
      console.log('[NotificationsScreen] Invitation accepted successfully');
    } catch (error) {
      console.error('[NotificationsScreen] Error accepting invitation:', error);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (courseId: string) => {
    if (!user?.email) return;

    try {
      setProcessingInvitation(courseId);
      console.log('[NotificationsScreen] Rejecting invitation for course:', courseId);
      
      // Eliminar la invitación
      await removeInvitation(courseId, user.email);
      
      // Refrescar invitaciones
      await loadInvitations();
      
      console.log('[NotificationsScreen] Invitation rejected successfully');
    } catch (error) {
      console.error('[NotificationsScreen] Error rejecting invitation:', error);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const addStudentToCourse = async (courseId: string, studentId: string) => {
    // Implementación similar a joinCourseByCode pero usando el courseId directamente
    const token = await getAuthToken();
    const baseUrl = `https://roble-api.openlab.uninorte.edu.co/database/${process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID}`;
    
    // Obtener el curso actual
    const response = await fetch(`${baseUrl}/read?tableName=CourseModel&id=${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Error obteniendo curso');
    
    const courses = await response.json() as Course[];
    if (courses.length === 0) throw new Error('Curso no encontrado');
    
    const course = courses[0];
    const studentIds = Array.isArray(course.studentIds) ? course.studentIds : [];
    
    if (studentIds.includes(studentId)) {
      return; // Ya está registrado
    }
    
    // Actualizar el curso
    const updateResponse = await fetch(`${baseUrl}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        tableName: 'CourseModel',
        idColumn: 'id',
        idValue: courseId,
        updates: {
          studentIds: [...studentIds, studentId]
        }
      })
    });
    
    if (!updateResponse.ok) throw new Error('Error actualizando curso');
  };

  const removeInvitation = async (courseId: string, studentEmail: string) => {
    const token = await getAuthToken();
    const baseUrl = `https://roble-api.openlab.uninorte.edu.co/database/${process.env.EXPO_PUBLIC_ROBLE_PROJECT_ID}`;
    
    // Obtener el curso actual
    const response = await fetch(`${baseUrl}/read?tableName=CourseModel&id=${courseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Error obteniendo curso');
    
    const courses = await response.json() as Course[];
    if (courses.length === 0) throw new Error('Curso no encontrado');
    
    const course = courses[0];
    const invitations = Array.isArray(course.invitations) ? course.invitations : [];
    
    // Filtrar el email del estudiante de la lista
    const updatedInvitations = invitations.filter(
      (email: string) => email !== studentEmail
    );
    
    // Actualizar el curso
    const updateResponse = await fetch(`${baseUrl}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        tableName: 'CourseModel',
        idColumn: 'id',
        idValue: courseId,
        updates: {
          invitations: updatedInvitations
        }
      })
    });
    
    if (!updateResponse.ok) throw new Error('Error actualizando invitaciones');
  };

  const getAuthToken = async (): Promise<string> => {
    const { LocalPreferencesAsyncStorage } = await import('@/src/core/LocalPreferencesAsyncStorage');
    const prefs = LocalPreferencesAsyncStorage.getInstance();
    const token = await prefs.retrieveData<string>('token');
    if (!token) throw new Error('No authentication token');
    return token;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notificaciones</Text>
            <Text style={styles.headerSubtitle}>
              {invitations.length} {invitations.length === 1 ? 'invitación' : 'invitaciones'}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de notificaciones */}
      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#5C6BC0" />
              <Text style={styles.loadingText}>Cargando invitaciones...</Text>
            </View>
          ) : invitations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bell-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyText}>No tienes invitaciones</Text>
              <Text style={styles.emptySubtext}>
                Aquí aparecerán las invitaciones a cursos
              </Text>
            </View>
          ) : (
            invitations.map((invitation, index) => (
              <Card key={`${invitation.courseId}-${index}`} style={styles.invitationCard} mode="elevated">
                <Card.Content style={styles.cardContent}>
                  <View style={styles.invitationHeader}>
                    {/* Icono */}
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons 
                        name="email-outline" 
                        size={24} 
                        color="#5C6BC0" 
                      />
                    </View>

                    {/* Contenido */}
                    <View style={styles.invitationContent}>
                      <Text style={styles.invitationTitle}>
                        Invitación a curso
                      </Text>
                      <Text style={styles.courseName} numberOfLines={1}>
                        {invitation.courseName}
                      </Text>
                      {invitation.teacherName && (
                        <Text style={styles.teacherName}>
                          Por: {invitation.teacherName}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Botones de acción */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.rejectButton,
                        processingInvitation === invitation.courseId && styles.buttonDisabled
                      ]}
                      onPress={() => handleRejectInvitation(invitation.courseId)}
                      disabled={processingInvitation === invitation.courseId}
                    >
                      <MaterialCommunityIcons name="close" size={18} color="#DC2626" />
                      <Text style={styles.rejectButtonText}>
                        {processingInvitation === invitation.courseId ? 'Procesando...' : 'Rechazar'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.acceptButton,
                        processingInvitation === invitation.courseId && styles.buttonDisabled
                      ]}
                      onPress={() => handleAcceptInvitation(invitation.courseId, invitation.courseName)}
                      disabled={processingInvitation === invitation.courseId}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                      <Text style={styles.acceptButtonText}>
                        {processingInvitation === invitation.courseId ? 'Procesando...' : 'Unirse'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home')}>  
          <MaterialCommunityIcons name="home-outline" size={24} color="#636E72" />
          <Text style={styles.navButtonText}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <MaterialCommunityIcons name="bell" size={24} color="#5C6BC0" />
          <Text style={styles.navButtonTextActive}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
          <MaterialCommunityIcons name="account-outline" size={24} color="#636E72" />
          <Text style={styles.navButtonText}>Perfil</Text>
        </TouchableOpacity>
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
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8EAF6',
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
    paddingTop: 24,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B6B6B',
  },
  invitationCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitationContent: {
    flex: 1,
    gap: 4,
  },
  invitationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C6BC0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  teacherName: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#5C6BC0',
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
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
  bottomPadding: {
    height: 20,
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
});
