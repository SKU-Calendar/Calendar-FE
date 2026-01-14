import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '@/api/auth';
import { THEME } from '@/utils/colors';

const SettingsScreen: React.FC = () => {
  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // RootNavigator에서 isLoggedIn 상태가 변경되면 자동으로 Auth 화면으로 이동합니다
              // navigation.reset은 필요하지 않습니다
            } catch (error: any) {
              Alert.alert('오류', error.message || '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>설정</Text>
      <Text style={styles.description}>여기에 로그아웃, 프로필 수정 등의 기능을 추가할 수 있습니다.</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: THEME.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: THEME.text,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    color: THEME.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: THEME.error,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: THEME.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  }
});

export default SettingsScreen;

