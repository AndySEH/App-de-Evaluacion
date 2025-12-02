import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { AuthUser } from "@/src/features/auth/domain/entities/AuthUser";
import { GetUsersByIdsUseCase } from "@/src/features/auth/domain/usecases/GetUsersByIdsUseCase";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { GetGroupsByCategoryUseCase } from "@/src/features/courses/domain/usecases/GetGroupsByCategoryUseCase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "react-native-paper";
import { Assessment } from "../../domain/entities/Assessment";
import { PeerEvaluation } from "../../domain/entities/PeerEvaluation";
import { AddPeerEvaluationUseCase } from "../../domain/usecases/AddPeerEvaluationUseCase";
import { GetActivityByIdUseCase } from "../../domain/usecases/GetActivityByIdUseCase";
import { GetAssessmentByIdUseCase } from "../../domain/usecases/GetAssessmentByIdUseCase";
import { GetPeerEvaluationsByAssessmentUseCase } from "../../domain/usecases/GetPeerEvaluationsByAssessmentUseCase";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

interface RatingCriteria {
  name: string;
  key: keyof Pick<PeerEvaluation, 'punctuality' | 'contributions' | 'commitment' | 'attitude'>;
  icon: string;
  description: string;
}

const CRITERIA: RatingCriteria[] = [
  {
    name: 'Puntualidad',
    key: 'punctuality',
    icon: 'clock-check-outline',
    description: 'Cumplimiento de horarios y entregas a tiempo'
  },
  {
    name: 'Contribuciones',
    key: 'contributions',
    icon: 'account-group',
    description: 'Aportes significativos al trabajo del equipo'
  },
  {
    name: 'Compromiso',
    key: 'commitment',
    icon: 'handshake',
    description: 'Dedicación y responsabilidad con las tareas'
  },
  {
    name: 'Actitud',
    key: 'attitude',
    icon: 'emoticon-happy-outline',
    description: 'Disposición positiva y colaborativa'
  }
];

export default function PeerEvaluationFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const { assessmentId, activityId } = route.params;
  const { user } = useAuth();
  const di = useDI();

  const getAssessmentByIdUC = di.resolve<GetAssessmentByIdUseCase>(TOKENS.GetAssessmentByIdUC);
  const getPeerEvaluationsByAssessmentUC = di.resolve<GetPeerEvaluationsByAssessmentUseCase>(TOKENS.GetPeerEvaluationsByAssessmentUC);
  const addPeerEvaluationUC = di.resolve<AddPeerEvaluationUseCase>(TOKENS.AddPeerEvaluationUC);
  const getUsersByIdsUC = di.resolve<GetUsersByIdsUseCase>(TOKENS.GetUsersByIdsUC);
  const getGroupsByCategoryUC = di.resolve<GetGroupsByCategoryUseCase>(TOKENS.GetGroupsByCategoryUC);
  const getActivityByIdUC = di.resolve<GetActivityByIdUseCase>(TOKENS.GetActivityByIdUC);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [groupMembers, setGroupMembers] = useState<AuthUser[]>([]);
  const [existingEvaluations, setExistingEvaluations] = useState<PeerEvaluation[]>([]);
  const [selectedMember, setSelectedMember] = useState<AuthUser | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({
    punctuality: 0,
    contributions: 0,
    commitment: 0,
    attitude: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar assessment
      const assessmentData = await getAssessmentByIdUC.execute(assessmentId);
      if (!assessmentData) {
        Alert.alert('Error', 'No se encontró la evaluación');
        navigation.goBack();
        return;
      }
      setAssessment(assessmentData);

      // Verificar si la evaluación está activa
      if (assessmentData.cancelled) {
        Alert.alert('Evaluación cancelada', 'Esta evaluación ha sido cancelada');
        navigation.goBack();
        return;
      }

      // Verificar tiempo de evaluación
      if (assessmentData.startAt) {
        const now = new Date();
        const startDate = new Date(assessmentData.startAt);
        const endDate = new Date(startDate.getTime() + (assessmentData.durationMinutes * 60 * 1000));
        
        if (now < startDate) {
          Alert.alert('Evaluación no disponible', 'Esta evaluación aún no ha comenzado');
          navigation.goBack();
          return;
        }
        
        if (now > endDate) {
          Alert.alert('Tiempo finalizado', 'El tiempo para esta evaluación ha expirado');
          navigation.goBack();
          return;
        }
      }

      // Cargar actividad para obtener categoryId
      const activity = await getActivityByIdUC.execute(activityId);
      if (!activity) {
        Alert.alert('Error', 'No se encontró la actividad');
        navigation.goBack();
        return;
      }

      // Cargar grupos de la categoría
      const groups = await getGroupsByCategoryUC.execute(activity.categoryId);
      
      // Encontrar el grupo del usuario actual
      const userId = user?._id || user?.id || user?.uid || '';
      const userGroup = groups.find(group => group.memberIds.includes(userId));

      if (!userGroup) {
        Alert.alert('Error', 'No perteneces a ningún grupo en esta categoría');
        navigation.goBack();
        return;
      }

      // Cargar información de los miembros del grupo
      const memberIds = userGroup.memberIds.filter(id => id !== userId); // Excluir al evaluador
      if (memberIds.length === 0) {
        Alert.alert('Sin compañeros', 'No hay otros miembros en tu grupo para evaluar');
        navigation.goBack();
        return;
      }

      const members = await getUsersByIdsUC.execute(memberIds);
      setGroupMembers(members);

      // Cargar evaluaciones existentes
      const evaluations = await getPeerEvaluationsByAssessmentUC.execute(assessmentId);
      console.log('[PeerEvaluationFormScreen] Loaded evaluations:', evaluations.length, 'for assessmentId:', assessmentId);
      console.log('[PeerEvaluationFormScreen] All evaluations:', JSON.stringify(evaluations, null, 2));
      const userEvaluations = evaluations.filter(
        evaluation => evaluation.evaluatorId === userId
      );
      console.log('[PeerEvaluationFormScreen] User evaluations:', userEvaluations.length, 'for userId:', userId);
      setExistingEvaluations(userEvaluations);

    } catch (error) {
      console.error('[PeerEvaluationFormScreen] Error loading data:', error);
      Alert.alert('Error', 'No se pudo cargar la información');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMember = (member: AuthUser) => {
    const userId = user?._id || user?.id || user?.uid || '';
    const memberId = member.id || member.userId || '';
    
    // Verificar si ya evaluó a este compañero
    const alreadyEvaluated = existingEvaluations.some(
      evaluation => evaluation.evaluateeId === memberId
    );

    if (alreadyEvaluated) {
      Alert.alert('Ya evaluado', 'Ya has evaluado a este compañero');
      return;
    }

    setSelectedMember(member);
    // Reset ratings
    setRatings({
      punctuality: 0,
      contributions: 0,
      commitment: 0,
      attitude: 0,
    });
  };

  const handleRatingChange = (criterion: string, value: string) => {
    // Permitir vacío o números enteros entre 1 y 5
    if (value === '') {
      setRatings(prev => ({ ...prev, [criterion]: 0 }));
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
      setRatings(prev => ({ ...prev, [criterion]: numValue }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      Alert.alert('Error', 'Selecciona un compañero para evaluar');
      return;
    }

    // Validar que todas las calificaciones estén entre 1 y 5
    const allRated = Object.values(ratings).every(rating => rating >= 1 && rating <= 5);
    if (!allRated) {
      Alert.alert('Error', 'Debes calificar todos los criterios con una puntuación del 1 al 5');
      return;
    }

    try {
      setSubmitting(true);

      const userId = user?._id || user?.id || user?.uid || '';
      const memberId = selectedMember._id || selectedMember.id || selectedMember.uid || '';

      // Generar ID único para la evaluación
      const evaluationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      const newEvaluation = {
        id: evaluationId,
        assessmentId,
        evaluatorId: userId,
        evaluateeId: memberId,
        punctuality: ratings.punctuality,
        contributions: ratings.contributions,
        commitment: ratings.commitment,
        attitude: ratings.attitude,
      };

      console.log('[PeerEvaluationFormScreen] Submitting evaluation:', JSON.stringify(newEvaluation, null, 2));
      await addPeerEvaluationUC.execute(newEvaluation);
      console.log('[PeerEvaluationFormScreen] Evaluation submitted successfully');

      Alert.alert(
        'Evaluación enviada',
        'Tu evaluación ha sido registrada exitosamente',
        [
          {
            text: 'OK',
            onPress: () => {
              // Recargar datos para actualizar la lista
              loadData();
              setSelectedMember(null);
            }
          }
        ]
      );

    } catch (error) {
      console.error('[PeerEvaluationFormScreen] Error submitting evaluation:', error);
      Alert.alert('Error', 'No se pudo enviar la evaluación');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingInput = (criterion: RatingCriteria) => {
    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.ratingInput}
          keyboardType="number-pad"
          placeholder="1 - 5"
          value={ratings[criterion.key] > 0 ? ratings[criterion.key].toString() : ''}
          onChangeText={(value: string) => handleRatingChange(criterion.key, value)}
          maxLength={1}
          placeholderTextColor="#999999"
        />
        <Text style={styles.inputHint}>Escala: 1 - 5</Text>
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

  if (!assessment) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#FF6B6B" />
        <Text style={styles.errorText}>No se pudo cargar la evaluación</Text>
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
          <Text style={styles.headerTitle}>{assessment.title}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.content, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
          
          {/* Instrucciones */}
          <View style={styles.instructionsCard}>
            <MaterialCommunityIcons name="information" size={24} color="#6C63FF" />
            <Text style={styles.instructionsText}>
              Evalúa a cada uno de tus compañeros de grupo del 1 al 5 según los criterios. No puedes autoevaluarte.
            </Text>
          </View>

          {/* Selección de compañero */}
          {!selectedMember ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Selecciona un compañero</Text>
              {groupMembers.map((member) => {
                const memberId = member._id || member.id || member.uid || '';
                const alreadyEvaluated = existingEvaluations.some(
                  evaluation => evaluation.evaluateeId === memberId
                );

                return (
                  <TouchableOpacity
                    key={memberId}
                    style={[
                      styles.memberCard,
                      alreadyEvaluated && styles.memberCardDisabled
                    ]}
                    onPress={() => handleSelectMember(member)}
                    disabled={alreadyEvaluated}
                  >
                    <View style={styles.memberInfo}>
                      <MaterialCommunityIcons
                        name="account-circle"
                        size={40}
                        color={alreadyEvaluated ? '#999999' : '#6C63FF'}
                      />
                      <View style={styles.memberDetails}>
                        <Text style={[
                          styles.memberName,
                          alreadyEvaluated && styles.memberNameDisabled
                        ]}>
                          {member.name || member.email}
                        </Text>
                        {alreadyEvaluated && (
                          <Text style={styles.evaluatedBadge}>✓ Ya evaluado</Text>
                        )}
                      </View>
                    </View>
                    {!alreadyEvaluated && (
                      <MaterialCommunityIcons name="chevron-right" size={24} color="#6C63FF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <>
              {/* Miembro seleccionado */}
              <View style={styles.card}>
                <View style={styles.selectedMemberHeader}>
                  <Text style={styles.sectionTitle}>Evaluando a:</Text>
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => setSelectedMember(null)}
                  >
                    <Text style={styles.changeButtonText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.selectedMemberInfo}>
                  <MaterialCommunityIcons name="account-circle" size={48} color="#6C63FF" />
                  <Text style={styles.selectedMemberName}>
                    {selectedMember.name || selectedMember.email}
                  </Text>
                </View>
              </View>

              {/* Criterios de evaluación */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Califica cada criterio (1 - 5)</Text>
                {CRITERIA.map((criterion) => (
                  <View key={criterion.key} style={styles.simpleRow}>
                    <Text style={styles.simpleLabel}>{criterion.name}:</Text>
                    <TextInput
                      style={styles.simpleInput}
                      keyboardType="number-pad"
                      placeholder="1-5"
                      value={ratings[criterion.key] > 0 ? ratings[criterion.key].toString() : ''}
                      onChangeText={(value: string) => handleRatingChange(criterion.key, value)}
                      maxLength={1}
                      placeholderTextColor="#999999"
                    />
                  </View>
                ))}
              </View>

              {/* Botón de enviar */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Enviar Evaluación</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
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
    backgroundColor: '#6C63FF',
    paddingTop: 48,
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
    paddingBottom: 20,
    flexGrow: 1,
  },
  content: {
    padding: 12,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    color: '#4C1D95',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  memberCardDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  memberNameDisabled: {
    color: '#999999',
  },
  evaluatedBadge: {
    fontSize: 12,
    color: '#27AE60',
    marginTop: 4,
  },
  selectedMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  changeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  selectedMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  selectedMemberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  criterionCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  criterionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  criterionDescription: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 12,
    marginLeft: 36,
  },
  inputContainer: {
    marginLeft: 36,
  },
  ratingInput: {
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    width: 100,
  },
  inputHint: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0BEC5',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  simpleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3436',
    flex: 1,
  },
  simpleInput: {
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    width: 60,
  },
});
