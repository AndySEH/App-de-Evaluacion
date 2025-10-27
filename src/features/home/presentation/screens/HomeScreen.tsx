import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Card, Paragraph, Title, useTheme } from "react-native-paper";

export default function HomeScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerWrap}>
        <Title style={styles.title}>Student Eval</Title>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("TeacherCourses")}>
        <Card style={styles.card} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <Avatar.Icon size={40} icon="book" style={{ backgroundColor: theme.colors.secondary }} />
            <View style={{ marginLeft: 12 }}>
              <Title style={styles.cardTitle}>Módulo de profesores</Title>
              <Paragraph style={styles.cardSubtitle}>Ver mis cursos</Paragraph>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <Avatar.Icon size={40} icon="file-chart" style={{ backgroundColor: theme.colors.surface }} />
          <View style={{ marginLeft: 12 }}>
            <Title style={styles.cardTitle}>Reporte de cursos</Title>
            <Paragraph style={styles.cardSubtitle}>Ver reportes y estadísticas</Paragraph>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.cardContent}>
          <Avatar.Icon size={40} icon="account-group" style={{ backgroundColor: theme.colors.surface }} />
          <View style={{ marginLeft: 12 }}>
            <Title style={styles.cardTitle}>Módulo de estudiantes</Title>
            <Paragraph style={styles.cardSubtitle}>Mis cursos / Mis actividades</Paragraph>
          </View>
        </Card.Content>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerWrap: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "gray",
  },
});
