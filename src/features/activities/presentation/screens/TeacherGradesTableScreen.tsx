import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { AuthUser } from "@/src/features/auth/domain/entities/AuthUser";
import { GetUsersByIdsUseCase } from "@/src/features/auth/domain/usecases/GetUsersByIdsUseCase";
import { GetGroupsByCategoryUseCase } from "@/src/features/courses/domain/usecases/GetGroupsByCategoryUseCase";
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
import { GetActivityByIdUseCase } from "../../domain/usecases/GetActivityByIdUseCase";
import { GetAssessmentByIdUseCase } from "../../domain/usecases/GetAssessmentByIdUseCase";
import { GetPeerEvaluationsByAssessmentUseCase } from "../../domain/usecases/GetPeerEvaluationsByAssessmentUseCase";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StudentScores {
  studentId: string;
  student: AuthUser;
  punctuality: number;
  contributions: number;
  commitment: number;
  attitude: number;
  evaluationsCount: number;
}

const CRITERIA = [
  { key: 'punctuality', label: 'Puntualidad', icon: 'clock-check-outline' },
  { key: 'contributions', label: 'Contribuciones', icon: 'account-group' },
  { key: 'commitment', label: 'Compromiso', icon: 'handshake' },
  { key: 'attitude', label: 'Actitud', icon: 'emoticon-happy-outline' },
];

export default function TeacherGradesTableScreen({ route, navigation }: { route: any; navigation: any }) {
  const { assessmentId, activityId } = route.params;
  const di = useDI();

  const getAssessmentByIdUC = di.resolve<GetAssessmentByIdUseCase>(TOKENS.GetAssessmentByIdUC);
  const getPeerEvaluationsByAssessmentUC = di.resolve<GetPeerEvaluationsByAssessmentUseCase>(TOKENS.GetPeerEvaluationsByAssessmentUC);
  const getUsersByIdsUC = di.resolve<GetUsersByIdsUseCase>(TOKENS.GetUsersByIdsUC);
  const getGroupsByCategoryUC = di.resolve<GetGroupsByCategoryUseCase>(TOKENS.GetGroupsByCategoryUC);
  const getActivityByIdUC = di.resolve<GetActivityByIdUseCase>(TOKENS.GetActivityByIdUC);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [studentScores, setStudentScores] = useState<StudentScores[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGradesTable();
  }, [assessmentId]);

  const loadGradesTable = async () => {
    try {
      setLoading(true);

      // Cargar assessment
      const assessmentData = await getAssessmentByIdUC.execute(assessmentId);
      if (!assessmentData) {
        console.error('[TeacherGradesTableScreen] Assessment not found');
        return;
      }
      setAssessment(assessmentData);

      // Cargar actividad para obtener categoryId
      const activity = await getActivityByIdUC.execute(activityId);
      if (!activity) {
        console.error('[TeacherGradesTableScreen] Activity not found');
        return;
      }

      // Cargar grupos de la categoría para obtener todos los estudiantes
      const groups = await getGroupsByCategoryUC.execute(activity.categoryId);
      const allStudentIds = new Set<string>();
      groups.forEach(group => {
        group.memberIds.forEach(id => allStudentIds.add(id));
      });

      // Cargar información de todos los estudiantes
      const students = await getUsersByIdsUC.execute(Array.from(allStudentIds));

      // Cargar todas las evaluaciones
      const evaluations = await getPeerEvaluationsByAssessmentUC.execute(assessmentId);

      // Calcular promedios por estudiante
      const scoresData: StudentScores[] = students.map(student => {
        const studentId = student._id || student.id || student.uid || '';
        
        // Obtener todas las evaluaciones recibidas por este estudiante
        const receivedEvaluations = evaluations.filter(
          evaluation => evaluation.evaluateeId === studentId
        );

        const count = receivedEvaluations.length;

        if (count === 0) {
          return {
            studentId,
            student,
            punctuality: 0,
            contributions: 0,
            commitment: 0,
            attitude: 0,
            evaluationsCount: 0,
          };
        }

        // Calcular promedios
        const avgPunctuality = receivedEvaluations.reduce((sum, e) => sum + e.punctuality, 0) / count;
        const avgContributions = receivedEvaluations.reduce((sum, e) => sum + e.contributions, 0) / count;
        const avgCommitment = receivedEvaluations.reduce((sum, e) => sum + e.commitment, 0) / count;
        const avgAttitude = receivedEvaluations.reduce((sum, e) => sum + e.attitude, 0) / count;

        return {
          studentId,
          student,
          punctuality: avgPunctuality,
          contributions: avgContributions,
          commitment: avgCommitment,
          attitude: avgAttitude,
          evaluationsCount: count,
        };
      });

      setStudentScores(scoresData);

    } catch (error) {
      console.error('[TeacherGradesTableScreen] Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number): string => {
    return score > 0 ? Math.round(score).toString() : '-';
  };

  const getScoreColor = (score: number): string => {
    if (score === 0) return '#999999';
    if (score >= 4) return '#27AE60';
    if (score >= 3) return '#F39C12';
    return '#E74C3C';
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Tabla de Calificaciones</Text>
            <Text style={styles.headerSubtitle}>{assessment.title}</Text>
          </View>
        </View>
      </View>

      {studentScores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="clipboard-alert" size={64} color="#B0BEC5" />
          <Text style={styles.emptyText}>No hay estudiantes en esta actividad</Text>
        </View>
      ) : (
        <ScrollView horizontal style={styles.horizontalScroll}>
          <View style={styles.tableWrapper}>
            {/* Header Row */}
            <View style={styles.tableRow}>
              <View style={[styles.cell, styles.headerCell, styles.criterionCell]}>
                <Text style={styles.headerText}>Criterio</Text>
              </View>
              {studentScores.map((studentScore) => (
                <View key={studentScore.studentId} style={[styles.cell, styles.headerCell, styles.studentCell]}>
                  <Text style={styles.headerText} numberOfLines={2}>
                    {studentScore.student.name || studentScore.student.email}
                  </Text>
                  <Text style={styles.evaluationsCountText}>
                    ({studentScore.evaluationsCount} eval.)
                  </Text>
                </View>
              ))}
            </View>

            {/* Criteria Rows */}
            {CRITERIA.map((criterion, rowIndex) => (
              <View key={criterion.key} style={[
                styles.tableRow,
                rowIndex % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
              ]}>
                <View style={[styles.cell, styles.criterionCell]}>
                  <MaterialCommunityIcons 
                    name={criterion.icon as any} 
                    size={20} 
                    color="#6C63FF" 
                  />
                  <Text style={styles.criterionText}>{criterion.label}</Text>
                </View>
                {studentScores.map((studentScore) => {
                  const score = studentScore[criterion.key as keyof Omit<StudentScores, 'studentId' | 'student' | 'evaluationsCount'>] as number;
                  return (
                    <View key={studentScore.studentId} style={[styles.cell, styles.studentCell]}>
                      <Text style={[
                        styles.scoreText,
                        { color: getScoreColor(score) }
                      ]}>
                        {formatScore(score)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  horizontalScroll: {
    flex: 1,
  },
  tableWrapper: {
    padding: 20,
    minWidth: SCREEN_WIDTH,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    backgroundColor: '#F8F9FA',
  },
  cell: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  headerCell: {
    backgroundColor: '#6C63FF',
    borderBottomWidth: 2,
    borderBottomColor: '#5B52D9',
  },
  criterionCell: {
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentCell: {
    width: 120,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  evaluationsCountText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  criterionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
