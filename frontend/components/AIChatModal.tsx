import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';
import { groqService, UserProfile } from '@/services/groqService';

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isStreaming?: boolean;
}

const PRESET_CHIPS = [
  { label: '🥗 Create Meal Plan', prompt: 'Create a personalized high-protein daily meal plan based on my target weight and goals.' },
  { label: '🏋️ Today\'s Best Workout', prompt: 'What is my recommended workout routine for today based on my energy and rest?' },
  { label: '🩹 Joint & Recovery Care', prompt: 'How should I modify my workout if I feel mild joint soreness?' },
  { label: '⚡ Energy & Fatigue Tips', prompt: 'How can I optimize my sleep and recovery for maximum energy tomorrow?' },
];

const THINKING_STEPS = [
  '✨ Reviewing your fitness goals and weight...',
  '⚡ Crafting your personalized recommendation...',
  '🌟 Formatting your custom plan...',
];

export function AIChatModal({ visible, onClose }: AIChatModalProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function initCoach() {
      const u = await groqService.getUserProfile();
      setUserProfile(u);

      const name = u?.name || (u?.email ? u.email.split('@')[0] : 'Athlete');
      const goal = u?.goal || 'Fitness & Health';

      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `👋 Hey ${name}! I am FitGuru, your personal AI fitness coach.\n\nI am ready to help you with your ${goal} journey. Tap any quick suggestion below or ask me anything!`,
        },
      ]);
    }
    if (visible) {
      initCoach();
    }
  }, [visible]);

  // Thinking Step Animation
  useEffect(() => {
    let interval: any;
    if (loading) {
      setThinkingStep(0);
      interval = setInterval(() => {
        setThinkingStep(prev => (prev + 1) % THINKING_STEPS.length);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Character-by-character slow typing animation
  const streamMessageText = (fullText: string) => {
    const msgId = Date.now().toString();
    const newMsg: Message = { id: msgId, sender: 'ai', text: '', isStreaming: true };

    setMessages(prev => [...prev, newMsg]);

    let charIndex = 0;
    const speedMs = 16;

    const typeInterval = setInterval(() => {
      charIndex += 2;
      const currentText = fullText.slice(0, charIndex);

      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, text: currentText } : m))
      );

      scrollViewRef.current?.scrollToEnd({ animated: true });

      if (charIndex >= fullText.length) {
        clearInterval(typeInterval);
        setMessages(prev =>
          prev.map(m => (m.id === msgId ? { ...m, text: fullText, isStreaming: false } : m))
        );
      }
    }, speedMs);
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptText.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const contextualPrompt = userProfile
        ? `[User Profile Context: Name=${userProfile.name || 'Athlete'}, Age=${userProfile.age || 'N/A'}, Height=${userProfile.height_cm || 'N/A'}cm, Weight=${userProfile.weight_kg || 'N/A'}kg, Goal=${userProfile.goal || 'General Fitness'}, Diet=${userProfile.diet_preference || 'Balanced'}, Equipment=${userProfile.equipment || 'Gym'}, Injuries=${Array.isArray(userProfile.injuries) ? userProfile.injuries.join(', ') : (userProfile.injuries || 'None')}, Time=${userProfile.time_commitment || '45m'}] ${promptText}`
        : promptText;

      const response = await groqService.chatWithCoach(contextualPrompt);
      setLoading(false);
      streamMessageText(response);
    } catch {
      setLoading(false);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'I am taking a quick breather! Please tap send again in a moment.',
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const renderFormattedText = (text: string, isUser: boolean) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return (
          <Text
            key={index}
            style={{
              fontWeight: '800',
              color: isUser ? '#0A0A0A' : Colors.gold,
            }}>
            {content}
          </Text>
        );
      } else if (part.startsWith('*') && part.endsWith('*')) {
        const content = part.slice(1, -1);
        return (
          <Text
            key={index}
            style={{
              fontStyle: 'italic',
              color: isUser ? '#0A0A0A' : '#F8FAFC',
            }}>
            {content}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View style={styles.modalWrapper}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header - Sleek Yellow & Dark */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.goldBadgeIcon}>
                <MaterialCommunityIcons name="brain" size={20} color="#0A0A0A" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.title}>Fitness Coach</Text>
                <Text style={styles.subtitle}>FitGuru • Ready to Help</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.gold} />
            </TouchableOpacity>
          </View>

          {/* Chat Stream */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}>
            {messages.map(msg => (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}>
                <Text
                  style={[
                    styles.bubbleText,
                    msg.sender === 'user' ? styles.userText : styles.aiText,
                  ]}>
                  {renderFormattedText(msg.text, msg.sender === 'user')}
                  {msg.isStreaming && <Text style={{ color: Colors.gold }}> ❘</Text>}
                </Text>
              </View>
            ))}

            {/* Thinking Animation */}
            {loading && (
              <View style={[styles.bubble, styles.aiBubble, styles.loadingBubble]}>
                <ActivityIndicator color={Colors.gold} size="small" style={{ marginRight: 8 }} />
                <Text style={styles.thinkingText}>{THINKING_STEPS[thinkingStep]}</Text>
              </View>
            )}
          </ScrollView>

          {/* Preset Chips Row - Yellow / Black */}
          <View style={styles.presetRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {PRESET_CHIPS.map(chip => (
                <TouchableOpacity
                  key={chip.label}
                  disabled={loading}
                  style={styles.chipButton}
                  onPress={() => handleSendPrompt(chip.prompt)}>
                  <Text style={styles.chipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Bar */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask FitGuru anything about fitness or meals..."
              placeholderTextColor="#888888"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendPrompt(inputText)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.disabledSend]}
              onPress={() => handleSendPrompt(inputText)}
              disabled={!inputText.trim() || loading}>
              <Ionicons name="arrow-up" size={20} color="#0A0A0A" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    width: '100%',
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    position: Platform.OS === 'web' ? ('fixed' as any) : 'relative',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 64 : (StatusBar.currentHeight ?? 0) + 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 196, 0, 0.2)',
    backgroundColor: '#161616',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goldBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 196, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.3)',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatContent: {
    paddingVertical: 16,
    gap: 12,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.gold,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.25)',
    borderBottomLeftRadius: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
  },
  thinkingText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userText: {
    color: '#0A0A0A',
    fontWeight: '800',
  },
  aiText: {
    color: '#F8FAFC',
    fontWeight: '400',
  },
  presetRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#101010',
  },
  chipButton: {
    backgroundColor: 'rgba(245, 196, 0, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 0, 0.3)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 196, 0, 0.2)',
    backgroundColor: '#161616',
  },
  input: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    borderRadius: Radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledSend: {
    opacity: 0.4,
  },
});
