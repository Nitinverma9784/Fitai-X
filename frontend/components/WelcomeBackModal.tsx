import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface WelcomeBackModalProps {
  visible: boolean;
  userName: string;
  level?: number;
  streakCount?: number;
  readinessScore?: number;
  onClose: () => void;
  onStartWorkout: () => void;
}

export function WelcomeBackModal({
  visible,
  userName,
  level = 1,
  streakCount = 0,
  readinessScore,
  onClose,
  onStartWorkout,
}: WelcomeBackModalProps) {
  if (!visible) return null;

  const hasReadiness = readinessScore !== undefined && readinessScore !== null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="flame" size={32} color={Colors.gold} />
          </View>

          {/* Title & Greeting */}
          <Text style={styles.title}>WELCOME BACK 👋</Text>
          <Text style={styles.userName}>{userName || 'Athlete'}</Text>

          <Text style={styles.subtitle}>
            Your AI Adaptive Engine is ready for today's session.
          </Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { onClose(); onStartWorkout(); }} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Start Today's Workout ⚡</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.secondaryBtnText}>View Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#121214',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1A1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#26262B',
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  btnRow: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.gold,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: '#1A1A1E',
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#26262B',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text2,
  },
});
