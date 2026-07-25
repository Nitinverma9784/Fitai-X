import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { sessionService } from '@/services/sessionService';
import Constants from 'expo-constants';

// ─── Backend URL ─────────────────────────────────────────────────────────────
function resolveBackendUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:5000/api';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:5000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
}
const BASE = resolveBackendUrl();

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': String(sessionService.getUserId()),
  };
  const token = sessionService.getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// ─── Dot Typing Animation ─────────────────────────────────────────────────────
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    Animated.parallel([anim(dot1, 0), anim(dot2, 200), anim(dot3, 400)]).start();
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: Colors.gold,
    opacity: dot,
    transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', gap: 5, padding: 12, alignItems: 'center' }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[s.bubbleRow, isUser && s.bubbleRowUser]}>
      {!isUser && (
        <View style={s.aiAvatar}>
          <Text style={s.aiAvatarText}>AI</Text>
        </View>
      )}
      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAi]}>
        <Text style={[s.bubbleText, isUser && s.bubbleTextUser]}>{msg.content}</Text>
        <Text style={[s.bubbleTime, isUser && { color: 'rgba(10,10,10,0.5)' }]}>
          {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

// ─── Quick Prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "How sore should I expect to be?",
  "Give me a stretching routine",
  "How to improve my deadlift?",
  "Best foods for muscle recovery",
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AiChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  // Load chat history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${BASE}/coach/history`, { headers: headers() });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped: ChatMessage[] = json.data.map((m: any) => ({
            id: String(m.id || Math.random()),
            role: m.role === 'user' ? 'user' : 'ai',
            content: m.content || m.message || '',
            timestamp: new Date(m.created_at || Date.now()),
          }));
          setMessages(mapped);
        }
      } catch { /* silent */ } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${BASE}/coach/chat`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ message: trimmed }),
      });
      const json = await res.json();
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'ai',
        content: json.response || "I'm here to help — ask me anything about your training!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: "Couldn't reach the server. Check your connection and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>AI COACH</Text>
          <Text style={s.title}>FitGuru Chat</Text>
        </View>
        <View style={s.onlineDot} />
        <Text style={s.onlineText}>Online</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.msgList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {loadingHistory ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator color={Colors.gold} />
              <Text style={{ color: Colors.text2, marginTop: 10, fontSize: 13 }}>Loading history...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={s.emptyState}>
              {/* Glowing orb */}
              <View style={s.orb}>
                <Text style={s.orbText}>🤖</Text>
              </View>
              <Text style={s.emptyTitle}>Your AI Coach is ready</Text>
              <Text style={s.emptySub}>
                Ask me anything — workout plans, nutrition tips, recovery advice, form cues, and more.
              </Text>
              {/* Quick prompts */}
              <View style={s.quickGrid}>
                {QUICK_PROMPTS.map((p, i) => (
                  <TouchableOpacity key={i} style={s.quickBtn} onPress={() => sendMessage(p)} activeOpacity={0.75}>
                    <Text style={s.quickBtnText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {isTyping && (
                <View style={s.bubbleRow}>
                  <View style={s.aiAvatar}><Text style={s.aiAvatarText}>AI</Text></View>
                  <View style={[s.bubble, s.bubbleAi]}>
                    <TypingDots />
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your AI coach..."
            placeholderTextColor={Colors.text2}
            multiline
            maxLength={800}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            blurOnSubmit
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || isTyping) && s.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            activeOpacity={0.8}>
            {isTyping
              ? <ActivityIndicator size="small" color="#0A0A0A" />
              : <Text style={s.sendBtnText}>↑</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: Colors.text, lineHeight: 24 },
  kicker: { fontSize: 9, fontWeight: '800', color: Colors.gold, letterSpacing: 1 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  onlineText: { fontSize: 11, fontWeight: '700', color: '#4ADE80' },

  msgList: { padding: Spacing.lg, paddingBottom: 20, flexGrow: 1 },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(245,196,0,0.15)',
    borderWidth: 1, borderColor: 'rgba(245,196,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiAvatarText: { fontSize: 9, fontWeight: '900', color: Colors.gold },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAi: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.gold,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  bubbleTextUser: { color: '#0A0A0A', fontWeight: '600' },
  bubbleTime: { fontSize: 10, color: Colors.text2, marginTop: 4, textAlign: 'right' },

  emptyState: { flex: 1, alignItems: 'center', paddingTop: 40 },
  orb: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(245,196,0,0.1)',
    borderWidth: 2, borderColor: 'rgba(245,196,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  orbText: { fontSize: 38 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.text2, textAlign: 'center', lineHeight: 19, marginBottom: 28, paddingHorizontal: 20 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingHorizontal: 8 },
  quickBtn: {
    backgroundColor: Colors.card, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnText: { fontSize: 12, color: Colors.text2, fontWeight: '600' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#0A0A0A',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendBtnDisabled: { backgroundColor: Colors.card, shadowOpacity: 0 },
  sendBtnText: { fontSize: 20, fontWeight: '800', color: '#0A0A0A', lineHeight: 24 },
});
