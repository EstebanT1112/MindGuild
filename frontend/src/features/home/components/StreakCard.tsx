import { View, Text, StyleSheet } from "react-native";
import { Flame, Shield } from 'lucide-react-native';

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
    accentColor: '#64748b',
    softAccentColor: '#94a3b8',
    borderColor: '#334155',
    statusText: 'Inactiva',
  },
  pending: {
    accentColor: '#38bdf8',
    softAccentColor: '#7dd3fc',
    borderColor: '#38bdf833',
    statusText: 'Pendiente',
  },
  active: {
    accentColor: '#fb923c',
    softAccentColor: '#fdba74',
    borderColor: '#fb923c33',
    statusText: 'Activa',
  },
  shielded: {
    accentColor: '#fb923c',
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
  const resolvedStatus: StreakStatus = status ?? (active ? 'active' : currentStreak > 0 ? 'pending' : 'inactive');
  const config = STATUS_CONFIG[resolvedStatus];
  const shieldLabel = shieldUntil ? `Escudo hasta ${formatDateTime(shieldUntil)}` : 'Escudo activo';

  return (
    <View style={[styles.card, { borderColor: config.borderColor }]}>
      {resolvedStatus === 'shielded' && (
        <View style={styles.shieldBadge}>
          <Shield color="#facc15" size={15} strokeWidth={2.3} />
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.icon}>
            <Flame color={config.accentColor} size={46} strokeWidth={1.45} />
          </View>

          <View>
            <Text style={[styles.days, { color: config.accentColor }]}>
              {loading ? '--' : currentStreak} dias
            </Text>
            <Text style={styles.label}>{resolvedStatus === 'shielded' ? shieldLabel : 'Racha actual'}</Text>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1d29",
    padding: 16,
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
    color: "#fb923c",
  },
  label: {
    fontSize: 12,
    color: "#aaa",
  },
  right: {
    alignItems: "flex-end",
    paddingTop: 18,
  },
  status: {
    fontSize: 16,
    fontWeight: "bold",
  },
  shieldBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#422006',
    borderWidth: 1,
    borderColor: '#facc15',
  },
});
