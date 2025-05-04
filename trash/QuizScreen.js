import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar, Animated } from 'react-native';
import { supabase } from '../supabase';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export default function QuizScreen({ route, navigation }) {
  const { mode, subjectId: initialSubjectId } = route.params;
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  
  // Animation values
  const scaleAnim = useState(new Animated.Value(1))[0];
  const bounceAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(1))[0];
  const optionAnims = useState(Array(4).fill().map(() => new Animated.Value(0)))[0];
  const floatAnimation = useRef(new Animated.Value(0)).current;

  // Load the DynaPuff font
  const [fontsLoaded] = useFonts({
    'DynaPuff': require('../assets/fonts/Dynapuff.ttf'),
    'DynaPuff-Bold': require('../assets/fonts/Dynapuff.ttf'),
  });

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
  

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const userId = userData.user.id;

        if (mode === 'quizzes' && !selectedSubjectId) {
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('subjects')
            .select('*')
            .order('order_num');
          if (subjectsError) throw subjectsError;
          setSubjects(subjectsData || []);

          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId);
          if (progressError) throw progressError;
          setProgress(progressData || []);
          
          // Calculate total points
          let totalPoints = 0;
          progressData?.forEach(item => {
            if (item.quiz_score) {
              totalPoints += item.quiz_score;
            }
          });
          setPoints(totalPoints);
        } else {
          const subjectId = selectedSubjectId || initialSubjectId;
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('subject_id', subjectId)
            .order('order_num');
          if (lessonsError) throw lessonsError;

          const { data: quizzesData, error: quizzesError } = await supabase
            .from('quizzes')
            .select('*')
            .in('lesson_id', lessonsData.map(l => l.id));
          if (quizzesError) throw quizzesError;

          const { data: progressData, error: progressError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('subject_id', subjectId);
          if (progressError) throw progressError;

          setLessons(lessonsData || []);
          setQuizzes(quizzesData || []);
          setProgress(progressData || []);
        }
      } catch (error) {
        alert('Error fetching data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [mode, selectedSubjectId, initialSubjectId]);

  useEffect(() => {
    // Reset animations when a quiz is selected
    if (selectedQuiz) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
      optionAnims.forEach(anim => anim.setValue(0));
      
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        ...optionAnims.map((anim, i) => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay: 500 + (i * 100),
            useNativeDriver: true,
          })
        )
      ]).start();
    }
  }, [selectedQuiz]);

  const isSubjectUnlocked = (subjectOrder) => {
    if (subjectOrder === 1) return true;
    const prevSubject = subjects.find(s => s.order_num === subjectOrder - 1);
    if (!prevSubject) return false;
    const prevLessonsCompleted = progress.filter(p => p.subject_id === prevSubject.id && p.lesson_id && p.is_completed).length;
    return prevLessonsCompleted === 5;
  };

  const isLessonUnlocked = (lessonOrder) => {
    if (lessonOrder === 1) return true;
    const prevLesson = lessons.find(l => l.order_num === lessonOrder - 1);
    return prevLesson && progress.some(p => p.lesson_id === prevLesson.id && p.is_completed);
  };

  const isQuizUnlocked = (quiz) => {
    const lesson = lessons.find(l => l.id === quiz.lesson_id);
    return lesson && isLessonUnlocked(lesson.order_num) && progress.some(p => p.lesson_id === lesson.id && p.is_completed);
  };

  const getSubjectProgress = (subjectId) => {
    const subjectProgress = progress.filter(p => p.subject_id === subjectId && p.is_completed);
    return Math.min(Math.round((subjectProgress.length / 5) * 100), 100);
  };

  const onSubjectPress = (subject) => {
    if (isSubjectUnlocked(subject.order_num)) {
      // Animate the press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
      
      setSelectedSubjectId(subject.id);
    } else {
      // Play "locked" animation
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(bounceAnim, {
          toValue: 5,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const handleOptionPress = (key) => {
    // Option selection animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setUserAnswer(key);
  };

  const submitQuiz = async (quizId) => {
    try {
      setIsSubmitting(true);
      
      const quiz = quizzes.find(q => q.id === quizId);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      const userName = userData.user.user_metadata.name;

      // Check if answer is correct
      const isCorrect = userAnswer === quiz.correct_answer;
      const score = isCorrect ? 100 : 0;
      
      // Show feedback
      setFeedback({
        isCorrect,
        message: isCorrect ? 
          "Great job! That's correct! 🎉" : 
          `Not quite! The correct answer was ${quiz.correct_answer}.`
      });
      
      if (isCorrect) {
        setShowConfetti(true);
        // Play success sound here if you have sound capabilities
      } else {
        // Play incorrect sound here if you have sound capabilities
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      // Save progress to database
      const { error } = await supabase.from('user_progress').upsert({
        user_id: userId,
        subject_id: selectedSubjectId || initialSubjectId,
        lesson_id: quiz.lesson_id,
        quiz_id: quizId,
        quiz_score: score,
        is_completed: true,
      });
      if (error) throw error;

      const { error: userError } = await supabase
        .from('users')
        .update({ name: userName })
        .eq('id', userId);
      if (userError) throw userError;

      // Wait before proceeding
      setTimeout(() => {
        setFeedback(null);
        setIsSubmitting(false);
        setShowConfetti(false);
        setSelectedQuiz(null);
        setUserAnswer('');
        // Update points
        setPoints(prevPoints => prevPoints + score);
      }, 2500);
      
    } catch (error) {
      alert('Error submitting quiz: ' + error.message);
      setIsSubmitting(false);
    }
  };

  // Custom Button Component with DynaPuff font and inner shadow
  const CustomButton = ({ title, onPress, disabled = false }) => (
    <TouchableOpacity 
      style={[
        styles.customButton, 
        disabled && styles.disabledButton
      ]} 
      onPress={onPress} 
      disabled={disabled}
    >
      <View style={styles.buttonInnerShadow}>
        <Text style={styles.buttonText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSubjectItem = ({ item, index }) => {
    const isUnlocked = isSubjectUnlocked(item.order_num);
    const progressPercentage = getSubjectProgress(item.id);
    const subjectProgress = progress.filter(p => p.subject_id === item.id && p.is_completed).length;
    
    // Different colors for subject cards
    const colors = ['#4b86f0', '#ff6f9c', '#ffb347', '#83c5be', '#d62828'];
    const color = colors[index % colors.length];
    
    return (
      <Animated.View 
        style={[
          styles.subjectCard,
          { 
            backgroundColor: isUnlocked ? '#fff' : '#e0e0e0',
            transform: [
              { scale: isUnlocked ? scaleAnim : 1 },
              { translateX: !isUnlocked ? bounceAnim : 0 }
            ]
          }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onSubjectPress(item)}
          style={styles.subjectCardContent}
        >
          {/* Icon or Level indicator */}
          <View style={[styles.levelBadge, { backgroundColor: color }]}>
            <Text style={styles.levelText}>{item.order_num}</Text>
          </View>
          
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectName}>{item.name}</Text>
            
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: color
                  }
                ]} 
              />
            </View>
            
            <Text style={styles.progressText}>
              {isUnlocked ? `${subjectProgress}/5 completed` : 'Complete previous subject to unlock'}
            </Text>
          </View>
          
          {/* Lock icon or trophy icon */}
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

  const renderLessonItem = ({ item }) => (
    <CustomButton
      title={`Lesson ${item.order_num}`}
      onPress={() =>
        isLessonUnlocked(item.order_num) &&
        navigation.navigate('LessonDetail', {
          lessonId: item.id,
          subjectId: initialSubjectId,
          progress,
        })
      }
      disabled={!isLessonUnlocked(item.order_num)}
    />
  );

  const renderQuizItem = ({ item }) => (
    <View style={styles.quizItemContainer}>
      <View style={styles.item}>
        <Text style={styles.itemText}>{item.title}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.enhancedQuizButton,
          !isQuizUnlocked(item) && styles.enhancedQuizButtonDisabled
        ]}
        onPress={() => isQuizUnlocked(item) && setSelectedQuiz(item)}
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

  if (loading || !fontsLoaded) return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  // Enhanced Quiz Display
  if (selectedQuiz) {
    const options = selectedQuiz.options;
    const totalQuestions = quizzes.length;
    const currentQuestionNumber = quizzes.findIndex(q => q.id === selectedQuiz.id) + 1;
    const progressPercentage = (currentQuestionNumber / totalQuestions) * 100;
    
    return (
      <Animated.View 
        style={[
          styles.quizContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (!isSubmitting && !feedback) {
                setSelectedQuiz(null);
                setUserAnswer('');
              }
            }}
            disabled={isSubmitting || !!feedback}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsIcon}>⭐</Text>
            <Text style={styles.pointsText}>{points} points</Text>
          </View>
        </View>
        
        {/* Progress indicator */}
        <View style={styles.progressIndicator}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>Question {currentQuestionNumber} of {totalQuestions}</Text>
        </View>
        
        {/* Point reward indicator */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <Text style={styles.pointsValue}>+100</Text>
        </View>
        
        {/* Quiz question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>{selectedQuiz.title}</Text>
          <Text style={styles.questionText}>{selectedQuiz.question}</Text>
          
          {/* Quiz timer (visual only in this example) */}
          <View style={styles.timerContainer}>
            <View style={styles.timerBar}>
              <Animated.View 
                style={[
                  styles.timerFill,
                  { width: '70%' } // In a real app, this would be animated
                ]} 
              />
            </View>
            <Text style={styles.timerText}>0:45</Text>
          </View>
        </View>
        
        {/* Answer options */}
        <View style={styles.optionsContainer}>
          {Object.entries(options).map(([key, value], index) => (
            <Animated.View 
              key={key}
              style={{
                opacity: optionAnims[index],
                transform: [{ 
                  translateY: optionAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }]
              }}
            >
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  userAnswer === key && styles.selectedOption,
                  feedback && key === selectedQuiz.correct_answer && styles.correctOption,
                  feedback && userAnswer === key && userAnswer !== selectedQuiz.correct_answer && styles.incorrectOption
                ]}
                onPress={() => !feedback && !isSubmitting && handleOptionPress(key)}
                disabled={!!feedback || isSubmitting}
              >
                <View style={[styles.optionBadge, userAnswer === key && styles.selectedBadge]}>
                  <Text style={[
                    styles.optionBadgeText,
                    userAnswer === key && { color: 'white' }
                  ]}>{key}</Text>
                </View>
                <Text style={[
                  styles.optionText,
                  userAnswer === key && styles.selectedOptionText
                ]}>
                  {value}
                </Text>
                
                {feedback && key === selectedQuiz.correct_answer && (
                  <View style={styles.feedbackIcon}>
                    <Text style={styles.feedbackIconText}>✓</Text>
                  </View>
                )}
                
                {feedback && userAnswer === key && userAnswer !== selectedQuiz.correct_answer && (
                  <View style={[styles.feedbackIcon, styles.incorrectIcon]}>
                    <Text style={styles.feedbackIconText}>✗</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        
        {/* Feedback message */}
        {feedback && (
          <Animated.View 
            style={[
              styles.feedbackContainer,
              { 
                backgroundColor: feedback.isCorrect ? '#d4edda' : '#f8d7da',
                borderColor: feedback.isCorrect ? '#c3e6cb' : '#f5c6cb' 
              }
            ]}
          >
            <Text style={[
              styles.feedbackText, 
              { color: feedback.isCorrect ? '#155724' : '#721c24' }
            ]}>
              {feedback.message}
            </Text>
          </Animated.View>
        )}
        
        {/* Submit button */}
        {!feedback && (
          <TouchableOpacity 
            style={[
              styles.submitButton,
              !userAnswer && styles.disabledButton
            ]}
            onPress={() => submitQuiz(selectedQuiz.id)}
            disabled={!userAnswer || isSubmitting}
          >
            <View style={styles.buttonInnerShadow}>
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Checking...' : 'Submit Answer'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {/* Confetti effect - this is just a placeholder */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {Array(20).fill().map((_, i) => (
              <Animated.View 
                key={i}
                style={[
                  styles.confetti,
                  {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 40}%`,
                    backgroundColor: ['#FFD700', '#FF6347', '#4b86f0', '#50C878', '#9370DB'][Math.floor(Math.random() * 5)],
                    width: Math.random() * 10 + 5,
                    height: Math.random() * 10 + 5,
                  }
                ]}
              />
            ))}
          </View>
        )}
      </Animated.View>
    );
  }

  // Subject selection screen for quizzes
  if (mode === 'quizzes' && !selectedSubjectId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#f0f4f8" barStyle="dark-content" />
        
        {/* Header with Back Button and Settings */}
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
        
        {/* Points display */}
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <Text style={styles.pointsText}>{points} points</Text>
        </View>
        
        {/* Animated Quiz Image - ADD THIS SECTION */}
        <View style={styles.quizImageContainer}>
          <Animated.Image 
            source={require('../assets/quiz.png')} 
            style={[
              styles.quizImage,
              {
                transform: [{ translateY: floatAnimation }]
              }
            ]}
          />
        </View>
        
        <Text style={styles.title}>Select Subject for Quizzes</Text>
        
        {/* Modified FlatList for subjects */}
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

  // Quizzes screen when a subject is selected
  if (mode === 'quizzes' && selectedSubjectId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#f0f4f8" barStyle="dark-content" />
        
        {/* Header with Back Button and Settings */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setSelectedSubjectId(null)}
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

  // Subjects/Lessons screen (default view)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f0f4f8" barStyle="dark-content" />
      
      {/* Header with Back Button and Settings */}
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
      
      {/* Logo and Title */}
      <View style={styles.logoContainer}>
        <Text style={styles.subjectTitle}>INFORMATION AND{'\n'}COMMUNICATION TECHNOLOGY</Text>
        
        <Image 
          source={require('../assets/computer.gif')} 
          style={styles.computerImage}
        />
      </View>
      
      {/* Lesson Buttons */}
      <View style={styles.lessonContainer}>
        {mode === 'subjects' && lessons.map((lesson, index) => (
          <View key={lesson.id} style={styles.lessonButtonWrapper}>
            {renderLessonItem({ item: lesson })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// Complete styles for the enhanced quiz screen
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    fontFamily: 'DynaPuff',
    fontSize: 20,
    color: '#4b86f0',
  },
  quizContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 15,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#4b86f0',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  logoText: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 16,
    color: '#4b86f0',
  },
  brainBoostText: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 28,
    color: '#ff6f9c',
    marginBottom: 10,
  },
  subjectTitle: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 20,
    color: '#4b86f0',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    borderColor: '#000'
  },
  computerImage: {
    width: 320,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  lessonContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  lessonButtonWrapper: {
    width: '100%',
    marginBottom: 15,
  },
  listContainer: {
    padding: 20,
    
  },
  customButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4b86f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: '#000',
  },
  buttonInnerShadow: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'DynaPuff',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#a3c2f8',
  },
  title: { 
    fontFamily: 'DynaPuff-Bold',
    fontSize: 28, 
    marginBottom: 20, 
    textAlign: 'center', 
    color: '#4b86f0' 
  },
  item: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 15, 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemText: { 
    fontFamily: 'DynaPuff',
    fontSize: 18, 
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  // Enhanced quiz display styles
  progressIndicator: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4b86f0',
    borderRadius: 4,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFEB3B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 15,
  },
  pointsIcon: {
    fontSize: 20,
    marginRight: 5,
  },
  pointsText: {
    fontFamily: 'DynaPuff',
    fontSize: 16,
    color: '#4b86f0',
  },
  pointsValue: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 18,
    color: '#212121',
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  questionTitle: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 22,
    color: '#333',
    marginBottom: 15,
  },
  questionText: {
    fontFamily: 'DynaPuff',
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    marginBottom: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  timerText: {
    fontFamily: 'DynaPuff',
    fontSize: 14,
    color: '#757575',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedOption: {
    borderColor: '#4b86f0',
    backgroundColor: '#e6f0ff',
  },
  correctOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  incorrectOption: {
    borderColor: '#F44336',
    backgroundColor: '#ffebee',
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  selectedBadge: {
    backgroundColor: '#4b86f0',
  },
  optionBadgeText: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 16,
    color: '#757575',
  },
  optionText: {
    fontFamily: 'DynaPuff',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#4b86f0',
  },
  feedbackIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incorrectIcon: {
    backgroundColor: '#F44336',
  },
  feedbackIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  feedbackContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
  },
  feedbackText: {
    fontFamily: 'DynaPuff',
    fontSize: 16,
    textAlign: 'center',
  },
  submitButton: {
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  submitButtonText: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 18,
    color: 'white',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Subject styles
  subjectCard: {
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
  },
  subjectCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  levelText: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 18,
    color: 'white',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontFamily: 'DynaPuff-Bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'DynaPuff',
    fontSize: 12,
    color: '#757575',
  },
  statusIconContainer: {
    marginLeft: 10,
  },
  statusIcon: {
    fontSize: 24,
  },
  quizItemContainer: {
    marginBottom: 16,
  },
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    marginBottom: 8, // Space between card and button
  },
  itemText: {
    fontFamily: 'DynaPuff',
    fontSize: 17,
    color: '#2c3e50',
    padding: 14,
    lineHeight: 24,
  },
  quizButton: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#4b86f0',
    borderRadius: 8,
    shadowColor: '#4b86f0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  quizButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  quizButtonText: {
    fontFamily: 'DynaPuff',
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quizImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  quizImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  enhancedQuizButton: {
    height: 60,
    width: 250,
    borderRadius: 30,
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000000',
    // 3D effect with shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5, 
  },
  enhancedQuizButtonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  enhancedQuizButtonText: {
    fontFamily: 'DynaPuff',
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});