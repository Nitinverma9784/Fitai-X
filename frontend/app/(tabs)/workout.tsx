import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { workoutService, WorkoutRecord, StreakDay, TodayState } from '@/services/workoutService';
import { Video, ResizeMode } from 'expo-av';

// ─────────────────────────────────────────────────────────────
// STREAK CALENDAR
// ─────────────────────────────────────────────────────────────
function StreakCalendar({ streak }: { streak: StreakDay[] }) {
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={cal.container}>
      <View style={cal.header}>
        <Text style={cal.title}>WEEKLY STREAK</Text>
        <Text style={cal.sub}>{streak.filter(d => d.status === 'completed').length}/7 days</Text>
      </View>
      <View style={cal.row}>
        {streak.map((day) => {
          const isToday = day.date === today;
          const d = new Date(day.date);
          const dayLabel = dayLabels[d.getDay()];
          const dateNum = d.getDate();

          let dotBg = '#2A2A2A';
          let textColor = Colors.text2;
          let icon: React.ReactNode = null;

          if (day.status === 'completed') {
            dotBg = Colors.green;
            textColor = Colors.green;
            icon = <Feather name="check" size={12} color="#0A0A0A" />;
          } else if (day.status === 'missed') {
            dotBg = '#FF444422';
            textColor = '#FF4444';
            icon = <Feather name="x" size={12} color="#FF4444" />;
          } else if (day.status === 'pending') {
            dotBg = 'rgba(245,196,0,0.2)';
            textColor = Colors.gold;
            icon = <Feather name="clock" size={10} color={Colors.gold} />;
          } else if (isToday) {
            dotBg = 'rgba(245,196,0,0.12)';
            textColor = Colors.gold;
          }

          return (
            <View key={day.date} style={[cal.dayCol, isToday && cal.dayColToday]}>
              <Text style={[cal.dayLabel, { color: textColor }]}>{dayLabel}</Text>
              <View style={[cal.dot, { backgroundColor: dotBg }]}>
                {icon}
              </View>
              <Text style={[cal.dateNum, { color: textColor }]}>{dateNum}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  container: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 11, fontWeight: '800', color: Colors.text2, letterSpacing: 1 },
  sub: { fontSize: 12, fontWeight: '700', color: Colors.gold },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 5, paddingHorizontal: 4 },
  dayColToday: { backgroundColor: 'rgba(245,196,0,0.07)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  dayLabel: { fontSize: 10, fontWeight: '700', color: Colors.text2 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dateNum: { fontSize: 10, fontWeight: '700', color: Colors.text2 },
});

// ─────────────────────────────────────────────────────────────
// FEEDBACK MODAL
// ─────────────────────────────────────────────────────────────
interface FeedbackModalProps {
  visible: boolean;
  onSubmit: (f: { energy: number; soreness: number; mood: number; notes: string }) => void;
  onSkip: () => void;
}

function FeedbackModal({ visible, onSubmit, onSkip }: FeedbackModalProps) {
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [mood, setMood] = useState(4);
  const [notes, setNotes] = useState('');

  const RatingRow = ({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) => (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color }}>{value}/5</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={{
              flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
              backgroundColor: value >= n ? color : 'rgba(255,255,255,0.06)',
              borderWidth: 1, borderColor: value >= n ? color : Colors.border,
            }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: value >= n ? '#0A0A0A' : Colors.text2 }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>How was the session?</Text>
          <Text style={{ fontSize: 13, color: Colors.text2, marginBottom: 22 }}>Your feedback shapes tomorrow's workout.</Text>
          <RatingRow label="Energy Level" value={energy} onChange={setEnergy} color={Colors.gold} />
          <RatingRow label="Muscle Soreness" value={soreness} onChange={setSoreness} color="#FF6B6B" />
          <RatingRow label="Mood" value={mood} onChange={setMood} color={Colors.green} />
          <TextInput
            style={{ backgroundColor: Colors.card, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 13, borderWidth: 1, borderColor: Colors.border, marginBottom: 20, minHeight: 60, textAlignVertical: 'top' }}
            placeholder="Any notes? (optional)"
            placeholderTextColor={Colors.text2}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <TouchableOpacity
            style={{ backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10 }}
            onPress={() => onSubmit({ energy, soreness, mood, notes })}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0A0A0A' }}>Save Feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip} style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ fontSize: 13, color: Colors.text2 }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// AI GENERATION PROGRESS MODAL
// ─────────────────────────────────────────────────────────────
interface AIGenerationModalProps {
  visible: boolean;
  lastWorkout?: WorkoutRecord | null;
}

function AIGenerationModal({ visible, lastWorkout }: AIGenerationModalProps) {
  const [step, setStep] = useState(0);

  const energy = lastWorkout?.feedback_energy || 3;
  const soreness = lastWorkout?.feedback_soreness || 3;
  const lastMuscles = (lastWorkout?.target_muscles || []).join(', ') || 'Previous Group';

  const steps = [
    {
      title: 'Analyzing Session History & Feedback',
      detail: lastWorkout
        ? `Reviewing "${lastWorkout.title}" • Energy ${energy}/5 • Soreness ${soreness}/5`
        : 'Evaluating baseline fitness goals and equipment setup...',
    },
    {
      title: 'Calculating Muscle Recovery & Fatigue Index',
      detail: lastWorkout
        ? `Resting [${lastMuscles}] -> Rotating to complementary muscle groups`
        : 'Selecting optimal full-body muscle activation protocol...',
    },
    {
      title: 'Synthesizing Progressive Overload Plan',
      detail: soreness >= 4
        ? 'High soreness detected -> Lowering working sets & adding rest intervals'
        : energy >= 4
          ? 'High energy reported -> Applying progressive overload & target intensity'
          : 'Calibrating exercise selection for current recovery state...',
    },
    {
      title: 'Finalizing Customized Exercises & Form Tips',
      detail: 'Building exercise sequence, rest times, and readiness score...',
    },
  ];

  useEffect(() => {
    if (visible) {
      setStep(0);
      const t1 = setTimeout(() => setStep(1), 600);
      const t2 = setTimeout(() => setStep(2), 1200);
      const t3 = setTimeout(() => setStep(3), 1800);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={genM.overlay}>
        <View style={genM.card}>
          <View style={genM.header}>
            <View style={genM.iconCircle}>
              <Feather name="cpu" size={20} color="#0A0A0A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={genM.kicker}>FITAI ENGINE ACTIVATING</Text>
              <Text style={genM.title}>Generating Adaptive Plan</Text>
            </View>
            <ActivityIndicator size="small" color={Colors.gold} />
          </View>

          {/* Last session context badge if available */}
          {lastWorkout && (
            <View style={genM.contextBox}>
              <Text style={genM.contextTag}>LAST SESSION INGESTED</Text>
              <Text style={genM.contextTitle}>"{lastWorkout.title}"</Text>
              <View style={genM.chipRow}>
                <View style={genM.chip}><Text style={genM.chipText}>⚡ Energy {energy}/5</Text></View>
                <View style={[genM.chip, soreness >= 4 && { backgroundColor: 'rgba(239,68,68,0.2)' }]}><Text style={[genM.chipText, soreness >= 4 && { color: '#FF6B6B' }]}>🩹 Soreness {soreness}/5</Text></View>
                {lastWorkout.feedback_notes ? (
                  <View style={genM.chip}><Text style={genM.chipText}>📝 "{lastWorkout.feedback_notes.slice(0, 24)}"</Text></View>
                ) : null}
              </View>
            </View>
          )}

          {/* Step Timeline */}
          <View style={genM.timeline}>
            {steps.map((st, idx) => {
              const active = idx === step;
              const done = idx < step;
              return (
                <View key={idx} style={genM.stepRow}>
                  <View style={[genM.dot, done && genM.dotDone, active && genM.dotActive]}>
                    {done ? (
                      <Feather name="check" size={10} color="#0A0A0A" />
                    ) : (
                      <Text style={[genM.stepNum, active && { color: '#0A0A0A' }]}>{idx + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[genM.stepTitle, active && { color: Colors.gold }, done && { color: Colors.text }]}>
                      {st.title}
                    </Text>
                    <Text style={genM.stepDetail}>{st.detail}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const genM = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', backgroundColor: '#141414', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: 'rgba(245,196,0,0.3)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 9, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 16, fontWeight: '800', color: Colors.text },

  contextBox: { backgroundColor: 'rgba(245,196,0,0.06)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(245,196,0,0.18)', marginBottom: 16 },
  contextTag: { fontSize: 8.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8, marginBottom: 3 },
  contextTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: 10, fontWeight: '700', color: Colors.text2 },

  timeline: { gap: 12 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: Colors.gold },
  dotDone: { backgroundColor: Colors.green },
  stepNum: { fontSize: 10, fontWeight: '800', color: Colors.text2 },
  stepTitle: { fontSize: 13, fontWeight: '700', color: Colors.text2 },
  stepDetail: { fontSize: 11, color: 'rgba(176,170,154,0.6)', marginTop: 2, lineHeight: 15 },
});

// ─────────────────────────────────────────────────────────────
// EXERCISE VIDEO & STEPS MODAL
// ─────────────────────────────────────────────────────────────
interface ExerciseVideoModalProps {
  exercise: WorkoutRecord['exercises'][0] | null;
  visible: boolean;
  onClose: () => void;
}

function cleanMediaUrl(inputUrl?: string): string {
  if (!inputUrl) return '';
  let url = inputUrl.trim();

  // Recursively unwrap any proxy wrappers if present
  while (url.includes('media-proxy?') || url.includes('video-proxy?')) {
    const match = url.match(/url=([^&]+)/);
    if (match && match[1]) {
      try {
        url = decodeURIComponent(match[1]);
      } catch {
        url = match[1];
      }
    } else {
      break;
    }
  }

  return url;
}

function ExerciseVideoModal({ exercise, visible, onClose }: ExerciseVideoModalProps) {
  const videoRef = React.useRef<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setIsPlaying(true);
      setLoadingVideo(true);
      setVideoError(null);

      const timer = setTimeout(() => {
        console.warn('[VideoModal] ⏱️ 10s timeout — video still not loaded');
        setLoadingVideo(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [visible, exercise]);

  if (!exercise || !visible) return null;

  const rawVideo = cleanMediaUrl(exercise.video_url || exercise.videoUrl);
  const videoUrl = rawVideo;

  console.log('[VideoModal] 📦 Exercise data:', JSON.stringify({
    name: exercise.name,
    video_url: exercise.video_url,
    videoUrl: exercise.videoUrl,
  }));
  console.log('[VideoModal] 🎬 Direct ExerciseDB video URL:', videoUrl || '(none)');

  const rawBodymap = cleanMediaUrl(
    exercise.image_url || exercise.imageUrl || exercise.bodymap_url || exercise.bodymapUrl
  );
  const resolvedBodymap = rawBodymap;

  const steps = (exercise.steps && exercise.steps.length > 0)
    ? exercise.steps
    : [
      'Setup with proper posture and core engaged.',
      'Perform movement through full range of motion.',
      'Squeeze target muscle at peak contraction.',
      'Control lowering phase under strict tempo.'
    ];

  const targetMuscle = exercise.target_muscle || exercise.targetMuscle || 'Target Muscle';

  const handleStartVideo = async () => {
    setIsPlaying(true);
    if (videoRef.current) {
      try {
        console.log('[VideoModal] ▶️ Calling playAsync()');
        await videoRef.current.playAsync();
      } catch (e: any) {
        console.error('[VideoModal] ❌ playAsync() failed:', e?.message || e);
      }
    } else {
      console.warn('[VideoModal] ⚠️ videoRef.current is null — Video component not mounted yet');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={evmS.overlay}>
        <View style={evmS.card}>
          {/* Header */}
          <View style={evmS.header}>
            <View style={{ flex: 1 }}>
              <View style={evmS.badgeRow}>
                <View style={evmS.badge}><Text style={evmS.badgeText}>⚡ ExerciseDB HD</Text></View>
                <View style={evmS.badgeGold}><Text style={evmS.badgeGoldText}>{targetMuscle}</Text></View>
              </View>
              <Text style={evmS.title}>{exercise.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={evmS.closeBtn}>
              <Feather name="x" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
            {/* Video Player Box */}
            <View style={evmS.videoBox}>
              {loadingVideo && (
                <View style={evmS.loadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.gold} />
                  <Text style={evmS.loadingText}>Loading Video Demo...</Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, paddingHorizontal: 8, textAlign: 'center' }} numberOfLines={2}>{videoUrl}</Text>
                </View>
              )}
              {videoError && (
                <View style={{ position: 'absolute', bottom: 6, left: 6, right: 6, backgroundColor: 'rgba(255,50,50,0.85)', borderRadius: 8, padding: 6, zIndex: 20 }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff' }}>❌ VIDEO ERROR</Text>
                  <Text style={{ fontSize: 8, color: '#ffd0d0', marginTop: 2 }} numberOfLines={3}>{videoError}</Text>
                </View>
              )}

              {Platform.OS === 'web' ? (
                // @ts-ignore
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  onLoadedData={() => setLoadingVideo(false)}
                  onCanPlay={() => setLoadingVideo(false)}
                  onError={() => setLoadingVideo(false)}
                  style={{ width: '100%', height: 210, borderRadius: 14, backgroundColor: '#1A1A1A', objectFit: 'contain' }}
                />
              ) : (
                <Video
                  ref={videoRef}
                  style={{ width: '100%', height: 210, borderRadius: 14, backgroundColor: '#1A1A1A' }}
                  source={{ uri: videoUrl }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  shouldPlay={true}
                  isMuted={true}
                  onLoad={(status: any) => {
                    console.log('[VideoModal] ✅ onLoad fired — video loaded successfully', JSON.stringify(status));
                    setLoadingVideo(false);
                    setVideoError(null);
                  }}
                  onPlaybackStatusUpdate={(status: any) => {
                    if (status.isLoaded) {
                      if (!status.isBuffering) setLoadingVideo(false);
                      if (status.error) {
                        console.error('[VideoModal] ❌ Playback error in status:', status.error);
                        setVideoError(String(status.error));
                      }
                    } else if (status.error) {
                      console.error('[VideoModal] ❌ Status error (not loaded):', status.error);
                      setVideoError(String(status.error));
                      setLoadingVideo(false);
                    }
                  }}
                  onError={(e: any) => {
                    const msg = typeof e === 'string' ? e : e?.message || JSON.stringify(e);
                    console.error('[VideoModal] ❌ onError fired:', msg);
                    console.error('[VideoModal] ❌ Failed video URL was:', videoUrl);
                    setVideoError(msg);
                    setLoadingVideo(false);
                  }}
                />
              )}

              {!isPlaying && Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={evmS.startVideoOverlay}
                  onPress={handleStartVideo}
                  activeOpacity={0.85}>
                  <View style={evmS.playCircle}>
                    <Ionicons name="play" size={26} color="#0A0A0A" style={{ marginLeft: 3 }} />
                  </View>
                  <Text style={evmS.startVideoText}>START VIDEO</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Reps & Sets Metadata Bar */}
            <View style={evmS.metaBar}>
              <View style={evmS.metaCol}>
                <Text style={evmS.metaVal}>{exercise.sets}</Text>
                <Text style={evmS.metaLbl}>TARGET SETS</Text>
              </View>
              <View style={evmS.metaDivider} />
              <View style={evmS.metaCol}>
                <Text style={evmS.metaVal}>{exercise.reps}</Text>
                <Text style={evmS.metaLbl}>REPETITIONS</Text>
              </View>
              <View style={evmS.metaDivider} />
              <View style={evmS.metaCol}>
                <Text style={evmS.metaVal}>{exercise.rest_sec}s</Text>
                <Text style={evmS.metaLbl}>REST INTERVAL</Text>
              </View>
            </View>

            {/* Targeted Muscle Bodymap Diagram */}
            {resolvedBodymap ? (
              <View style={evmS.bodymapCard}>
                <Text style={evmS.bodymapTag}>🎯 TARGETED MUSCLE BODYMAP</Text>
                <Image
                  source={{ uri: resolvedBodymap }}
                  style={{ width: '100%', height: 160, borderRadius: 10, resizeMode: 'contain', marginTop: 6 }}
                />
              </View>
            ) : null}

            {/* Form Tip */}
            {exercise.tip ? (
              <View style={evmS.tipCard}>
                <Text style={evmS.tipTag}>PRO FORM TIP</Text>
                <Text style={evmS.tipText}>{exercise.tip}</Text>
              </View>
            ) : null}

            {/* Step-by-Step Instructions */}
            <View style={evmS.stepsSection}>
              <Text style={evmS.sectionTitle}>STEP-BY-STEP INSTRUCTIONS</Text>
              {steps.map((st, idx) => (
                <View key={idx} style={evmS.stepRow}>
                  <View style={evmS.stepBadge}>
                    <Text style={evmS.stepBadgeNum}>{idx + 1}</Text>
                  </View>
                  <Text style={evmS.stepText}>{st}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Action Close */}
          <TouchableOpacity style={evmS.actionBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={evmS.actionBtnText}>Got It — Ready to Lift 💪</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const evmS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30, borderWidth: 1, borderColor: Colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  badge: { backgroundColor: 'rgba(245,196,0,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)' },
  badgeText: { fontSize: 9.5, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 },
  badgeGold: { backgroundColor: Colors.card2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  badgeGoldText: { fontSize: 9.5, fontWeight: '700', color: Colors.text2 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },

  videoBox: { position: 'relative', width: '100%', height: 210, borderRadius: 14, overflow: 'hidden', backgroundColor: '#1A1A1A', marginBottom: 14, justifyContent: 'center', alignItems: 'center' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#141414', zIndex: 10, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 12, fontWeight: '700', color: Colors.gold, letterSpacing: 0.5 },
  nativeVideoPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  videoTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  videoSub: { fontSize: 11, color: Colors.text2 },
  startVideoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', gap: 8 },
  playCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  startVideoText: { fontSize: 12, fontWeight: '900', color: Colors.gold, letterSpacing: 1.5 },

  metaBar: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 12, alignItems: 'center' },
  metaCol: { flex: 1, alignItems: 'center' },
  metaVal: { fontSize: 15, fontWeight: '800', color: Colors.gold },
  metaLbl: { fontSize: 8.5, fontWeight: '800', color: Colors.text2, letterSpacing: 0.8, marginTop: 2 },
  metaDivider: { width: 1, height: 24, backgroundColor: Colors.border },

  bodymapCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, marginBottom: 14, alignItems: 'center' },
  bodymapTag: { fontSize: 9, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8, alignSelf: 'flex-start' },

  tipCard: { backgroundColor: 'rgba(245,196,0,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(245,196,0,0.2)', marginBottom: 14 },
  tipTag: { fontSize: 9, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8, marginBottom: 4 },
  tipText: { fontSize: 12, color: Colors.text, lineHeight: 17 },

  stepsSection: { gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: Colors.text2, letterSpacing: 1 },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: Colors.card, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  stepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepBadgeNum: { fontSize: 10, fontWeight: '900', color: '#0A0A0A' },
  stepText: { flex: 1, fontSize: 12, color: Colors.text, lineHeight: 17 },

  actionBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  actionBtnText: { fontSize: 14, fontWeight: '800', color: '#0A0A0A' },
});

// ─────────────────────────────────────────────────────────────
// EXERCISE CARD
// ─────────────────────────────────────────────────────────────
function ExerciseCard({
  exercise, index, onToggle, onSelect,
}: {
  exercise: WorkoutRecord['exercises'][0];
  index: number;
  onToggle: (id: number, isDone: boolean) => void;
  onSelect: (ex: WorkoutRecord['exercises'][0]) => void;
}) {
  const done = !!exercise.is_completed;

  return (
    <View style={[exS.card, done && exS.cardDone]}>
      <TouchableOpacity style={exS.numWrap} onPress={() => onSelect(exercise)}>
        <Text style={exS.numText}>{index + 1}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={exS.info} onPress={() => onSelect(exercise)} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[exS.name, done && { opacity: 0.5 }]}>{exercise.name}</Text>
        </View>
        <Text style={exS.meta}>{exercise.sets} Sets × {exercise.reps} Reps · {exercise.rest_sec}s Rest</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <TouchableOpacity style={exS.videoBtn} onPress={() => onSelect(exercise)} activeOpacity={0.8}>
            <Ionicons name="play-circle" size={14} color={Colors.gold} />
            <Text style={exS.videoBtnText}>▶ Video &amp; Steps</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[exS.checkBtn, done && exS.checkBtnDone]}
        onPress={() => onToggle(Number(exercise.id), !done)}
        activeOpacity={0.7}>
        {done
          ? <Feather name="check" size={18} color="#0A0A0A" />
          : <Text style={exS.checkText}>{exercise.completed_sets || 0}/{exercise.sets}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const exS = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardDone: { borderColor: Colors.green, opacity: 0.75 },
  numWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12, fontWeight: '800', color: Colors.gold },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  meta: { fontSize: 11, color: Colors.text2 },
  videoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,196,0,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245,196,0,0.25)' },
  videoBtnText: { fontSize: 10, fontWeight: '800', color: Colors.gold },
  checkBtn: { width: 48, height: 40, borderRadius: 12, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkBtnDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkText: { fontSize: 11, fontWeight: '800', color: Colors.gold },
});

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────
export default function WorkoutScreen() {
  const router = useRouter();
  const [state, setState] = useState<TodayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutRecord['exercises'][0] | null>(null);

  const load = useCallback(async () => {
    const data = await workoutService.getToday();
    setState(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await workoutService.generate();
    if (!result.success) {
      Alert.alert('FitAI Engine Notice', result.error || 'Unable to generate your AI workout. Please try again.');
    }
    await load();
    setGenerating(false);
  };

  const handleToggleExercise = async (exId: number, isDone: boolean) => {
    await workoutService.toggleExercise(exId, isDone);
    setState(prev => {
      if (!prev?.workout) return prev;
      return {
        ...prev,
        workout: {
          ...prev.workout,
          exercises: prev.workout.exercises.map(e =>
            Number(e.id) === exId ? { ...e, is_completed: isDone, completed_sets: isDone ? e.sets : 0 } : e
          ),
        },
      };
    });
  };

  const handleFeedbackSubmit = async (feedback: { energy: number; soreness: number; mood: number; notes: string }) => {
    if (!state?.workout?.id) return;
    setShowFeedback(false);
    setCompleting(true);
    await workoutService.completeWorkout(state.workout.id, feedback);
    await load();
    setCompleting(false);
  };

  const handleFeedbackSkip = async () => {
    if (!state?.workout?.id) return;
    setShowFeedback(false);
    setCompleting(true);
    await workoutService.completeWorkout(state.workout.id, { energy: 3, soreness: 3, mood: 3, notes: '' });
    await load();
    setCompleting(false);
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={{ color: Colors.text2, marginTop: 14, fontSize: 13 }}>Loading your plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scenario = state?.scenario;
  const workout = state?.workout as WorkoutRecord | null;
  const streak = state?.streak || [];
  const completedExercises = workout?.exercises.filter(e => e.is_completed).length || 0;
  const totalExercises = workout?.exercises.length || 0;

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <FeedbackModal visible={showFeedback} onSubmit={handleFeedbackSubmit} onSkip={handleFeedbackSkip} />
      <AIGenerationModal visible={generating} lastWorkout={state?.lastWorkout} />
      <ExerciseVideoModal visible={!!selectedExercise} exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}>

        {/* Header */}
        <View style={s.topbar}>
          <View>
            <Text style={s.kicker}>WORKOUT PLANNER</Text>
            <Text style={s.title}>
              {scenario === 'FIRST_DAY' ? "Let's Begin" :
                scenario === 'COMPLETED_TODAY' ? 'Session Done' :
                  scenario === 'READY_TO_GENERATE' ? 'Ready to Train' : "Today's Plan"}
            </Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/version-control')} activeOpacity={0.8}>
            <Feather name="git-branch" size={18} color={Colors.gold} />
          </TouchableOpacity>
        </View>

        {/* Streak Calendar */}
        {streak.length > 0 && <StreakCalendar streak={streak} />}

        {/* ── FIRST DAY ───────────────────────────────────────── */}
        {scenario === 'FIRST_DAY' && (
          <View style={s.heroCard}>
            <View style={s.pill}>
              <Feather name="zap" size={11} color={Colors.gold} />
              <Text style={s.pillText}>DAY ONE</Text>
            </View>
            <Text style={s.heroTitle}>Welcome to Your Journey</Text>
            <Text style={s.heroSub}>
              Your first workout will be designed specifically for you — full body, perfect intensity, built around your goal.
            </Text>
            <View style={s.statRow}>
              <View style={s.statItem}><Feather name="target" size={14} color={Colors.paleGold} /><Text style={s.statText}>Personalized</Text></View>
              <View style={s.statItem}><Feather name="clock" size={14} color={Colors.paleGold} /><Text style={s.statText}>35–45 mins</Text></View>
              <View style={s.statItem}><Feather name="activity" size={14} color={Colors.paleGold} /><Text style={s.statText}>~320 kcal</Text></View>
            </View>
            <TouchableOpacity style={s.primaryBtn} onPress={handleGenerate} disabled={generating} activeOpacity={0.85}>
              {generating
                ? <ActivityIndicator size="small" color="#0A0A0A" />
                : <Text style={s.primaryBtnText}>Generate My First Workout</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── READY TO GENERATE ───────────────────────────────── */}
        {scenario === 'READY_TO_GENERATE' && (
          <>
            {state?.lastWorkout && (
              <View style={s.lastCard}>
                <Text style={s.sectionLabel}>PREVIOUS SESSION FEEDBACK INGESTED</Text>
                <Text style={s.lastTitle}>{state.lastWorkout.title}</Text>
                <Text style={s.lastMeta}>Target: {(state.lastWorkout.target_muscles || []).join(' · ')}</Text>
                {state.lastWorkout.feedback_energy !== undefined && state.lastWorkout.feedback_energy > 0 && (
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    <Text style={s.adaptTagText}>Energy {state.lastWorkout.feedback_energy}/5</Text>
                    <Text style={s.adaptTagText}>Soreness {state.lastWorkout.feedback_soreness}/5</Text>
                    <Text style={s.adaptTagText}>Mood {state.lastWorkout.feedback_mood}/5</Text>
                  </View>
                )}
                {state.lastWorkout.status === 'missed' && (
                  <View style={s.missedBadge}><Text style={s.missedText}>MISSED</Text></View>
                )}
              </View>
            )}
            <View style={s.heroCard}>
              <View style={s.pill}>
                <Feather name="cpu" size={11} color={Colors.gold} />
                <Text style={s.pillText}>ADAPTIVE AI PLANNER</Text>
              </View>
              <Text style={s.heroTitle}>Generate Today's Workout</Text>
              <Text style={s.heroSub}>
                {state?.missedCount && state.missedCount > 0
                  ? `You missed ${state.missedCount} day(s) — plan adapted for smooth re-engagement.`
                  : 'AI evaluates yesterday\'s exercises, muscle fatigue, and feedback score.'}
              </Text>
              <TouchableOpacity style={s.primaryBtn} onPress={handleGenerate} disabled={generating} activeOpacity={0.85}>
                {generating
                  ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator size="small" color="#0A0A0A" />
                    <Text style={s.primaryBtnText}>Analyzing &amp; Generating…</Text>
                  </View>
                  : <Text style={s.primaryBtnText}>Generate Today's Workout</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── HAS WORKOUT / COMPLETED ─────────────────────────── */}
        {(scenario === 'HAS_WORKOUT_TODAY' || scenario === 'COMPLETED_TODAY') && workout && (
          <>
            {/* Hero */}
            <View style={s.workoutHero}>
              {workout.readiness_score !== undefined && (
                <View style={s.pill}>
                  <Feather name="bar-chart-2" size={11} color={Colors.gold} />
                  <Text style={s.pillText}>READINESS {workout.readiness_score}%</Text>
                </View>
              )}
              <Text style={s.heroTitle}>{workout.title}</Text>
              <Text style={s.heroSub}>{(workout.target_muscles || []).join(' · ')}</Text>

              <View style={s.statRow}>
                <View style={s.statItem}><Feather name="clock" size={14} color={Colors.paleGold} /><Text style={s.statText}>{workout.duration_minutes} mins</Text></View>
                <View style={s.statItem}><Feather name="zap" size={14} color={Colors.amberGold} /><Text style={s.statText}>{workout.estimated_calories} kcal</Text></View>
                <View style={s.statItem}><Feather name="layers" size={14} color={Colors.brightYellow} /><Text style={s.statText}>{totalExercises} exercises</Text></View>
              </View>

              {/* Reasoning Box */}
              {workout.ai_reasoning && (
                <View style={s.reasonBox}>
                  <Text style={s.reasonText}>🧠 {workout.ai_reasoning}</Text>
                </View>
              )}

              {/* Adaptation tags */}
              {workout.adaptations && workout.adaptations.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {workout.adaptations.map((a, i) => (
                    <View key={i} style={s.adaptTag}><Text style={s.adaptTagText}>✓ {a}</Text></View>
                  ))}
                </View>
              )}

              {/* Progress bar */}
              {scenario === 'HAS_WORKOUT_TODAY' && totalExercises > 0 && (
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, color: Colors.text2, fontWeight: '700' }}>PROGRESS</Text>
                    <Text style={{ fontSize: 11, color: Colors.gold, fontWeight: '800' }}>{completedExercises}/{totalExercises}</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: Colors.card2, borderRadius: 3 }}>
                    <View style={{ height: 6, backgroundColor: Colors.gold, borderRadius: 3, width: `${Math.round((completedExercises / totalExercises) * 100)}%` as any }} />
                  </View>
                </View>
              )}
            </View>

            {/* Why card */}
            {workout.why_recommendation && (
              <View style={s.whyCard}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.gold, letterSpacing: 0.8, marginBottom: 4 }}>WHY THIS WORKOUT TODAY</Text>
                <Text style={s.whyText}>{workout.why_recommendation}</Text>
              </View>
            )}

            {/* Exercise list */}
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Exercises</Text>
              <Text style={s.sectionMeta}>{totalExercises} moves</Text>
            </View>

            {workout.exercises.map((ex, i) => (
              <ExerciseCard
                key={String(ex.id)}
                exercise={ex}
                index={i}
                onToggle={scenario === 'COMPLETED_TODAY' ? () => { } : handleToggleExercise}
                onSelect={(selected) => setSelectedExercise(selected)}
              />
            ))}

            {/* Finish button */}
            {scenario === 'HAS_WORKOUT_TODAY' && (
              <TouchableOpacity
                style={[s.primaryBtn, { marginTop: 8, opacity: completing ? 0.6 : 1 }]}
                onPress={() => setShowFeedback(true)}
                disabled={completing}
                activeOpacity={0.85}>
                {completing
                  ? <ActivityIndicator size="small" color="#0A0A0A" />
                  : <Text style={s.primaryBtnText}>
                    {completedExercises === totalExercises && totalExercises > 0
                      ? '✓ Finish Workout'
                      : `Finish Session (${completedExercises}/${totalExercises} done)`}
                  </Text>}
              </TouchableOpacity>
            )}

            {/* Completed summary */}
            {scenario === 'COMPLETED_TODAY' && (
              <View style={s.completedBanner}>
                <Feather name="award" size={28} color={Colors.green} style={{ marginBottom: 8 }} />
                <Text style={s.completedTitle}>Session Complete!</Text>
                <Text style={s.completedSub}>Great work. Tomorrow's workout adapts to today's performance.</Text>
                {workout.feedback_energy !== undefined && workout.feedback_energy > 0 && (
                  <View style={s.feedbackRow}>
                    <Text style={s.feedbackChip}>Energy {workout.feedback_energy}/5</Text>
                    <Text style={s.feedbackChip}>Soreness {workout.feedback_soreness}/5</Text>
                    <Text style={s.feedbackChip}>Mood {workout.feedback_mood}/5</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Version Control Link */}
        <TouchableOpacity style={s.vcCard} onPress={() => router.push('/version-control')} activeOpacity={0.8}>
          <Feather name="git-commit" size={18} color={Colors.gold} />
          <View style={{ flex: 1 }}>
            <Text style={s.vcTitle}>WORKOUT HISTORY</Text>
            <Text style={s.vcSub}>View all sessions, rollback plans, see diffs</Text>
          </View>
          <Feather name="chevron-right" size={16} color={Colors.text2} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg, paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + 12 },
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  content: { paddingBottom: 100 },

  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: Spacing.md },
  kicker: { fontSize: 10.5, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },

  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,196,0,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(245,196,0,0.25)', alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontWeight: '800', color: Colors.gold, letterSpacing: 0.5 },

  heroCard: { backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.borderLight },
  workoutHero: { backgroundColor: Colors.card, borderRadius: Radii.xxl, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.borderLight },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  heroSub: { fontSize: 13, color: Colors.text2, marginBottom: 16, lineHeight: 18 },
  statRow: { flexDirection: 'row', gap: 18, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, fontWeight: '700', color: Colors.text },

  reasonBox: { backgroundColor: 'rgba(245,196,0,0.07)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(245,196,0,0.15)', marginBottom: 8 },
  reasonText: { fontSize: 12, color: Colors.gold, lineHeight: 17 },

  adaptTag: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.border },
  adaptTagText: { fontSize: 10, color: Colors.text2, fontWeight: '600' },

  whyCard: { backgroundColor: Colors.card2, borderRadius: Radii.md, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  whyText: { fontSize: 12.5, color: Colors.text2, lineHeight: 18 },

  lastCard: { backgroundColor: Colors.card2, borderRadius: Radii.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  lastTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 4 },
  lastMeta: { fontSize: 12, color: Colors.text2 },
  missedBadge: { backgroundColor: 'rgba(255,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  missedText: { fontSize: 10, fontWeight: '800', color: '#FF4444' },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  sectionMeta: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: Colors.text2, letterSpacing: 1 },

  primaryBtn: { backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#0A0A0A' },

  completedBanner: { backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: Radii.lg, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: Colors.green, alignItems: 'center' },
  completedTitle: { fontSize: 18, fontWeight: '800', color: Colors.green, marginBottom: 6 },
  completedSub: { fontSize: 13, color: Colors.text2, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  feedbackRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  feedbackChip: { fontSize: 11, fontWeight: '700', color: Colors.text2, backgroundColor: Colors.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  vcCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Radii.lg, padding: 14, marginTop: 4, borderWidth: 1, borderColor: Colors.border },
  vcTitle: { fontSize: 11, fontWeight: '800', color: Colors.gold, letterSpacing: 1, marginBottom: 2 },
  vcSub: { fontSize: 12, color: Colors.text2 },
});
