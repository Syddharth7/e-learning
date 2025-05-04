import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, SafeAreaView, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export default function QuizSubjectSelection({ subjects, progress, points, navigation, onSelectSubject }) {
  const floatAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startFloatingAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnimation, {
            toValue: 10,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          })
        ])
      ).start();
    };
    
    startFloatingAnimation();
    
    return () => {
      floatAnimation.stopAnimation();
    };
  }, []);

  const isSubjectUnlocked = (subjectOrder) => {
    if (subjectOrder === 1) return true;
    const prevSubject = subjects.find(s => s.order_num === subjectOrder - 1);
    if (!prevSubject) return false;
    const prevLessonsCompleted = progress.filter(p => p.subject_id === prevSubject.id && p.lesson_id && p.is_completed).length;
    return prevLessonsCompleted === 5;
  };

  const renderSubjectItem = ({ item, index }) => {
    const isUnlocked = isSubjectUnlocked(item.order_num);
    const colors = ['#4b86f0', '#ff6f9c', '#ffb347', '#83c5be', '#d62828'];
    const color = colors[index % colors.length];
    
    return (
      <Animated.View style={[styles.subjectCard, { backgroundColor: isUnlocked ? '#fff' : '#e0e0e0' }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => isUnlocked && onSelectSubject(item.id)}
          style={styles.subjectCardContent}
        >
          <View style={[styles.levelBadge, { backgroundColor: color }]}>
            <Text style={styles.levelText}>{item.order_num}</Text>
          </View>
          
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectName}>{item.name}</Text>
            <Text style={styles.progressText}>
              {isUnlocked ? 'Unlocked' : 'Complete previous subject to unlock'}
            </Text>
          </View>
          
          <View style={styles.statusIconContainer}>
            {isUnlocked ? (
              <Text style={styles.statusIcon}>🏆</Text>
            ) : (
              <Text style={styles.statusIcon}>🔒</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f0f4f8" barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color="#1E88E5" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsIcon}>⭐</Text>
        <Text style={styles.pointsText}>{points} points</Text>
      </View>
      
      <View style={styles.quizImageContainer}>
        <Animated.Image 
          source={require('../assets/quiz.png')} 
          style={[styles.quizImage, { transform: [{ translateY: floatAnimation }] }]}
        />
      </View>
      
      <Text style={styles.title}>Select Subject for Quizzes</Text>
      
      <FlatList 
        data={subjects} 
        keyExtractor={item => item.id.toString()} 
        renderItem={renderSubjectItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}