import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Activity } from "@/src/features/activities/domain/entities/Activity";
import { GetActivitiesByCourseUseCase } from "@/src/features/activities/domain/usecases/GetActivitiesByCourseUseCase";
import { AuthUser } from "@/src/features/auth/domain/entities/AuthUser";
import { GetUsersByIdsUseCase } from "@/src/features/auth/domain/usecases/GetUsersByIdsUseCase";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { Category } from "@/src/features/courses/domain/entities/Category";
import { GetCategoriesByCourseUseCase } from "@/src/features/courses/domain/usecases/GetCategoriesByCourseUseCase";
import { useCourses } from "@/src/features/courses/presentation/context/courseContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

type TabType = 'categories' | 'activities' | 'students';

export default function CourseDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { courseId } = route.params;
  const { user } = useAuth();
  const { getCourse } = useCourses();
  const di = useDI();
  
  const getUsersByIdsUC = di.resolve<GetUsersByIdsUseCase>(TOKENS.GetUsersByIdsUC);
  const getCategoriesByCourseUC = di.resolve<GetCategoriesByCourseUseCase>(TOKENS.GetCategoriesByCourseUC);
  const getActivitiesByCourseUC = di.resolve<GetActivitiesByCourseUseCase>(TOKENS.GetActivitiesByCourseUC);
  
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<AuthUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      console.log('[CourseDetailScreen] Loading course data for:', courseId);
      
      // Obtener datos del curso
      const courseData = await getCourse(courseId);
      console.log('[CourseDetailScreen] Course data:', courseData);
      setCourse(courseData);

      // Obtener estudiantes si existen IDs
      if (courseData?.studentIds && courseData.studentIds.length > 0) {
        console.log('[CourseDetailScreen] Loading students:', courseData.studentIds);
        const studentsData = await getUsersByIdsUC.execute(courseData.studentIds);
        console.log('[CourseDetailScreen] Students loaded:', studentsData.length);
        setStudents(studentsData);
      }

      // Obtener categorías
      console.log('[CourseDetailScreen] Loading categories for course:', courseId);
      const categoriesData = await getCategoriesByCourseUC.execute(courseId);
      console.log('[CourseDetailScreen] Categories loaded:', categoriesData.length);
      setCategories(categoriesData);

      // Obtener actividades
      console.log('[CourseDetailScreen] Loading activities for course:', courseId);
      const activitiesData = await getActivitiesByCourseUC.execute(courseId);
      console.log('[CourseDetailScreen] Activities loaded:', activitiesData.length);
      setActivities(activitiesData);

    } catch (error) {
      console.error('[CourseDetailScreen] Error loading course data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'categories' && styles.tabButtonActive]}
        onPress={() => setActiveTab('categories')}
      >
        <MaterialCommunityIcons 
          name="shape" 
          size={20} 
          color={activeTab === 'categories' ? '#FFFFFF' : '#6C63FF'} 
        />
        <Text style={[styles.tabButtonText, activeTab === 'categories' && styles.tabButtonTextActive]}>
          Categorías
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'activities' && styles.tabButtonActive]}
        onPress={() => setActiveTab('activities')}
      >
        <MaterialCommunityIcons 
          name="clipboard-text" 
          size={20} 
          color={activeTab === 'activities' ? '#FFFFFF' : '#6C63FF'} 
        />
        <Text style={[styles.tabButtonText, activeTab === 'activities' && styles.tabButtonTextActive]}>
          Actividades
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'students' && styles.tabButtonActive]}
        onPress={() => setActiveTab('students')}
      >
        <MaterialCommunityIcons 
          name="account-group" 
          size={20} 
          color={activeTab === 'students' ? '#FFFFFF' : '#6C63FF'} 
        />
        <Text style={[styles.tabButtonText, activeTab === 'students' && styles.tabButtonTextActive]}>
          Estudiantes
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <>
      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="shape-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>No hay categorías registradas</Text>
        </View>
      ) : (
        categories.map((category) => (
          <View key={category.id || category._id} style={styles.listItem}>
            <View style={styles.listItemIcon}>
              <MaterialCommunityIcons name="shape" size={24} color="#6C63FF" />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{category.name}</Text>
              <Text style={styles.listItemDescription}>
                {category.randomGroups ? 'Grupos aleatorios' : 'Grupos manuales'}
                {category.maxStudentsPerGroup && ` • Máx. ${category.maxStudentsPerGroup} estudiantes`}
              </Text>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderActivities = () => (
    <>
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>No hay actividades registradas</Text>
        </View>
      ) : (
        activities.map((activity) => (
          <View key={activity.id || activity._id} style={styles.listItem}>
            <View style={styles.listItemIcon}>
              <MaterialCommunityIcons name="clipboard-text" size={24} color="#6C63FF" />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{activity.name}</Text>
              {activity.description && (
                <Text style={styles.listItemDescription}>{activity.description}</Text>
              )}
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderStudents = () => (
    <>
      {students.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-group-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>No hay estudiantes inscritos</Text>
        </View>
      ) : (
        students.map((student) => (
          <View key={student.uid || student.id || student._id} style={styles.listItem}>
            <View style={styles.listItemIcon}>
              <MaterialCommunityIcons name="account" size={24} color="#6C63FF" />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{student.name || student.email}</Text>
              {student.email && student.name && (
                <Text style={styles.listItemDescription}>{student.email}</Text>
              )}
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'categories':
        return renderCategories();
      case 'activities':
        return renderActivities();
      case 'students':
        return renderStudents();
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando información del curso...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>No se pudo cargar el curso</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3436" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{course.name}</Text>
              {course.description && (
                <Text style={styles.headerSubtitle}>{course.description}</Text>
              )}
              <Text style={styles.headerStats}>
                {students.length} estudiantes · {activities.length} actividades
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Tab Buttons */}
        {renderTabButtons()}

        {/* Botón de invitar estudiantes - solo visible en pestaña de estudiantes */}
        {activeTab === 'students' && (
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => {
              // TODO: Implementar funcionalidad de invitar estudiantes
              console.log('Invitar estudiantes');
            }}
          >
            <MaterialCommunityIcons name="account-plus" size={20} color="#FFFFFF" />
            <Text style={styles.inviteButtonText}>Invitar Estudiantes</Text>
          </TouchableOpacity>
        )}

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollableList}
          contentContainerStyle={styles.scrollableListContent}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <FontAwesome6 name="house" size={24} color="#6C63FF" iconStyle="solid" />
          <Text style={styles.navLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Notifications')}>
          <FontAwesome6 name="bell" size={24} color="#999999" />
          <Text style={[styles.navLabel, styles.navLabelInactive]}>Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <FontAwesome6 name="user" size={24} color="#999999" />
          <Text style={[styles.navLabel, styles.navLabelInactive]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
  },
  headerContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#636E72',
  },
  headerStats: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 6,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  tabButtonActive: {
    backgroundColor: '#6C63FF',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C63FF',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollableList: {
    height: 200,
  },
  scrollableListContent: {
    paddingBottom: 16,
    gap: 12,
  },
  inviteButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 14,
    color: '#636E72',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: '#6C63FF',
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelInactive: {
    color: '#999999',
  },
});
