/**
 * FitAI Pro — High-Quality SVG Icon Components
 * Replaces Ionicons with crisp, inline SVG icons using react-native-svg.
 * All icons accept `size` and `color` props for full flexibility.
 */

import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// ─── Bell / Notifications ──────────────────────────────────────────────────
export const BellIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Flame / Calories ──────────────────────────────────────────────────────
export const FlameIcon = ({ size = 24, color = '#FFB300', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 01-7-7c0-1.507.333-2.078.875-3 .531.28 1.125 1 1.125 2.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Dumbbell / Workout ────────────────────────────────────────────────────
export const DumbbellIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 5v14M18 5v14" stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
    <Path d="M3 7v10M21 7v10" stroke={color} strokeWidth={strokeWidth + 1} strokeLinecap="round" />
    <Path d="M6 12h12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ─── Sparkles / AI ────────────────────────────────────────────────────────
export const SparklesIcon = ({ size = 24, color = '#FFD60A', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75L19 3zM5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"
      stroke={color}
      strokeWidth={strokeWidth - 0.3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Arrow Right ──────────────────────────────────────────────────────────
export const ArrowRightIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Arrow Forward Circle ──────────────────────────────────────────────────
export const ArrowForwardCircleIcon = ({ size = 24, color = '#FFD60A', strokeWidth = 1.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M8 12h8M13 8l4 4-4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Clock / Time ─────────────────────────────────────────────────────────
export const TimeIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Scale / Weight ───────────────────────────────────────────────────────
export const ScaleIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3a1 1 0 100 2 1 1 0 000-2z" fill={color} />
    <Path d="M3 6l9-3 9 3M3 6l3 9h12l3-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 21h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M12 5v16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ─── Body / Height ────────────────────────────────────────────────────────
export const BodyIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="4" r="2" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 6v6M9 9h6M9 22l3-6 3 6M9 16l3-6 3 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Stopwatch ────────────────────────────────────────────────────────────
export const StopwatchIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 9v4l2.5 2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 2h6M12 2v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ─── Google Logo ──────────────────────────────────────────────────────────
export const GoogleIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </Svg>
);

// ─── Logout ───────────────────────────────────────────────────────────────
export const LogoutIcon = ({ size = 24, color = '#EF4444', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ─── Star ─────────────────────────────────────────────────────────────────
export const StarIcon = ({ size = 24, color = '#FFD60A', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon
      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="rgba(255,214,10,0.2)"
    />
  </Svg>
);

// ─── Checkmark ────────────────────────────────────────────────────────────
export const CheckIcon = ({ size = 24, color = '#0A0A0A', strokeWidth = 2.5 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Radio Button On ──────────────────────────────────────────────────────
export const RadioOnIcon = ({ size = 24, color = '#FFD60A', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="5" fill={color} />
  </Svg>
);

// ─── Radio Button Off ─────────────────────────────────────────────────────
export const RadioOffIcon = ({ size = 24, color = '#555', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// ─── Create / Edit ────────────────────────────────────────────────────────
export const EditIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Volume / Sound ───────────────────────────────────────────────────────
export const VolumeIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ─── Hand / Haptics ───────────────────────────────────────────────────────
export const HandIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 11V6a2 2 0 00-4 0M14 10V4a2 2 0 00-4 0v2M10 10.5V6a2 2 0 00-4 0v8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 14a2 2 0 000 4h8a4 4 0 004-4v-2.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Watch / Wearable ─────────────────────────────────────────────────────
export const WatchIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="7" y="7" width="10" height="10" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M9 17v2a1 1 0 001 1h4a1 1 0 001-1v-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M12 10v2l1.5 1.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Alert Circle ─────────────────────────────────────────────────────────
export const AlertCircleIcon = ({ size = 24, color = '#FFB300', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={strokeWidth + 0.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── User / Person ────────────────────────────────────────────────────────
export const UserIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// ─── Trending Up / Analytics ──────────────────────────────────────────────
export const TrendingUpIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="17 6 23 6 23 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Calendar ─────────────────────────────────────────────────────────────
export const CalendarIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ─── Leaf / Nutrition ─────────────────────────────────────────────────────
export const LeafIcon = ({ size = 24, color = '#a3e635', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 3-8 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Home ─────────────────────────────────────────────────────────────────
export const HomeIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9.5L12 3l9 6.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 22V12h6v10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Heart / Recovery ─────────────────────────────────────────────────────
export const HeartIcon = ({ size = 24, color = '#EF4444', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Moon / Rest ──────────────────────────────────────────────────────────
export const MoonIcon = ({ size = 24, color = '#818cf8', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Zap / Energy ─────────────────────────────────────────────────────────
export const ZapIcon = ({ size = 24, color = '#FFD60A', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Activity / HRV ───────────────────────────────────────────────────────
export const ActivityIcon = ({ size = 24, color = '#34d399', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Droplets / Hydration ─────────────────────────────────────────────────
export const DropletIcon = ({ size = 24, color = '#38bdf8', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── ChevronRight ─────────────────────────────────────────────────────────
export const ChevronRightIcon = ({ size = 24, color = '#fff', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Plus ─────────────────────────────────────────────────────────────────
export const PlusIcon = ({ size = 24, color = '#fff', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ─── Info ─────────────────────────────────────────────────────────────────
export const InfoIcon = ({ size = 24, color = '#60a5fa', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={strokeWidth + 0.2} strokeLinecap="round" />
  </Svg>
);

// ─── Barbell (alias for DumbbellIcon with thicker stroke) ─────────────────
export const BarbellIcon = ({ size = 24, color = '#FFD60A', strokeWidth = 2 }: IconProps) => (
  <DumbbellIcon size={size} color={color} strokeWidth={strokeWidth} />
);

// ─── Map Pin / Location ───────────────────────────────────────────────────
export const MapPinIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// ─── Wind / Breathing ─────────────────────────────────────────────────────
export const WindIcon = ({ size = 24, color = '#38bdf8', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9.59 4.59A2 2 0 1111 8H2M12.59 19.41A2 2 0 1014 16H2M17.73 7.73A2.5 2.5 0 1119.5 12H2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Search ────────────────────────────────────────────────────────────────
export const SearchIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// ─── Filter ────────────────────────────────────────────────────────────────
export const FilterIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Eye / View ────────────────────────────────────────────────────────────
export const EyeIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// ─── Refresh / Rollback / Restore ──────────────────────────────────────────
export const RefreshIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 4v6h-6M1 20v-6h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── GitDiff / Compare ─────────────────────────────────────────────────────
export const GitDiffIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="18" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M6 9v6M13 6h3a2 2 0 012 2v7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Target / Goal ────────────────────────────────────────────────────────
export const TargetIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// ─── Settings / Gear ──────────────────────────────────────────────────────
export const SettingsIcon = ({ size = 24, color = '#fff', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
