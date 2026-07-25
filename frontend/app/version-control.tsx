import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { workoutService, WorkoutCommit } from '@/services/workoutService';

// ─────────────────────────────────────────────────────────────
// DIFF BADGE
// ─────────────────────────────────────────────────────────────
function DiffBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: `${color}18`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: `${color}33` }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMMIT DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function CommitDetailModal({
  commit, visible, onClose, onRollback, isLatest,
}: {
  commit: WorkoutCommit | null;
  visible: boolean;
  onClose: () => void;
  onRollback: (versionId: string) => void;
  isLatest: boolean;
}) {
  if (!commit) return null;

  const date = new Date(commit.timestamp);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const authorColor =
    commit.author === 'FitAI Engine' ? Colors.gold :
      commit.author === 'User Customization' ? '#60A5FA' : '#FF6B6B';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' }}>
          <View style={{ width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />

          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }}>
            {/* Version badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245,196,0,0.25)' }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: Colors.gold, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {commit.versionId}
                </Text>
              </View>
              {isLatest && (
                <View style={{ backgroundColor: Colors.green + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: Colors.green + '40' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: Colors.green }}>LATEST</Text>
                </View>
              )}
            </View>

            <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>{commit.commitMessage}</Text>
            <Text style={{ fontSize: 12, color: Colors.text2, marginBottom: 14 }}>{dateStr} at {timeStr}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: authorColor }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: authorColor }}>{commit.author}</Text>
            </View>

            {/* Diff counts */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {commit.diffSummary.addedCount > 0 && <DiffBadge label={`+${commit.diffSummary.addedCount} added`} color="#4ADE80" />}
              {commit.diffSummary.removedCount > 0 && <DiffBadge label={`-${commit.diffSummary.removedCount} removed`} color="#FF4444" />}
              {commit.diffSummary.swappedCount > 0 && <DiffBadge label={`~${commit.diffSummary.swappedCount} swapped`} color={Colors.gold} />}
              {commit.diffSummary.addedCount === 0 && commit.diffSummary.removedCount === 0 && commit.diffSummary.swappedCount === 0 && (
                <DiffBadge label="No changes" color={Colors.text2} />
              )}
            </View>

            {/* Reasoning */}
            {commit.aiReasoning && (
              <View style={{ backgroundColor: 'rgba(245,196,0,0.07)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(245,196,0,0.15)', marginBottom: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5, marginBottom: 6 }}>DECISION REASONING</Text>
                <Text style={{ fontSize: 12.5, color: Colors.text, lineHeight: 18 }}>{commit.aiReasoning}</Text>
              </View>
            )}

            {/* Adaptations */}
            {commit.adaptations && commit.adaptations.length > 0 && (
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.text2, letterSpacing: 0.5, marginBottom: 8 }}>ADAPTATIONS</Text>
                {commit.adaptations.map((a, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 5 }}>
                    <Feather name="arrow-right" size={12} color={Colors.gold} style={{ marginTop: 2 }} />
                    <Text style={{ fontSize: 12.5, color: Colors.text2, flex: 1, lineHeight: 17 }}>{a}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Exercises */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.text2, letterSpacing: 0.5, marginBottom: 8 }}>
              EXERCISES IN THIS VERSION
            </Text>
            {commit.exercises.map((ex, i) => (
              <View key={ex.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.gold, width: 22 }}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>{ex.name}</Text>
                  <Text style={{ fontSize: 11, color: Colors.text2 }}>
                    {ex.targetMuscle} · {ex.sets}×{ex.reps} · RPE {ex.rpeTarget}
                  </Text>
                  {(ex as any).substituteFor && (
                    <Text style={{ fontSize: 10, color: '#FF6B6B', marginTop: 2 }}>Replaced: {(ex as any).substituteFor}</Text>
                  )}
                </View>
              </View>
            ))}

            {/* Rollback */}
            {!isLatest && (
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(245,196,0,0.1)', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 22, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => onRollback(commit.versionId)}
                activeOpacity={0.85}>
                <Feather name="rotate-ccw" size={15} color={Colors.gold} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.gold }}>Restore {commit.versionId}</Text>
                  <Text style={{ fontSize: 11, color: Colors.text2, marginTop: 1 }}>Creates a new rollback commit in history</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', marginTop: 14, paddingVertical: 10 }}>
              <Text style={{ fontSize: 13, color: Colors.text2 }}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function VersionControlScreen() {
  const router = useRouter();
  const [commits, setCommits] = useState<WorkoutCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommit, setSelectedCommit] = useState<WorkoutCommit | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

  const load = useCallback(async () => {
    const data = await workoutService.getVersionHistory();
    setCommits([...data].reverse()); // newest first
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRollback = (versionId: string) => {
    Alert.alert(
      'Restore Version',
      `Restore ${versionId}? A new rollback commit will be created — your current plan is preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setRollingBack(true);
            setSelectedCommit(null);
            await workoutService.rollbackToVersion(versionId);
            await load();
            setRollingBack(false);
            Alert.alert('Restored', `Rolled back to ${versionId}.`);
          },
        },
      ]
    );
  };

  const filteredCommits = commits.filter(c =>
    c.versionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.commitMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.aiReasoning || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.exercises.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <CommitDetailModal
        commit={selectedCommit}
        visible={!!selectedCommit}
        onClose={() => setSelectedCommit(null)}
        onRollback={handleRollback}
        isLatest={selectedCommit?.versionId === commits[0]?.versionId}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Feather name="arrow-left" size={18} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>WORKOUT HISTORY</Text>
          <Text style={s.title}>Version Control</Text>
        </View>
        <TouchableOpacity onPress={() => { setRefreshing(true); load(); }} style={s.iconBtn}>
          <Feather name="refresh-cw" size={16} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        {[
          { num: commits.length, label: 'Commits' },
          { num: commits.filter(c => c.author === 'FitAI Engine').length, label: 'Generated' },
          { num: commits.filter(c => c.author === 'User Customization').length, label: 'Rollbacks' },
          { num: commits.filter(c => c.author === 'Recovery Auto-Deload').length, label: 'Deloads' },
        ].map(({ num, label }) => (
          <View key={label} style={s.statChip}>
            <Text style={s.statNum}>{num}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Feather name="search" size={15} color={Colors.text2} />
        <TextInput
          style={s.searchInput}
          placeholder="Search commits, exercises..."
          placeholderTextColor={Colors.text2}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={15} color={Colors.text2} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}>

        {loading && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={{ color: Colors.text2, marginTop: 12, fontSize: 13 }}>Loading history...</Text>
          </View>
        )}

        {!loading && filteredCommits.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Feather name="git-commit" size={40} color={Colors.border} />
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 6 }}>No commits yet</Text>
            <Text style={{ color: Colors.text2, fontSize: 13, textAlign: 'center' }}>
              Generate your first workout to start tracking version history.
            </Text>
          </View>
        )}

        {/* Git log timeline */}
        {filteredCommits.map((commit, index) => {
          const isLatest = index === 0;
          const isRollback = commit.versionId.includes('rollback');
          const authorColor =
            commit.author === 'FitAI Engine' ? Colors.gold :
              commit.author === 'User Customization' ? '#60A5FA' : '#FF6B6B';
          const date = new Date(commit.timestamp);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          return (
            <View key={commit.versionId} style={{ flexDirection: 'row' }}>
              {/* Git tree */}
              <View style={{ alignItems: 'center', width: 28, marginRight: 12 }}>
                <View style={[s.gitDot, { backgroundColor: isLatest ? Colors.gold : isRollback ? '#60A5FA' : authorColor }]}>
                  {isLatest && <Feather name="star" size={7} color="#0A0A0A" />}
                </View>
                {index < filteredCommits.length - 1 && <View style={s.gitLine} />}
              </View>

              {/* Commit card */}
              <TouchableOpacity
                style={[s.commitCard, isLatest && s.commitCardLatest, { flex: 1, marginBottom: 12 }]}
                onPress={() => setSelectedCommit(commit)}
                activeOpacity={0.8}>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[s.versionId, { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                      {commit.versionId}
                    </Text>
                    {isLatest && (
                      <View style={s.headBadge}><Text style={s.headBadgeText}>HEAD</Text></View>
                    )}
                    {isRollback && (
                      <View style={{ backgroundColor: '#60A5FA20', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: '#60A5FA30' }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#60A5FA' }}>ROLLBACK</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.dateText}>{dateStr} · {timeStr}</Text>
                </View>

                <Text style={s.commitMsg} numberOfLines={2}>{commit.commitMessage}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginBottom: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: authorColor }} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: authorColor }}>{commit.author}</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {commit.diffSummary.addedCount > 0 && <DiffBadge label={`+${commit.diffSummary.addedCount}`} color="#4ADE80" />}
                  {commit.diffSummary.removedCount > 0 && <DiffBadge label={`-${commit.diffSummary.removedCount}`} color="#FF4444" />}
                  {commit.diffSummary.swappedCount > 0 && <DiffBadge label={`~${commit.diffSummary.swappedCount} swap`} color={Colors.gold} />}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: Colors.text2 }}>
                    {commit.exercises.length} exercise{commit.exercises.length !== 1 ? 's' : ''}
                    {commit.exercises[0] ? ` · ${commit.exercises[0].name}${commit.exercises.length > 1 ? ` +${commit.exercises.length - 1}` : ''}` : ''}
                  </Text>
                  <Feather name="chevron-right" size={14} color={Colors.text2} />
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        {rollingBack && (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator color={Colors.gold} />
            <Text style={{ color: Colors.text2, marginTop: 8, fontSize: 12 }}>Creating rollback commit...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, gap: 12 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  kicker: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },

  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: 14 },
  statChip: { flex: 1, backgroundColor: Colors.card, borderRadius: Radii.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statNum: { fontSize: 18, fontWeight: '800', color: Colors.gold },
  statLabel: { fontSize: 9, fontWeight: '700', color: Colors.text2, marginTop: 2 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card, borderRadius: Radii.md, paddingHorizontal: 12, paddingVertical: 10, marginHorizontal: Spacing.lg, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 13, color: Colors.text },

  gitDot: { width: 14, height: 14, borderRadius: 7, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  gitLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 2 },

  commitCard: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, borderWidth: 1, borderColor: Colors.border },
  commitCardLatest: { borderColor: 'rgba(245,196,0,0.35)', backgroundColor: 'rgba(245,196,0,0.03)' },
  versionId: { fontSize: 13, fontWeight: '800', color: Colors.gold },
  headBadge: { backgroundColor: 'rgba(245,196,0,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  headBadgeText: { fontSize: 9, fontWeight: '900', color: Colors.gold },
  dateText: { fontSize: 10, color: Colors.text2 },
  commitMsg: { fontSize: 13.5, fontWeight: '700', color: Colors.text, lineHeight: 18 },
});
