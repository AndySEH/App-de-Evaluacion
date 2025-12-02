import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { AuthUser } from "@/src/features/auth/domain/entities/AuthUser";
import { GetUsersByIdsUseCase } from "@/src/features/auth/domain/usecases/GetUsersByIdsUseCase";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { Category } from "@/src/features/courses/domain/entities/Category";
import { Group, NewGroup } from "@/src/features/courses/domain/entities/Group";
import { AddGroupUseCase } from "@/src/features/courses/domain/usecases/AddGroupUseCase";
import { DeleteGroupUseCase } from "@/src/features/courses/domain/usecases/DeleteGroupUseCase";
import { GetCategoriesByCourseUseCase } from "@/src/features/courses/domain/usecases/GetCategoriesByCourseUseCase";
import { GetGroupsByCategoryUseCase } from "@/src/features/courses/domain/usecases/GetGroupsByCategoryUseCase";
import { GetStudentsWithoutGroupUseCase } from "@/src/features/courses/domain/usecases/GetStudentsWithoutGroupUseCase";
import { UpdateCategoryUseCase } from "@/src/features/courses/domain/usecases/UpdateCategoryUseCase";
import { UpdateGroupUseCase } from "@/src/features/courses/domain/usecases/UpdateGroupUseCase";
import { useCourses } from "@/src/features/courses/presentation/context/courseContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;
const HEADER_HEIGHT = 100; // Aproximadamente altura del header
const BOTTOM_NAV_HEIGHT = 90; // Aproximadamente altura de la bottom navigation + margen
const SCROLL_VIEW_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - BOTTOM_NAV_HEIGHT;

export default function CategoryDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { categoryId, courseId } = route.params;
  const { user } = useAuth();
  const { getCourse } = useCourses();
  const di = useDI();
  
  const getGroupsByCategoryUC = di.resolve<GetGroupsByCategoryUseCase>(TOKENS.GetGroupsByCategoryUC);
  const getCategoriesByCourseUC = di.resolve<GetCategoriesByCourseUseCase>(TOKENS.GetCategoriesByCourseUC);
  const getUsersByIdsUC = di.resolve<GetUsersByIdsUseCase>(TOKENS.GetUsersByIdsUC);
  const getStudentsWithoutGroupUC = di.resolve<GetStudentsWithoutGroupUseCase>(TOKENS.GetStudentsWithoutGroupUC);
  const addGroupUC = di.resolve<AddGroupUseCase>(TOKENS.AddGroupUC);
  const updateGroupUC = di.resolve<UpdateGroupUseCase>(TOKENS.UpdateGroupUC);
  const deleteGroupUC = di.resolve<DeleteGroupUseCase>(TOKENS.DeleteGroupUC);
  const updateCategoryUC = di.resolve<UpdateCategoryUseCase>(TOKENS.UpdateCategoryUC);
  
  const [category, setCategory] = useState<Category | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  
  // Modal state for adding member
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [availableStudents, setAvailableStudents] = useState<AuthUser[]>([]);

  useEffect(() => {
    loadCategoryData();
  }, [categoryId]);

  const loadCategoryData = async () => {
    try {
      setIsLoading(true);
      
      // Obtener curso para verificar si es docente
      const courseData = await getCourse(courseId);
      setCourse(courseData);
      const userIsTeacher = courseData?.teacherId === (user?._id || user?.id);
      setIsTeacher(userIsTeacher);
      console.log('[ActivityDetailScreen] User is teacher:', userIsTeacher);
      console.log('teacherId:', courseData?.teacherId, 'userId:', user?.id);
      
      // Obtener categoría
      const categories = await getCategoriesByCourseUC.execute(courseId);
      const categoryData = categories.find(c => c._id === categoryId || c.id === categoryId);
      
      if (!categoryData) {
        console.error('[CategoryDetailScreen] Category not found');
        return;
      }
      
      setCategory(categoryData);

      // Obtener estudiantes del curso (reutilizar courseData ya cargado)
      if (courseData?.studentIds && courseData.studentIds.length > 0) {
        const studentsData = await getUsersByIdsUC.execute(courseData.studentIds);
        setStudents(studentsData);
        
        // Cargar grupos existentes
        await loadGroups(categoryData, studentsData);
      }

    } catch (error) {
      console.error('[CategoryDetailScreen] Error loading category data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroups = async (cat: Category, studentsList: AuthUser[]) => {
    try {
      // Usar id en lugar de _id para consultas
      const categoryIdToUse = cat.id || cat._id || '';
      const groupsData = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(groupsData);

      console.log('[CategoryDetailScreen] Checking auto-creation conditions:', {
        randomGroups: cat.randomGroups,
        groupsCount: groupsData.length,
        studentsCount: studentsList.length,
        categoryId: categoryIdToUse,
        categoryName: cat.name
      });

      // Cargar estudiantes sin grupo al inicio
      const studentsWithoutGroup = await getStudentsWithoutGroupUC.execute(courseId, categoryIdToUse);
      setAvailableStudents(studentsWithoutGroup);

      // Si es categoría aleatoria y no hay grupos, crear automáticamente
      if (cat.randomGroups && groupsData.length === 0 && studentsList.length > 0) {
        console.log('[CategoryDetailScreen] Creating random groups automatically...');
        await createRandomGroups(cat, studentsList);
      } else if (cat.randomGroups && groupsData.length > 0) {
        // Verificar si hay estudiantes sin asignar
        await assignUnassignedStudents(cat, groupsData, studentsList);
      }
    } catch (error) {
      console.error('[CategoryDetailScreen] Error loading groups:', error);
    }
  };

  const createRandomGroups = async (cat: Category, studentsList: AuthUser[]) => {
    try {
      console.log('[CategoryDetailScreen] Starting random group creation...');
      console.log('[CategoryDetailScreen] Category details:', cat);
      console.log('[CategoryDetailScreen] Students to assign:', studentsList.length);
      
      const maxPerGroup = cat.maxStudentsPerGroup || 5;
      const shuffledStudents = [...studentsList].sort(() => Math.random() - 0.5);
      const numberOfGroups = Math.ceil(shuffledStudents.length / maxPerGroup);

      console.log(`[CategoryDetailScreen] Will create ${numberOfGroups} groups with max ${maxPerGroup} students each`);

      const newGroups: Group[] = [];
      // Usar id en lugar de _id para la relación
      const categoryIdToUse = cat.id || cat._id || '';
      
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
          categoryId: categoryIdToUse,
          name: `Grupo ${i + 1}`,
          memberIds: []  // Crear vacío inicialmente
        };

        console.log(`[CategoryDetailScreen] Step 1 - Creating empty group ${i + 1}:`, newGroup);
        await addGroupUC.execute(newGroup);

        // Paso 2: Actualizar el grupo con los miembros
        const memberIds = groupStudents.map(s => s.userId || '');
        console.log(`[CategoryDetailScreen] Step 2 - Adding ${memberIds.length} members to group ${i + 1}:`, memberIds);
        await updateGroupUC.execute(groupId, {
          memberIds: memberIds
        });

        newGroups.push({ ...newGroup, memberIds: memberIds } as Group);
      }

      console.log(`[CategoryDetailScreen] Successfully created ${newGroups.length} groups`);

      // Recargar grupos
      const updatedGroups = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(updatedGroups);
      
      console.log('[CategoryDetailScreen] Groups reloaded, count:', updatedGroups.length);
    } catch (error) {
      console.error('[CategoryDetailScreen] Error creating random groups:', error);
    }
  };

  const assignUnassignedStudents = async (cat: Category, currentGroups: Group[], studentsList: AuthUser[]) => {
    try {
      const assignedStudentIds = new Set<string>();
      currentGroups.forEach(group => {
        group.memberIds.forEach(id => assignedStudentIds.add(id));
      });

      const unassignedStudents = studentsList.filter(s => !assignedStudentIds.has(s.userId || ''));
      
      if (unassignedStudents.length === 0) return;

      const maxPerGroup = cat.maxStudentsPerGroup || 5;
      // Usar id en lugar de _id para la relación
      const categoryIdToUse = cat.id || cat._id || '';

      for (const student of unassignedStudents) {
        // Buscar grupo con espacio disponible
        const groupWithSpace = currentGroups.find(g => {
          const memberIds = Array.isArray(g.memberIds) 
            ? g.memberIds 
            : (typeof g.memberIds === 'string' ? JSON.parse(g.memberIds) : []);
          return memberIds.length < maxPerGroup;
        });

        if (groupWithSpace) {
          // Agregar al grupo existente
          const currentMemberIds = Array.isArray(groupWithSpace.memberIds) 
            ? groupWithSpace.memberIds 
            : (typeof groupWithSpace.memberIds === 'string' ? JSON.parse(groupWithSpace.memberIds) : []);
          const updatedMemberIds = [...currentMemberIds, student.userId || ''];
          const groupIdToUse = groupWithSpace.id || groupWithSpace._id || '';
          await updateGroupUC.execute(groupIdToUse, {
            memberIds: updatedMemberIds
          });
          groupWithSpace.memberIds = updatedMemberIds as any;
        } else {
          // Crear nuevo grupo
          const groupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });

          const newGroup: NewGroup = {
            id: groupId,
            courseId,
            categoryId: categoryIdToUse,
            name: `Grupo ${currentGroups.length + 1}`,
            memberIds: [student.userId || '']
          };

          await addGroupUC.execute(newGroup);
          currentGroups.push(newGroup as Group);
        }
      }

      // Recargar grupos
      const updatedGroups = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(updatedGroups);
    } catch (error) {
      console.error('[CategoryDetailScreen] Error assigning unassigned students:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!category) return;

    try {
      const groupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      // Usar id en lugar de _id para la relación
      const categoryIdToUse = category.id || category._id || '';

      const newGroup: NewGroup = {
        id: groupId,
        courseId,
        categoryId: categoryIdToUse,
        name: `Grupo ${groups.length + 1}`,
        memberIds: []
      };

      await addGroupUC.execute(newGroup);

      // Recargar grupos
      const updatedGroups = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(updatedGroups);
    } catch (error) {
      console.error('[CategoryDetailScreen] Error creating group:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!category) return;

    try {
      await deleteGroupUC.execute(groupId);

      // Recargar grupos
      const categoryIdToUse = category.id || category._id || '';
      const updatedGroups = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(updatedGroups);
    } catch (error) {
      console.error('[CategoryDetailScreen] Error deleting group:', error);
    }
  };

  const handleAddMember = (group: Group) => {
    const currentMemberIds = getMemberIds(group);
    const maxPerGroup = category?.maxStudentsPerGroup || 5;
    
    // Verificar si el grupo está lleno
    if (currentMemberIds.length >= maxPerGroup) {
      return; // No abrir modal si está lleno
    }
    
    // Usar la lista ya cargada de estudiantes sin grupo
    setSelectedGroup(group);
    setSelectedStudentId('');
    setShowAddMemberModal(true);
  };

  const handleConfirmAddMember = async () => {
    if (!selectedGroup || !selectedStudentId) return;

    try {
      const groupId = selectedGroup.id || selectedGroup._id || '';
      
      // Agregar estudiante al grupo
      const currentMemberIds = getMemberIds(selectedGroup);
      const updatedMemberIds = [...currentMemberIds, selectedStudentId];
      await updateGroupUC.execute(groupId, {
        memberIds: updatedMemberIds
      });

      // Recargar grupos
      const categoryIdToUse = category?.id || category?._id || '';
      const updatedGroups = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(updatedGroups);

      // Eliminar estudiante de la lista de disponibles
      setAvailableStudents(prev => prev.filter(s => s.userId !== selectedStudentId));

      // Cerrar modal
      setShowAddMemberModal(false);
      setSelectedGroup(null);
      setSelectedStudentId('');
    } catch (error) {
      console.error('[CategoryDetailScreen] Error adding member:', error);
    }
  };

  const handleSelectStudent = async (student: AuthUser) => {
    if (!selectedGroup) return;

    try {
      const studentId = student.userId || '';
      const groupId = selectedGroup.id || selectedGroup._id || '';
      
      // Agregar estudiante al grupo
      const currentMemberIds = getMemberIds(selectedGroup);
      const updatedMemberIds = [...currentMemberIds, studentId];
      await updateGroupUC.execute(groupId, {
        memberIds: updatedMemberIds
      });

      // Recargar grupos
      const categoryIdToUse = category?.id || category?._id || '';
      const updatedGroups = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(updatedGroups);

      // Cerrar modal
      setShowAddMemberModal(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('[CategoryDetailScreen] Error adding member:', error);
    }
  };

  const isGroupFull = (group: Group): boolean => {
    const memberIds = getMemberIds(group);
    const maxPerGroup = category?.maxStudentsPerGroup || 5;
    return memberIds.length >= maxPerGroup;
  };

  const handleRemoveMember = async (groupId: string, studentId: string) => {
    try {
      const group = groups.find(g => (g.id || g._id) === groupId);
      if (!group) return;

      const currentMemberIds = getMemberIds(group);
      const updatedMemberIds = currentMemberIds.filter(id => id !== studentId);
      
      await updateGroupUC.execute(groupId, {
        memberIds: updatedMemberIds
      });

      // Recargar grupos
      const categoryIdToUse = category?.id || category?._id || '';
      const updatedGroups = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(updatedGroups);

      // Agregar estudiante de vuelta a la lista de disponibles
      const removedStudent = students.find(s => s.userId === studentId);
      if (removedStudent) {
        setAvailableStudents(prev => [...prev, removedStudent]);
      }
    } catch (error) {
      console.error('[CategoryDetailScreen] Error removing member:', error);
    }
  };

  const handleJoinGroup = async (group: Group) => {
    if (!user) return;
    
    try {
      const userId = user._id || user.id || '';
      const groupId = group.id || group._id || '';
      
      // Verificar si el usuario ya está en este grupo (para salir)
      if (isUserInGroup(group)) {
        // Salir del grupo actual
        const currentMemberIds = getMemberIds(group);
        const updatedMemberIds = currentMemberIds.filter(id => id !== userId);
        
        await updateGroupUC.execute(groupId, {
          memberIds: updatedMemberIds
        });
      } else {
        // Verificar si el usuario ya está en otro grupo de esta categoría
        const userCurrentGroup = groups.find(g => {
          const memberIds = getMemberIds(g);
          return memberIds.includes(userId);
        });

        // Si ya está en un grupo, primero salir de ese grupo
        if (userCurrentGroup) {
          const currentGroupId = userCurrentGroup.id || userCurrentGroup._id || '';
          const currentMemberIds = getMemberIds(userCurrentGroup);
          const updatedCurrentMemberIds = currentMemberIds.filter(id => id !== userId);
          
          await updateGroupUC.execute(currentGroupId, {
            memberIds: updatedCurrentMemberIds
          });
        }

        // Agregar al nuevo grupo
        const currentMemberIds = getMemberIds(group);
        const updatedMemberIds = [...currentMemberIds, userId];
        
        await updateGroupUC.execute(groupId, {
          memberIds: updatedMemberIds
        });
      }

      // Recargar grupos
      const categoryIdToUse = category?.id || category?._id || '';
      const updatedGroups = await getGroupsByCategoryUC.execute(categoryIdToUse);
      setGroups(updatedGroups);
    } catch (error) {
      console.error('[CategoryDetailScreen] Error joining group:', error);
    }
  };

  const isUserInGroup = (group: Group): boolean => {
    if (!user) return false;
    const userId = user._id || user.id || '';
    const memberIds = getMemberIds(group);
    return memberIds.includes(userId);
  };

  const isUserInAnyGroup = (): boolean => {
    if (!user) return false;
    const userId = user._id || user.id || '';
    return groups.some(g => {
      const memberIds = getMemberIds(g);
      return memberIds.includes(userId);
    });
  };



  const getMemberIds = (group: Group): string[] => {
    // Normalizar memberIds a array
    if (Array.isArray(group.memberIds)) {
      return group.memberIds;
    }
    if (typeof group.memberIds === 'string') {
      try {
        const parsed = JSON.parse(group.memberIds);
        return parsed;
      } catch (e) {
        console.error('[CategoryDetailScreen] getMemberIds - Parse error:', e);
        return [];
      }
    }
    return [];
  };

  const getStudentById = (studentId: string): AuthUser | undefined => {
    console.log('[CategoryDetailScreen] getStudentById - Looking for:', studentId);
    console.log('[CategoryDetailScreen] getStudentById - Students available:', students.map(s => ({ id: s.userId, _id: s._id, name: s.name })));
    const found = students.find(s => s._id === studentId || s.userId === studentId);
    console.log('[CategoryDetailScreen] getStudentById - Found:', found ? found.name : 'NOT FOUND');
    return found;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B8DEF" />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Categoría no encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Grupos - {category.name}</Text>
            <Text style={styles.headerSubtitle}>
              {groups.length} {groups.length === 1 ? 'grupo creado' : 'grupos creados'} • {category.randomGroups ? 'Aleatorio' : 'Libre'}
            </Text>
          </View>
        </View>
      </View>

      {/* Groups List */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group-outline" size={64} color="#B0BEC5" />
              <Text style={styles.emptyStateText}>No hay grupos creados</Text>
              <Text style={styles.emptyStateSubtext}>
                {category.randomGroups 
                  ? 'Agrega estudiantes al curso para crear grupos automáticamente' 
                  : 'Presiona el botón + para crear un grupo'}
              </Text>
            </View>
          ) : (
            groups.map((group, index) => {
              const memberIds = getMemberIds(group);
              
              return (
              <View key={group._id || group.id || index} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.name}</Text>
                <View style={styles.groupHeaderRight}>
                  <Text style={styles.groupCount}>
                    {memberIds.length}/{category.maxStudentsPerGroup || 5}
                  </Text>
                  {isTeacher && (
                    <View style={styles.groupActions}>
                      <TouchableOpacity 
                        style={[
                          styles.actionButton,
                          isGroupFull(group) && styles.actionButtonDisabled
                        ]}
                        onPress={() => handleAddMember(group)}
                        disabled={isGroupFull(group)}
                      >
                        <MaterialCommunityIcons 
                          name="account-plus" 
                          size={18} 
                          color={isGroupFull(group) ? '#B0BEC5' : '#27AE60'} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteGroup(group.id || group._id || '')}
                      >
                        <MaterialCommunityIcons name="delete" size={18} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {memberIds.length > 0 ? (
                <View style={styles.membersContainer}>
                  {memberIds.map((memberId, idx) => {
                    const student = getStudentById(memberId);
                    console.log('[CategoryDetailScreen] Looking for student:', memberId, 'Found:', student ? 'Yes' : 'No');
                    if (!student) {
                      console.log('[CategoryDetailScreen] Student not found for ID:', memberId);
                      console.log('[CategoryDetailScreen] Available students:', students.map(s => ({ id: s.id, _id: s._id, name: s.name })));
                      return null;
                    }

                    return (
                      <View key={idx} style={styles.memberCard}>
                        <View style={styles.memberAvatar}>
                          <MaterialCommunityIcons name="account" size={24} color="#FFFFFF" />
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{student.name}</Text>
                          <Text style={styles.memberEmail}>{student.email}</Text>
                        </View>
                        {isTeacher && (
                          <TouchableOpacity 
                            style={styles.removeMemberButton}
                            onPress={() => handleRemoveMember(group.id || group._id || '', memberId)}
                          >
                            <MaterialCommunityIcons name="close-circle" size={20} color="#E74C3C" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyGroup}>
                  <Text style={styles.emptyGroupText}>Sin integrantes</Text>
                </View>
              )}

              <View style={styles.groupFooter}>
                <Text style={styles.groupFooterText}>
                  {memberIds.length} {memberIds.length === 1 ? 'integrante' : 'integrantes'}
                </Text>
                
                {/* Botón de Unirse/Salir - Solo para estudiantes en categorías libres */}
                {!isTeacher && !category.randomGroups && (
                  <TouchableOpacity
                    style={[
                      styles.joinButton,
                      // Si está en este grupo, mostrar como botón de salir
                      isUserInGroup(group) && styles.leaveButton,
                      // Si está en otro grupo y este no es su grupo, deshabilitar
                      (isUserInAnyGroup() && !isUserInGroup(group)) && styles.joinButtonDisabled,
                      // Si el grupo está lleno y no es su grupo, deshabilitar
                      (isGroupFull(group) && !isUserInGroup(group)) && styles.joinButtonDisabled,
                    ]}
                    onPress={() => handleJoinGroup(group)}
                    disabled={(isUserInAnyGroup() && !isUserInGroup(group)) || (isGroupFull(group) && !isUserInGroup(group))}
                  >
                    <MaterialCommunityIcons 
                      name={isUserInGroup(group) ? "exit-to-app" : "account-plus"} 
                      size={18} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.joinButtonText}>
                      {isUserInGroup(group) 
                        ? 'Salir del grupo' 
                        : (isUserInAnyGroup() ? 'Ya estás en un grupo' : isGroupFull(group) ? 'Grupo lleno' : 'Unirse')
                      }
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )})
        )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home')}>
          <MaterialCommunityIcons name="home-outline" size={24} color="#636E72" />
          <Text style={styles.navButtonText}>Inicio</Text>
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

      {/* FAB - Create Group (only for teachers and non-random categories) */}
      {isTeacher && !category.randomGroups && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateGroup}>
          <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAddMemberModal(false);
          setSelectedStudentId('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir miembro a {selectedGroup?.name}</Text>
              <TouchableOpacity onPress={() => {
                setShowAddMemberModal(false);
                setSelectedStudentId('');
              }}>
                <MaterialCommunityIcons name="close" size={24} color="#636E72" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {availableStudents.length === 0 ? (
                <View style={styles.emptyStudents}>
                  <MaterialCommunityIcons name="account-off-outline" size={48} color="#B0BEC5" />
                  <Text style={styles.emptyStudentsText}>
                    Todos los estudiantes ya están asignados a un grupo
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.pickerLabel}>Seleccionar estudiante:</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedStudentId}
                      onValueChange={(itemValue: string) => setSelectedStudentId(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Seleccione un estudiante..." value="" />
                      {availableStudents.map((student, index) => (
                        <Picker.Item 
                          key={index} 
                          label={student.name || 'Sin nombre'} 
                          value={student.userId || ''} 
                        />
                      ))}
                    </Picker>
                  </View>
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowAddMemberModal(false);
                        setSelectedStudentId('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.modalButton, 
                        styles.confirmButton,
                        !selectedStudentId && styles.confirmButtonDisabled
                      ]}
                      onPress={handleConfirmAddMember}
                      disabled={!selectedStudentId}
                    >
                      <Text style={styles.confirmButtonText}>Añadir</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
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
  headerWrapper: {
    width: '100%',
    backgroundColor: '#5B8DEF',
  },
  header: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#5B8DEF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  scrollView: {
    height: SCROLL_VIEW_HEIGHT,
    width: '100%',
  },
  scrollContentContainer: {
    paddingBottom: 8,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 12,
    paddingTop: 8,
    alignSelf: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#636E72',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  actionButtonDisabled: {
    backgroundColor: '#E8EAED',
    opacity: 0.5,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  groupCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5B8DEF',
  },
  membersContainer: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: '#95A5A6',
  },
  removeMemberButton: {
    padding: 4,
  },
  emptyGroup: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyGroupText: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
  groupFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  groupFooterText: {
    fontSize: 13,
    color: '#95A5A6',
    textAlign: 'center',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    marginBottom: 20,
  },
  picker: {
    height: 50,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#636E72',
  },
  confirmButton: {
    backgroundColor: '#5B8DEF',
  },
  confirmButtonDisabled: {
    backgroundColor: '#B0BEC5',
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalStudentsList: {
    padding: 16,
    gap: 12,
  },
  emptyStudents: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStudentsText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 12,
  },
  studentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5B8DEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  studentOptionInfo: {
    flex: 1,
  },
  studentOptionName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 2,
  },
  studentOptionEmail: {
    fontSize: 13,
    color: '#95A5A6',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#5B8DEF',
    marginTop: 12,
  },
  joinButtonDisabled: {
    backgroundColor: '#B0BEC5',
    opacity: 0.6,
  },
  joinButtonActive: {
    backgroundColor: '#27AE60',
  },
  leaveButton: {
    backgroundColor: '#E74C3C',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
