import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brain, CheckCircle2, ShoppingBag } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import { useAppDataStore } from '../../../store/appDataStore';
import { useThemeStore } from '../../../store/themeStore';
import { equipStoreItem, fetchMyWallet, purchaseStoreItem, type StoreItem } from '../services/walletService';

export default function WalletScreen() {
  const accessToken = useAuthStore(state => state.access_token);
  const profile = useAppDataStore(state => state.profile.data);
  const loadProfile = useAppDataStore(state => state.loadProfile);
  const colors = useThemeStore(state => state.colors);

  const [items, setItems] = useState<StoreItem[]>([]);
  const [coinsBalance, setCoinsBalance] = useState(profile?.coins_balance ?? 0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionItemId, setActionItemId] = useState<string | null>(null);

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

  const handlePurchase = async (item: StoreItem) => {
    if (!accessToken || actionItemId) return;

    if (coinsBalance < item.price) {
      Alert.alert('Saldo insuficiente', 'No tenes monedas suficientes para comprar este cosmetico.');
      return;
    }

    setActionItemId(item.id);
    try {
      await purchaseStoreItem(accessToken, item.id);
      await loadWallet(true);
    } catch (error: any) {
      Alert.alert('Error al comprar', error.message ?? 'No se pudo comprar el cosmetico.');
    } finally {
      setActionItemId(null);
    }
  };

  const handleEquip = async (item: StoreItem) => {
    if (!accessToken || actionItemId || item.is_equipped) return;
    if (!isEquippableItem(item)) return;

    setActionItemId(item.id);
    try {
      await equipStoreItem(accessToken, item.id);
      await loadWallet(true);
    } catch (error: any) {
      Alert.alert('Error al equipar', error.message ?? 'No se pudo equipar el cosmetico.');
    } finally {
      setActionItemId(null);
    }
  };

  // Estilos dinámicos basados en el tema
  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { paddingBottom: 80 },
        loadingState: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        },
        loadingText: {
          color: colors.textMuted,
          fontWeight: 'bold',
        },
        balanceCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          backgroundColor: colors.warning,
          borderRadius: 24,
          padding: 18,
          marginBottom: 24,
        },
        coinIcon: {
          width: 58,
          height: 58,
          borderRadius: 29,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        balanceLabel: {
          color: colors.rankBadgeText,
          fontSize: 13,
          fontWeight: '900',
          opacity: 0.7,
        },
        balanceValue: {
          color: colors.rankBadgeText,
          fontSize: 34,
          fontWeight: '900',
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        },
        sectionTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '900',
        },
        emptyState: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 20,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
        },
        emptyTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '900',
          textAlign: 'center',
        },
        emptyText: {
          color: colors.textMuted,
          fontSize: 13,
          textAlign: 'center',
          marginTop: 6,
        },
        itemCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: colors.surfaceElevated,
          borderRadius: 18,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 10,
        },
        itemIcon: {
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        itemInfo: { flex: 1 },
        itemName: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '900',
        },
        itemDescription: {
          color: colors.textMuted,
          fontSize: 12,
          marginTop: 3,
        },
        itemCategory: {
          color: colors.accent,
          fontSize: 11,
          fontWeight: '800',
          marginTop: 4,
        },
        buyBtn: {
          minWidth: 82,
          height: 38,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.warning,
        },
        ownedBtn: {
          backgroundColor: colors.accent,
        },
        equippedBtn: {
          backgroundColor: colors.accentSoft,
        },
        disabledBtn: {
          backgroundColor: colors.border,
        },
        buyText: {
          color: colors.rankBadgeText,
          fontWeight: '900',
        },
        ownedText: {
          color: colors.rankBadgeText,
        },
        equippedText: {
          color: colors.text,
        },
        disabledText: {
          color: colors.textMuted,
        },
      }),
    [colors]
  );

  return (
    <ScreenLayout title="WALLET" type="profiles" icon={<Brain color={colors.warning} size={22} />}>
      {loading && !refreshing ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.warning} />
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
              tintColor={colors.warning}
              colors={[colors.warning]}
            />
          }
        >
          <View style={styles.balanceCard}>
            <View style={styles.coinIcon}>
              <Brain color={colors.rankBadgeText} size={34} strokeWidth={2.3} />
            </View>
            <View>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <Text style={styles.balanceValue}>{coinsBalance}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <ShoppingBag color={colors.accent} size={20} />
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
              const isBusy = actionItemId === item.id;
              const isEquippable = isEquippableItem(item);
              const buttonText = item.is_equipped
                ? 'Equipado'
                : item.owned
                  ? isEquippable ? 'Equipar' : 'Comprado'
                  : `${item.price}`;
              const buttonDisabled = isBusy || item.is_equipped || (item.owned && !isEquippable) || (!item.owned && !canAfford);

              // Estilos del botón según estado
              let buttonStyle = styles.buyBtn;
              let textStyle = styles.buyText;
              if (item.is_equipped) {
                buttonStyle = { ...styles.buyBtn, ...styles.equippedBtn };
                textStyle = { ...styles.buyText, ...styles.equippedText };
              } else if (item.owned) {
                buttonStyle = { ...styles.buyBtn, ...styles.ownedBtn };
                textStyle = { ...styles.buyText, ...styles.ownedText };
              } else if (!canAfford) {
                buttonStyle = { ...styles.buyBtn, ...styles.disabledBtn };
                textStyle = { ...styles.buyText, ...styles.disabledText };
              }

              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemIcon}>
                    {item.is_equipped ? (
                      <CheckCircle2 color={colors.accent} size={24} />
                    ) : item.owned ? (
                      <ShoppingBag color={colors.warning} size={24} />
                    ) : (
                      <ShoppingBag color={colors.textMuted} size={24} />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
                    {!!item.category && <Text style={styles.itemCategory}>{item.category}</Text>}
                  </View>
                  <Pressable
                    style={buttonStyle}
                    disabled={buttonDisabled}
                    onPress={() => (item.owned ? handleEquip(item) : handlePurchase(item))}
                  >
                    {isBusy ? (
                      <ActivityIndicator color={colors.rankBadgeText} size="small" />
                    ) : (
                      <Text style={textStyle}>{buttonText}</Text>
                    )}
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

function isEquippableItem(item: StoreItem) {
  return item.category === 'squirrel_skin' || item.category === 'profile_frame' || item.category === 'badge_effect';
}