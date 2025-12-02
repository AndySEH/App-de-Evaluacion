import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Activity } from "@/src/features/activities/domain/entities/Activity";
import { GetActivitiesByCourseUseCase } from "@/src/features/activities/domain/usecases/GetActivitiesByCourseUseCase";
import { AuthUser } from "@/src/features/auth/domain/entities/AuthUser";
import { GetUsersByIdsUseCase } from "@/src/features/auth/domain/usecases/GetUsersByIdsUseCase";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { Category, NewCategory } from "@/src/features/courses/domain/entities/Category";
import { AddCategoryUseCase } from "@/src/features/courses/domain/usecases/AddCategoryUseCase";
import { GetCategoriesByCourseUseCase } from "@/src/features/courses/domain/usecases/GetCategoriesByCourseUseCase";
import { GetGroupsCountByCategoryUseCase } from "@/src/features/courses/domain/usecases/GetGroupsCountByCategoryUseCase";
import { useCourses } from "@/src/features/courses/presentation/context/courseContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
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
  const addCategoryUC = di.resolve<AddCategoryUseCase>(TOKENS.AddCategoryUC);
  const getGroupsCountByCategoryUC = di.resolve<GetGroupsCountByCategoryUseCase>(TOKENS.GetGroupsCountByCategoryUC);
  
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<AuthUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [isLoading, setIsLoading] = useState(true);
  const [categoryGroupCounts, setCategoryGroupCounts] = useState<Record<string, number>>({});
  
  // Modal state for creating category
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  const [isRandomGroups, setIsRandomGroups] = useState(true);

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

      // Obtener conteos de grupos para cada categoría
      const groupCounts: Record<string, number> = {};
      for (const category of categoriesData) {
        const categoryIdToUse = category.id || category._id || '';
        if (categoryIdToUse) {
          try {
            const count = await getGroupsCountByCategoryUC.execute(categoryIdToUse);
            groupCounts[categoryIdToUse] = count;
          } catch (error) {
            console.error('[CourseDetailScreen] Error getting group count for category:', categoryIdToUse, error);
            groupCounts[categoryIdToUse] = 0;
          }
        }
      }
      console.log('[CourseDetailScreen] Group counts:', groupCounts);
      setCategoryGroupCounts(groupCounts);

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

  const handleCreateCategory = async () => {
    try {
      // Generar un UUID v4 para la categoría
      const categoryId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      console.log('[CourseDetailScreen] Creating category:', {
        id: categoryId,
        name: categoryName,
        maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
        randomGroups: isRandomGroups,
        courseId
      });

      const newCategory: NewCategory = {
        id: categoryId,
        courseId,
        name: categoryName,
        randomGroups: isRandomGroups,
        ...(maxStudents && { maxStudentsPerGroup: parseInt(maxStudents) })
      };

      await addCategoryUC.execute(newCategory);
      console.log('[CourseDetailScreen] Category created successfully');

      // Recargar categorías
      const categoriesData = await getCategoriesByCourseUC.execute(courseId);
      console.log('[CourseDetailScreen] Categories reloaded:', categoriesData.length);
      setCategories(categoriesData);

      // Recargar conteos de grupos
      const groupCounts: Record<string, number> = {};
      for (const category of categoriesData) {
        const categoryIdToUse = category.id || category._id || '';
        if (categoryIdToUse) {
          try {
            const count = await getGroupsCountByCategoryUC.execute(categoryIdToUse);
            groupCounts[categoryIdToUse] = count;
          } catch (error) {
            groupCounts[categoryIdToUse] = 0;
          }
        }
      }
      setCategoryGroupCounts(groupCounts);

      // Cerrar modal y limpiar campos
      setShowCategoryModal(false);
      setCategoryName('');
      setMaxStudents('');
      setIsRandomGroups(true);
    } catch (error) {
      console.error('[CourseDetailScreen] Error creating category:', error);
    }
  };

  const handleOpenModal = () => {
    if (activeTab === 'categories') {
      setShowCategoryModal(true);
    } else if (activeTab === 'activities') {
      // TODO: Abrir modal de actividades
      console.log('Abrir modal de actividades');
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
        categories.map((category) => {
          const categoryIdToUse = category.id || category._id || '';
          const groupCount = categoryGroupCounts[categoryIdToUse] || 0;
          
          return (
          <TouchableOpacity 
            key={categoryIdToUse} 
            style={styles.categoryCard}
            onPress={() => navigation.navigate('CategoryDetail', { 
              categoryId: categoryIdToUse, 
              courseId 
            })}
          >
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconCircle}>
                <MaterialCommunityIcons name="folder" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.categoryHeaderText}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {category.randomGroups ? 'Aleatorio' : 'Libre'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.categoryFooter}>
              <View style={styles.categoryInfoItem}>
                <MaterialCommunityIcons name="account-group" size={16} color="#636E72" />
                <Text style={styles.categoryInfoText}>
                  Max {category.maxStudentsPerGroup || 0} por grupo
                </Text>
              </View>
              <Text style={styles.categoryGroupsText}>
                {groupCount === 0 
                  ? 'Sin grupos aún' 
                  : `${groupCount} ${groupCount === 1 ? 'grupo creado' : 'grupos creados'}`
                }
              </Text>
            </View>
          </TouchableOpacity>
        )})
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

      {/* Floating Action Button - Mostrar en categorías y actividades */}
      {(activeTab === 'categories' || activeTab === 'activities') && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleOpenModal}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

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

      {/* Modal para crear categoría */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBackground}>
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Categoría</Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#636E72" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Nombre de categoría */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre de la categoría</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Proyecto Final"
                    value={categoryName}
                    onChangeText={setCategoryName}
                    placeholderTextColor="#999999"
                  />
                </View>

                {/* Máximo de estudiantes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Máximo de estudiantes por grupo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 4"
                    value={maxStudents}
                    onChangeText={setMaxStudents}
                    keyboardType="numeric"
                    placeholderTextColor="#999999"
                  />
                </View>

                {/* Tipo de agrupación */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tipo de agrupación</Text>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[styles.toggleButton, isRandomGroups && styles.toggleButtonActive]}
                      onPress={() => setIsRandomGroups(true)}
                    >
                      <Text style={[styles.toggleButtonText, isRandomGroups && styles.toggleButtonTextActive]}>
                        Aleatorio
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleButton, !isRandomGroups && styles.toggleButtonActive]}
                      onPress={() => setIsRandomGroups(false)}
                    >
                      <Text style={[styles.toggleButtonText, !isRandomGroups && styles.toggleButtonTextActive]}>
                        Libre
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.createButton, !categoryName.trim() && styles.createButtonDisabled]}
                  onPress={handleCreateCategory}
                  disabled={!categoryName.trim()}
                >
                  <Text style={styles.createButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0E6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryInfoText: {
    fontSize: 13,
    color: '#636E72',
  },
  categoryGroupsText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3436',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#6C63FF',
  },
  toggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6C63FF',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#636E72',
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
