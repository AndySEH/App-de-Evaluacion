import { FlatList, StyleSheet, View } from "react-native";
import { Card, FAB, IconButton, Paragraph, useTheme } from "react-native-paper";

const mockCourses = [
  { id: "1", title: "test", description: "testing course", students: 6 },
  { id: "2", title: "Matemáticas 1", description: "Álgebra básica", students: 12 },
];

export default function TeacherCoursesScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <FlatList
        data={mockCourses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => { /* could navigate to course details */ }}>
            <Card.Title
              title={item.title}
              subtitle={item.description}
              right={() => (
                <View style={styles.rightWrap}>
                  <Paragraph style={styles.students}>{item.students} alumnos</Paragraph>
                  <IconButton icon="chevron-right" onPress={() => { /* navigate */ }} />
                </View>
              )}
            />
          </Card>
        )}
        contentContainerStyle={{ padding: 16 }}
      />

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('AddProductScreen')}
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
