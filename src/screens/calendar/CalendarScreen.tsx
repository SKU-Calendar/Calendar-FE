import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, SafeAreaView, Alert, ActivityIndicator, PanResponder, Animated, Dimensions, Modal } from 'react-native';
import dayjs from 'dayjs';
import { getEventsByDate, getEvents, createEvent, deleteEvent, type Event } from '@/api/events';
import { getEventColor, getColorForEvent, EVENT_COLORS, THEME } from '@/utils/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CalendarScreen: React.FC = () => {
  const [viewDate, setViewDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  // --- 스와이프 제스처 처리 수정 ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isAnimating && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const SWIPE_THRESHOLD = 50;
        const SWIPE_VELOCITY_THRESHOLD = 0.3;

        const shouldSwipe = 
          Math.abs(gestureState.dx) > SWIPE_THRESHOLD || 
          Math.abs(gestureState.vx) > SWIPE_VELOCITY_THRESHOLD;

        if (shouldSwipe && !isAnimating) {
          setIsAnimating(true);
          
          // dx > 0 이면 오른쪽으로 민 것(이전 달), dx < 0 이면 왼쪽으로 민 것(다음 달)
          const isRightSwipe = gestureState.dx > 0;
          const targetX = isRightSwipe ? SCREEN_WIDTH : -SCREEN_WIDTH;
          
          // 먼저 날짜를 변경하여 데이터를 미리 로드
          if (isRightSwipe) {
            setViewDate((prev) => prev.subtract(1, 'month'));
          } else {
            setViewDate((prev) => prev.add(1, 'month'));
          }
          
          Animated.timing(translateX, {
            toValue: targetX,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            // 애니메이션 완료 후 위치 리셋
            translateX.setValue(0);
            setIsAnimating(false);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // 월의 모든 일정을 로드 (viewDate 변경 시)
  useEffect(() => {
    loadMonthEvents();
  }, [viewDate]);

  const loadMonthEvents = async () => {
    setLoading(true);
    try {
      const startDate = viewDate.startOf('month').format('YYYY-MM-DD');
      const endDate = viewDate.endOf('month').format('YYYY-MM-DD');
      const response = await getEvents(startDate, endDate);
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('월 일정 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const startOfMonth = viewDate.startOf('month');
  const daysInMonth = viewDate.daysInMonth();
  const startDay = startOfMonth.day();

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push({ label: '', iso: `empty-${i}`, isDay: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateObj = viewDate.date(i);
    calendarDays.push({
      label: i.toString(),
      iso: dateObj.format('YYYY-MM-DD'),
      isDay: true,
    });
  }

  // 7개씩 나누어 주(week) 배열 생성
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    const week = [...calendarDays.slice(i, i + 7)];
    // 마지막 주가 7개 미만이면 빈 셀로 채우기
    while (week.length < 7) {
      week.push({ label: '', iso: `empty-${i + week.length}`, isDay: false });
    }
    weeks.push(week);
  }

  const handleAddEvent = async () => {
    if (!newEventTitle.trim()) {
      Alert.alert('알림', '일정 제목을 입력해주세요.');
      return;
    }
    setAdding(true);
    try {
      const color = selectedColor || getColorForEvent(newEventTitle.trim());
      const response = await createEvent({
        title: newEventTitle.trim(),
        date: selectedDate,
        color: color,
      });
      if (response.success && response.data) {
        // 새 일정이 현재 월에 속하면 events에 추가
        const eventDate = dayjs(response.data.date);
        if (eventDate.month() === viewDate.month() && eventDate.year() === viewDate.year()) {
          setEvents((prev) => [...prev, response.data!]);
        }
        setNewEventTitle('');
        setSelectedColor(null);
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    Alert.alert('일정 삭제', '정말 이 일정을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const response = await deleteEvent(id);
          if (response.success) {
            setEvents((prev) => prev.filter((e) => e.id !== id));
          }
        },
      },
    ]);
  };

  const filteredEvents = events.filter((e) => e.date === selectedDate);
  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.monthHeader}>
        <Text style={styles.headerTitle}>{viewDate.format('YYYY년 MM월')}</Text>
      </View>

      <View style={styles.weekLabels}>
        {daysOfWeek.map((day, i) => (
          <Text key={day} style={[styles.weekLabelText, i === 0 && { color: '#ef4444' }, i === 6 && { color: '#3b82f6' }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarContainer} {...panResponder.panHandlers}>
        <Animated.View style={[styles.calendarContent, { transform: [{ translateX }] }]}>
          <View style={styles.gridContainer}>
            {weeks.map((week, weekIndex) => (
              <View key={`${viewDate.format('YYYY-MM')}-${weekIndex}`} style={styles.weekRow}>
                {week.map((d) => {
                  const isSelected = d.iso === selectedDate;
                  const isToday = d.iso === dayjs().format('YYYY-MM-DD');
                  return (
                    <TouchableOpacity
                      key={d.iso}
                      disabled={!d.isDay || isAnimating}
                      style={[styles.dayCell, isSelected && styles.daySelected]}
                      onPress={() => d.isDay && setSelectedDate(d.iso)}
                    >
                      <Text style={[styles.dayText, isToday && styles.todayText, isSelected && { color: '#fff' }]}>
                        {d.label}
                      </Text>
                      {d.isDay && (() => {
                        const dayEvents = events.filter(e => e.date === d.iso);
                        if (dayEvents.length === 0) return null;
                        const eventsToShow = dayEvents.slice(0, 2);
                        return (
                          <View style={styles.eventLabelsContainer}>
                            {eventsToShow.map((event, idx) => {
                              const eventColor = getEventColor(event);
                              return (
                                <View key={event.id || idx} style={[styles.eventLabel, { backgroundColor: eventColor }]}>
                                  <Text style={styles.eventLabelText} numberOfLines={1} ellipsizeMode="tail">
                                    {event.title}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })()}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={styles.divider} />

      <View style={styles.selectedDateInfo}>
        <Text style={styles.infoText}>{dayjs(selectedDate).format('MM월 DD일')} 일정</Text>
      </View>
      
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="새 일정 입력"
          value={newEventTitle}
          onChangeText={setNewEventTitle}
          editable={!adding}
        />
        <TouchableOpacity style={styles.colorPickerButton} onPress={() => setColorPickerVisible(true)} disabled={adding}>
          <View style={[styles.colorIndicator, { backgroundColor: selectedColor || getColorForEvent(newEventTitle || '') }]} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addButton, adding && styles.buttonDisabled]} onPress={handleAddEvent} disabled={adding}>
          {adding ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addButtonText}>추가</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={colorPickerVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.colorPickerOverlay} activeOpacity={1} onPress={() => setColorPickerVisible(false)}>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>색상 선택</Text>
            <View style={styles.colorPalette}>
              <TouchableOpacity style={styles.colorOptionContainer} onPress={() => { setSelectedColor(null); setColorPickerVisible(false); }}>
                <View style={[styles.colorOption, !selectedColor && styles.colorOptionSelected, { backgroundColor: getColorForEvent(newEventTitle || '') }]}>
                  {!selectedColor && <View style={styles.colorOptionCheckmark} />}
                </View>
                <Text style={styles.colorOptionLabel}>자동</Text>
              </TouchableOpacity>
              {EVENT_COLORS.map((color) => (
                <TouchableOpacity key={color} style={styles.colorOptionContainer} onPress={() => { setSelectedColor(color); setColorPickerVisible(false); }}>
                  <View style={[styles.colorOption, selectedColor === color && styles.colorOptionSelected, { backgroundColor: color }]}>
                    {selectedColor === color && <View style={styles.colorOptionCheckmark} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.eventsContainer}>
      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={THEME.primary} /></View>
      ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>일정이 없습니다.</Text>}
            renderItem={({ item }) => (
              <View style={styles.eventItem}>
                <View style={styles.eventItemContent}>
                  <View style={[styles.eventColorBar, { backgroundColor: getEventColor(item) }]} />
                  <Text style={styles.eventTitle}>{item.title}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteEvent(item.id)}>
                  <Text style={styles.deleteText}>삭제</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// ... 기존 스타일 코드와 동일 ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, paddingHorizontal: 16 },
  monthHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6, marginBottom: 6, paddingVertical: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.text, letterSpacing: 0.3 },
  calendarContainer: { overflow: 'hidden', backgroundColor: THEME.backgroundWhite, borderRadius: 20, padding: 10, marginBottom: 4, shadowColor: THEME.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, flex: 1 },
  calendarContent: { width: '100%' },
  weekLabels: { flexDirection: 'row', marginBottom: 6, paddingHorizontal: 4 },
  weekLabelText: { flex: 1, textAlign: 'center', fontWeight: '600', color: THEME.textSecondary, fontSize: 13 },
  gridContainer: { width: '100%' },
  weekRow: { flexDirection: 'row', width: '100%' },
  dayCell: { flex: 1, minHeight: 80, justifyContent: 'flex-start', alignItems: 'center', marginBottom: 3, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 2 },
  daySelected: { backgroundColor: THEME.primary },
  dayText: { fontSize: 15, color: THEME.text, fontWeight: '500', marginBottom: 2 },
  todayText: { fontWeight: '700', color: THEME.primary },
  eventLabelsContainer: { width: '100%', alignItems: 'center', marginTop: 2, gap: 2 },
  eventLabel: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, width: '95%', minHeight: 16, justifyContent: 'center' },
  eventLabelText: { fontSize: 9, color: '#ffffff', fontWeight: '500', textAlign: 'center' },
  divider: { height: 1, backgroundColor: THEME.borderLight, marginVertical: 8 },
  selectedDateInfo: { marginBottom: 6, paddingLeft: 4 },
  infoText: { fontSize: 16, fontWeight: '700', color: THEME.text },
  addRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1.5, borderColor: THEME.border, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginRight: 10, backgroundColor: THEME.backgroundWhite },
  colorPickerButton: { width: 44, height: 44, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  colorIndicator: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: THEME.borderLight },
  addButton: { backgroundColor: THEME.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  colorPickerOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  colorPickerContainer: { backgroundColor: THEME.backgroundWhite, borderRadius: 24, padding: 24, width: '80%' },
  colorPickerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  colorPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  colorOptionContainer: { alignItems: 'center' },
  colorOption: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  colorOptionSelected: { borderColor: THEME.primary, borderWidth: 3 },
  colorOptionCheckmark: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  colorOptionLabel: { fontSize: 12, marginTop: 6, color: THEME.textSecondary },
  eventItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, marginBottom: 4, backgroundColor: THEME.backgroundWhite, borderRadius: 16 },
  eventItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  eventColorBar: { width: 5, height: 36, borderRadius: 3, marginRight: 14 },
  eventTitle: { fontSize: 16, flex: 1, color: THEME.text },
  deleteText: { color: THEME.error, fontWeight: '600', paddingHorizontal: 12 },
  emptyText: { textAlign: 'center', marginTop: 10, color: THEME.textLight },
  buttonDisabled: { opacity: 0.6 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', paddingTop: 10, minHeight: 60 },
  eventsContainer: { maxHeight: 220, flex: 0 }
});

export default CalendarScreen;