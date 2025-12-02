import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Activity } from "@/src/features/activities/domain/entities/Activity";
import { GetActivitiesByCourseUseCase } from "@/src/features/activities/domain/usecases/GetActivitiesByCourseUseCase";
import { AuthUser } from "@/src/features/auth/domain/entities/AuthUser";
import { GetUsersByIdsUseCase } from "@/src/features/auth/domain/usecases/GetUsersByIdsUseCase";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { Category, NewCategory } from "@/src/features/courses/domain/entities/Category";
import { NewGroup } from "@/src/features/courses/domain/entities/Group";
import { AddCategoryUseCase } from "@/src/features/courses/domain/usecases/AddCategoryUseCase";
import { AddGroupUseCase } from "@/src/features/courses/domain/usecases/AddGroupUseCase";
import { DeleteCategoryUseCase } from "@/src/features/courses/domain/usecases/DeleteCategoryUseCase";
import { GetCategoriesByCourseUseCase } from "@/src/features/courses/domain/usecases/GetCategoriesByCourseUseCase";
import { GetGroupsCountByCategoryUseCase } from "@/src/features/courses/domain/usecases/GetGroupsCountByCategoryUseCase";
import { UpdateCategoryUseCase } from "@/src/features/courses/domain/usecases/UpdateCategoryUseCase";
import { UpdateGroupUseCase } from "@/src/features/courses/domain/usecases/UpdateGroupUseCase";
import { useCourses } from "@/src/features/courses/presentation/context/courseContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
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
  const updateCategoryUC = di.resolve<UpdateCategoryUseCase>(TOKENS.UpdateCategoryUC);
  const deleteCategoryUC = di.resolve<DeleteCategoryUseCase>(TOKENS.DeleteCategoryUC);
  const getGroupsCountByCategoryUC = di.resolve<GetGroupsCountByCategoryUseCase>(TOKENS.GetGroupsCountByCategoryUC);
  const getGroupsByCategoryUC = di.resolve<any>(TOKENS.GetGroupsByCategoryUC);
  const addGroupUC = di.resolve<AddGroupUseCase>(TOKENS.AddGroupUC);
  const updateGroupUC = di.resolve<UpdateGroupUseCase>(TOKENS.UpdateGroupUC);
  const deleteGroupUC = di.resolve<any>(TOKENS.DeleteGroupUC);
  const getAssessmentsByActivityUC = di.resolve<any>(TOKENS.GetAssessmentsByActivityUC);
  const addActivityUC = di.resolve<any>(TOKENS.AddActivityUC);
  const updateActivityUC = di.resolve<any>(TOKENS.UpdateActivityUC);
  const deleteActivityUC = di.resolve<any>(TOKENS.DeleteActivityUC);
  
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<AuthUser[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [categoryGroupCounts, setCategoryGroupCounts] = useState<Record<string, number>>({});
  
  // Modal state for creating/editing category
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  const [isRandomGroups, setIsRandomGroups] = useState(true);
  
  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // Modal state for creating/editing activity
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [isEditActivityMode, setIsEditActivityMode] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityName, setActivityName] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityCategory, setActivityCategory] = useState('');
  const [activityDueDate, setActivityDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Modal state for delete activity confirmation
  const [showDeleteActivityModal, setShowDeleteActivityModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  
  // State for activity assessments
  const [activityAssessments, setActivityAssessments] = useState<Record<string, boolean>>({});

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
      
      // Verificar si el usuario es docente
      const userIsTeacher = courseData?.teacherId === (user?._id || user?.id);
      setIsTeacher(userIsTeacher);
      console.log('[ActivityDetailScreen] User is teacher:', userIsTeacher);
      console.log('teacherId:', courseData?.teacherId, 'userId:', user?.id);

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
      
      // Verificar evaluaciones activas para cada actividad
      const assessments: Record<string, boolean> = {};
      for (const activity of activitiesData) {
        const activityIdToUse = activity.id || activity._id || '';
        if (activityIdToUse) {
          try {
            const activityAssessments = await getAssessmentsByActivityUC.execute(activityIdToUse);
            // Verificar si hay alguna evaluación activa (no cancelada y dentro del período)
            const now = new Date();
            const hasActiveAssessment = activityAssessments.some((assessment: any) => {
              if (assessment.cancelled) return false;
              if (!assessment.startAt || !assessment.endAt) return false;
              const start = new Date(assessment.startAt);
              const end = new Date(assessment.endAt);
              return now >= start && now <= end;
            });
            assessments[activityIdToUse] = hasActiveAssessment;
          } catch (error) {
            console.error('[CourseDetailScreen] Error getting assessments for activity:', activityIdToUse, error);
            assessments[activityIdToUse] = false;
          }
        }
      }
      setActivityAssessments(assessments);

    } catch (error) {
      console.error('[CourseDetailScreen] Error loading course data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      if (isEditMode && editingCategoryId && editingCategory) {
        // Modo edición
        console.log('[CourseDetailScreen] Updating category:', editingCategoryId);
        
        const newMaxStudents = maxStudents ? parseInt(maxStudents) : undefined;
        const oldMaxStudents = editingCategory.maxStudentsPerGroup;
        
        await updateCategoryUC.execute(editingCategoryId, {
          name: categoryName,
          randomGroups: isRandomGroups,
          ...(newMaxStudents && { maxStudentsPerGroup: newMaxStudents })
        });
        
        console.log('[CourseDetailScreen] Category updated successfully');
        
        // Si cambió maxStudentsPerGroup, reorganizar grupos
        if (newMaxStudents && oldMaxStudents && newMaxStudents !== oldMaxStudents) {
          console.log('[CourseDetailScreen] Max students changed from', oldMaxStudents, 'to', newMaxStudents);
          await handleGroupReorganization(editingCategoryId, newMaxStudents, isRandomGroups);
        }
      } else {
        // Modo creación
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

        // Si es categoría aleatoria, crear grupos automáticamente con estudiantes
        if (isRandomGroups && students.length > 0) {
          console.log('[CourseDetailScreen] Creating random groups for new category...');
          await createRandomGroupsForCategory(categoryId, newCategory, students);
        }
        // Si es categoría libre, crear grupos vacíos
        else if (!isRandomGroups && students.length > 0) {
          console.log('[CourseDetailScreen] Creating empty groups for free category...');
          await createEmptyGroupsForCategory(categoryId, newCategory, students.length);
        }
      }

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
      setIsEditMode(false);
      setEditingCategoryId(null);
      setEditingCategory(null);
      setCategoryName('');
      setMaxStudents('');
      setIsRandomGroups(true);
    } catch (error) {
      console.error('[CourseDetailScreen] Error creating/updating category:', error);
    }
  };

  const createRandomGroupsForCategory = async (categoryId: string, category: NewCategory, studentsList: AuthUser[]) => {
    try {
      const maxPerGroup = category.maxStudentsPerGroup || 5;
      const shuffledStudents = [...studentsList].sort(() => Math.random() - 0.5);
      const numberOfGroups = Math.ceil(shuffledStudents.length / maxPerGroup);

      console.log(`[CourseDetailScreen] Creating ${numberOfGroups} random groups with max ${maxPerGroup} students each`);

      for (let i = 0; i < numberOfGroups; i++) {
        const groupStudents = shuffledStudents.slice(i * maxPerGroup, (i + 1) * maxPerGroup);
        const groupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        // Paso 1: Crear grupo vacío
        const newGroup: NewGroup = {
          id: groupId,
          courseId,
          categoryId: categoryId,
          name: `Grupo ${i + 1}`,
          memberIds: []  // Crear vacío inicialmente
        };

        console.log(`[CourseDetailScreen] Creating empty group ${i + 1}`);
        await addGroupUC.execute(newGroup);

        // Paso 2: Actualizar el grupo con los miembros
        const memberIds = groupStudents.map(s => s.userId || '');
        console.log(`[CourseDetailScreen] Adding ${memberIds.length} members to group ${i + 1}`);
        await updateGroupUC.execute(groupId, {
          memberIds: memberIds
        });
      }

      console.log(`[CourseDetailScreen] Successfully created ${numberOfGroups} groups for category`);
    } catch (error) {
      console.error('[CourseDetailScreen] Error creating random groups for category:', error);
    }
  };

  const createEmptyGroupsForCategory = async (categoryId: string, category: NewCategory, totalStudents: number) => {
    try {
      const maxPerGroup = category.maxStudentsPerGroup || 5;
      // Calcular cantidad mínima de grupos necesarios
      const numberOfGroups = Math.ceil(totalStudents / maxPerGroup);

      console.log(`[CourseDetailScreen] Creating ${numberOfGroups} empty groups with max ${maxPerGroup} students each for free category`);

      for (let i = 0; i < numberOfGroups; i++) {
        const groupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        // Crear grupo vacío
        const newGroup: NewGroup = {
          id: groupId,
          courseId,
          categoryId: categoryId,
          name: `Grupo ${i + 1}`,
          memberIds: []  // Grupos vacíos para que los estudiantes se asignen libremente
        };

        console.log(`[CourseDetailScreen] Creating empty group ${i + 1}`);
        await addGroupUC.execute(newGroup);
      }

      console.log(`[CourseDetailScreen] Successfully created ${numberOfGroups} empty groups for free category`);
    } catch (error) {
      console.error('[CourseDetailScreen] Error creating empty groups for category:', error);
    }
  };

  const handleGroupReorganization = async (categoryId: string, newMaxStudents: number, isRandom: boolean) => {
    try {
      console.log('[CourseDetailScreen] Reorganizing groups for category:', categoryId);
      
      // Obtener grupos actuales de la categoría
      const currentGroups = await getGroupsByCategoryUC.execute(categoryId);
      console.log('[CourseDetailScreen] Current groups:', currentGroups.length);
      
      if (isRandom) {
        // Categoría aleatoria: reorganizar todos los grupos
        await reorganizeRandomGroups(categoryId, currentGroups, newMaxStudents);
      } else {
        // Categoría libre: ajustar capacidad y crear grupos si es necesario
        await adjustFreeGroups(categoryId, currentGroups, newMaxStudents);
      }
      
      console.log('[CourseDetailScreen] Group reorganization completed');
    } catch (error) {
      console.error('[CourseDetailScreen] Error reorganizing groups:', error);
    }
  };

  const reorganizeRandomGroups = async (categoryId: string, currentGroups: any[], newMaxStudents: number) => {
    try {
      // Recopilar todos los estudiantes de todos los grupos
      const allStudents: string[] = [];
      for (const group of currentGroups) {
        if (group.memberIds && group.memberIds.length > 0) {
          allStudents.push(...group.memberIds);
        }
      }
      
      console.log('[CourseDetailScreen] Total students to redistribute:', allStudents.length);
      
      // Eliminar todos los grupos existentes
      for (const group of currentGroups) {
        const groupId = group.id || group._id || '';
        if (groupId) {
          await deleteGroupUC.execute(groupId);
        }
      }
      
      // Calcular nuevo número de grupos necesarios
      const newNumberOfGroups = Math.ceil(allStudents.length / newMaxStudents);
      console.log('[CourseDetailScreen] Creating', newNumberOfGroups, 'new random groups');
      
      // Mezclar estudiantes aleatoriamente
      const shuffledStudents = [...allStudents].sort(() => Math.random() - 0.5);
      
      // Crear nuevos grupos con estudiantes distribuidos
      for (let i = 0; i < newNumberOfGroups; i++) {
        const groupStudents = shuffledStudents.slice(i * newMaxStudents, (i + 1) * newMaxStudents);
        const groupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        const newGroup: NewGroup = {
          id: groupId,
          courseId,
          categoryId: categoryId,
          name: `Grupo ${i + 1}`,
          memberIds: []
        };

        await addGroupUC.execute(newGroup);
        
        if (groupStudents.length > 0) {
          await updateGroupUC.execute(groupId, {
            memberIds: groupStudents
          });
        }
      }
      
      console.log('[CourseDetailScreen] Random groups reorganized successfully');
    } catch (error) {
      console.error('[CourseDetailScreen] Error reorganizing random groups:', error);
    }
  };

  const adjustFreeGroups = async (categoryId: string, currentGroups: any[], newMaxStudents: number) => {
    try {
      // Contar total de estudiantes en todos los grupos
      let totalStudents = 0;
      for (const group of currentGroups) {
        totalStudents += group.memberIds?.length || 0;
      }
      
      // Calcular número mínimo de grupos necesarios
      const minRequiredGroups = Math.ceil(totalStudents / newMaxStudents);
      console.log('[CourseDetailScreen] Min required groups:', minRequiredGroups, 'Current groups:', currentGroups.length);
      
      // Si necesitamos más grupos, crearlos vacíos
      if (minRequiredGroups > currentGroups.length) {
        const groupsToCreate = minRequiredGroups - currentGroups.length;
        console.log('[CourseDetailScreen] Creating', groupsToCreate, 'additional empty groups');
        
        for (let i = 0; i < groupsToCreate; i++) {
          const groupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });

          const newGroup: NewGroup = {
            id: groupId,
            courseId,
            categoryId: categoryId,
            name: `Grupo ${currentGroups.length + i + 1}`,
            memberIds: []
          };

          await addGroupUC.execute(newGroup);
        }
      }
      
      // Revisar si algún grupo excede la capacidad máxima
      for (const group of currentGroups) {
        const groupId = group.id || group._id || '';
        const memberIds = group.memberIds || [];
        
        if (memberIds.length > newMaxStudents) {
          console.log('[CourseDetailScreen] Group', group.name, 'exceeds capacity. Removing excess members.');
          
          // Mantener solo los primeros newMaxStudents miembros
          const trimmedMembers = memberIds.slice(0, newMaxStudents);
          await updateGroupUC.execute(groupId, {
            memberIds: trimmedMembers
          });
          
          console.log('[CourseDetailScreen] Removed', memberIds.length - newMaxStudents, 'members from', group.name);
        }
      }
      
      console.log('[CourseDetailScreen] Free groups adjusted successfully');
    } catch (error) {
      console.error('[CourseDetailScreen] Error adjusting free groups:', error);
    }
  };

  const handleOpenModal = () => {
    if (activeTab === 'categories') {
      setIsEditMode(false);
      setEditingCategoryId(null);
      setEditingCategory(null);
      setCategoryName('');
      setMaxStudents('');
      setIsRandomGroups(true);
      setShowCategoryModal(true);
    } else if (activeTab === 'activities') {
      setIsEditActivityMode(false);
      setEditingActivityId(null);
      setActivityName('');
      setActivityDescription('');
      setActivityCategory('');
      setActivityDueDate('');
      setShowActivityModal(true);
    }
  };

  const handleEditCategory = (category: Category) => {
    const categoryIdToUse = category.id || category._id || '';
    setIsEditMode(true);
    setEditingCategoryId(categoryIdToUse);
    setEditingCategory(category); // Guardar categoría completa
    setCategoryName(category.name);
    setMaxStudents(category.maxStudentsPerGroup?.toString() || '');
    setIsRandomGroups(category.randomGroups);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    console.log('[CourseDetailScreen] handleDeleteCategory called with:', category);
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    const categoryIdToUse = categoryToDelete.id || categoryToDelete._id || '';
    console.log('[CourseDetailScreen] Confirming deletion of category:', categoryIdToUse);
    
    try {
      console.log('[CourseDetailScreen] User confirmed deletion');
      await deleteCategoryUC.execute(categoryIdToUse);
      
      // Actualizar categorías en memoria (filtrar la eliminada)
      const updatedCategories = categories.filter(cat => {
        const catId = cat.id || cat._id || '';
        return catId !== categoryIdToUse;
      });
      setCategories(updatedCategories);
      
      // Actualizar conteos de grupos (remover la categoría eliminada)
      const updatedGroupCounts = { ...categoryGroupCounts };
      delete updatedGroupCounts[categoryIdToUse];
      setCategoryGroupCounts(updatedGroupCounts);
      
      console.log('[CourseDetailScreen] Category deleted successfully');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('[CourseDetailScreen] Error deleting category:', error);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const handleCreateActivity = async () => {
    try {
      if (!activityName.trim() || !activityCategory) {
        console.error('[CourseDetailScreen] Activity name and category are required');
        return;
      }

      if (isEditActivityMode && editingActivityId) {
        // Modo edición
        console.log('[CourseDetailScreen] Updating activity:', editingActivityId);
        
        await updateActivityUC.execute(editingActivityId, {
          name: activityName,
          description: activityDescription,
          categoryId: activityCategory,
          ...(activityDueDate && { dueDate: activityDueDate })
        });
        
        console.log('[CourseDetailScreen] Activity updated successfully');
      } else {
        // Modo creación
        const activityId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

        console.log('[CourseDetailScreen] Creating activity:', {
          id: activityId,
          name: activityName,
          description: activityDescription,
          categoryId: activityCategory,
          dueDate: activityDueDate,
          courseId
        });

        const newActivity = {
          id: activityId,
          courseId,
          categoryId: activityCategory,
          name: activityName,
          description: activityDescription,
          visible: true,
          ...(activityDueDate && { dueDate: activityDueDate })
        };

        await addActivityUC.execute(newActivity);
        console.log('[CourseDetailScreen] Activity created successfully');
      }

      // Recargar actividades
      const activitiesData = await getActivitiesByCourseUC.execute(courseId);
      setActivities(activitiesData);

      // Cerrar modal y limpiar campos
      setShowActivityModal(false);
      setIsEditActivityMode(false);
      setEditingActivityId(null);
      setActivityName('');
      setActivityDescription('');
      setActivityCategory('');
      setActivityDueDate('');
    } catch (error) {
      console.error('[CourseDetailScreen] Error creating/updating activity:', error);
    }
  };

  const handleEditActivity = (activity: Activity) => {
    const activityIdToUse = activity.id || activity._id || '';
    setIsEditActivityMode(true);
    setEditingActivityId(activityIdToUse);
    setActivityName(activity.name);
    setActivityDescription(activity.description || '');
    setActivityCategory(activity.categoryId);
    setActivityDueDate(activity.dueDate || '');
    setShowActivityModal(true);
  };

  const handleDeleteActivity = (activity: Activity) => {
    console.log('[CourseDetailScreen] handleDeleteActivity called with:', activity);
    setActivityToDelete(activity);
    setShowDeleteActivityModal(true);
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    
    const activityIdToUse = activityToDelete.id || activityToDelete._id || '';
    console.log('[CourseDetailScreen] Confirming deletion of activity:', activityIdToUse);
    
    try {
      console.log('[CourseDetailScreen] User confirmed deletion');
      await deleteActivityUC.execute(activityIdToUse);
      
      // Actualizar actividades en memoria (filtrar la eliminada)
      const updatedActivities = activities.filter(act => {
        const actId = act.id || act._id || '';
        return actId !== activityIdToUse;
      });
      setActivities(updatedActivities);
      
      console.log('[CourseDetailScreen] Activity deleted successfully');
      setShowDeleteActivityModal(false);
      setActivityToDelete(null);
    } catch (error) {
      console.error('[CourseDetailScreen] Error deleting activity:', error);
      setShowDeleteActivityModal(false);
      setActivityToDelete(null);
    }
  };

  const calculateDaysRemaining = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalizar a medianoche
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0); // Normalizar a medianoche
    
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const handleToggleActivityVisibility = async (activity: Activity) => {
    try {
      const activityIdToUse = activity.id || activity._id || '';
      console.log('[CourseDetailScreen] Toggling visibility for activity:', activityIdToUse);

      await updateActivityUC.execute(activityIdToUse, {
        visible: !activity.visible
      });

      // Actualizar actividad en memoria
      const updatedActivities = activities.map(act => {
        const actId = act.id || act._id || '';
        if (actId === activityIdToUse) {
          return { ...act, visible: !act.visible };
        }
        return act;
      });
      setActivities(updatedActivities);

      console.log('[CourseDetailScreen] Activity visibility toggled successfully');
    } catch (error) {
      console.error('[CourseDetailScreen] Error toggling activity visibility:', error);
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
          <View key={categoryIdToUse} style={styles.categoryCard}>
            <TouchableOpacity 
              style={styles.categoryCardContent}
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
            
            {isTeacher && (
              <View style={styles.categoryActions}>
                <TouchableOpacity 
                  style={styles.categoryActionButton}
                  onPress={() => handleEditCategory(category)}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="#5C6BC0" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.categoryActionButton}
                  onPress={() => handleDeleteCategory(category)}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )})
      )}
    </>
  );

  const renderActivities = () => {
    // Filtrar actividades según el rol del usuario
    const visibleActivities = isTeacher 
      ? activities 
      : activities.filter(activity => activity.visible !== false);
    
    return (
      <>
        {visibleActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No hay actividades registradas</Text>
          </View>
        ) : (
          visibleActivities.map((activity) => {
          const activityIdToUse = activity.id || activity._id || '';
          const hasActiveAssessment = activityAssessments[activityIdToUse] || false;
          
          // Obtener nombre de la categoría
          const category = categories.find(cat => {
            const catId = cat.id || cat._id || '';
            return catId === activity.categoryId;
          });
          const categoryName = category?.name || 'Sin categoría';
          
          // Calcular días restantes
          const daysRemaining = calculateDaysRemaining(activity.dueDate);
          const isOverdue = daysRemaining !== null && daysRemaining < 0;
          
          return (
            <View key={activityIdToUse} style={[
              styles.activityCard,
              isOverdue && styles.activityCardOverdue
            ]}>
              <View style={styles.activityCardHeader}>
                <View style={styles.activityIconCircle}>
                  <MaterialCommunityIcons name="clipboard-text" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.activityHeaderText}>
                  <Text style={styles.activityTitle}>{activity.name}</Text>
                  <Text style={styles.activityCategory}>{categoryName}</Text>
                  {activity.description && (
                    <Text style={styles.activityDescription} numberOfLines={2}>
                      {activity.description}
                    </Text>
                  )}
                  {daysRemaining !== null && (
                    <Text style={[
                      styles.activityDueDate,
                      isOverdue && styles.activityDueDateOverdue
                    ]}>
                      {isOverdue 
                        ? `${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? 'día' : 'días'} de retraso`
                        : daysRemaining === 0
                        ? 'Vence hoy'
                        : `Faltan ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`
                      }
                    </Text>
                  )}
                  {hasActiveAssessment && (
                    <View style={styles.activeAssessmentBadge}>
                      <MaterialCommunityIcons name="check-circle" size={16} color="#27AE60" />
                      <Text style={styles.activeAssessmentText}>1 evaluación activa</Text>
                    </View>
                  )}
                </View>
                {isTeacher && (
                  <View style={styles.activityActions}>
                    <TouchableOpacity 
                      style={styles.activityActionButton}
                      onPress={() => handleToggleActivityVisibility(activity)}
                    >
                      <MaterialCommunityIcons 
                        name={activity.visible ? "eye" : "eye-off"} 
                        size={20} 
                        color={activity.visible ? "#6C63FF" : "#999999"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.activityActionButton}
                      onPress={() => handleEditActivity(activity)}
                    >
                      <MaterialCommunityIcons name="pencil" size={20} color="#5C6BC0" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.activityActionButton}
                      onPress={() => handleDeleteActivity(activity)}
                    >
                      <MaterialCommunityIcons name="delete" size={20} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.activityCardFooter}>
                <TouchableOpacity 
                  style={styles.viewActivityButton}
                  onPress={() => {
                    navigation.navigate('ActivityDetail', { 
                      activityId: activityIdToUse,
                      courseId: course._id || course.id
                    });
                  }}
                >
                  <Text style={styles.viewActivityButtonText}>Ver actividad</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#6C63FF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </>
    );
  };

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

      {/* Floating Action Button - Mostrar solo para docentes en categorías y actividades */}
      {isTeacher && (activeTab === 'categories' || activeTab === 'activities') && (
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
                <Text style={styles.modalTitle}>{isEditMode ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
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
                  <Text style={styles.createButtonText}>{isEditMode ? 'Editar' : 'Crear'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackground}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteModalIcon}>
                <MaterialCommunityIcons name="alert-circle" size={48} color="#E74C3C" />
              </View>
              
              <Text style={styles.deleteModalTitle}>Eliminar categoría</Text>
              <Text style={styles.deleteModalMessage}>
                ¿Estás seguro de que deseas eliminar la categoría "{categoryToDelete?.name}"? 
                Esta acción no se puede deshacer.
              </Text>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalCancelButton}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setCategoryToDelete(null);
                  }}
                >
                  <Text style={styles.deleteModalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteModalConfirmButton}
                  onPress={confirmDeleteCategory}
                >
                  <Text style={styles.deleteModalConfirmText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para crear actividad */}
      <Modal
        visible={showActivityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActivityModal(false)}
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
                <Text style={styles.modalTitle}>Nueva Actividad</Text>
                <TouchableOpacity onPress={() => setShowActivityModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#636E72" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Nombre de actividad */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre de la actividad</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Proyecto Final"
                    value={activityName}
                    onChangeText={setActivityName}
                    placeholderTextColor="#999999"
                  />
                </View>

                {/* Descripción */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descripción (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe la actividad..."
                    value={activityDescription}
                    onChangeText={setActivityDescription}
                    placeholderTextColor="#999999"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Fecha de entrega */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fecha de entrega (opcional)</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={activityDueDate}
                      onChange={(e: any) => setActivityDueDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '15px',
                        borderRadius: '8px',
                        border: '1px solid #E0E0E0',
                        backgroundColor: '#F8F9FA',
                        fontFamily: 'inherit',
                        color: '#2D3436',
                      }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <View style={styles.datePickerWrapper}>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <MaterialCommunityIcons name="calendar" size={20} color="#6C63FF" style={styles.calendarIcon} />
                        <Text style={styles.datePickerButtonText} numberOfLines={1}>
                          {activityDueDate || 'Seleccionar fecha (YYYY-MM-DD)'}
                        </Text>
                        {activityDueDate && (
                          <TouchableOpacity
                            onPress={() => setActivityDueDate('')}
                            style={styles.clearDateButton}
                          >
                            <MaterialCommunityIcons name="close-circle" size={20} color="#999999" />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  {showDatePicker && Platform.OS !== 'web' && (
                    <Modal
                      visible={showDatePicker}
                      transparent
                      animationType="fade"
                      onRequestClose={() => setShowDatePicker(false)}
                    >
                      <View style={styles.datePickerModal}>
                        <View style={styles.datePickerContainer}>
                          <View style={styles.datePickerHeader}>
                            <Text style={styles.datePickerTitle}>Seleccionar fecha</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                              <MaterialCommunityIcons name="close" size={24} color="#636E72" />
                            </TouchableOpacity>
                          </View>
                          <TextInput
                            style={styles.dateInput}
                            placeholder="YYYY-MM-DD (ej: 2025-12-31)"
                            value={activityDueDate}
                            onChangeText={setActivityDueDate}
                            placeholderTextColor="#999999"
                          />
                          <TouchableOpacity
                            style={styles.datePickerConfirmButton}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.datePickerConfirmText}>Confirmar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Modal>
                  )}
                </View>

                {/* Categoría */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Categoría</Text>
                  <View style={styles.pickerContainer}>
                    {categories.length > 0 ? (
                      <Picker
                        selectedValue={activityCategory}
                        onValueChange={setActivityCategory}
                        style={styles.picker}
                      >
                        <Picker.Item label="Selecciona una categoría" value="" />
                        {categories.map((cat) => {
                          const catId = cat.id || cat._id || '';
                          return (
                            <Picker.Item 
                              key={catId} 
                              label={cat.name} 
                              value={catId} 
                            />
                          );
                        })}
                      </Picker>
                    ) : (
                      <Text style={styles.noCategoriesText}>
                        No hay categorías disponibles. Crea una categoría primero.
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.createButton, (!activityName.trim() || !activityCategory) && styles.createButtonDisabled]}
                  onPress={handleCreateActivity}
                  disabled={!activityName.trim() || !activityCategory}
                >
                  <Text style={styles.createButtonText}>{isEditActivityMode ? 'Editar' : 'Crear'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Activity Modal */}
      <Modal
        visible={showDeleteActivityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Eliminar Actividad</Text>
                <TouchableOpacity 
                  style={styles.closeModalButton}
                  onPress={() => setShowDeleteActivityModal(false)}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#636E72" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.confirmDeleteText}>
                  ¿Estás seguro de que deseas eliminar la actividad "{activityToDelete?.name}"?
                </Text>
                <Text style={styles.warningText}>
                  Esta acción no se puede deshacer.
                </Text>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteActivityModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={confirmDeleteActivity}
                >
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardContent: {
    padding: 16,
  },
  categoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
    paddingTop: 12,
  },
  categoryActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
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
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '90%',
    alignItems: 'center',
  },
  deleteModalIcon: {
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 15,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#636E72',
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Activity card styles
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityHeaderText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  activityCategory: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6C63FF',
    marginBottom: 6,
  },
  activityDescription: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
    marginBottom: 8,
  },
  visibilityButton: {
    padding: 4,
    marginLeft: 8,
  },
  activityCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  activeAssessmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    marginBottom: 0,
  },
  activeAssessmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#27AE60',
  },
  viewActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewActivityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  // Activity modal styles
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  pickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: 'transparent',
  },
  noCategoriesText: {
    fontSize: 14,
    color: '#999999',
    padding: 16,
    textAlign: 'center',
  },
  // Activity overdue styles
  activityCardOverdue: {
    backgroundColor: '#FFE8E8',
  },
  activityDueDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636E72',
    marginTop: 4,
  },
  activityDueDateOverdue: {
    color: '#E74C3C',
  },
  activityActions: {
    flexDirection: 'row',
    gap: 4,
  },
  activityActionButton: {
    padding: 6,
  },
  // Date picker styles
  datePickerWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    height: 48,
    maxWidth: '100%',
  },
  calendarIcon: {
    marginRight: 8,
    flexShrink: 0,
    width: 20,
    height: 20,
  },
  datePickerButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
    flexShrink: 1,
  },
  clearDateButton: {
    padding: 4,
    marginLeft: 4,
    flexShrink: 0,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#2D3436',
    marginBottom: 16,
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  datePickerConfirmButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Delete modal styles
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxWidth: 500,
    width: '90%',
  },
  closeModalButton: {
    padding: 4,
  },
  confirmDeleteText: {
    fontSize: 15,
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  warningText: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
