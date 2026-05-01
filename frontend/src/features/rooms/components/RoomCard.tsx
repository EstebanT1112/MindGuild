import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Users, Trophy, Copy } from 'lucide-react-native';
import { Clipboard } from 'react-native';

interface RoomCardProps {
  name: string;
  code: string;
  members: number;
  mode: string;
  rank: number;
  onPress: () => void;
}

export default function RoomCard({ name, code, members, mode, rank, onPress }: RoomCardProps) {
  
  // Función para copiar el código al portapapeles
  const copyToClipboard = async () => {
    await Clipboard.setString(code);
    Alert.alert("¡Copiado!", `El código ${code} se guardó en el portapapeles.`);
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        
        {/* Usamos e.stopPropagation() para que al copiar NO se dispare la navegación de la tarjeta */}
        <Pressable 
          style={styles.codeBadge} 
          onPress={(e) => {
            e.stopPropagation(); 
            copyToClipboard();
          }}
        >
          <Text style={styles.codeText}>{code}</Text>
          <Copy color="#22c55e" size={14} />
        </Pressable>
      </View>

      <View style={styles.footer}>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Users color="#94a3b8" size={16} />
            <Text style={styles.metaText}>{members}</Text>
          </View>
          <Text style={styles.metaText}>{mode}</Text>
        </View>
        
        <View style={styles.rankBadge}>
          <Trophy color="#22c55e" size={14} />
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#1e293b', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  header: { marginBottom: 15 },
  name: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  codeBadge: { 
    alignSelf: 'flex-start', 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#0f172a', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  codeText: { color: '#22c55e', fontWeight: 'bold', fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#94a3b8', fontSize: 14 },
  rankBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#14532d', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  rankText: { color: '#22c55e', fontWeight: 'bold' }
});