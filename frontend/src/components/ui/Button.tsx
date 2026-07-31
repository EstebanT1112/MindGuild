import { StyleSheet, View } from "react-native";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing } from "../../theme";

export function Button({ children }: any) {
  const colors = useThemeStore((s) => s.colors);
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
});
