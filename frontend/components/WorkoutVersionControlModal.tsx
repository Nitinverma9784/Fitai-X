import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import {
  SearchIcon, FilterIcon, EyeIcon, RefreshIcon, GitDiffIcon,
} from '@/components/icons/SvgIcons';

interface HistoryItem {
  version: string;
  date: string;
  description: string;
  tags: string[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectVersion?: (version: string) => void;
}

export function WorkoutVersionControlModal({ visible, onClose, onSelectVersion }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const historyItems: HistoryItem[] = [
    {
      version: 'v4.1',
      date: 'Jul 4',
      description: 'Deload week: reduced intensity 15% across all lifts.',
      tags: ['Volume -15%', 'Rest +30s', 'Swapped OHP → DB press'],
    },
    {
      version: 'v4.0',
      date: 'Jun 30',
      description: 'New mesocycle started. Added progressive overload targeting chest priority.',
      tags: ['New mesocycle', 'Bench added', 'Rep ranges updated'],
    },
    {
      version: 'v3.9',
      date: 'Jun 23',
      description: 'Recovery-focused plan after reported shoulder soreness.',
      tags: ['Shoulder exercises removed', 'Volume -25%', 'Extra stretching added'],
    },
  ];

  const filteredHistory = historyItems.filter(
    (item) =>
      item.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Version Control</Text>
            <Text style={styles.subTitle}>GitHub-style workout history</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}>

          {/* Search Bar & Filter Button */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <SearchIcon size={16} color={Colors.text2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search versions..."
                placeholderTextColor={Colors.text2}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
              <FilterIcon size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Current Active Version Hero Card (v4.2) */}
          <View style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <View style={styles.versionBadgeRow}>
                <Text style={styles.currentVerText}>v4.2</Text>
                <View style={styles.currentPill}>
                  <Text style={styles.currentPillText}>Current</Text>
                </View>
              </View>
              <Text style={styles.currentDateText}>Today, Jul 7</Text>
            </View>

            <Text style={styles.currentDesc}>
              AI increased bench volume +10%, added cable flyes for chest isolation.
            </Text>

            <View style={styles.currentActionsRow}>
              <TouchableOpacity style={styles.compareBtn} activeOpacity={0.85}>
                <GitDiffIcon size={16} color="#0A0A0A" />
                <Text style={styles.compareBtnText}>Compare</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rollbackBtn} activeOpacity={0.85}>
                <RefreshIcon size={16} color={Colors.text} />
                <Text style={styles.rollbackBtnText}>Rollback</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* HISTORY Kicker */}
          <Text style={styles.historyKicker}>HISTORY</Text>

          {/* Timeline List with Vertical Branch & Node Dots */}
          <View style={styles.timelineContainer}>
            <View style={styles.branchLine} />

            {filteredHistory.map((item, idx) => (
              <View key={idx} style={styles.timelineItem}>
                {/* Timeline Node Circle */}
                <View style={styles.nodeDot}>
                  <View style={styles.nodeInnerDot} />
                </View>

                {/* History Card */}
                <View style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyVerText}>{item.version}</Text>
                    <Text style={styles.historyDateText}>{item.date}</Text>
                  </View>

                  <Text style={styles.historyDesc}>{item.description}</Text>

                  {/* Tag Pills */}
                  <View style={styles.tagWrap}>
                    {item.tags.map((tag, tIdx) => (
                      <View key={tIdx} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Links Row */}
                  <View style={styles.actionLinksRow}>
                    <TouchableOpacity
                      style={styles.actionLinkItem}
                      activeOpacity={0.75}
                      onPress={() => {
                        if (onSelectVersion) onSelectVersion(item.version);
                        onClose();
                      }}>
                      <EyeIcon size={13} color={Colors.gold} />
                      <Text style={styles.actionLinkText}>View</Text>
                    </TouchableOpacity>

                    <Text style={styles.actionDot}>•</Text>

                    <TouchableOpacity
                      style={styles.actionLinkItem}
                      activeOpacity={0.75}
                      onPress={() => {
                        if (onSelectVersion) onSelectVersion(item.version);
                        onClose();
                      }}>
                      <RefreshIcon size={13} color={Colors.gold} />
                      <Text style={styles.actionLinkText}>Restore</Text>
                    </TouchableOpacity>

                    <Text style={styles.actionDot}>•</Text>

                    <TouchableOpacity
                      style={styles.actionLinkItem}
                      activeOpacity={0.75}
                      onPress={() => {
                        if (onSelectVersion) onSelectVersion(item.version);
                        onClose();
                      }}>
                      <GitDiffIcon size={13} color={Colors.gold} />
                      <Text style={styles.actionLinkText}>Diff</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titleContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  contentContainer: {
    paddingBottom: 60,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161616',
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  currentCard: {
    backgroundColor: '#141414',
    borderRadius: Radii.xxl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  versionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentVerText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.gold,
  },
  currentPill: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  currentPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  currentDateText: {
    fontSize: 12,
    color: Colors.text2,
  },
  currentDesc: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 16,
  },
  currentActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.gold,
    borderRadius: Radii.full,
    paddingVertical: 10,
  },
  compareBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  rollbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E1E1E',
    borderRadius: Radii.full,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rollbackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  historyKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.text2,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 24,
  },
  branchLine: {
    position: 'absolute',
    left: 7,
    top: 14,
    bottom: 24,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 16,
  },
  nodeDot: {
    position: 'absolute',
    left: -24,
    top: 14,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  historyCard: {
    backgroundColor: '#141414',
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyVerText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  historyDateText: {
    fontSize: 12,
    color: Colors.text2,
  },
  historyDesc: {
    fontSize: 12.5,
    color: Colors.text2,
    lineHeight: 18,
    marginBottom: 12,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text2,
  },
  actionLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gold,
  },
  actionDot: {
    fontSize: 12,
    color: Colors.text2,
  },
});
