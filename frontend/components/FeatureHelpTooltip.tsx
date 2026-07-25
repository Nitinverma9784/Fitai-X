import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { HelpCircleIcon, XIcon, SparklesIcon } from '@/components/icons/SvgIcons';

export interface FeatureHelpInfo {
  title: string;
  tagline: string;
  description: string;
  aiLogic: string;
  howToUse: string[];
}

interface FeatureHelpTooltipProps {
  info: FeatureHelpInfo;
  badgeStyle?: object;
}

export const FeatureHelpTooltip: React.FC<FeatureHelpTooltipProps> = ({
  info,
  badgeStyle,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        style={[styles.badge, badgeStyle]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.badgeText}>?</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.iconBox}>
                  <HelpCircleIcon size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{info.title}</Text>
                  <Text style={styles.tagline}>{info.tagline}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.closeBtn}
              >
                <XIcon size={18} color={Colors.text2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Overview</Text>
                <Text style={styles.description}>{info.description}</Text>
              </View>

              {/* How FitAI Helps You */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <SparklesIcon size={14} color={Colors.gold} />
                  <Text style={[styles.sectionHeader, { marginLeft: 6 }]}>How FitAI Helps You</Text>
                </View>
                <View style={styles.aiBox}>
                  <Text style={styles.aiText}>{info.aiLogic}</Text>
                </View>
              </View>

              {/* How to Use */}
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Quick Tips</Text>
                {info.howToUse.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepNum}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.gotItBtn}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.gotItText}>Got it!</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 196, 0, 0.15)',
    borderWidth: 1,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '82%',
    backgroundColor: '#161616',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.25)',
    padding: Spacing.lg,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(245, 196, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 12,
    color: Colors.gold,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#B0AA9A',
    lineHeight: 19,
  },
  aiBox: {
    backgroundColor: '#101010',
    borderRadius: Radii.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.2)',
  },
  aiText: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 19,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 196, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.gold,
  },
  stepText: {
    fontSize: 13,
    color: '#B0AA9A',
    flex: 1,
    lineHeight: 18,
  },
  gotItBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  gotItText: {
    color: '#0A0A0A',
    fontWeight: '800',
    fontSize: 14,
  },
});
