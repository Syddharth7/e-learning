import React from 'react';
import { View, Text, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export default function QuizList({ quizzes, lessons, progress, navigation, onSelectQuiz, onBack }) {
  // Function to determine quarter based on lesson order
  const getQuarter = (orderNum) => {
    if (orderNum === 1) return "Quarter 1";
    if (orderNum === 2) return "Quarter 2";
    if (orderNum === 3) return "Quarter 3";
    if (orderNum === 4) return "Quarter 3.5";
    if (orderNum >= 5) return "Quarter 4";
    return "Quarter 1"; // default fallback
  };

  const isQuizUnlocked = (quiz) => {
    const lesson = lessons.find(l => l.id === quiz.lesson_id);
    return lesson && isLessonUnlocked(lesson.order_num) && progress.some(p => p.lesson_id === lesson.id && p.is_completed);
  };

  const isLessonUnlocked = (lessonOrder) => {
    if (lessonOrder === 1) return true;
    const prevLesson = lessons.find(l => l.order_num === lessonOrder - 1);
    return prevLesson && progress.some(p => p.lesson_id === prevLesson.id && p.is_completed);
  };

  const renderQuizItem = ({ item }) => {
    // Find the lesson associated with this quiz to get the quarter info
    const associatedLesson = lessons.find(l => l.id === item.lesson_id);
    const quarterInfo = associatedLesson ? getQuarter(associatedLesson.order_num) : "Quarter 1";
    
    return (
      <View style={styles.quizItemContainer}>
        <View style={styles.item}>
          <Text style={styles.itemText}>{`${quarterInfo}: ${item.title}`}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.enhancedQuizButton,
            !isQuizUnlocked(item) && styles.enhancedQuizButtonDisabled
          ]}
          onPress={() => isQuizUnlocked(item) && onSelectQuiz(item)}
          disabled={!isQuizUnlocked(item)}
        >
          <View style={styles.buttonInnerShadow}>
            <Text style={styles.enhancedQuizButtonText}>
              {isQuizUnlocked(item) ? 'Take Quiz' : 'Locked'}
            </Text>
            {isQuizUnlocked(item) && <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 8}} />}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color="#1E88E5" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.title}>Quizzes</Text>
      <FlatList 
        data={quizzes} 
        keyExtractor={item => item.id.toString()} 
        renderItem={renderQuizItem}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}