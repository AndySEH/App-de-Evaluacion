import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";

interface MenuCardProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

export default function HomeScreen({ navigation }: { navigation: any }) {
  const theme = useTheme();

  const MenuCard = ({ title, subtitle, icon, onPress }: MenuCardProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.cardWrapper}>
      <Card style={styles.menuCard} mode="elevated">
        <Card.Content style={styles.menuCardContent}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={styles.menuTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.menuSubtitle} numberOfLines={2}>{subtitle}</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Student Eval</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Módulo de profesores</Text>
        <View style={styles.grid}>
          <MenuCard
            icon="📚"
            title="Ver mis cursos"
            subtitle="Administrar y crear cursos"
            onPress={() => navigation.navigate("TeacherCourses")}
          />
          <MenuCard
            icon="📊"
            title="Reporte de cursos"
            subtitle="Ver reportes y estadísticas"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Módulo de estudiantes</Text>
        <View style={styles.grid}>
          <MenuCard
            icon="📖"
            title="Mis cursos"
            subtitle="Ver cursos donde está inscrito"
            onPress={() => {}}
          />
          <MenuCard
            icon="📝"
            title="Mis actividades"
            subtitle="Ver tareas y actividades"
            onPress={() => {}}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 32,
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 16,
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  menuCard: {
    elevation: 2,
    borderRadius: 16,
    backgroundColor: '#fff',
    minHeight: 140,
  },
  menuCardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  textBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
