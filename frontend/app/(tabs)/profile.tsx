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
import { useFocusEffect } from '@react-navigation/native';
import { groqService, UserProfile } from '@/services/groqService';
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
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [syncWearable, setSyncWearable] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function loadProfile() {
        const u = await groqService.getUserProfile();
        if (u) setUser(u);
      }
      loadProfile();
    }, [])
  );

  const handleLogout = () => {
    sessionService.clear();
    router.replace('/auth');
  };

  const isAvatarUrl = user?.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* 1. Top Header Card matching profile.html */}
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
                  {user?.avatar || (user?.name?.slice(0, 2) || 'AM').toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.userInfo}>
              <Text style={styles.userName} testID="profile-name">
                {user?.name || 'Alex Morgan'}
              </Text>
              <Text style={styles.userEmail} testID="profile-email">
                {user?.email || 'alex@fitai.pro'}
              </Text>

              <View style={styles.badgeRow}>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO Member</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <View style={styles.verifiedDot} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 2. 3-Stat Grid Cards matching profile.html */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <DumbbellIcon size={18} color={Colors.gold} />
            <Text style={styles.statNumber}>127</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <View style={styles.statCard}>
            <FlameIcon size={18} color={Colors.amberGold} />
            <Text style={styles.statNumber}>12d</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>

          <View style={styles.statCard}>
            <TargetIcon size={18} color={Colors.green} />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {/* 3. Fitness Profile Card matching profile.html */}
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
              <Text style={styles.infoLabel}>Level</Text>
            </View>
            <Text style={styles.infoVal}>{user?.tier || 'Intermediate'}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <CalendarIcon size={14} color={Colors.text2} />
              <Text style={styles.infoLabel}>Experience</Text>
            </View>
            <Text style={styles.infoVal}>4 years</Text>
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

        {/* 4. Achievements & Milestones Card matching profile.html */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Achievements & Milestones</Text>

          <View style={styles.achieveRow}>
            <View style={styles.achieveIconBox}>
              <Text style={styles.emojiIcon}>🏆</Text>
            </View>
            <View style={styles.achieveInfo}>
              <Text style={styles.achieveName}>100 Workouts Club</Text>
              <Text style={styles.achieveSub}>Completed 100 sessions</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Unlocked</Text>
            </View>
          </View>

          <View style={[styles.achieveRow, { borderBottomWidth: 0 }]}>
            <View style={styles.achieveIconBox}>
              <Text style={styles.emojiIcon}>🔥</Text>
            </View>
            <View style={styles.achieveInfo}>
              <Text style={styles.achieveName}>10-Day Streak Master</Text>
              <Text style={styles.achieveSub}>Consistency record hit</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Unlocked</Text>
            </View>
          </View>
        </View>

        {/* 5. Preferences & Hardware List Card matching profile.html */}
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

        {/* 6. Log Out Button matching profile.html */}
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
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
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
