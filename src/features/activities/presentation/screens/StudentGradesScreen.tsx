import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "react-native-paper";
import { Assessment } from "../../domain/entities/Assessment";
import { GetAssessmentByIdUseCase } from "../../domain/usecases/GetAssessmentByIdUseCase";
import { GetPeerEvaluationsByAssessmentUseCase } from "../../domain/usecases/GetPeerEvaluationsByAssessmentUseCase";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

interface StudentScore {
  averagePunctuality: number;
  averageContributions: number;
  averageCommitment: number;
  averageAttitude: number;
  overallAverage: number;
  evaluationsCount: number;
}

export default function StudentGradesScreen({ route, navigation }: { route: any; navigation: any }) {
  const { assessmentId } = route.params;
  const { user } = useAuth();
  const di = useDI();

  const getAssessmentByIdUC = di.resolve<GetAssessmentByIdUseCase>(TOKENS.GetAssessmentByIdUC);
  const getPeerEvaluationsByAssessmentUC = di.resolve<GetPeerEvaluationsByAssessmentUseCase>(TOKENS.GetPeerEvaluationsByAssessmentUC);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [scores, setScores] = useState<StudentScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, [assessmentId]);

  const loadGrades = async () => {
    try {
      setLoading(true);

      // Cargar assessment
      const assessmentData = await getAssessmentByIdUC.execute(assessmentId);
      if (!assessmentData) {
        console.error('[StudentGradesScreen] Assessment not found');
        return;
      }
      setAssessment(assessmentData);

      // Verificar si las notas son visibles
      if (!assessmentData.gradesVisible) {
        console.log('[StudentGradesScreen] Grades not visible yet');
        return;
      }

      // Cargar evaluaciones
      const evaluations = await getPeerEvaluationsByAssessmentUC.execute(assessmentId);
      console.log('[StudentGradesScreen] Loaded evaluations:', evaluations.length, 'for assessmentId:', assessmentId);

      // Filtrar evaluaciones recibidas por el usuario actual
      const userId = user?._id || user?.id || user?.uid || '';
      const receivedEvaluations = evaluations.filter(
        evaluation => evaluation.evaluateeId === userId
      );
      console.log('[StudentGradesScreen] Evaluations received by userId:', userId, 'count:', receivedEvaluations.length);

      if (receivedEvaluations.length === 0) {
        setScores({
          averagePunctuality: 0,
          averageContributions: 0,
          averageCommitment: 0,
          averageAttitude: 0,
          overallAverage: 0,
          evaluationsCount: 0,
        });
        return;
      }

      // Calcular promedios
      const count = receivedEvaluations.length;
      const avgPunctuality = receivedEvaluations.reduce((sum, e) => sum + e.punctuality, 0) / count;
      const avgContributions = receivedEvaluations.reduce((sum, e) => sum + e.contributions, 0) / count;
      const avgCommitment = receivedEvaluations.reduce((sum, e) => sum + e.commitment, 0) / count;
      const avgAttitude = receivedEvaluations.reduce((sum, e) => sum + e.attitude, 0) / count;
      const overall = (avgPunctuality + avgContributions + avgCommitment + avgAttitude) / 4;

      setScores({
        averagePunctuality: avgPunctuality,
        averageContributions: avgContributions,
        averageCommitment: avgCommitment,
        averageAttitude: avgAttitude,
        overallAverage: overall,
        evaluationsCount: count,
      });

    } catch (error) {
      console.error('[StudentGradesScreen] Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number): string => {
    return score > 0 ? score.toFixed(2) : 'N/A';
  };

  const getScoreColor = (score: number): string => {
    if (score === 0) return '#999999';
    if (score >= 4.5) return '#27AE60';
    if (score >= 3.5) return '#F39C12';
    return '#E74C3C';
  };

  const getScoreLabel = (score: number): string => {
    if (score === 0) return 'Sin calificar';
    if (score >= 4.5) return 'Excelente';
    if (score >= 3.5) return 'Bueno';
    if (score >= 2.5) return 'Regular';
    return 'Necesita mejorar';
  };

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <MaterialCommunityIcons key={`full-${i}`} name="star" size={24} color="#FFD700" />
        ))}
        {hasHalfStar && (
          <MaterialCommunityIcons name="star-half-full" size={24} color="#FFD700" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <MaterialCommunityIcons key={`empty-${i}`} name="star-outline" size={24} color="#D1D5DB" />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando calificaciones...</Text>
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

  if (!assessment.gradesVisible) {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <View style={[styles.header, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mis Calificaciones</Text>
          </View>
        </View>
        <View style={styles.notVisibleContainer}>
          <MaterialCommunityIcons name="eye-off" size={64} color="#B0BEC5" />
          <Text style={styles.notVisibleText}>Las calificaciones aún no están disponibles</Text>
          <Text style={styles.notVisibleSubtext}>
            El profesor publicará las calificaciones cuando estén listas
          </Text>
        </View>
      </View>
    );
  }

  if (!scores || scores.evaluationsCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <View style={[styles.header, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mis Calificaciones</Text>
          </View>
        </View>
        <View style={styles.notVisibleContainer}>
          <MaterialCommunityIcons name="clipboard-alert" size={64} color="#B0BEC5" />
          <Text style={styles.notVisibleText}>No has sido evaluado aún</Text>
          <Text style={styles.notVisibleSubtext}>
            Tus compañeros aún no han completado las evaluaciones
          </Text>
        </View>
      </View>
    );
  }

  const overallColor = getScoreColor(scores.overallAverage);
  const overallLabel = getScoreLabel(scores.overallAverage);

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
          <Text style={styles.headerTitle}>Mis Calificaciones</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.content, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
          
          {/* Assessment Title */}
          <View style={styles.titleCard}>
            <Text style={styles.assessmentTitle}>{assessment.title}</Text>
            <Text style={styles.evaluationsCount}>
              Basado en {scores.evaluationsCount} evaluación{scores.evaluationsCount !== 1 ? 'es' : ''}
            </Text>
          </View>

          {/* Overall Score Card */}
          <View style={styles.overallCard}>
            <Text style={styles.overallLabel}>Calificación General</Text>
            <Text style={[styles.overallScore, { color: overallColor }]}>
              {formatScore(scores.overallAverage)}
            </Text>
            {renderStars(scores.overallAverage)}
            <Text style={[styles.overallBadge, { color: overallColor }]}>
              {overallLabel}
            </Text>
          </View>

          {/* Criteria Breakdown */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Desglose por Criterio</Text>
            
            <View style={styles.criterionRow}>
              <View style={styles.criterionHeader}>
                <MaterialCommunityIcons name="clock-check-outline" size={24} color="#6C63FF" />
                <View style={styles.criterionInfo}>
                  <Text style={styles.criterionName}>Puntualidad</Text>
                  <Text style={styles.criterionDescription}>
                    Cumplimiento de horarios y entregas
                  </Text>
                </View>
              </View>
              <Text style={[styles.criterionScore, { color: getScoreColor(scores.averagePunctuality) }]}>
                {formatScore(scores.averagePunctuality)}
              </Text>
            </View>

            <View style={styles.criterionRow}>
              <View style={styles.criterionHeader}>
                <MaterialCommunityIcons name="account-group" size={24} color="#6C63FF" />
                <View style={styles.criterionInfo}>
                  <Text style={styles.criterionName}>Contribuciones</Text>
                  <Text style={styles.criterionDescription}>
                    Aportes significativos al equipo
                  </Text>
                </View>
              </View>
              <Text style={[styles.criterionScore, { color: getScoreColor(scores.averageContributions) }]}>
                {formatScore(scores.averageContributions)}
              </Text>
            </View>

            <View style={styles.criterionRow}>
              <View style={styles.criterionHeader}>
                <MaterialCommunityIcons name="handshake" size={24} color="#6C63FF" />
                <View style={styles.criterionInfo}>
                  <Text style={styles.criterionName}>Compromiso</Text>
                  <Text style={styles.criterionDescription}>
                    Dedicación y responsabilidad
                  </Text>
                </View>
              </View>
              <Text style={[styles.criterionScore, { color: getScoreColor(scores.averageCommitment) }]}>
                {formatScore(scores.averageCommitment)}
              </Text>
            </View>

            <View style={styles.criterionRow}>
              <View style={styles.criterionHeader}>
                <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color="#6C63FF" />
                <View style={styles.criterionInfo}>
                  <Text style={styles.criterionName}>Actitud</Text>
                  <Text style={styles.criterionDescription}>
                    Disposición positiva y colaborativa
                  </Text>
                </View>
              </View>
              <Text style={[styles.criterionScore, { color: getScoreColor(scores.averageAttitude) }]}>
                {formatScore(scores.averageAttitude)}
              </Text>
            </View>
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <MaterialCommunityIcons name="information" size={20} color="#6C63FF" />
            <Text style={styles.infoText}>
              Estas calificaciones representan el promedio de las evaluaciones realizadas por tus compañeros de grupo.
            </Text>
          </View>
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
  notVisibleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notVisibleText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#636E72',
    textAlign: 'center',
  },
  notVisibleSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#B0BEC5',
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
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  titleCard: {
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
  assessmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  evaluationsCount: {
    fontSize: 14,
    color: '#636E72',
  },
  overallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overallLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  overallScore: {
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  overallBadge: {
    fontSize: 18,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 20,
  },
  criterionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  criterionInfo: {
    flex: 1,
  },
  criterionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 2,
  },
  criterionDescription: {
    fontSize: 12,
    color: '#636E72',
  },
  criterionScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4C1D95',
    lineHeight: 20,
  },
});
