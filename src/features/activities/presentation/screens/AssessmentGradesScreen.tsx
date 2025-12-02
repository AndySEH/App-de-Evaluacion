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
import { PeerEvaluation } from "../../domain/entities/PeerEvaluation";
import { GetActivityByIdUseCase } from "../../domain/usecases/GetActivityByIdUseCase";
import { GetAssessmentByIdUseCase } from "../../domain/usecases/GetAssessmentByIdUseCase";
import { GetPeerEvaluationsByAssessmentUseCase } from "../../domain/usecases/GetPeerEvaluationsByAssessmentUseCase";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 1200;

interface StudentGrade {
  student: AuthUser;
  studentId: string;
  evaluationsReceived: PeerEvaluation[];
  averagePunctuality: number;
  averageContributions: number;
  averageCommitment: number;
  averageAttitude: number;
  overallAverage: number;
  evaluationsCount: number;
}

export default function AssessmentGradesScreen({ route, navigation }: { route: any; navigation: any }) {
  const { assessmentId, activityId } = route.params;
  const di = useDI();

  const getAssessmentByIdUC = di.resolve<GetAssessmentByIdUseCase>(TOKENS.GetAssessmentByIdUC);
  const getPeerEvaluationsByAssessmentUC = di.resolve<GetPeerEvaluationsByAssessmentUseCase>(TOKENS.GetPeerEvaluationsByAssessmentUC);
  const getUsersByIdsUC = di.resolve<GetUsersByIdsUseCase>(TOKENS.GetUsersByIdsUC);
  const getGroupsByCategoryUC = di.resolve<GetGroupsByCategoryUseCase>(TOKENS.GetGroupsByCategoryUC);
  const getActivityByIdUC = di.resolve<GetActivityByIdUseCase>(TOKENS.GetActivityByIdUC);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
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
        console.error('[AssessmentGradesScreen] Assessment not found');
        return;
      }
      setAssessment(assessmentData);

      // Cargar todas las evaluaciones
      const evaluations = await getPeerEvaluationsByAssessmentUC.execute(assessmentId);
      console.log('[AssessmentGradesScreen] Loaded evaluations:', evaluations.length, 'for assessmentId:', assessmentId);
      console.log('[AssessmentGradesScreen] All evaluations:', JSON.stringify(evaluations, null, 2));

      // Cargar actividad para obtener categoryId
      const activity = await getActivityByIdUC.execute(activityId);
      if (!activity) {
        console.error('[AssessmentGradesScreen] Activity not found');
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

      // Calcular calificaciones por estudiante
      const gradesData: StudentGrade[] = students.map(student => {
        const studentId = student.id || student.userId;
        
        // Obtener todas las evaluaciones recibidas por este estudiante
        const receivedEvaluations = evaluations.filter(
          evaluation => evaluation.evaluateeId === studentId
        );
        console.log('[AssessmentGradesScreen] Student:', student.name, 'studentId:', studentId, 'evaluations received:', receivedEvaluations.length);

        const count = receivedEvaluations.length;

        if (count === 0) {
          return {
            student,
            studentId,
            evaluationsReceived: [],
            averagePunctuality: 0,
            averageContributions: 0,
            averageCommitment: 0,
            averageAttitude: 0,
            overallAverage: 0,
            evaluationsCount: 0,
          };
        }

        // Calcular promedios
        const avgPunctuality = receivedEvaluations.reduce((sum, e) => sum + e.punctuality, 0) / count;
        const avgContributions = receivedEvaluations.reduce((sum, e) => sum + e.contributions, 0) / count;
        const avgCommitment = receivedEvaluations.reduce((sum, e) => sum + e.commitment, 0) / count;
        const avgAttitude = receivedEvaluations.reduce((sum, e) => sum + e.attitude, 0) / count;
        const overall = (avgPunctuality + avgContributions + avgCommitment + avgAttitude) / 4;

        return {
          student,
          studentId,
          evaluationsReceived: receivedEvaluations,
          averagePunctuality: avgPunctuality,
          averageContributions: avgContributions,
          averageCommitment: avgCommitment,
          averageAttitude: avgAttitude,
          overallAverage: overall,
          evaluationsCount: count,
        };
      });

      // Ordenar por promedio general (descendente)
      gradesData.sort((a, b) => b.overallAverage - a.overallAverage);

      setStudentGrades(gradesData);

    } catch (error) {
      console.error('[AssessmentGradesScreen] Error loading grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandStudent = (studentId: string) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  const formatScore = (score: number): string => {
    return score > 0 ? Math.round(score).toString() : 'N/A';
  };

  const getScoreColor = (score: number): string => {
    if (score === 0) return '#999999';
    if (score >= 4.5) return '#27AE60';
    if (score >= 3.5) return '#F39C12';
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
        <View style={[styles.header, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calificaciones - {assessment.title}</Text>
        </View>
      </View>

      <ScrollView horizontal style={styles.scrollView}>
        <ScrollView style={styles.verticalScrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            
            {/* Assessment Info */}
            <View style={styles.infoCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="account-group" size={20} color="#6C63FF" />
                  <Text style={styles.statValue}>{studentGrades.length}</Text>
                  <Text style={styles.statLabel}>Estudiantes</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="clipboard-check" size={20} color="#6C63FF" />
                  <Text style={styles.statValue}>
                    {studentGrades.filter(g => g.evaluationsCount > 0).length}
                  </Text>
                  <Text style={styles.statLabel}>Evaluados</Text>
                </View>
              </View>
            </View>

            {/* Tabla de calificaciones */}
            {studentGrades.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="clipboard-alert" size={64} color="#B0BEC5" />
                <Text style={styles.emptyText}>No hay calificaciones disponibles</Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <View style={[styles.tableCell, styles.nameCellHeader]}>
                    <Text style={styles.tableHeaderText}>Estudiante</Text>
                  </View>
                  <View style={[styles.tableCell, styles.scoreCellHeader]}>
                    <Text style={styles.tableHeaderText}>Puntualidad</Text>
                  </View>
                  <View style={[styles.tableCell, styles.scoreCellHeader]}>
                    <Text style={styles.tableHeaderText}>Contribuciones</Text>
                  </View>
                  <View style={[styles.tableCell, styles.scoreCellHeader]}>
                    <Text style={styles.tableHeaderText}>Compromiso</Text>
                  </View>
                  <View style={[styles.tableCell, styles.scoreCellHeader]}>
                    <Text style={styles.tableHeaderText}>Actitud</Text>
                  </View>
                  <View style={[styles.tableCell, styles.scoreCellHeader]}>
                    <Text style={styles.tableHeaderText}>Promedio</Text>
                  </View>
                  <View style={[styles.tableCell, styles.countCellHeader]}>
                    <Text style={styles.tableHeaderText}>Evaluaciones</Text>
                  </View>
                </View>

                {/* Table Rows */}
                {studentGrades.map((grade, index) => (
                  <View 
                    key={grade.studentId} 
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                    ]}
                  >
                    <View style={[styles.tableCell, styles.nameCell]}>
                      <Text style={styles.tableCellText} numberOfLines={2}>
                        {grade.student.name || grade.student.email}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.scoreCell]}>
                      <Text style={[styles.tableCellText, { color: getScoreColor(grade.averagePunctuality) }]}>
                        {formatScore(grade.averagePunctuality)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.scoreCell]}>
                      <Text style={[styles.tableCellText, { color: getScoreColor(grade.averageContributions) }]}>
                        {formatScore(grade.averageContributions)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.scoreCell]}>
                      <Text style={[styles.tableCellText, { color: getScoreColor(grade.averageCommitment) }]}>
                        {formatScore(grade.averageCommitment)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.scoreCell]}>
                      <Text style={[styles.tableCellText, { color: getScoreColor(grade.averageAttitude) }]}>
                        {formatScore(grade.averageAttitude)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.scoreCell]}>
                      <Text style={[styles.tableCellText, styles.averageText, { color: getScoreColor(grade.overallAverage) }]}>
                        {formatScore(grade.overallAverage)}
                      </Text>
                    </View>
                    <View style={[styles.tableCell, styles.countCell]}>
                      <Text style={styles.tableCellText}>
                        {grade.evaluationsCount}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  verticalScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    minWidth: 900,
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
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    backgroundColor: '#F8F9FA',
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  nameCellHeader: {
    width: 200,
  },
  nameCell: {
    width: 200,
  },
  scoreCellHeader: {
    width: 120,
    alignItems: 'center',
  },
  scoreCell: {
    width: 120,
    alignItems: 'center',
  },
  countCellHeader: {
    width: 100,
    alignItems: 'center',
  },
  countCell: {
    width: 100,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#2D3436',
  },
  averageText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
