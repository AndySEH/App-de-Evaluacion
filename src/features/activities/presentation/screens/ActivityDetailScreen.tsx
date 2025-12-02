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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
  const [assessmentGradesVisible, setAssessmentGradesVisible] = useState(false);

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
      const assessmentsData = await getAssessmentsByActivityUC.execute(activityId);
      setAssessments(assessmentsData);

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

      const newAssessment = {
        id: assessmentId,
        activityId,
        courseId,
        title: assessmentTitle,
        durationMinutes: durationMinutes,
        startAt: startAt,
        gradesVisible: assessmentGradesVisible,
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
      setAssessmentGradesVisible(false);

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
      {(assessments.length > 0 || isTeacher) && (
        <View style={styles.bottomContainer}>
          {/* Assessments Panel - Shows when expanded */}
          {showAssessments && assessments.length > 0 && (
            <View style={styles.assessmentsPanel}>
              <ScrollView style={styles.assessmentsPanelScroll}>
                <View style={styles.assessmentsPanelContent}>
                    {assessments.map((assessment) => {
                      const assessmentId = assessment.id || assessment._id || '';
                      const timeRemaining = calculateTimeRemaining(assessment);
                      const isFinished = timeRemaining === 'Tiempo Finalizado';
                      const isCancelled = assessment.cancelled;

                      return (
                        <View key={assessmentId} style={[
                          styles.assessmentCard,
                          (isCancelled || isFinished) && styles.assessmentCardDisabled
                        ]}>
                          <View style={styles.assessmentCardHeader}>
                            <MaterialCommunityIcons 
                              name="clipboard-text" 
                              size={24} 
                              color={isCancelled || isFinished ? '#999999' : '#6C63FF'} 
                            />
                            <Text style={[
                              styles.assessmentTitle,
                              (isCancelled || isFinished) && styles.assessmentTitleDisabled
                            ]}>
                              {assessment.title}
                            </Text>
                          </View>

                          <View style={styles.assessmentInfoRow}>
                            <Text style={[
                              styles.assessmentLabel,
                              (isCancelled || isFinished) && styles.assessmentLabelDisabled
                            ]}>
                              Tiempo límite:
                            </Text>
                            <Text style={[
                              styles.assessmentValue,
                              (isCancelled || isFinished) && styles.assessmentValueDisabled
                            ]}>
                              {assessment.durationMinutes} minutos
                            </Text>
                          </View>

                          <View style={styles.assessmentInfoRow}>
                            <Text style={[
                              styles.assessmentLabel,
                              (isCancelled || isFinished) && styles.assessmentLabelDisabled
                            ]}>
                              Restante:
                            </Text>
                            <Text
                              style={[
                                styles.assessmentValue,
                                (isFinished || isCancelled) && styles.assessmentValueFinished,
                              ]}
                            >
                              {timeRemaining}
                            </Text>
                          </View>

                          {isTeacher && (
                            <View style={styles.assessmentInfoRow}>
                              <Text style={styles.assessmentLabel}>Notas visibles:</Text>
                              <Switch
                                value={assessment.gradesVisible}
                                onValueChange={(value) => handleToggleGradesVisible(assessment, value)}
                                trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                                thumbColor={assessment.gradesVisible ? '#6C63FF' : '#F3F4F6'}
                                disabled={isCancelled}
                              />
                            </View>
                          )}

                          <View style={styles.assessmentActions}>
                            {isTeacher === true ? (
                              <>
                                <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={() => handleOpenEditAssessment(assessment)}
                                >
                                  <MaterialCommunityIcons name="pencil" size={20} color="#6C63FF" />
                                  <Text style={styles.actionButtonText}>Editar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={() => {
                                    // Navegar a ver notas
                                    console.log('View grades:', assessmentId);
                                  }}
                                >
                                  <MaterialCommunityIcons name="chart-bar" size={20} color="#6C63FF" />
                                  <Text style={styles.actionButtonText}>Ver Notas</Text>
                                </TouchableOpacity>

                                {!isCancelled && (
                                  <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={() => handleCancelAssessment(assessment)}
                                  >
                                    <MaterialCommunityIcons name="close-circle" size={20} color="#E74C3C" />
                                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                                      Cancelar
                                    </Text>
                                  </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                  style={[styles.actionButton, styles.deleteButton]}
                                  onPress={() => handleDeleteAssessment(assessment)}
                                >
                                  <MaterialCommunityIcons name="delete" size={20} color="#E74C3C" />
                                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                                    Eliminar
                                  </Text>
                                </TouchableOpacity>
                              </>
                            ) : isTeacher === false ? (
                              <>
                                {/* Botón Evaluar - Siempre visible pero bloqueado si está cancelada o finalizada */}
                                <TouchableOpacity
                                  style={[
                                    styles.actionButton,
                                    (isCancelled || isFinished) && styles.actionButtonDisabled
                                  ]}
                                  onPress={() => {
                                    if (!isCancelled && !isFinished) {
                                      // Navegar a realizar evaluación
                                      console.log('Start assessment:', assessmentId);
                                    }
                                  }}
                                  disabled={isCancelled || isFinished}
                                >
                                  <MaterialCommunityIcons 
                                    name="pencil-box" 
                                    size={20} 
                                    color={isCancelled || isFinished ? '#999999' : '#6C63FF'} 
                                  />
                                  <Text style={[
                                    styles.actionButtonText,
                                    (isCancelled || isFinished) && styles.actionButtonTextDisabled
                                  ]}>
                                    Evaluar
                                  </Text>
                                </TouchableOpacity>

                                {/* Botón Ver Notas - Solo coloreado si gradesVisible está activado */}
                                <TouchableOpacity
                                  style={[
                                    styles.actionButton,
                                    !assessment.gradesVisible && styles.actionButtonDisabled
                                  ]}
                                  onPress={() => {
                                    if (assessment.gradesVisible) {
                                      // Navegar a ver notas
                                      console.log('View grades:', assessmentId);
                                    }
                                  }}
                                  disabled={!assessment.gradesVisible}
                                >
                                  <MaterialCommunityIcons 
                                    name="chart-bar" 
                                    size={20} 
                                    color={assessment.gradesVisible ? '#6C63FF' : '#999999'} 
                                  />
                                  <Text style={[
                                    styles.actionButtonText,
                                    !assessment.gradesVisible && styles.actionButtonTextDisabled
                                  ]}>
                                    Ver Notas
                                  </Text>
                                </TouchableOpacity>
                              </>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Toggle Button */}
            <TouchableOpacity
              style={styles.toggleAssessmentsButton}
              onPress={() => {
                // Si no hay evaluaciones y es profesor, abrir modal de crear evaluación
                if (assessments.length === 0 && isTeacher) {
                  setShowCreateAssessmentModal(true);
                } else {
                  setShowAssessments(!showAssessments);
                }
              }}
            >
              <MaterialCommunityIcons
                name={assessments.length === 0 && isTeacher ? 'plus-circle' : (showAssessments ? 'chevron-down' : 'chevron-up')}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.toggleAssessmentsText}>
                {assessments.length === 0 && isTeacher 
                  ? 'Iniciar evaluación' 
                  : (showAssessments ? 'Ocultar evaluación' : 'Ver evaluación')
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}

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

              <View style={styles.modalBody}>
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

                <View style={styles.inputGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>Notas visibles</Text>
                    <Switch
                      value={assessmentGradesVisible}
                      onValueChange={setAssessmentGradesVisible}
                      trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
                      thumbColor={assessmentGradesVisible ? '#6C63FF' : '#F3F4F6'}
                    />
                  </View>
                </View>
              </View>

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

              <View style={styles.modalBody}>
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
              </View>

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
  toggleAssessmentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    gap: 8,
  },
  toggleAssessmentsText: {
    fontSize: 16,
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
