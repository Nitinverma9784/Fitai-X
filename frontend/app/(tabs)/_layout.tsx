import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Platform, TouchableOpacity, View, StyleSheet } from 'react-native';
import { AIChatModal } from '@/components/AIChatModal';

// ─── FAB AI Button (centre slot) ─────────────────────────────────────────────
function AiTabButton({ onPress, ...props }: any) {
  return (
    <TouchableOpacity
      {...props}
      onPress={onPress}
      activeOpacity={0.85}
      style={[props.style, fab.wrapper]}>
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
    flex: 1,
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245,196,0,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(245,196,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  inner: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
            borderTopColor: '#1F1F1F',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 6,
            elevation: 0,
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

        {/* Centre AI FAB */}
        <Tabs.Screen
          name="nutrition"
          options={{
            title: '',
            tabBarLabel: () => null,
            tabBarIcon: () => null,
            tabBarButton: (props) => (
              <AiTabButton {...props} onPress={() => setShowAiChat(true)} />
            ),
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

        <Tabs.Screen
          name="analytics"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
