import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { socketMessaging } from '../../services/socketMessaging';
import { chatService } from '../../services/chatService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { notificationService } from '../../services/notificationService';

const ADMIN_ID = '67c59508544c9b003328e469';

export default function ChatScreen() {
  const { user } = useAuth();
  const { theme: appTheme } = useTheme();
  const colorScheme = appTheme ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user?.id) {
      const loadHistory = async () => {
        try {
          setLoadingHistory(true);
          const response = await chatService.getChatHistory(user.id, ADMIN_ID);
          if (response.success) {
            const history = response.data.map((msg: any) => ({
              ...msg,
              isMe: msg.senderId === user.id
            }));
            setChat(history);
          }
        } catch (error) {
          console.error("Failed to load history", error);
        } finally {
          setLoadingHistory(false);
        }
      };

      loadHistory();

      const socket = socketMessaging.connect(user.id);
      socketMessaging.onMessageReceived((data) => {
        setChat((prev) => [...prev, { ...data, isMe: false }]);
        notificationService.sendLocalNotification(
          `New message from ${data.senderName}`,
          data.message
        );
      });

      return () => {
        socketMessaging.disconnect();
      };
    }
  }, [user]);

  const sendMessage = () => {
    if (message.trim() && user) {
      const msgData = {
        senderId: user.id,
        senderName: user.username,
        receiverId: ADMIN_ID,
        message: message.trim(),
      };

      socketMessaging.sendMessage(msgData.senderId, msgData.senderName, msgData.receiverId, msgData.message);
      setChat((prev) => [...prev, { ...msgData, isMe: true, timestamp: new Date().toISOString() }]);
      setMessage('');
      notificationService.notifySuccess('Message Sent');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.messageWrapper, item.isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
      <View style={[
        styles.messageBubble, 
        item.isMe ? styles.myBubble : (isDark ? styles.theirBubbleDark : styles.theirBubbleLight)
      ]}>
        {!item.isMe && (
          <Text style={[styles.senderName, { color: isDark ? '#6366F1' : '#4F46E5' }]}>
            {item.senderName}
          </Text>
        )}
        <Text style={[styles.messageText, { color: item.isMe ? '#fff' : (isDark ? '#fff' : '#1E293B') }]}>
          {item.message}
        </Text>
        <Text style={[styles.timestamp, { color: item.isMe ? 'rgba(255,255,255,0.7)' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') }]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#F1F5F9']}
        style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatarContainer, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)', borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)' }]}>
                <MaterialCommunityIcons name="shield-account" size={24} color="#6366F1" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#0F172A' }]}>Campus Security</Text>
                <View style={styles.statusBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.statusText}>Active Support</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={[styles.headerAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <Ionicons name="call-outline" size={22} color={isDark ? '#fff' : '#0F172A'} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loadingHistory ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }]}>Synchronizing secure chat...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={chat}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <BlurView 
          intensity={80} 
          tint={isDark ? "dark" : "light"} 
          style={[styles.inputArea, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                color: isDark ? '#fff' : '#1E293B',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }]}
              placeholder="Send an emergency message..."
              placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <LinearGradient
                colors={message.trim() ? ['#6366F1', '#4F46E5'] : (isDark ? ['#334155', '#1E293B'] : ['#E2E8F0', '#CBD5E1'])}
                style={styles.sendButton}
              >
                <Ionicons name="send" size={20} color={message.trim() ? "#fff" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)")} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
    shadowColor: '#10B981',
    shadowRadius: 4,
    shadowOpacity: 0.5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(128,128,128,0.7)',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },
  messageWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  theirMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 14,
    borderRadius: 20,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  myBubble: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  theirBubbleDark: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  theirBubbleLight: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  senderName: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    textAlign: 'right',
  },
  inputArea: {
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    paddingTop: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});


