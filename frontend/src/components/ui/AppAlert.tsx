import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AppAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const iconMap = {
  success: { icon: CheckCircle, color: '#22c55e' },
  error: { icon: XCircle, color: '#ef4444' },
  warning: { icon: AlertCircle, color: '#f59e0b' },
  info: { icon: Info, color: '#3b82f6' },
};

export default function AppAlert({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  showCancel = false,
}: AppAlertProps) {
  const colors = useThemeStore((state) => state.colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const IconComponent = iconMap[type].icon;
  const iconColor = iconMap[type].color;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Resetear animaciones al cerrar
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleClose = () => {
    // Animación de salida rápida antes de cerrar
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  // Colores dinámicos según el tipo
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return colors.accent;
      case 'error':
        return colors.danger;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      default:
        return colors.border;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.accentSoft;
      case 'error':
        return colors.dangerSoft;
      case 'warning':
        return colors.warningSoft;
      case 'info':
        return colors.infoSoft;
      default:
        return colors.surface;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return colors.accentStrong;
      case 'error':
        return colors.danger;
      case 'warning':
        return colors.warningStrong;
      case 'info':
        return colors.infoStrong;
      default:
        return colors.text;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: getBorderColor(),
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icono */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getBackgroundColor() },
            ]}
          >
            <IconComponent color={iconColor} size={32} />
          </View>

          {/* Botón de cerrar (X) */}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <X color={colors.textMuted} size={20} />
          </Pressable>

          {/* Contenido */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            {message}
          </Text>

          {/* Botones de acción */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <Pressable
                style={[
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={handleCancel}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>
                  {cancelText}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: iconColor },
              ]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: Math.min(SCREEN_WIDTH - 40, 400),
    borderRadius: 24,
    padding: 24,
    paddingTop: 16,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: -8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});