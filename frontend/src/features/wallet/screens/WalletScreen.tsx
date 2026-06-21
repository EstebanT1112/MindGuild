import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brain, CheckCircle2, ShoppingBag } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import { useAppDataStore } from '../../../store/appDataStore';
import { fetchMyWallet, type StoreItem } from '../services/walletService';

export default function WalletScreen() {
  const accessToken = useAuthStore(state => state.access_token);
  const profile = useAppDataStore(state => state.profile.data);
  const loadProfile = useAppDataStore(state => state.loadProfile);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [coinsBalance, setCoinsBalance] = useState(profile?.coins_balance ?? 0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWallet();
  }, [accessToken]);

  const loadWallet = async (forceProfile = false) => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const [wallet] = await Promise.all([
        fetchMyWallet(accessToken),
        loadProfile(accessToken, { force: forceProfile }),
      ]);
      setCoinsBalance(wallet.coins_balance);
      setItems(wallet.store_items);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadWallet(true);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScreenLayout title="WALLET" type="profiles" icon={<Brain color="#facc15" size={22} />}>
      {loading && !refreshing ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#facc15" />
          <Text style={styles.loadingText}>Cargando wallet...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#facc15"
              colors={['#facc15']}
            />
          }
        >
          <View style={styles.balanceCard}>
            <View style={styles.coinIcon}>
              <Brain color="#0f172a" size={34} strokeWidth={2.3} />
            </View>
            <View>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <Text style={styles.balanceValue}>{coinsBalance}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <ShoppingBag color="#22c55e" size={20} />
            <Text style={styles.sectionTitle}>Tienda</Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Todavia no hay objetos disponibles.</Text>
              <Text style={styles.emptyText}>Cuando carguen la tienda, los cosmeticos van a aparecer aca.</Text>
            </View>
          ) : (
            items.map(item => {
              const canAfford = coinsBalance >= item.price;
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemIcon}>
                    {item.owned ? (
                      <CheckCircle2 color="#22c55e" size={24} />
                    ) : (
                      <ShoppingBag color="#94a3b8" size={24} />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                    {!!item.category && <Text style={styles.itemCategory}>{item.category}</Text>}
                  </View>
                  <Pressable
                    style={[
                      styles.buyBtn,
                      item.owned && styles.ownedBtn,
                      !item.owned && !canAfford && styles.disabledBtn,
                    ]}
                    disabled
                  >
                    <Text style={styles.buyText}>{item.owned ? 'Comprado' : `${item.price}`}</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 80 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#94a3b8', fontWeight: 'bold' },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#facc15',
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
  },
  coinIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fde68a' },
  balanceLabel: { color: '#713f12', fontSize: 13, fontWeight: '900' },
  balanceValue: { color: '#0f172a', fontSize: 34, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  emptyState: { backgroundColor: '#1e293b', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155' },
  emptyTitle: { color: 'white', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 6 },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  itemIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  itemInfo: { flex: 1 },
  itemName: { color: 'white', fontSize: 15, fontWeight: '900' },
  itemDescription: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  itemCategory: { color: '#22c55e', fontSize: 11, fontWeight: '800', marginTop: 4 },
  buyBtn: { minWidth: 82, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#facc15' },
  ownedBtn: { backgroundColor: '#14532d' },
  disabledBtn: { backgroundColor: '#334155' },
  buyText: { color: '#0f172a', fontWeight: '900' },
});
