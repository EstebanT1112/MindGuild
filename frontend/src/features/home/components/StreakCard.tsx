import { View, Text, StyleSheet } from "react-native";
import { Flame, FlameKindling, Shield, Snowflake } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';

type StreakStatus = 'inactive' | 'pending' | 'active' | 'shielded';

interface StreakCardProps {
  currentStreak: number;
  active?: boolean;
  status?: StreakStatus;
  shieldUntil?: string | null;
  loading?: boolean;
}

const STATUS_CONFIG: Record<StreakStatus, {
  accentColor: string;
  softAccentColor: string;
  borderColor: string;
  statusText: string;
}> = {
  inactive: {
    accentColor: '#38bdf8',
    softAccentColor: '#7dd3fc',
    borderColor: '#38bdf833',
    statusText: 'Inactiva',
  },
  pending: {
    accentColor: '#94a3b8',
    softAccentColor: '#cbd5e1',
    borderColor: '#47556966',
    statusText: 'Pendiente',
  },
  active: {
    accentColor: '#fb923c',
    softAccentColor: '#fdba74',
    borderColor: '#fb923c33',
    statusText: 'Activa',
  },
  shielded: {
    accentColor: '#facc15',
    softAccentColor: '#fde68a',
    borderColor: '#facc153d',
    statusText: 'Protegida',
  },
};

export default function StreakCard({
  currentStreak,
  active,
  status,
  shieldUntil,
  loading = false,
}: StreakCardProps) {
  const colors = useThemeStore(state => state.colors);
  const resolvedStatus: StreakStatus = status ?? (active ? 'active' : currentStreak > 0 ? 'pending' : 'inactive');
  const config = STATUS_CONFIG[resolvedStatus];
  const shieldLabel = shieldUntil ? `Escudo hasta ${formatDateTime(shieldUntil)}` : 'Escudo activo';
  const StatusIcon = getStatusIcon(resolvedStatus);
  const iconSize = getStatusIconSize(resolvedStatus);

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: config.borderColor }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.icon}>
            <StatusIcon color={config.accentColor} size={iconSize} strokeWidth={1.45} />
          </View>

          <View>
            <Text style={[styles.days, { color: config.accentColor }]}>
              {loading ? '--' : currentStreak} dias
            </Text>
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
              {resolvedStatus === 'shielded' ? shieldLabel : 'Racha actual'}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={[styles.status, { color: config.softAccentColor }]}>
            {loading ? '...' : config.statusText}
          </Text>
        </View>
      </View>
    </View>
  );
}

function formatDateTime(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month} 23:59`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return value;
}

function getStatusIcon(status: StreakStatus) {
  switch (status) {
    case 'inactive': return Snowflake;
    case 'pending': return FlameKindling;
    case 'shielded': return Shield;
    case 'active':
    default: return Flame;
  }
}

function getStatusIconSize(status: StreakStatus) {
  switch (status) {
    case 'inactive': return 43;
    case 'pending': return 42;
    case 'shielded': return 42;
    case 'active':
    default: return 46;
  }
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    minHeight: 80,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  days: {
    fontSize: 22,
    fontWeight: "bold",
  },
  label: {
    fontSize: 12,
    maxWidth: 150,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: 'center',
    minWidth: 86,
  },
  status: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "bold",
    textAlign: 'right',
  },
});