import { AuthRemoteDataSourceImpl } from "@/src/features/auth/data/datasources/AuthRemoteDataSourceImp";
import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { CourseRemoteDataSourceImp } from "@/src/features/courses/data/datasources/CourseRemoteDataSourceImp";
import { CourseRepositoryImpl } from "@/src/features/courses/data/repositories/CourseRepositoryImpl";
import { Course } from "@/src/features/courses/domain/entities/Course";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Card, FAB, IconButton, Paragraph, Text, useTheme } from "react-native-paper";

export default function TeacherCoursesScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // Determine effective user: prefer context user, fallback to stored auth info
      let effectiveUser = user;
      if (!effectiveUser || !effectiveUser.email) {
        console.log('[TeacherCoursesScreen] useAuth.user is empty, attempting to read stored auth info');
        try {
          const authRemoteForFallback = new AuthRemoteDataSourceImpl();
          const stored = await authRemoteForFallback.getStoredAuthInfo();
          console.log('[TeacherCoursesScreen] Stored auth info read', { hasUser: !!stored.user, token: !!stored.token });
          if (stored.user) effectiveUser = stored.user;
        } catch (e) {
          console.warn('[TeacherCoursesScreen] Failed to read stored auth info', e);
        }
      }

      if (!effectiveUser || !effectiveUser.email) {
        console.log('[TeacherCoursesScreen] No user available after fallback, skipping courses fetch', { user: effectiveUser });
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const authRemote = new AuthRemoteDataSourceImpl();
        const courseRemote = new CourseRemoteDataSourceImp(authRemote);
        const repo = new CourseRepositoryImpl(courseRemote);

  // Prefer UID when available (backend uses UID as teacher identifier). Fall back to common id fields or email.
  const teacherId = effectiveUser.uid ?? effectiveUser.id ?? effectiveUser._id ?? effectiveUser.email;

  // Log the filters and start (also indicate which field was used)
  const usedIdField = effectiveUser.uid ? 'uid' : effectiveUser.id ? 'id' : effectiveUser._id ? '_id' : 'email';
  console.log('[TeacherCoursesScreen] Fetching courses for teacher', { teacherId, usedIdField, table: 'CourseModel' });

        const start = Date.now();
        const list = await repo.getCoursesByTeacher(teacherId);
        const duration = Date.now() - start;

        // Log the response (count + preview)
        try {
          console.log('[TeacherCoursesScreen] Received courses', { count: list?.length ?? 0, durationMs: duration, sample: (list || []).slice(0,5) });
        } catch {}

        if (mounted) setCourses(list || []);
      } catch (e: any) {
        console.error("Error loading courses", e);
        if (mounted) setError(e.message || "Error cargando cursos");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <View style={styles.container}>
      {error ? <Text style={{ padding: 16, color: 'red' }}>{error}</Text> : null}

      <FlatList
        data={courses}
        keyExtractor={(item) => item._id ?? (item as any).id ?? (item as any).name ?? item.title}
        renderItem={({ item }) => {
          // support server shape: { name, description, studentIds: [] } and legacy shape { title, description, studentsCount }
          const title = (item as any).name ?? item.title ?? 'Sin título';
          const description = (item as any).description ?? item.description ?? '';
          const students = Array.isArray((item as any).studentIds) ? (item as any).studentIds.length : (item.studentsCount ?? 0);
          const courseId = item._id ?? (item as any).id ?? (item as any).registrationCode ?? title;

          return (
            <Card style={styles.card} onPress={() => navigation.navigate('CourseDetail', { id: courseId })}>
              <Card.Title
                title={title}
                subtitle={description}
                right={() => (
                  <View style={styles.rightWrap}>
                    <Paragraph style={styles.students}>{students} alumnos</Paragraph>
                    <IconButton icon="chevron-right" onPress={() => navigation.navigate('CourseDetail', { id: courseId })} />
                  </View>
                )}
              />
            </Card>
          );
        }}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={!loading ? <Text style={{ padding: 16, color: 'gray' }}>No hay cursos</Text> : null}
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('AddCourse')}
        label=""
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { marginBottom: 12, borderRadius: 12 },
  rightWrap: { flexDirection: 'row', alignItems: 'center' },
  students: { marginRight: 6, color: 'gray' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
