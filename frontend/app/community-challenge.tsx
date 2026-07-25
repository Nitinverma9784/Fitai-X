import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { FeatureHelpTooltip } from '@/components/FeatureHelpTooltip';
import { SparklesIcon, TrophyIcon, FlameIcon, UsersIcon, CheckCircleIcon, ArrowLeftIcon } from '@/components/icons/SvgIcons';
import { groqService } from '@/services/groqService';

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  streakDays: number;
  badge: string;
}

export default function CommunityChallengeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [challengeProgress, setChallengeProgress] = useState(68);

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([
    { rank: 1, name: 'Marcus Vance', avatar: 'MV', points: 2840, streakDays: 24, badge: '🔥 Hypertrophy Titan' },
    { rank: 2, name: 'Elena Rostova', avatar: 'ER', points: 2650, streakDays: 21, badge: '⚡ Recovery Pro' },
    { rank: 3, name: 'Nitin Verma', avatar: 'NV', points: 2490, streakDays: 18, badge: '💪 Consistency King' },
    { rank: 4, name: 'Sarah Jenkins', avatar: 'SJ', points: 2310, streakDays: 15, badge: '🎯 Bio-Hacker' },
    { rank: 5, name: 'David Kim', avatar: 'DK', points: 2180, streakDays: 14, badge: '🚀 Rising Star' },
  ]);

  const challengeHelp = {
    title: 'Community Challenge & Real-Time Leaderboard',
    tagline: 'Feature 20 • Live Socket & XP System',
    description: 'Compete in monthly adaptive challenges with active community members. XP points are awarded for completed workouts, bio-recovery consistency, and streak protection.',
    aiLogic: 'Synchronizes XP scores and live user rankings via real-time WebSocket events.',
    howToUse: [
      'Tap "Join Challenge" to enroll in the current monthly sprint.',
      'Log daily workouts and high bio-readiness scores to earn XP.',
      'Climb the live community leaderboard!',
    ],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>

        {/* Top Navigation */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Community Challenge</Text>
            <FeatureHelpTooltip info={challengeHelp} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Active Challenge Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <TrophyIcon size={14} color="#0F172A" />
              <Text style={styles.heroBadgeText}>JULY HYPERTROPHY SPRINT</Text>
            </View>
            <Text style={styles.daysLeft}>6 Days Remaining</Text>
          </View>

          <Text style={styles.challengeTitle}>30-Day Adaptive Volume Blast</Text>
          <Text style={styles.challengeDesc}>
            Complete 20 AI-generated adaptive workouts while maintaining an average Bio-Recovery score above 75%.
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Challenge Completion</Text>
              <Text style={styles.progressPct}>{challengeProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${challengeProgress}%` }]} />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.joinBtn, joined && styles.joinedBtn]}
            onPress={() => setJoined(!joined)}
            activeOpacity={0.85}>
            <Text style={[styles.joinBtnText, joined && styles.joinedBtnText]}>
              {joined ? '✓ Challenge Active' : 'Join July Challenge'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.sectionHeaderRow}>
          <UsersIcon size={18} color={Colors.accentBlue} />
          <Text style={styles.sectionTitle}>Global Leaderboard</Text>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>

        {leaderboard.map((item) => (
          <View key={item.rank} style={styles.leaderRow}>
            <View style={[styles.rankBadge, item.rank === 1 && styles.rank1, item.rank === 2 && styles.rank2, item.rank === 3 && styles.rank3]}>
              <Text style={styles.rankText}>#{item.rank}</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{item.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userBadge}>{item.badge}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.pointsNum}>{item.points.toLocaleString()} XP</Text>
              <Text style={styles.streakText}>🔥 {item.streakDays}d Streak</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtnText: {
    color: Colors.textBright,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textBright,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: Spacing.lg,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.xs,
  },
  heroBadgeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  daysLeft: {
    fontSize: 12,
    color: Colors.accentOrange,
    fontWeight: '600',
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textBright,
    marginBottom: 6,
  },
  challengeDesc: {
    fontSize: 13,
    color: Colors.textDim,
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accentBlue,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accentBlue,
  },
  joinBtn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  joinedBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  joinedBtnText: {
    color: '#22C55E',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textBright,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginLeft: 4,
  },
  liveText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '700',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rank1: { backgroundColor: 'rgba(234, 179, 8, 0.25)', borderWidth: 1, borderColor: '#EAB308' },
  rank2: { backgroundColor: 'rgba(148, 163, 184, 0.25)', borderWidth: 1, borderColor: '#94A3B8' },
  rank3: { backgroundColor: 'rgba(217, 119, 6, 0.25)', borderWidth: 1, borderColor: '#D97706' },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textBright,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: Colors.accentBlue,
    fontWeight: '800',
    fontSize: 13,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textBright,
  },
  userBadge: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  pointsNum: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.accentBlue,
  },
  streakText: {
    fontSize: 11,
    color: Colors.accentOrange,
    marginTop: 1,
  },
});
