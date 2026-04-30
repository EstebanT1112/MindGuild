# DESIGN SYSTEM SPEC – React Native

## 1. OBJECTIVE

Define a centralized design system for consistent UI across the app.

All styles must use these tokens.
Do not hardcode values in components.

---

## 2. FILE LOCATION

```bash
src/theme/design-system.ts
```

---

## 3. IMPLEMENTATION

```ts
export const colors = {
  background: "#1a1d29",
  surface: "#222533",
  surfaceAlt: "#2a2d3d",

  primary: "#22c55e",
  primaryLight: "#4ade80",
  primaryDark: "#16a34a",

  secondary: "#3b82f6",
  accent: "#facc15",

  text: "#ffffff",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",

  border: "#2e3245",
  danger: "#ef4444",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
};
```

---

## 4. USAGE RULES

* Never hardcode colors
* Never hardcode spacing
* Always import from design-system
* Maintain consistency across all features

---

## 5. USAGE EXAMPLE

```ts
import { StyleSheet } from "react-native";
import { colors, spacing, radius } from "../../theme/design-system";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
```

---

## 6. EXTENSION (OPTIONAL)

This system can be extended with:

* shadows
* gradients
* theme provider
* light/dark mode

---

## 7. IMPORTANT NOTE

This file is the single source of truth for UI styling.

All generated code must follow this system.
