import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Platform,
  Image,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groqService, UserProfile, UserStatsResponse } from '@/services/groqService';
import { sessionService } from '@/services/sessionService';
import {
  EditIcon, DumbbellIcon, FlameIcon, StarIcon,
  TargetIcon, BarbellIcon, ScaleIcon,
  VolumeIcon, HandIcon, WatchIcon, LogoutIcon, SettingsIcon,
  MoonIcon, CalendarIcon, ZapIcon,
} from '@/components/icons/SvgIcons';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [statsData, setStatsData] = useState<UserStatsResponse | null>(null);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [syncWearable, setSyncWearable] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadProfileData() {
        const data = await groqService.getUserStats();
        if (data) {
          setStatsData(data);
          setUser(data.user);
        } else {
          const u = await groqService.getUserProfile();
          if (u) setUser(u);
        }
      }
      loadProfileData();
    }, [])
  );

  const handleLogout = () => {
    sessionService.clear();
    router.replace('/auth');
  };

  const isAvatarUrl = user?.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'));
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'FitAI Member');
  const level = statsData?.levelData?.level ?? user?.level ?? 1;
  const levelTitle = statsData?.levelData?.levelTitle ?? user?.levelTitle ?? 'Novice Trainee';
  const currentXp = statsData?.levelData?.xp ?? user?.xp ?? 0;
  const progressPct = statsData?.levelData?.progressPct ?? 0;
  const xpNeeded = statsData?.levelData?.xpNeeded ?? 100;
  const xpInLevel = statsData?.levelData?.xpInCurrentLevel ?? 0;

  const completedWorkouts = statsData?.stats?.completedWorkouts ?? 0;
  const currentStreak = statsData?.stats?.currentStreak ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* 1. Top Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.topNavRow}>
            <TouchableOpacity style={styles.navBtn} activeOpacity={0.7} onPress={() => router.back()}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Profile</Text>

            <TouchableOpacity style={styles.navBtn} activeOpacity={0.7} onPress={() => router.push('/edit-profile')}>
              <SettingsIcon size={16} color={Colors.text2} />
            </TouchableOpacity>
          </View>

          {/* User Profile Info Row */}
          <View style={styles.userRow}>
            {isAvatarUrl ? (
              <Image
                source={{ uri: user!.avatar }}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>
                  {user?.avatar || displayName.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.userInfo}>
              <Text style={styles.userName} testID="profile-name">
                {displayName}
              </Text>
              <Text style={styles.userEmail} testID="profile-email">
                {user?.email || 'user@fitai.pro'}
              </Text>

              <View style={styles.badgeRow}>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>LVL {level} • {levelTitle}</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <View style={styles.verifiedDot} />
                  <Text style={styles.verifiedText}>Active</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Gamification XP Level Card */}
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ZapIcon size={16} color={Colors.gold} />
              <Text style={styles.xpTitle}>GAMIFICATION LEVEL {level}/100</Text>
            </View>
            <Text style={styles.xpVal}>{currentXp} XP</Text>
          </View>

          <Text style={styles.xpSub}>{levelTitle} • {xpInLevel} / {xpNeeded} XP to Level {Math.min(100, level + 1)}</Text>

          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${progressPct}%` as any }]} />
          </View>

          <View style={styles.xpFooter}>
            <Text style={styles.xpHint}>⚡ Earn +20 XP for every completed workout, exercise, or task</Text>
            <Text style={styles.xpPct}>{progressPct}%</Text>
          </View>
        </View>

        {/* 3. Real Stats Grid Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <DumbbellIcon size={18} color={Colors.gold} />
            <Text style={styles.statNumber}>{completedWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <View style={styles.statCard}>
            <FlameIcon size={18} color={Colors.amberGold} />
            <Text style={styles.statNumber}>{currentStreak}d</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>

          <View style={styles.statCard}>
            <StarIcon size={18} color={Colors.green} />
            <Text style={styles.statNumber}>{currentXp}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        {/* 4. Fitness Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fitness Profile</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <TargetIcon size={14} color={Colors.text2} />
              <Text style={styles.infoLabel}>Goal</Text>
            </View>
            <Text style={styles.infoVal}>{user?.goal || 'Build Muscle'}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <StarIcon size={14} color={Colors.text2} />
              <Text style={styles.infoLabel}>Rank / Tier</Text>
            </View>
            <Text style={styles.infoVal}>Level {level} • {levelTitle}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <BarbellIcon size={14} color={Colors.text2} />
              <Text style={styles.infoLabel}>Equipment</Text>
            </View>
            <Text style={styles.infoVal}>{user?.equipment || 'Commercial Gym'}</Text>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoLeft}>
              <ScaleIcon size={14} color={Colors.text2} />
              <Text style={styles.infoLabel}>Body Metrics</Text>
            </View>
            <Text style={styles.infoVal}>
              {user?.weight_kg ?? 75} kg • {user?.height_cm ?? 175} cm
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}>
            <EditIcon size={16} color={Colors.gold} />
            <Text style={styles.editProfileText}>Edit Fitness Profile & Goals</Text>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Achievements & Milestones Card (Dynamic from DB) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements & Milestones</Text>

          {(statsData?.achievements || []).map((ach, idx) => {
            const isLast = idx === (statsData?.achievements || []).length - 1;
            return (
              <View key={ach.id} style={[styles.achieveRow, isLast && { borderBottomWidth: 0 }]}>
                <View style={[styles.achieveIconBox, !ach.unlocked && styles.achieveIconBoxLocked]}>
                  <Text style={styles.emojiIcon}>{ach.emoji}</Text>
                </View>
                <View style={styles.achieveInfo}>
                  <Text style={[styles.achieveName, !ach.unlocked && { opacity: 0.7 }]}>{ach.name}</Text>
                  <Text style={styles.achieveSub}>{ach.description}</Text>
                  {!ach.unlocked && (
                    <View style={styles.achieveBarTrack}>
                      <View style={[styles.achieveBarFill, { width: `${ach.progressPct}%` as any }]} />
                    </View>
                  )}
                </View>
                {ach.unlocked ? (
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>Unlocked</Text>
                  </View>
                ) : (
                  <View style={styles.statusPillLocked}>
                    <Text style={styles.statusPillLockedText}>{ach.current}/{ach.target}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* 6. Preferences & Hardware List Card */}
        <View style={styles.cardList}>
          <Text style={styles.cardTitlePadding}>Preferences & Hardware</Text>

          <View style={styles.listRow}>
            <VolumeIcon size={18} color={Colors.text2} />
            <Text style={styles.rowLabel}>FitGuru Voice Guidance</Text>
            <Switch
              value={voiceGuidance}
              onValueChange={setVoiceGuidance}
              trackColor={{ false: Colors.card2, true: Colors.gold }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.listRow}>
            <HandIcon size={18} color={Colors.text2} />
            <Text style={styles.rowLabel}>Haptic Set Reminders</Text>
            <Switch
              value={haptics}
              onValueChange={setHaptics}
              trackColor={{ false: Colors.card2, true: Colors.gold }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.listRow}>
            <WatchIcon size={18} color={Colors.text2} />
            <Text style={styles.rowLabel}>Sync Apple Health / Garmin</Text>
            <Switch
              value={syncWearable}
              onValueChange={setSyncWearable}
              trackColor={{ false: Colors.card2, true: Colors.gold }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.listRow, { borderBottomWidth: 0 }]}>
            <MoonIcon size={18} color={Colors.text2} />
            <Text style={styles.rowLabel}>Dark Mode Theme</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.card2, true: Colors.gold }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* 7. Log Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          testID="btn-logout"
          onPress={handleLogout}>
          <LogoutIcon size={18} color={Colors.red} />
          <Text style={styles.logoutText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + 12 },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 100 },

  // Top Header Card matching profile.html
  headerCard: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.card2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text2,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },

  // User Profile Row matching profile.html
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  proBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.green,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0A0A0A',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0A',
  },

  // 3 Stats Grid matching profile.html
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginVertical: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.text2,
    marginTop: 2,
  },

  // Cards
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  cardTitlePadding: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.text2,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(245, 196, 0, 0.08)',
    borderRadius: Radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  editProfileText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '300',
    color: Colors.gold,
  },

  // XP Level Card
  xpCard: {
    backgroundColor: '#141008',
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 196, 0, 0.28)',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  xpTitle: { fontSize: 10, fontWeight: '900', color: Colors.gold, letterSpacing: 0.8 },
  xpVal: { fontSize: 13, fontWeight: '900', color: Colors.gold },
  xpSub: { fontSize: 11.5, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  xpTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  xpFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 4 },
  xpFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpHint: { fontSize: 10, color: Colors.text2 },
  xpPct: { fontSize: 10, fontWeight: '800', color: Colors.gold },

  // Achievements
  achieveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  achieveIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(245, 196, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveIconBoxLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.6,
  },
  emojiIcon: {
    fontSize: 16,
  },
  achieveInfo: {
    flex: 1,
  },
  achieveName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  achieveSub: {
    fontSize: 11,
    color: Colors.text2,
    marginTop: 2,
  },
  achieveBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: 5,
    overflow: 'hidden',
  },
  achieveBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  statusPill: {
    backgroundColor: 'rgba(163, 230, 53, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.green,
  },
  statusPillLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusPillLockedText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text2,
  },
  statusPillActive: {
    backgroundColor: 'rgba(245, 196, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  statusPillActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gold,
  },

  // App Settings List Card
  cardList: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },

  // Log Out Button matching profile.html
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: Radii.md,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.red,
  },
});
