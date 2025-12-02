import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { useCourses } from "@/src/features/courses/presentation/context/courseContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "react-native-paper";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

export default function AddCourseScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { addCourse } = useCourses();
  
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getUserId = () => {
    return user?.uid || user?.id || user?._id || '';
  };

  const generateRegistrationCode = () => {
    // Genera un número aleatorio entre 100000 y 999999
    return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  };

  const handleCreateCourse = async () => {
    // Validaciones
    if (!courseName.trim()) {
      setError('El nombre del curso es obligatorio');
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setError('No se pudo obtener el ID del usuario');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const registrationCode = generateRegistrationCode();
      console.log('Código de registro generado:', registrationCode);
      
      await addCourse({
        name: courseName.trim(),
        description: courseDescription.trim() || undefined,
        teacherId: userId,
        registrationCode: registrationCode.toString(),
        studentIds: [],
        invitations: [],
      }, userId);

      console.log('Curso creado exitosamente');
      
      // Navegar de regreso
      navigation.goBack();
    } catch (err: any) {
      console.error('Error al crear curso:', err);
      setError(err.message || 'Error al crear el curso');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Crear Curso</Text>
              <Text style={styles.headerSubtitle}>Completa la información del nuevo curso</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Formulario */}
          <View style={styles.formCard}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#5C6BC0" />
            </View>

            {/* Campo de nombre */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Nombre del curso <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                value={courseName}
                onChangeText={(text) => {
                  setCourseName(text);
                  setError('');
                }}
                placeholder="Ej: Programación Orientada a Objetos"
                mode="flat"
                style={styles.input}
                underlineStyle={{ display: 'none' }}
                contentStyle={styles.inputContent}
                textColor="#000000"
                placeholderTextColor="#999999"
                disabled={isLoading}
                maxLength={100}
              />
              <Text style={styles.helperText}>
                {courseName.length}/100 caracteres
              </Text>
            </View>

            {/* Campo de descripción */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                value={courseDescription}
                onChangeText={setCourseDescription}
                placeholder="Describe de qué trata el curso (opcional)"
                mode="flat"
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
                underlineStyle={{ display: 'none' }}
                contentStyle={styles.inputContent}
                textColor="#000000"
                placeholderTextColor="#999999"
                disabled={isLoading}
                maxLength={500}
              />
              <Text style={styles.helperText}>
                {courseDescription.length}/500 caracteres
              </Text>
            </View>

            {/* Mensaje de error */}
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Información adicional */}
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#5C6BC0" />
              <Text style={styles.infoText}>
                Después de crear el curso, podrás agregar estudiantes y crear actividades.
              </Text>
            </View>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, isLoading && styles.createButtonDisabled]}
              onPress={handleCreateCourse}
              disabled={isLoading}
            >
              <MaterialCommunityIcons 
                name={isLoading ? "loading" : "plus-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.createButtonText}>
                {isLoading ? 'Creando...' : 'Crear Curso'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  headerWrapper: {
    width: '100%',
    backgroundColor: '#5C6BC0',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: '#5C6BC0',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8EAF6',
  },
  scrollContent: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#F0F0F5',
    borderRadius: 12,
  },
  textArea: {
    minHeight: 100,
  },
  inputContent: {
    backgroundColor: '#F0F0F5',
    paddingHorizontal: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E8EAF6',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#5C6BC0',
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#B8C1E8',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
