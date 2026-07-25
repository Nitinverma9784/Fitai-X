import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { AIChatModal } from '@/components/AIChatModal';

// ─── FAB AI Button (centre slot) ─────────────────────────────────────────────
function AiTabButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={fab.wrapper}>
      <View style={fab.outerRing}>
        <View style={fab.inner}>
          <MaterialCommunityIcons name="brain" size={28} color="#0A0A0A" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const fab = StyleSheet.create({
  wrapper: {
    top: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245,196,0,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(245,196,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
  },
  inner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const [showAiChat, setShowAiChat] = useState(false);

  return (
    <>
      <AIChatModal visible={showAiChat} onClose={() => setShowAiChat(false)} />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.gold,
          tabBarInactiveTintColor: Colors.text2,
          tabBarStyle: {
            backgroundColor: '#0A0A0A',
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            paddingTop: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: '700',
            marginTop: 2,
          },
        }}>

        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="workout"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={24} color={color} />
            ),
          }}
        />

        {/* Centre AI FAB — custom button intercepts press, opens modal instead of navigating */}
        <Tabs.Screen
          name="nutrition"
          options={{
            title: '',
            tabBarLabel: () => null,
            tabBarIcon: () => null,
            tabBarButton: () => (
              <AiTabButton onPress={() => setShowAiChat(true)} />
            ),
          }}
        />

        {/* Analytics hidden from nav — accessible via Profile */}
        <Tabs.Screen
          name="analytics"
          options={{
            tabBarButton: () => null,
          }}
        />

        <Tabs.Screen
          name="recovery"
          options={{
            title: 'Recovery',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
