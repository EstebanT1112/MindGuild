import { StyleSheet, Text, View } from "react-native";
import { useThemeStore } from '../../../store/themeStore';

export default function StreakCard() {
  const colors = useThemeStore(state => state.colors);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: `${colors.warning}33` }]}>
      <View style={styles.row}>
        <View>
          <Text style={[styles.days, { color: colors.warning }]}>7 días</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Racha actual</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Mejor</Text>
          <Text style={[styles.best, { color: colors.warning }]}>12 días</Text>
        </View>
      </View>

      <View style={[styles.success, { backgroundColor: `${colors.accent}22` }]}>
        <Text style={{ color: colors.accent, fontSize: 12 }}>
          ✔ Racha completada hoy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  days: {
    fontSize: 24,
    fontWeight: "bold",
  },
  label: {
    fontSize: 12,
  },
  best: {
    fontWeight: "bold",
  },
  success: {
    marginTop: 10,
    padding: 6,
    borderRadius: 8,
  },
});
