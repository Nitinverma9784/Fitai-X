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
import {
  SparklesIcon,
  XIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ActivityIcon,
  SlidersIcon,
  UtensilsIcon,
  CalendarIcon,
  DumbbellIcon,
} from '@/components/icons/SvgIcons';

export interface TourStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  icon: any;
  content: string;
  aiHighlight: string;
  actionHint: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    badge: 'FitAI X Guide',
    title: 'Welcome to FitAI X',
    subtitle: 'Your Smart Daily Fitness Companion',
    icon: SparklesIcon,
    content:
      'FitAI X is a smart fitness app that learns your habits and adapts your workouts, meals, and rest every single day to match your real life.',
    aiHighlight:
      'If you sleep less, feel sore, or have only 20 minutes to train, FitAI X immediately customizes your plan so you never miss a beat.',
    actionHint: 'Tap "Next" to explore how each feature helps you stay fit.',
  },
  {
    id: 'adaptive-engine',
    badge: 'Daily Custom Workout',
    title: 'Adaptive Daily Workouts',
    subtitle: 'Workouts Tailored to Your Energy & Time',
    icon: DumbbellIcon,
    content:
      'Every day, your workout is freshly tailored based on your sleep, rest, and available equipment.',
    aiHighlight:
      'Short on time? Use the Workout Simulator to switch between 20m, 30m, or 45m sessions or switch between Gym and Home routines!',
    actionHint: 'Try the Workout Simulator on the Workout screen.',
  },
  {
    id: 'version-control',
    badge: 'Workout History',
    title: 'Workout History & Revert',
    subtitle: 'Keep Track & Go Back Anytime',
    icon: SlidersIcon,
    content:
      'Every plan you receive is saved in your history. You can compare past sessions and easily go back to any routine you liked before.',
    aiHighlight:
      'See clear summaries of exercise updates and why changes were suggested for your safety.',
    actionHint: 'Tap "Version Control" on your Dashboard to view past plans.',
  },
  {
    id: 'recovery-fatigue',
    badge: 'Health & Readiness',
    title: 'Daily Readiness & Rest Guide',
    subtitle: 'Listen to Your Body & Prevent Overworking',
    icon: ActivityIcon,
    content:
      'Check your daily Readiness Score calculated from your sleep, water, and soreness levels.',
    aiHighlight:
      'FitAI X alerts you when you need an extra rest day or gentle stretching so you stay energized and avoid injury.',
    actionHint: 'Check the Recovery tab each morning for your readiness score.',
  },
  {
    id: 'nutrition-budget',
    badge: 'Smart Meals',
    title: 'Budget Meal Planner & Grocery List',
    subtitle: 'Healthy Eating Made Simple & Affordable',
    icon: UtensilsIcon,
    content:
      'Get healthy daily meal recommendations tailored to your weekly food budget and dietary choices.',
    aiHighlight:
      'Automatically creates a handy weekly grocery list that reuses ingredients so nothing goes to waste.',
    actionHint: 'Visit the Nutrition tab to view your meals and grocery list.',
  },
  {
    id: 'goals-memory',
    badge: 'Your Journey',
    title: 'Flexible Goals & Progress Journey',
    subtitle: 'Change Goals Anytime Without Losing History',
    icon: CalendarIcon,
    content:
      'Whether your goal is weight loss, building muscle, or endurance, you can switch targets anytime while keeping all your past progress intact.',
    aiHighlight:
      'On super busy days, enjoy 5-minute micro-workouts to keep your daily streak going strong.',
    actionHint: 'Update your goals anytime in your Profile or Analytics tab.',
  },
];

interface GuidedAppTourProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'tour' | 'overview';
}

export const GuidedAppTour: React.FC<GuidedAppTourProps> = ({ visible, onClose, initialTab = 'tour' }) => {
  const [activeTab, setActiveTab] = useState<'tour' | 'overview'>(initialTab);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const step = TOUR_STEPS[currentStepIndex];
  const IconComponent = step.icon;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose();
      setCurrentStepIndex(0);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    onClose();
    setCurrentStepIndex(0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <Pressable style={styles.overlay} onPress={handleSkip}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Top Bar */}
          <View style={styles.header}>
            <View style={styles.tabToggleRow}>
              <TouchableOpacity
                onPress={() => setActiveTab('tour')}
                style={[styles.toggleBtn, activeTab === 'tour' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, activeTab === 'tour' && styles.toggleTextActive]}>
                  🚀 Guided Tour
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('overview')}
                style={[styles.toggleBtn, activeTab === 'overview' && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, activeTab === 'overview' && styles.toggleTextActive]}>
                  💡 Feature Overview
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
              <XIcon size={18} color={Colors.gold} />
            </TouchableOpacity>
          </View>

          {activeTab === 'tour' ? (
            <>
              {/* Step Counter */}
              <View style={styles.stepHeaderRow}>
                <View style={styles.badgeContainer}>
                  <SparklesIcon size={12} color="#0A0A0A" />
                  <Text style={styles.badgeText}>{step.badge}</Text>
                </View>
                <Text style={styles.stepCounter}>
                  Step {currentStepIndex + 1} of {TOUR_STEPS.length}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` },
                  ]}
                />
              </View>

              {/* Step Body */}
              <ScrollView
                style={styles.body}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}>
                <View style={styles.titleSection}>
                  <View style={styles.iconCircle}>
                    <IconComponent size={22} color="#0A0A0A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{step.title}</Text>
                    <Text style={styles.subtitle}>{step.subtitle}</Text>
                  </View>
                </View>

                <Text style={styles.contentParagraph}>{step.content}</Text>

                <View style={styles.aiBox}>
                  <View style={styles.aiBoxHeader}>
                    <SparklesIcon size={14} color={Colors.gold} />
                    <Text style={styles.aiBoxTitle}>FitAI Smart Support</Text>
                  </View>
                  <Text style={styles.aiBoxText}>{step.aiHighlight}</Text>
                </View>

                <View style={styles.hintRow}>
                  <Text style={styles.hintText}>💡 {step.actionHint}</Text>
                </View>
              </ScrollView>

              {/* Step Controls */}
              <View style={styles.footer}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                  <Text style={styles.skipText}>Close</Text>
                </TouchableOpacity>

                <View style={styles.navButtonsRight}>
                  {currentStepIndex > 0 && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                      <ChevronLeftIcon size={16} color={Colors.gold} />
                      <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    <Text style={styles.nextText}>
                      {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Guide' : 'Next'}
                    </Text>
                    <ChevronRightIcon size={16} color="#0A0A0A" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            /* Feature Overview List */
            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={true}>
              {TOUR_STEPS.map((item, idx) => (
                <View key={item.id} style={styles.overviewCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <View style={styles.overviewIconCircle}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#0A0A0A' }}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.overviewTitle}>{item.title}</Text>
                      <Text style={styles.overviewSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Text style={styles.overviewContent}>{item.content}</Text>
                  <View style={{ backgroundColor: '#101010', padding: 10, borderRadius: Radii.xs, marginTop: 8, borderWidth: 1, borderColor: 'rgba(245, 196, 0, 0.2)' }}>
                    <Text style={{ fontSize: 12, color: Colors.gold, fontWeight: '700' }}>💡 Tip: {item.actionHint}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: '#161616',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.3)',
    padding: Spacing.lg,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#101010',
    padding: 4,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.xs,
  },
  toggleBtnActive: {
    backgroundColor: Colors.gold,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text2,
  },
  toggleTextActive: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.xs,
  },
  badgeText: {
    color: '#0A0A0A',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stepCounter: {
    color: Colors.text2,
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginVertical: Spacing.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
  body: {
    flex: 1,
    marginVertical: Spacing.sm,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: Colors.gold,
    marginTop: 2,
  },
  contentParagraph: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  aiBox: {
    backgroundColor: '#101010',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.25)',
    marginBottom: Spacing.md,
  },
  aiBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiBoxText: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 19,
  },
  hintRow: {
    backgroundColor: 'rgba(245, 196, 0, 0.1)',
    padding: Spacing.sm,
    borderRadius: Radii.xs,
  },
  hintText: {
    fontSize: 12,
    color: Colors.gold,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  skipText: {
    color: Colors.text2,
    fontSize: 13,
    fontWeight: '600',
  },
  navButtonsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(245, 196, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.3)',
  },
  backText: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.sm,
    backgroundColor: Colors.gold,
  },
  nextText: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: '800',
  },
  overviewCard: {
    backgroundColor: '#101010',
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  overviewIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  overviewSubtitle: {
    fontSize: 11,
    color: Colors.gold,
  },
  overviewContent: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
});
