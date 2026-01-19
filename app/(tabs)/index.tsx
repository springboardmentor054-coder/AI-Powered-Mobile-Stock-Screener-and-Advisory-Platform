import { useState, useRef } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  View
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI Stock Advisor. I can help you with stock analysis, market trends, portfolio recommendations, and investment strategies. What would you like to know?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I\'m analyzing your query about stocks. This is a demo response. In production, this would connect to real AI models for stock analysis and recommendations.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 1000);
  };

  const suggestedPrompts = [
    '📊 Analyze Tesla stock',
    '💼 Build a portfolio',
    '📈 Market trends today',
    '🎯 Top tech stocks',
  ];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>AI Stock Advisor</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Your intelligent investment companion</ThemedText>
      </ThemedView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 1 && (
            <View style={styles.suggestionsContainer}>
              <ThemedText style={styles.suggestionsTitle}>Try asking:</ThemedText>
              <View style={styles.suggestionsGrid}>
                {suggestedPrompts.map((prompt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionChip, { borderColor: tintColor }]}
                    onPress={() => setInputText(prompt.replace(/[📊💼📈🎯] /, ''))}
                  >
                    <ThemedText style={styles.suggestionText}>{prompt}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((message) => (
            <ThemedView
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userMessage : styles.aiMessage,
                { backgroundColor: message.isUser ? tintColor : backgroundColor },
              ]}
            >
              <ThemedText
                style={[
                  styles.messageText,
                  message.isUser && styles.userMessageText,
                ]}
              >
                {message.text}
              </ThemedText>
            </ThemedView>
          ))}
        </ScrollView>

        {/* Input Area */}
        <ThemedView style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: backgroundColor, 
                color: textColor,
                borderColor: tintColor,
              }
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about stocks, markets, or portfolios..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: tintColor }]}
            onPress={sendMessage}
          >
            <ThemedText style={styles.sendButtonText}>➤</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1.5,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
