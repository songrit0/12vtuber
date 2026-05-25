import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Settings, Play, Filter } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

const GAMES = [
  {
    id: '12vtuber',
    title: '12VTuber',
    description: 'ศึก 12 VTuber Draft Pick สำหรับ Live Stream',
    emoji: '🗿',
    screen: 'VTuberSelection',
    tag: 'LIVE',
    isUse: true,
    coverGradient: ['#1A1200', '#2A1F00'],
    stats: { players: 12, sessions: 0 },
  },
  {
    id: 'domino',
    title: 'โดมิโน่',
    description: 'เกมโดมิโน่ออนไลน์ แบบบอร์ดเกม',
    emoji: '🁣',
    tag: 'NEW',
    isUse: true,
    isExternal: true,
    coverGradient: ['#001020', '#001830'],
    stats: { players: 4, sessions: 0 },
  },
  {
    id: 'sync-vote',
    title: 'Sync-Vote Pro',
    description: 'ตัวคุมสัญญาณผู้เล่น · เข้าร่วม session กับทีมงาน',
    emoji: '⚡',
    screen: 'SyncVoteLobby',
    navParams: { mode: 'join' },
    tag: 'NEW',
    isUse: true,
    coverGradient: ['#001A1F', '#003040'],
    stats: { players: 6, sessions: 0 },
  },
  {
    id: 'item-admin',
    title: 'Item Admin',
    description: 'จัดการรายการตลาด Unturned (sv_market) — ต้องรัน npm run item-admin',
    emoji: '🛒',
    screen: 'ItemAdmin',
    tag: 'NEW',
    isUse: true,
    coverGradient: ['#101820', '#16242E'],
    stats: { players: 0, sessions: 0 },
  },
];

function LivePill() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={cardStyles.livePill}>
      <Animated.View style={[cardStyles.liveDot, { opacity: pulseAnim }]} />
      <Text style={cardStyles.livePillText}>LIVE</Text>
    </View>
  );
}

function GameCard({ item, onPress, onSettings }) {
  return (
    <Pressable
      style={({ pressed }) => [
        cardStyles.card,
        pressed && cardStyles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* Cover area */}
      <View style={[cardStyles.cover, { backgroundColor: item.coverGradient ? item.coverGradient[0] : Colors.bg3 }]}>
        <Text style={cardStyles.coverEmoji}>{item.emoji}</Text>
        {item.tag === 'LIVE' && <LivePill />}
      </View>

      {/* Card body */}
      <View style={cardStyles.body}>
        <View style={cardStyles.titleRow}>
          <Text style={cardStyles.title}>{item.title}</Text>
          <View style={[cardStyles.tagBadge, item.tag === 'LIVE' ? cardStyles.tagLive : cardStyles.tagNew]}>
            <Text style={[cardStyles.tagText, item.tag === 'LIVE' ? cardStyles.tagLiveText : cardStyles.tagNewText]}>
              installed
            </Text>
          </View>
        </View>
        <Text style={cardStyles.desc} numberOfLines={2}>{item.description}</Text>

        {/* Stats row */}
        <View style={cardStyles.statsRow}>
          <View style={cardStyles.statItem}>
            <Text style={cardStyles.statValue}>{item.stats?.players ?? '-'}</Text>
            <Text style={cardStyles.statLabel}>Players</Text>
          </View>
          <View style={cardStyles.statDivider} />
          <View style={cardStyles.statItem}>
            <Text style={cardStyles.statValue}>{item.stats?.sessions ?? 0}</Text>
            <Text style={cardStyles.statLabel}>Sessions</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.launchBtn} onPress={onPress}>
            <Play size={13} color={Colors.accentFg} />
            <Text style={cardStyles.launchBtnText}>Launch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.settingsBtn} onPress={onSettings}>
            <Settings size={15} color={Colors.fg2} />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

export default function SelectGameScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { signOut, user, isAdmin, role } = useAuth();

  const installedGames = GAMES.filter(g => g.isUse);
  const numCols = isWide ? 3 : 1;

  const handleGamePress = (item) => {
    if (!item.isUse) return;
    if (item.isExternal) {
      const baseUrl = Platform.OS === 'web'
        ? `${window.location.origin}/${item.id}.html`
        : `https://tuber-tools-266cb.web.app/${item.id}.html`;
      if (Platform.OS === 'web') {
        window.open(baseUrl, '_blank');
      } else {
        Linking.openURL(baseUrl);
      }
    } else {
      navigation.navigate(item.screen, item.navParams || { gameId: item.id });
    }
  };

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <Sidebar navigation={navigation} active="games" user={user} isAdmin={isAdmin} role={role} />

      {/* Main area */}
      <View style={styles.main}>
        {/* TopBar */}
        <TopBar crumbs={['Games']} navigation={navigation} />

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Page header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLeft}>
              <Text style={styles.pageTitle}>Choose a game</Text>
              <Text style={styles.pageSub}>Select a tool to launch for your stream.</Text>
            </View>
          </View>

          {/* Toolbar row */}
          <View style={styles.toolbar}>
            <View style={styles.toolbarLeft}>
              <View style={styles.installedBadge}>
                <Text style={styles.installedBadgeText}>INSTALLED · {installedGames.length}</Text>
              </View>
            </View>
            <View style={styles.toolbarRight}>
              <TouchableOpacity style={styles.filterBtn}>
                <Filter size={14} color={Colors.fg2} />
                <Text style={styles.filterBtnText}>Filter</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cards grid */}
          <View style={[styles.grid, numCols > 1 && styles.gridWide]}>
            {installedGames.map((item) => (
              <View key={item.id} style={[styles.gridCell, numCols > 1 && styles.gridCellWide]}>
                <GameCard
                  item={item}
                  onPress={() => handleGamePress(item)}
                  onSettings={() => {}}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bg0,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageHeaderLeft: {
    flex: 1,
  },
  pageTitle: {
    color: Colors.fg0,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  pageSub: {
    color: Colors.fg2,
    fontSize: 13,
    marginTop: 4,
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  installedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.bg3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  installedBadgeText: {
    color: Colors.fg3,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bg2,
  },
  filterBtnText: {
    color: Colors.fg2,
    fontSize: 13,
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  addBtnText: {
    color: Colors.accentFg,
    fontSize: 13,
    fontWeight: '700',
  },

  grid: {
    gap: 14,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '100%',
  },
  gridCellWide: {
    width: '31.5%',
    flexShrink: 1,
    flexGrow: 0,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardPressed: {
    borderColor: Colors.accent + '55',
    backgroundColor: Colors.bg2,
  },

  cover: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverEmoji: {
    fontSize: 44,
  },
  livePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,71,87,0.18)',
    borderWidth: 1,
    borderColor: Colors.live,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.live,
  },
  livePillText: {
    color: Colors.live,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  body: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  title: {
    color: Colors.fg0,
    fontSize: 15,
    fontWeight: 'bold',
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  tagLive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent + '55',
  },
  tagNew: {
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderColor: '#4ADE8055',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagLiveText: {
    color: Colors.accent,
  },
  tagNewText: {
    color: Colors.green,
  },
  desc: {
    color: Colors.fg2,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.fg0,
    fontSize: 15,
    fontWeight: 'bold',
  },
  statLabel: {
    color: Colors.fg3,
    fontSize: 10,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderSubtle,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  launchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  launchBtnText: {
    color: Colors.accentFg,
    fontSize: 13,
    fontWeight: '700',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
