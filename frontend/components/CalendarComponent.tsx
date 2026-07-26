import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

interface CalendarComponentProps {
  loggedDates: Set<string>;
  onSelectDate: (dateStr: string) => void;
  selectedDate: string;
}

export function CalendarComponent({ loggedDates, onSelectDate, selectedDate }: CalendarComponentProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const yearNum = currentDate.getFullYear();
  const monthNum = currentDate.getMonth(); // 0-indexed
  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const totalDaysInMonth = new Date(yearNum, monthNum + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === yearNum && today.getMonth() === monthNum;
  const todayDayNum = today.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(yearNum, monthNum - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(yearNum, monthNum + 1, 1));
  };

  // Get weekday offset of day 1 (0 = Sun, 1 = Mon, ... 6 = Sat)
  const firstDayWeekday = new Date(yearNum, monthNum, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = (firstDayWeekday + 6) % 7;

  return (
    <View style={styles.card}>
      {/* Month Navigation Header */}
      <View style={styles.headerRow}>
        <Text style={styles.monthTitle}>{monthName} {yearNum}</Text>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
            <Ionicons name="chevron-back" size={16} color={Colors.text2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
            <Ionicons name="chevron-forward" size={16} color={Colors.text2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Column Headers */}
      <View style={styles.weekHeaderRow}>
        {(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const).map((day, idx) => (
          <View key={idx} style={styles.cellWrapper}>
            <Text style={styles.weekHeadText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 7-Column Centered Days Grid */}
      <View style={styles.daysGrid}>
        {/* Leading Empty Offsets */}
        {Array.from({ length: startOffset }).map((_, idx) => (
          <View key={`empty-${idx}`} style={styles.cellWrapper} />
        ))}

        {/* Day Cells */}
        {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isToday = isCurrentMonth && dayNum === todayDayNum;
          const isFuture = isCurrentMonth ? dayNum > todayDayNum : currentDate > today;
          const isSelected = selectedDate === dateStr;
          const hasData = loggedDates.has(dateStr);

          return (
            <View key={dayNum} style={styles.cellWrapper}>
              <TouchableOpacity
                disabled={isFuture}
                style={[
                  styles.daySquare,
                  isSelected && styles.daySquareSelected,
                  isToday && !isSelected && styles.daySquareToday,
                  isFuture && styles.daySquareDisabled,
                ]}
                onPress={() => onSelectDate(dateStr)}
                activeOpacity={0.75}>
                <Text style={[
                  styles.dayNumText,
                  isSelected && styles.dayNumSelected,
                  isToday && !isSelected && styles.dayNumTodayText,
                  isFuture && styles.dayNumDisabledText,
                ]}>
                  {dayNum}
                </Text>
                {hasData && (
                  <View style={[styles.dataDot, isSelected && { backgroundColor: '#0A0A0A' }]} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  navRow: {
    flexDirection: 'row',
    gap: 6,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cellWrapper: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  weekHeadText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text2,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  daySquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  daySquareSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  daySquareToday: {
    borderColor: Colors.gold,
  },
  daySquareDisabled: {
    opacity: 0.25,
    backgroundColor: 'transparent',
  },
  dayNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text2,
  },
  dayNumSelected: {
    color: '#0A0A0A',
    fontWeight: '900',
  },
  dayNumTodayText: {
    color: Colors.gold,
    fontWeight: '800',
  },
  dayNumDisabledText: {
    color: '#555',
  },
  dataDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    position: 'absolute',
    bottom: 3,
  },
});
