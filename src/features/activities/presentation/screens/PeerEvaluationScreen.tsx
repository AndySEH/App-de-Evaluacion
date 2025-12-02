import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { AddPeerEvaluationUseCase } from "@/src/features/activities/domain/usecases/AddPeerEvaluationUseCase";
import { GetActivityByIdUseCase } from "@/src/features/activities/domain/usecases/GetActivityByIdUseCase";
import { GetAssessmentByIdUseCase } from "@/src/features/activities/domain/usecases/GetAssessmentByIdUseCase";
import { GetPeerEvaluationsByAssessmentUseCase } from "@/src/features/activities/domain/usecases/GetPeerEvaluationsByAssessmentUseCase";
import { UpdatePeerEvaluationUseCase } from "@/src/features/activities/domain/usecases/UpdatePeerEvaluationUseCase";
import { AuthUser } from "@/src/features/auth/domain/entities/AuthUser";
import { GetUsersByIdsUseCase } from "@/src/features/auth/domain/usecases/GetUsersByIdsUseCase";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { GetGroupsByCategoryUseCase } from "@/src/features/courses/domain/usecases/GetGroupsByCategoryUseCase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "react-native-paper";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 800;

interface PeerEvaluationData {
  evaluateeId: string;
  evaluateeName: string;
  punctuality: number;
  contributions: number;
  commitment: number;
  attitude: number;
}

const CRITERIA = [
  { key: 'punctuality', label: 'Puntualidad' },
  { key: 'contributions', label: 'Contribuciones' },
  { key: 'commitment', label: 'Aportes' },
  { key: 'attitude', label: 'Actitud' },
] as const;

export default function PeerEvaluationScreen({ route, navigation }: { route: any; navigation: any }) {
  const { assessmentId, activityId, courseId, isEditing = false } = route.params;
  const { user } = useAuth();
  const di = useDI();

  const getActivityByIdUC = di.resolve<GetActivityByIdUseCase>(TOKENS.GetActivityByIdUC);
  const getAssessmentByIdUC = di.resolve<GetAssessmentByIdUseCase>(TOKENS.GetAssessmentByIdUC);
  const getGroupsByCategoryUC = di.resolve<GetGroupsByCategoryUseCase>(TOKENS.GetGroupsByCategoryUC);
  const getUsersByIdsUC = di.resolve<GetUsersByIdsUseCase>(TOKENS.GetUsersByIdsUC);
  const addPeerEvaluationUC = di.resolve<AddPeerEvaluationUseCase>(TOKENS.AddPeerEvaluationUC);
  const updatePeerEvaluationUC = di.resolve<UpdatePeerEvaluationUseCase>(TOKENS.UpdatePeerEvaluationUC);
  const getPeerEvaluationsByAssessmentUC = di.resolve<GetPeerEvaluationsByAssessmentUseCase>(TOKENS.GetPeerEvaluationsByAssessmentUC);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [groupMembers, setGroupMembers] = useState<AuthUser[]>([]);
  const [evaluations, setEvaluations] = useState<PeerEvaluationData[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    loadEvaluationData();
  }, []);

  const loadEvaluationData = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id || user?.UserId || '';

      // Cargar actividad y evaluación
      const activity = await getActivityByIdUC.execute(activityId);
      const assessment = await getAssessmentByIdUC.execute(assessmentId);

      if (!activity || !assessment) {
        Alert.alert('Error', 'No se pudo cargar la información de la evaluación');
        navigation.goBack();
        return;
      }

      setActivityName(activity.name);
      setAssessmentTitle(assessment.title);

      // Verificar si ya evaluó
      const existingEvaluations = await getPeerEvaluationsByAssessmentUC.execute(assessmentId);
      console.log('[PeerEvaluationScreen] Existing evaluations:', JSON.stringify(existingEvaluations, null, 2));
      console.log('[PeerEvaluationScreen] User ID to compare:', userId);
      console.log('[PeerEvaluationScreen] User object:', JSON.stringify(user, null, 2));
      
      const userHasEvaluated = existingEvaluations.some(
        (ev) => {
          const match = ev.evaluatorId === userId;
          console.log(`[PeerEvaluationScreen] Comparing evaluatorId '${ev.evaluatorId}' === userId '${userId}': ${match}`);
          return match;
        }
      );
      
      console.log('[PeerEvaluationScreen] userHasEvaluated:', userHasEvaluated);

      if (userHasEvaluated) {
        setHasSubmitted(true);
      }

      // Obtener grupo del usuario
      if (!activity.categoryId) {
        Alert.alert('Error', 'Esta actividad no tiene categoría asignada');
        navigation.goBack();
        return;
      }

      const groups = await getGroupsByCategoryUC.execute(activity.categoryId);
      const userGroup = groups.find((group) => {
        const memberIds = Array.isArray(group.memberIds) 
          ? group.memberIds 
          : JSON.parse(group.memberIds || '[]');
        return memberIds.includes(userId);
      });

      if (!userGroup) {
        Alert.alert('Error', 'No estás asignado a ningún grupo en esta actividad');
        navigation.goBack();
        return;
      }

      // Obtener miembros del grupo (excluyendo al usuario actual)
      const memberIds = Array.isArray(userGroup.memberIds)
        ? userGroup.memberIds
        : JSON.parse(userGroup.memberIds || '[]');

      const otherMemberIds = memberIds.filter((id: string) => id !== userId);

      if (otherMemberIds.length === 0) {
        Alert.alert('Información', 'No hay otros miembros en tu grupo para evaluar');
        navigation.goBack();
        return;
      }

      const members = await getUsersByIdsUC.execute(otherMemberIds);
      setGroupMembers(members);

      // Si estamos en modo edición, cargar las evaluaciones existentes
      let initialEvaluations: PeerEvaluationData[];
      
      if (isEditing && userHasEvaluated) {
        // Precargar evaluaciones existentes
        const userEvaluations = existingEvaluations.filter(ev => ev.evaluatorId === userId);
        
        initialEvaluations = members.map((member) => {
          const memberId = member.userId || member.id || member._id || '';
          const existingEval = userEvaluations.find(ev => ev.evaluateeId === memberId);

          console.log('[PeerEvaluationScreen] Member data:', { userId: member.userId, id: member.id, _id: member._id, name: member.name });
          console.log('[PeerEvaluationScreen] evaluateeId (memberId):', memberId);

          
          return {
            evaluateeId: memberId,
            evaluateeName: member.name || member.email || 'Usuario',
            punctuality: existingEval?.punctuality || 1,
            contributions: existingEval?.contributions || 1,
            commitment: existingEval?.commitment || 1,
            attitude: existingEval?.attitude || 1,
          };
        });
        
        console.log('[PeerEvaluationScreen] Loaded existing evaluations for editing:', initialEvaluations);
        setHasSubmitted(false); // Permitir edición
      } else {
        // Inicializar evaluaciones con valores por defecto
        initialEvaluations = members.map((member) => {
          const memberId = member.userId || member.id || member._id || '';
          console.log('[PeerEvaluationScreen] Member data:', { userId: member.userId, id: member.id, _id: member._id, name: member.name });
          console.log('[PeerEvaluationScreen] evaluateeId (memberId):', memberId);
          return {
            evaluateeId: memberId,
            evaluateeName: member.name || member.email || 'Usuario',
            punctuality: 1,
            contributions: 1,
            commitment: 1,
            attitude: 1,
          };
        });
      }

      setEvaluations(initialEvaluations);
    } catch (error) {
      console.error('[PeerEvaluationScreen] Error loading data:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar la información');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (evaluateeId: string, criterion: string, value: number) => {
    setEvaluations((prev) =>
      prev.map((ev) =>
        ev.evaluateeId === evaluateeId ? { ...ev, [criterion]: value } : ev
      )
    );
  };

  const validateEvaluations = (): boolean => {
    for (const evaluation of evaluations) {
      if (
        !evaluation.punctuality || evaluation.punctuality < 1 || evaluation.punctuality > 5 ||
        !evaluation.contributions || evaluation.contributions < 1 || evaluation.contributions > 5 ||
        !evaluation.commitment || evaluation.commitment < 1 || evaluation.commitment > 5 ||
        !evaluation.attitude || evaluation.attitude < 1 || evaluation.attitude > 5
      ) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    console.log('[PeerEvaluationScreen] handleSubmit called');
    console.log('[PeerEvaluationScreen] Current evaluations:', evaluations);
    
    const isValid = validateEvaluations();
    console.log('[PeerEvaluationScreen] Validation result:', isValid);
    
    if (!isValid) {
      console.log('[PeerEvaluationScreen] Validation failed - showing alert');
      Alert.alert('Incompleto', 'Por favor, evalúa todos los criterios para cada compañero');
      return;
    }

    console.log('[PeerEvaluationScreen] Validation passed - showing confirmation modal');
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    console.log('[PeerEvaluationScreen] User confirmed submission');
    setShowConfirmModal(false);
    await submitEvaluations();
  };

  const handleCancelSubmit = () => {
    console.log('[PeerEvaluationScreen] User cancelled submission');
    setShowConfirmModal(false);
  };

  const handleSuccessClose = () => {
    console.log('[PeerEvaluationScreen] Success modal closed - navigating back');
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const submitEvaluations = async () => {
    console.log('[PeerEvaluationScreen] submitEvaluations called');
    console.log('[PeerEvaluationScreen] Is editing mode:', isEditing);
    try {
      setSubmitting(true);
      const userId = user?._id || user?.id || user?.UserId || '';
      console.log('[PeerEvaluationScreen] User ID:', userId);
      console.log('[PeerEvaluationScreen] Assessment ID:', assessmentId);
      console.log('[PeerEvaluationScreen] Number of evaluations to submit:', evaluations.length);

      if (isEditing) {
        // Modo edición: actualizar evaluaciones existentes
        const existingEvals = await getPeerEvaluationsByAssessmentUC.execute(assessmentId);
        const userExistingEvals = existingEvals.filter(ev => ev.evaluatorId === userId);

        for (let i = 0; i < evaluations.length; i++) {
          const evaluation = evaluations[i];
          console.log(`[PeerEvaluationScreen] Updating evaluation ${i + 1}/${evaluations.length}`);
          
          // Encontrar la evaluación existente para este evaluatee
          const existingEval = userExistingEvals.find(ev => ev.evaluateeId === evaluation.evaluateeId);
          
          if (existingEval) {
            const evalId = existingEval.id || existingEval._id || '';
            const updates = {
              punctuality: evaluation.punctuality,
              contributions: evaluation.contributions,
              commitment: evaluation.commitment,
              attitude: evaluation.attitude,
            };
            
            console.log(`[PeerEvaluationScreen] Updating eval ID ${evalId}:`, updates);
            await updatePeerEvaluationUC.execute(evalId, updates);
            console.log(`[PeerEvaluationScreen] Evaluation ${i + 1} updated successfully`);
          }
        }
        console.log('[PeerEvaluationScreen] All evaluations updated successfully');
      } else {
        // Modo creación: crear nuevas evaluaciones
        for (let i = 0; i < evaluations.length; i++) {
          const evaluation = evaluations[i];
          console.log(`[PeerEvaluationScreen] Creating evaluation ${i + 1}/${evaluations.length}`);
          
          const peerEvaluation = {
            assessmentId,
            evaluatorId: userId,
            evaluateeId: evaluation.evaluateeId,
            punctuality: evaluation.punctuality,
            contributions: evaluation.contributions,
            commitment: evaluation.commitment,
            attitude: evaluation.attitude,
          };
          
          console.log(`[PeerEvaluationScreen] Peer evaluation data:`, peerEvaluation);
          await addPeerEvaluationUC.execute(peerEvaluation);
          console.log(`[PeerEvaluationScreen] Evaluation ${i + 1} created successfully`);
        }
        console.log('[PeerEvaluationScreen] All evaluations created successfully');
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('[PeerEvaluationScreen] Error submitting:', error);
      Alert.alert('Error', 'Ocurrió un error al enviar las evaluaciones');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingPicker = (evaluateeId: string, criterion: string, currentValue: number) => {
    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={currentValue || 1}
          onValueChange={(value) => !hasSubmitted && handleRatingChange(evaluateeId, criterion, value)}
          enabled={!hasSubmitted}
          style={styles.picker}
          itemStyle={styles.pickerItem}
          dropdownIconColor="#6C63FF"
        >
          <Picker.Item label="1 - Muy Bajo" value={1} />
          <Picker.Item label="2 - Bajo" value={2} />
          <Picker.Item label="3 - Regular" value={3} />
          <Picker.Item label="4 - Bueno" value={4} />
          <Picker.Item label="5 - Excelente" value={5} />
        </Picker>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando evaluación...</Text>
      </View>
    );
  }

  if (hasSubmitted) {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <View style={[styles.header, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Evaluación entre Pares</Text>
          </View>
        </View>

        <View style={styles.submittedContainer}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
          <Text style={styles.submittedTitle}>Evaluación Completada</Text>
          <Text style={styles.submittedText}>
            Ya has enviado tus evaluaciones para esta actividad.
          </Text>
          <TouchableOpacity style={styles.backHomeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backHomeButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={[styles.header, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Evaluación' : 'Evaluación entre Pares'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.content, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.activityName}>{activityName}</Text>
            <Text style={styles.assessmentTitle}>{assessmentTitle}</Text>
            <Text style={styles.instructions}>
              Evalúa a tus compañeros de grupo en una escala del 1 al 5, donde 1 es el más bajo y 5 es
              el más alto.
            </Text>
          </View>

          {/* Evaluation Table */}
          <View style={styles.tableCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Header Row */}
                <View style={styles.tableHeader}>
                  <View style={[styles.tableCell, styles.nameCellHeader]}>
                    <Text style={styles.tableHeaderText}>Compañero</Text>
                  </View>
                  {CRITERIA.map((criterion) => (
                    <View key={criterion.key} style={[styles.tableCell, styles.criterionCellHeader]}>
                      <Text style={styles.tableHeaderText}>{criterion.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Data Rows */}
                {evaluations.map((evaluation, index) => (
                  <View
                    key={evaluation.evaluateeId}
                    style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}
                  >
                    <View style={[styles.tableCell, styles.nameCell]}>
                      <Text style={styles.nameCellText}>{evaluation.evaluateeName}</Text>
                    </View>
                    {CRITERIA.map((criterion) => (
                      <View key={criterion.key} style={[styles.tableCell, styles.criterionCell]}>
                        {renderRatingPicker(
                          evaluation.evaluateeId,
                          criterion.key,
                          evaluation[criterion.key as keyof typeof evaluation] as number
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name={isEditing ? "pencil" : "send"} size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Actualizar Evaluaciones' : 'Enviar Evaluaciones'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelSubmit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#6C63FF" />
            <Text style={styles.modalTitle}>Confirmar envío</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de enviar tus evaluaciones? No podrás modificarlas después.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelSubmit}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmSubmit}
              >
                <Text style={styles.confirmButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <MaterialCommunityIcons name="check-circle" size={60} color="#4CAF50" />
            <Text style={styles.modalTitle}>¡Éxito!</Text>
            <Text style={styles.modalMessage}>
              Tus evaluaciones han sido enviadas correctamente.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { width: '100%' }]}
              onPress={handleSuccessClose}
            >
              <Text style={styles.confirmButtonText}>Aceptar</Text>
            </TouchableOpacity>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
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
  content: {
    padding: 20,
  },
  infoCard: {
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
  activityName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  assessmentTitle: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '600',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 14,
    color: '#636E72',
    lineHeight: 20,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  tableRowEven: {
    backgroundColor: '#F8F9FA',
  },
  tableCell: {
    padding: 12,
    justifyContent: 'center',
  },
  nameCellHeader: {
    width: 150,
    minWidth: 150,
  },
  nameCell: {
    width: 150,
    minWidth: 150,
  },
  criterionCellHeader: {
    width: 200,
    minWidth: 200,
  },
  criterionCell: {
    width: 200,
    minWidth: 200,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nameCellText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#E0E7FF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50,
    width: Platform.OS === 'web' ? 180 : 180,
    color: '#2D3436',
    fontWeight: '500',
  },
  pickerItem: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submittedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  submittedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginTop: 20,
    marginBottom: 12,
  },
  submittedText: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 32,
  },
  backHomeButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  backHomeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    maxWidth: 400,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3436',
    marginTop: 20,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E8EAED',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  confirmButton: {
    backgroundColor: '#6C63FF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
