import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../context/stores';

interface ChatScreenProps {
    navigation: any;
    route: {
        params: {
            orderId: string;
            driverName?: string;
        };
    };
}

interface Message {
    id: string;
    order_id: string;
    sender_id: string;
    sender_type: 'customer' | 'driver';
    content: string;
    created_at: string;
    read_at: string | null;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
    const { orderId, driverName } = route.params;
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchMessages();
        markMessagesAsRead();

        // Real-time subscription for new messages
        const channel = supabase
            .channel(`chat_${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `order_id=eq.${orderId}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => [...prev, newMessage]);
                    // Mark as read if from driver
                    if (newMessage.sender_type === 'driver') {
                        markMessageAsRead(newMessage.id);
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [orderId]);

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async () => {
        try {
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('order_id', orderId)
                .eq('sender_type', 'driver')
                .is('read_at', null);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const markMessageAsRead = async (messageId: string) => {
        try {
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', messageId);
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim() || !user) return;

        setSending(true);
        const messageContent = inputText.trim();
        setInputText('');

        try {
            const { error } = await supabase.from('messages').insert({
                order_id: orderId,
                sender_id: user.id,
                sender_type: 'customer',
                content: messageContent,
            });

            if (error) {
                console.error('Error sending message:', error);
                setInputText(messageContent); // Restore text on error
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setInputText(messageContent);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender_type === 'customer';

        return (
            <View
                style={[
                    styles.messageBubble,
                    isMyMessage ? styles.myMessage : styles.theirMessage,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        isMyMessage ? styles.myMessageText : styles.theirMessageText,
                    ]}
                >
                    {item.content}
                </Text>
                <Text
                    style={[
                        styles.messageTime,
                        isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
                    ]}
                >
                    {new Date(item.created_at).toLocaleTimeString('es-PE', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
            </View>
        );
    };

    const renderEmptyChat = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>Inicia la conversación</Text>
            <Text style={styles.emptySubtitle}>
                Escribe un mensaje para comunicarte con tu repartidor
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.gray800} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.avatarSmall}>
                        <Ionicons name="bicycle" size={18} color={COLORS.white} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>{driverName || 'Repartidor'}</Text>
                        <Text style={styles.headerSubtitle}>En línea</Text>
                    </View>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Messages List */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={[
                            styles.messagesList,
                            messages.length === 0 && styles.emptyList,
                        ]}
                        ListEmptyComponent={renderEmptyChat}
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                        onLayout={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                    />
                )}

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Escribe un mensaje..."
                        placeholderTextColor={COLORS.gray400}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || sending) && styles.sendButtonDisabled,
                        ]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                            <Ionicons name="send" size={20} color={COLORS.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
    },
    backButton: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        gap: 10,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.gray800,
    },
    headerSubtitle: {
        fontSize: 12,
        color: COLORS.success,
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 8,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.gray600,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.gray400,
        textAlign: 'center',
        marginTop: 8,
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        ...SHADOWS.small,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: COLORS.white,
    },
    theirMessageText: {
        color: COLORS.gray800,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
    },
    myMessageTime: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'right',
    },
    theirMessageTime: {
        color: COLORS.gray400,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        gap: 10,
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: COLORS.gray50,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.gray800,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.gray300,
    },
});

export default ChatScreen;
