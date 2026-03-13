import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Notification } from '../types/notification';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onPress }) => {
  const date = new Date(notification.createdAt).toLocaleDateString();

  return (
    <TouchableOpacity 
      style={[styles.card, !notification.isRead && styles.unreadCard]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={notification.isRead ? "bell-outline" : "bell-ring"} 
          size={24} 
          color={notification.isRead ? "#9E9E9E" : "#FF3B70"} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !notification.isRead && styles.unreadTitle]}>
          {notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: '#FFF5F7',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#1A237E',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 18,
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B70',
    marginLeft: 8,
  },
});
