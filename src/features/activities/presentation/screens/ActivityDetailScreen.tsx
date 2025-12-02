import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { Category } from "@/src/features/courses/domain/entities/Category";
import { GetCategoryByIdUseCase } from "@/src/features/courses/domain/usecases/GetCategoryByIdUseCase";
import { GetCourseByIdUseCase } from "@/src/features/courses/domain/usecases/GetCourseByIdUseCase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { Activity } from "../../domain/entities/Activity";
import { Assessment } from "../../domain/entities/Assessment";
import { AddAssessmentUseCase } from "../../domain/usecases/AddAssessmentUseCase";
import { DeleteAssessmentUseCase } from "../../domain/usecases/DeleteAssessmentUseCase";
import { GetActivityByIdUseCase } from "../../domain/usecases/GetActivityByIdUseCase";
import { GetAssessmentsByActivityUseCase } from "../../domain/usecases/GetAssessmentsByActivityUseCase";
import { UpdateActivityUseCase } from "../../domain/usecases/UpdateActivityUseCase";
import { UpdateAssessmentUseCase } from "../../domain/usecases/UpdateAssessmentUseCase";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

export default function ActivityDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { activityId, courseId } = route.params;
  const { user } = useAuth();
  const di = useDI();

  const getActivityByIdUC = di.resolve<GetActivityByIdUseCase>(TOKENS.GetActivityByIdUC);
  const updateActivityUC = di.resolve<UpdateActivityUseCase>(TOKENS.UpdateActivityUC);
  const getAssessmentsByActivityUC = di.resolve<GetAssessmentsByActivityUseCase>(TOKENS.GetAssessmentsByActivityUC);
  const updateAssessmentUC = di.resolve<UpdateAssessmentUseCase>(TOKENS.UpdateAssessmentUC);
  const deleteAssessmentUC = di.resolve<DeleteAssessmentUseCase>(TOKENS.DeleteAssessmentUC);
  const addAssessmentUC = di.resolve<AddAssessmentUseCase>(TOKENS.AddAssessmentUC);
  const getCategoryByIdUC = di.resolve<GetCategoryByIdUseCase>(TOKENS.GetCategoryByIdUC);
  const getCourseByIdUC = di.resolve<GetCourseByIdUseCase>(TOKENS.GetCourseByIdUC);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [showAssessments, setShowAssessments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);

  // Modal state for creating assessment
  const [showCreateAssessmentModal, setShowCreateAssessmentModal] = useState(false);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDuration, setAssessmentDuration] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);

  // Modal state for editing assessment
  const [showEditAssessmentModal, setShowEditAssessmentModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [editAssessmentTitle, setEditAssessmentTitle] = useState('');
  const [editAssessmentDuration, setEditAssessmentDuration] = useState('');
  const [editAssessmentGradesVisible, setEditAssessmentGradesVisible] = useState(false);

  useEffect(() => {
    loadActivityData();
  }, [activityId]);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      
      // Cargar curso para verificar si es profesor
      const courseData = await getCourseByIdUC.execute(courseId);
      console.log('[ActivityDetailScreen] Course data:', courseData);
      console.log('[ActivityDetailScreen] User data:', user);
      
      // Intentar diferentes campos que podrían contener el ID del profesor
      const teacherId = courseData?.teacherId || (courseData as any)?.teacher_id || (courseData as any)?.teacher;
      const userId = user?._id || user?.id || user?.UserId;
      
      const userIsTeacher = teacherId === userId;
      setIsTeacher(userIsTeacher);
      console.log('[ActivityDetailScreen] User is teacher:', userIsTeacher);
      console.log('[ActivityDetailScreen] teacherId:', teacherId, 'userId:', userId);
      // Cargar actividad
      const activityData = await getActivityByIdUC.execute(activityId);
      if (!activityData) {
        console.error('[ActivityDetailScreen] Activity not found');
        return;
      }
      setActivity(activityData);

      // Cargar categoría
      if (activityData.categoryId) {
        const categoryData = await getCategoryByIdUC.execute(activityData.categoryId);
        setCategory(categoryData || null);
      }

      // Cargar evaluaciones
      console.log('[ActivityDetailScreen] ===== LOADING ASSESSMENTS =====');
      console.log('[ActivityDetailScreen] Activity ID for query:', activityId);
      const assessmentsData = await getAssessmentsByActivityUC.execute(activityId);
      console.log('[ActivityDetailScreen] Assessments loaded:', assessmentsData.length);
      console.log('[ActivityDetailScreen] Assessments data:', JSON.stringify(assessmentsData, null, 2));
      setAssessments(assessmentsData);
      // Si ya hay evaluaciones, mostrar el panel por defecto
      if (assessmentsData && assessmentsData.length > 0) {
        console.log('[ActivityDetailScreen] Auto-opening assessments panel');
        setShowAssessments(true);
      } else {
        console.log('[ActivityDetailScreen] No assessments found, panel closed');
      }

    } catch (error) {
      console.error('[ActivityDetailScreen] Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (newValue: boolean) => {
    if (!activity) return;
    
    try {
      const activityIdToUse = activity.id || activity._id || '';
      await updateActivityUC.execute(activityIdToUse, { visible: newValue });
      setActivity({ ...activity, visible: newValue });
    } catch (error) {
      console.error('[ActivityDetailScreen] Error updating visibility:', error);
    }
  };

  const handleToggleGradesVisible = async (assessment: Assessment, newValue: boolean) => {
    try {
      const assessmentIdToUse = assessment.id || assessment._id || '';
      await updateAssessmentUC.execute(assessmentIdToUse, { gradesVisible: newValue });
      
      setAssessments(assessments.map(a => 
        (a.id || a._id) === assessmentIdToUse 
          ? { ...a, gradesVisible: newValue } 
          : a
      ));
    } catch (error) {
      console.error('[ActivityDetailScreen] Error updating grades visibility:', error);
    }
  };

  const handleCancelAssessment = async (assessment: Assessment) => {
    try {
      const assessmentIdToUse = assessment.id || assessment._id || '';
      await updateAssessmentUC.execute(assessmentIdToUse, { cancelled: true });
      
      setAssessments(assessments.map(a => 
        (a.id || a._id) === assessmentIdToUse 
          ? { ...a, cancelled: true } 
          : a
      ));
    } catch (error) {
      console.error('[ActivityDetailScreen] Error cancelling assessment:', error);
    }
  };

  const handleDeleteAssessment = async (assessment: Assessment) => {
    try {
      const assessmentIdToUse = assessment.id || assessment._id || '';
      await deleteAssessmentUC.execute(assessmentIdToUse);
      
      // Eliminar de la lista local
      setAssessments(assessments.filter(a => (a.id || a._id) !== assessmentIdToUse));
      
      console.log('[ActivityDetailScreen] Assessment deleted successfully');
    } catch (error) {
      console.error('[ActivityDetailScreen] Error deleting assessment:', error);
    }
  };

  const handleOpenEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setEditAssessmentTitle(assessment.title);
    setEditAssessmentDuration(assessment.durationMinutes.toString());
    setEditAssessmentGradesVisible(assessment.gradesVisible);
    setShowEditAssessmentModal(true);
  };

  const handleEditAssessment = async () => {
    if (!editingAssessment || !editAssessmentTitle.trim() || !editAssessmentDuration.trim()) return;

    try {
      const assessmentIdToUse = editingAssessment.id || editingAssessment._id || '';
      const updatedData = {
        title: editAssessmentTitle.trim(),
        durationMinutes: parseInt(editAssessmentDuration, 10),
        gradesVisible: editAssessmentGradesVisible,
      };

      await updateAssessmentUC.execute(assessmentIdToUse, updatedData);

      // Actualizar la lista local
      setAssessments(assessments.map(a => 
        (a.id || a._id) === assessmentIdToUse
          ? { ...a, ...updatedData }
          : a
      ));

      // Cerrar modal y limpiar estados
      setShowEditAssessmentModal(false);
      setEditingAssessment(null);
      setEditAssessmentTitle('');
      setEditAssessmentDuration('');
      setEditAssessmentGradesVisible(false);

      console.log('[ActivityDetailScreen] Assessment updated successfully');
    } catch (error) {
      console.error('[ActivityDetailScreen] Error updating assessment:', error);
    }
  };

  const handleCreateAssessment = async () => {
    try {
      if (!assessmentTitle.trim() || !assessmentDuration.trim()) {
        console.error('[ActivityDetailScreen] Title and duration are required');
        return;
      }

      const durationMinutes = parseInt(assessmentDuration);
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        console.error('[ActivityDetailScreen] Invalid duration');
        return;
      }

      // Generar ID único para la evaluación
      const assessmentId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      // Generar fecha y hora actual en formato YYYY-MM-DDTHH:mm
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const startAt = `${year}-${month}-${day}T${hours}:${minutes}`;

      // Calcular endAt sumando durationMinutes a startAt
      const startDate = new Date(`${startAt}:00`); // Añadir segundos para timestamp completo
      const endDate = new Date(startDate.getTime() + (durationMinutes * 60 * 1000));
      const endYear = endDate.getFullYear();
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(endDate.getDate()).padStart(2, '0');
      const endHours = String(endDate.getHours()).padStart(2, '0');
      const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
      const endAt = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;

      const newAssessment = {
        id: assessmentId,
        activityId,
        courseId,
        title: assessmentTitle,
        durationMinutes: durationMinutes,
        startAt: startAt,
        endAt: endAt,
        gradesVisible: false, // Por defecto oculto, el profesor puede activarlo después
        cancelled: false,
      };

      console.log('[ActivityDetailScreen] Creating assessment with startAt:', startAt);

      await addAssessmentUC.execute(newAssessment);

      // Recargar evaluaciones
      const updatedAssessments = await getAssessmentsByActivityUC.execute(activityId);
      setAssessments(updatedAssessments);

      // Cerrar modal y limpiar campos
      setShowCreateAssessmentModal(false);
      setAssessmentTitle('');
      setAssessmentDuration('');
      setSendImmediately(true);

      // Abrir panel de evaluación
      setShowAssessments(true);
    } catch (error) {
      console.error('[ActivityDetailScreen] Error creating assessment:', error);
    }
  };

  const calculateTimeRemaining = (assessment: Assessment): string => {
    if (assessment.cancelled) return 'Cancelada';
    if (!assessment.startAt) return 'Sin fecha';

    const now = new Date();
    const startDate = new Date(assessment.startAt);
    
    // Calcular fecha de fin: startAt + durationMinutes
    const endDate = new Date(startDate.getTime() + (assessment.durationMinutes * 60 * 1000));
    
    if (now > endDate) {
      return 'Tiempo Finalizado';
    }

    const diffMs = endDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    }
  };

  const formatDueDate = (dueDate?: string): string => {
    if (!dueDate) return 'Sin fecha límite';
    
    const date = new Date(dueDate);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando actividad...</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>No se pudo cargar la actividad</Text>
      </View>
    );
  }

  // Si el usuario es estudiante y la actividad no es visible, mostrar mensaje de acceso denegado
  // Solo validar cuando isTeacher ya se haya determinado (no es null)
  console.log('isTeacher:', isTeacher);
  if (isTeacher === false && !activity.visible) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="eye-off" size={64} color="#95A5A6" />
        <Text style={styles.errorText}>Esta actividad no está disponible</Text>
        <TouchableOpacity
          style={styles.backToListButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backToListButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={[styles.header, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de Actividad</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.content, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
          
          {/* Activity Info Card */}
          <View style={styles.card}>
            <Text style={styles.activityTitle}>{activity.name}</Text>
            
            {category && (
              <View style={styles.categoryBadge}>
                <MaterialCommunityIcons name="tag" size={16} color="#6C63FF" />
                <Text style={styles.categoryText}>{category.name}</Text>
              </View>
            )}

            {activity.description && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Descripción</Text>
                <Text style={styles.descriptionText}>{activity.description}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Fecha límite</Text>
              <View style={styles.dueDateContainer}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color="#636E72" />
                <Text style={styles.dueDateText}>{formatDueDate(activity.dueDate)}</Text>
              </View>
            </View>

            {isTeacher && (
              <View style={styles.section}>
                <View style={styles.visibilityRow}>
                  <Text style={styles.sectionLabel}>Visibilidad de la actividad</Text>
                  <Switch
                    value={activity.visible}
                    onValueChange={handleToggleVisibility}
                    trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                    thumbColor={activity.visible ? '#6C63FF' : '#F3F4F6'}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Accordion Button and Panel - Fixed Position */}
      {/* Bottom Fixed Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.fixedButtonsContainer}>
          {isTeacher ? (
            <>
              <TouchableOpacity
                style={[styles.fixedButton, styles.sendEvaluationButton]}
                onPress={() => setShowCreateAssessmentModal(true)}
              >
                <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.fixedButtonText}>ENVIAR EVALUACIÓN</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.fixedButton, 
                  styles.viewGradesButton,
                  assessments.length === 0 && styles.fixedButtonDisabled
                ]}
                onPress={() => {
                  if (assessments.length > 0) {
                    const firstAssessment = assessments[0];
                    const assessmentId = firstAssessment.id || firstAssessment._id || '';
                    navigation.navigate('AssessmentGrades', {
                      assessmentId: assessmentId,
                      activityId: activityId,
                    });
                  }
                }}
                disabled={assessments.length === 0}
              >
                <MaterialCommunityIcons 
                  name="chart-bar" 
                  size={20} 
                  color="#FFFFFF"
                />
                <Text style={styles.fixedButtonText}>
                  VER NOTAS
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.fixedButton, styles.viewGradesButtonStudent]}
              onPress={() => {
                if (assessments.length > 0 && assessments[0].gradesVisible) {
                  const firstAssessment = assessments[0];
                  const assessmentId = firstAssessment.id || firstAssessment._id || '';
                  navigation.navigate('AssessmentGrades', {
                    assessmentId: assessmentId,
                    activityId: activityId,
                  });
                }
              }}
              disabled={assessments.length === 0 || !assessments[0]?.gradesVisible}
            >
              <MaterialCommunityIcons 
                name="chart-bar" 
                size={20} 
                color={(assessments.length === 0 || !assessments[0]?.gradesVisible) ? '#999999' : '#FFFFFF'} 
              />
              <Text style={[
                styles.fixedButtonText,
                (assessments.length === 0 || !assessments[0]?.gradesVisible) && styles.fixedButtonDisabled
              ]}>
                VER NOTAS
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal para crear evaluación */}
      <Modal
        visible={showCreateAssessmentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateAssessmentModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBackground}>
            <TouchableOpacity 
              style={styles.modalContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Crear Evaluación</Text>
                <TouchableOpacity onPress={() => setShowCreateAssessmentModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#636E72" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={[styles.modalBodyScroll, { maxHeight: SCREEN_HEIGHT * 0.65 }]}
                contentContainerStyle={styles.modalBody}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre de la evaluación</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Evaluación Parcial"
                    value={assessmentTitle}
                    onChangeText={setAssessmentTitle}
                    placeholderTextColor="#999999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Duración (minutos)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 60"
                    value={assessmentDuration}
                    onChangeText={setAssessmentDuration}
                    keyboardType="numeric"
                    placeholderTextColor="#999999"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.createButton, (!assessmentTitle.trim() || !assessmentDuration.trim()) && styles.createButtonDisabled]}
                  onPress={handleCreateAssessment}
                  disabled={!assessmentTitle.trim() || !assessmentDuration.trim()}
                >
                  <Text style={styles.createButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Edición de Evaluación */}
      <Modal
        visible={showEditAssessmentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditAssessmentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackground}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalContainer}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Evaluación</Text>
                <TouchableOpacity onPress={() => setShowEditAssessmentModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#2D3436" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={[styles.modalBodyScroll, { maxHeight: SCREEN_HEIGHT * 0.65 }]}
                contentContainerStyle={styles.modalBody}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Título de la evaluación</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Evaluación Parcial"
                    value={editAssessmentTitle}
                    onChangeText={setEditAssessmentTitle}
                    placeholderTextColor="#999999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Duración (minutos)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 60"
                    value={editAssessmentDuration}
                    onChangeText={setEditAssessmentDuration}
                    keyboardType="numeric"
                    placeholderTextColor="#999999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>Notas visibles</Text>
                    <Switch
                      value={editAssessmentGradesVisible}
                      onValueChange={setEditAssessmentGradesVisible}
                      trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                      thumbColor={editAssessmentGradesVisible ? '#6C63FF' : '#F3F4F6'}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.createButton, (!editAssessmentTitle.trim() || !editAssessmentDuration.trim()) && styles.createButtonDisabled]}
                  onPress={handleEditAssessment}
                  disabled={!editAssessmentTitle.trim() || !editAssessmentDuration.trim()}
                >
                  <Text style={styles.createButtonText}>Actualizar</Text>
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
  backToListButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
  },
  backToListButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerWrapper: {
    backgroundColor: '#6C63FF',
    paddingTop: Platform.OS === 'web' ? 20 : 48,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  section: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#2D3436',
    lineHeight: 22,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueDateText: {
    fontSize: 15,
    color: '#2D3436',
  },
  visibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  assessmentsPanel: {
    maxHeight: 400,
    backgroundColor: '#F8F9FA',
  },
  assessmentsPanelScroll: {
    maxHeight: 400,
  },
  assessmentsPanelContent: {
    padding: 16,
  },
  noAssessmentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noAssessmentsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  createFirstAssessmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createFirstAssessmentButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assessmentSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  assessmentSummaryText: {
    flex: 1,
    fontSize: 13,
    color: '#4C46B6',
    lineHeight: 18,
  },
  fixedButtonsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  fixedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  fixedButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  sendEvaluationButton: {
    backgroundColor: '#6C63FF',
  },
  viewGradesButton: {
    backgroundColor: '#27AE60',
  },
  viewGradesButtonStudent: {
    backgroundColor: '#6C63FF',
  },
  fixedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  assessmentsContainer: {
    marginTop: 8,
  },
  assessmentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  assessmentCard: {
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
  assessmentCardDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.8,
  },
  assessmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  assessmentTitleDisabled: {
    color: '#999999',
  },
  assessmentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  assessmentLabel: {
    fontSize: 15,
    color: '#636E72',
  },
  assessmentLabelDisabled: {
    color: '#999999',
  },
  assessmentValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3436',
  },
  assessmentValueDisabled: {
    color: '#999999',
  },
  assessmentValueFinished: {
    color: '#E74C3C',
  },
  assessmentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C63FF',
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  actionButtonDisabled: {
    borderColor: '#CCCCCC',
    backgroundColor: '#F5F5F5',
  },
  actionButtonTextDisabled: {
    color: '#999999',
  },
  highlightButton: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  highlightButtonText: {
    color: '#FFFFFF',
  },
  visibilityActiveButton: {
    borderColor: '#27AE60',
  },
  visibilityActiveText: {
    color: '#27AE60',
  },
  visibilityInactiveButton: {
    borderColor: '#E67E22',
  },
  visibilityInactiveText: {
    color: '#E67E22',
  },
  cancelButton: {
    borderColor: '#E74C3C',
  },
  cancelButtonText: {
    color: '#E74C3C',
  },
  deleteButton: {
    borderColor: '#E74C3C',
  },
  deleteButtonText: {
    color: '#E74C3C',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
  },
  modalBody: {
    padding: 20,
  },
  modalBodyScroll: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2D3436',
    backgroundColor: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8EAED',
  },
  createButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#B0BEC5',
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
