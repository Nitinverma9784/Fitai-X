import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { ZapIcon } from '@/components/icons/SvgIcons';

interface XpRewardModalProps {
  visible: boolean;
  xpAmount: number;
  title?: string;
  message?: string;
  onClose: () => void;
}

export function XpRewardModal({ visible, xpAmount, title = 'XP EARNED!', message = 'Great job keeping up with your fitness journey!', onClose }: XpRewardModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.iconCircle}>
            <ZapIcon size={32} color="#0A0A0A" />
          </View>

          <Text style={s.xpBadge}>+{xpAmount} XP</Text>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>

          <TouchableOpacity style={s.btn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.btnText}>Awesome ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#141008',
    borderRadius: Radii.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 196, 0, 0.4)',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  xpBadge: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.gold,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 12.5,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  btn: {
    width: '100%',
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0A0A0A',
  },
});
