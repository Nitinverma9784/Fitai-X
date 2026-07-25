/**
 * FitAI Pro Design System Theme Tokens
 * Strictly adhering to style/0_style_guide.html specifications.
 */

export const Colors = {
  bg: '#0A0A0A',
  card: '#161616',
  card2: '#101010',
  
  // Gold / Yellow Accent Scale
  gold: '#F5C400',
  brightYellow: '#FFD60A',
  amberGold: '#FFB300',
  darkGold: '#CA8A04',
  paleGold: '#FDE68A',
  
  // Status Colors
  green: '#A3E635',
  amber: '#F59E0B',
  red: '#EF4444',
  
  // Neutral Typography & Borders
  text: '#FFFFFF',
  text2: '#B0AA9A',
  textBright: '#F8FAFC',
  textDim: '#CBD5E1',
  textMuted: '#94A3B8',
  border: 'rgba(255, 214, 10, 0.09)',
  borderLight: 'rgba(255, 214, 10, 0.18)',
  
  // Custom Accents
  accentBlue: '#38BDF8',
  accentOrange: '#F97316',
  
  // Gradients (for linear gradient usage)
  gradients: {
    primaryBtn: ['#F5C400', '#FFB300'] as const,
    ctaBtn: ['#F5C400', '#CA8A04'] as const,
    activeTab: ['#F5C400', '#FFD60A'] as const,
    heroWorkout: ['#1C1C1C', '#131313', '#0A0A0A'] as const,
    heroRecovery: ['#111111', '#191919'] as const,
    cardGold: ['#F5C400', '#FDE68A'] as const,
  },

  // React Navigation Theme Bridge
  dark: {
    text: '#FFFFFF',
    background: '#0A0A0A',
    tint: '#F5C400',
    icon: '#B0AA9A',
    tabIconDefault: '#B0AA9A',
    tabIconSelected: '#F5C400',
  },
  light: {
    text: '#FFFFFF',
    background: '#0A0A0A',
    tint: '#F5C400',
    icon: '#B0AA9A',
    tabIconDefault: '#B0AA9A',
    tabIconSelected: '#F5C400',
  }
};

export const Radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
