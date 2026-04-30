# FRONTEND SPEC – REACT NATIVE (EXPO)

## 1. OBJECTIVE

Convert Figma (exported as React Web) into a mobile frontend using:

* React Native
* Expo
* Feature-based architecture

The output must be production-ready, scalable, and modular.

---

## 2. HARD CONSTRAINTS

This is NOT a web project.

DO NOT use:

* div, span, input, button
* className
* CSS files
* Tailwind (web version)
* react-router
* Radix UI / shadcn

ALWAYS use:

* View, Text, Pressable, TextInput
* StyleSheet or NativeWind
* React Navigation
* Expo-compatible libraries

---

## 3. PROJECT STRUCTURE

```bash
src/
 ├── features/
 │    ├── auth/
 │    ├── rooms/
 │    ├── study/
 │    ├── village/
 │    ├── profile/
 │    └── friends/
 │
 ├── components/
 │    └── ui/
 │
 ├── navigation/
 ├── hooks/
 ├── services/
 ├── store/
 └── utils/
```

---

## 4. FEATURE STRUCTURE

Each feature must be self-contained.

Example:

```bash
features/friends/
 ├── screens/
 │    └── FriendsScreen.tsx
 ├── components/
 │    ├── FriendCard.tsx
 │    ├── RequestCard.tsx
 │    └── AddFriendModal.tsx
 ├── hooks/
 └── services/
```

---

## 5. FIGMA → REACT NATIVE MAPPING

| Figma (Web)   | React Native       |
| ------------- | ------------------ |
| pages/*.tsx   | features/*/screens |
| components/ui | components/ui      |
| div           | View               |
| button        | Pressable          |
| input         | TextInput          |
| modal         | Modal              |
| flex / gap    | Flexbox (RN)       |

---

## 6. UI SYSTEM

### General Style

* Dark theme
* Rounded cards (16–24 radius)
* Soft gradients (green, blue, yellow)
* Clean, modern, mobile-first

---

### Layout Pattern (ALL screens)

```tsx
<SafeAreaView>
  <View style={styles.container}>
    {/* Header */}
    {/* Content */}
    {/* Floating Action Button (optional) */}
    {/* Bottom Navigation */}
  </View>
</SafeAreaView>
```

---

## 7. CORE COMPONENTS

### Cards

* Dark background
* Rounded corners
* Internal padding
* Subtle borders or shadows

### Buttons

* Primary: green
* Secondary: dark gray
* Must support:

  * pressed state
  * disabled state

### Avatars

* Circular
* Initial letter
* Optional status indicator (online/offline)

### Badges

* Level (green)
* Streak (orange)
* Stats (yellow)

---

## 8. NAVIGATION

Use React Navigation.

Structure:

* Bottom Tabs (main navigation)
* Stack per feature

Main tabs:

* Home
* Rooms
* Ranking
* Friends
* Profile

---

## 9. STATE MANAGEMENT

* Local: useState
* Global: Zustand

---

## 10. LOGIC EXAMPLE (FRIENDS FEATURE)

State:

* friends list
* pending requests
* modal visibility
* search input

---

## 11. CODE GENERATION RULES

When generating code:

1. Do not create a single large file
2. Split into screens + components
3. Reuse components when possible
4. Keep naming consistent
5. Avoid duplicated logic
6. Code must run in Expo without modification

---

## 12. ALLOWED LIBRARIES

* @react-navigation/native
* @react-navigation/bottom-tabs
* react-native-safe-area-context
* expo/vector-icons
* zustand

---

## 13. FINAL GOAL

* Clean architecture
* Modular features
* Mobile-first UI
* Scalable codebase
* Maintainable long-term

---

## 14. IMPORTANT NOTE

Figma export is only a visual reference.

Do not replicate web structure.
Adapt it properly to React Native.
