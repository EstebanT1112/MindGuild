import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GraduationCap, Users, Trophy, Target, Zap } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeStore } from '../../../store/themeStore';

const { width, height } = Dimensions.get('window');

const pages = [
  {
    icon: GraduationCap,
    title: 'Bienvenido a MindGuild',
    description:
      'Tu plataforma de estudio gamificada. Estudiá, competí y crecé con tu gremio.',
  },
  {
    icon: Users,
    title: 'Salas de Estudio',
    description:
      'Unite a salas survival o battle royale. Estudiá en sesiones cronometradas con evidencia y peer review.',
  },
  {
    icon: Trophy,
    title: 'Quizzes y Ranking',
    description:
      'Proponé preguntas, validá con tus compañeros y escalá en el ranking semanal.',
  },
  {
    icon: Target,
    title: 'Misiones y Logros',
    description:
      'Completá misiones diarias, desbloqueá medallas y ganá monedas para el store.',
  },
  {
    icon: Zap,
    title: '¡Empezá a estudiar!',
    description:
      'Creá tu primera sala o unite a una existente. ¡El conocimiento es poder!',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const colors = useThemeStore((s) => s.colors);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (currentPage + 1), animated: true });
    } else {
      AsyncStorage.setItem('mindguild_onboarding_complete', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    AsyncStorage.setItem('mindguild_onboarding_complete', 'true');
    onComplete();
  };

  const onScroll = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  const isLast = currentPage === pages.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {pages.map((page, index) => {
          const Icon = page.icon;
          return (
            <View key={index} style={[styles.page, { width }]}>
              <Icon size={64} color={colors.accent} strokeWidth={1.5} />
              <Text style={[styles.title, { color: colors.text }]}>{page.title}</Text>
              <Text style={[styles.description, { color: colors.textMuted }]}>
                {page.description}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentPage ? colors.accent : colors.border,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>{isLast ? '¡Empezar!' : 'Siguiente'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 32,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
