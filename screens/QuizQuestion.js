import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { supabase } from '../supabase';
import { styles } from './styles';

// Fisher-Yates shuffle function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function QuizQuestion({ quiz, quizzes, points, setPoints, selectedSubjectId, onBack }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [showScorePopup, setShowScorePopup] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const optionAnims = useRef(Array(4).fill().map(() => new Animated.Value(0))).current;
  const popupScaleAnim = useRef(new Animated.Value(0)).current;
  const popupOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const randomizedQuestions = shuffleArray(quiz.questions);
    setShuffledQuestions(randomizedQuestions);
  }, [quiz]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const totalQuestions = shuffledQuestions.length;
  const pointsPerQuestion = Math.round(100 / totalQuestions);

  useEffect(() => {
    if (!currentQuestion) return;

    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    optionAnims.forEach(anim => anim.setValue(0));

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
      ),
    ]).start();
  }, [currentQuestionIndex, shuffledQuestions]);

  const showScoreModal = (totalScore, correct) => {
    setFinalScore(totalScore);
    setCorrectAnswers(correct);
    setShowScorePopup(true);
    
    Animated.parallel([
      Animated.timing(popupOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(popupScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideScoreModal = () => {
    Animated.parallel([
      Animated.timing(popupOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(popupScaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowScorePopup(false);
    });
  };

  const handleOptionPress = (key) => {
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

  const submitAnswer = async () => {
    try {
      setIsSubmitting(true);

      const isCorrect = userAnswer === currentQuestion.correct_answer;
      const score = isCorrect ? pointsPerQuestion : 0;

      setFeedback({
        isCorrect,
        message: isCorrect
          ? "Great job! That's correct! 🎉"
          : `Not quite! The correct answer was ${currentQuestion.correct_answer}.`,
      });

      if (isCorrect) {
        setShowConfetti(true);
        setQuizScore(prev => prev + score);
        setCorrectAnswers(prev => prev + 1);
      } else {
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

      setTimeout(() => {
        setFeedback(null);
        setShowConfetti(false);
        setUserAnswer('');
        setIsSubmitting(false);

        if (currentQuestionIndex + 1 < totalQuestions) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          const totalScore = quizScore + score;
          const totalCorrect = correctAnswers + (isCorrect ? 1 : 0);
          showScoreModal(totalScore, totalCorrect);
        }
      }, 2500);
    } catch (error) {
      alert('Error submitting answer: ' + error.message);
      setIsSubmitting(false);
    }
  };

  const saveQuizScore = async (totalScore) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      const userName = userData.user.user_metadata.name;

      const { error } = await supabase.from('user_progress').upsert({
        user_id: userId,
        subject_id: selectedSubjectId,
        lesson_id: quiz.lesson_id,
        quiz_id: quiz.id,
        quiz_score: totalScore,
        is_completed: true,
      });
      if (error) throw error;

      const { error: userError } = await supabase
        .from('users')
        .update({ name: userName })
        .eq('id', userId);
      if (userError) throw userError;

      setPoints(prevPoints => prevPoints + totalScore);
      hideScoreModal();
      onBack();
    } catch (error) {
      alert('Error saving quiz score: ' + error.message);
    }
  };

  const getScoreMessage = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "Outstanding! 🏆";
    if (percentage >= 80) return "Great job! 🎉";
    if (percentage >= 70) return "Well done! 👏";
    if (percentage >= 60) return "Good effort! 👍";
    return "Keep practicing! 💪";
  };

  const getScoreColor = (score, total) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    return '#F44336';
  };

  const progressPercentage = totalQuestions ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  if (!shuffledQuestions.length) {
    return <Text>Loading questions...</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.quizContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (!isSubmitting && !feedback) {
                onBack();
                setUserAnswer('');
              }
            }}
            disabled={isSubmitting || !!feedback}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.pointsContainer}>
            <Text style={styles.pointsIcon}>⭐</Text>
            <Text style={styles.pointsText}>{points + quizScore} points</Text>
          </View>
        </View>

        <View style={styles.progressIndicator}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <Text style={styles.pointsValue}>+{pointsPerQuestion}</Text>
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>{quiz.title}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          <View style={styles.timerContainer}>
            <View style={styles.timerBar}>
              <Animated.View style={[styles.timerFill, { width: '70%' }]} />
            </View>
            <Text style={styles.timerText}>0:45</Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {Object.entries(currentQuestion.options).map(([key, value], index) => (
            <Animated.View
              key={key}
              style={{
                opacity: optionAnims[index],
                transform: [
                  {
                    translateY: optionAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  userAnswer === key && styles.selectedOption,
                  feedback && key === currentQuestion.correct_answer && styles.correctOption,
                  feedback &&
                    userAnswer === key &&
                    userAnswer !== currentQuestion.correct_answer &&
                    styles.incorrectOption,
                ]}
                onPress={() => !feedback && !isSubmitting && handleOptionPress(key)}
                disabled={!!feedback || isSubmitting}
              >
                <View style={[styles.optionBadge, userAnswer === key && styles.selectedBadge]}>
                  <Text style={[styles.optionBadgeText, userAnswer === key && { color: 'white' }]}>
                    {key}
                  </Text>
                </View>
                <Text style={[styles.optionText, userAnswer === key && styles.selectedOptionText]}>
                  {value}
                </Text>

                {feedback && key === currentQuestion.correct_answer && (
                  <View style={styles.feedbackIcon}>
                    <Text style={styles.feedbackIconText}>✓</Text>
                  </View>
                )}

                {feedback &&
                  userAnswer === key &&
                  userAnswer !== currentQuestion.correct_answer && (
                    <View style={[styles.feedbackIcon, styles.incorrectIcon]}>
                      <Text style={styles.feedbackIconText}>✗</Text>
                    </View>
                  )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {feedback && (
          <Animated.View
            style={[
              styles.feedbackContainer,
              {
                backgroundColor: feedback.isCorrect ? '#d4edda' : '#f8d7da',
                borderColor: feedback.isCorrect ? '#c3e6cb' : '#f5c6cb',
              },
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                { color: feedback.isCorrect ? '#155724' : '#721c24' },
              ]}
            >
              {feedback.message}
            </Text>
          </Animated.View>
        )}

        {!feedback && (
          <TouchableOpacity
            style={[styles.submitButton, !userAnswer && styles.disabledButton]}
            onPress={submitAnswer}
            disabled={!userAnswer || isSubmitting}
          >
            <View style={styles.buttonInnerShadow}>
              <Text style={styles.submitButtonText}>
                {isSubmitting
                  ? 'Checking...'
                  : currentQuestionIndex + 1 === totalQuestions
                  ? 'Finish Quiz'
                  : 'Next Question'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {showConfetti && (
          <View style={styles.confettiContainer}>
            {Array(20)
              .fill()
              .map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.confetti,
                    {
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 40}%`,
                      backgroundColor: ['#FFD700', '#FF6347', '#4b86f0', '#50C878', '#9370DB'][
                        Math.floor(Math.random() * 5)
                      ],
                      width: Math.random() * 10 + 5,
                      height: Math.random() * 10 + 5,
                    },
                  ]}
                />
              ))}
          </View>
        )}
      </Animated.View>

      {/* Score Popup Modal */}
      {showScorePopup && (
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: popupOpacityAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.scorePopupCard,
              {
                transform: [{ scale: popupScaleAnim }],
              },
            ]}
          >
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreTitle}>Quiz Complete! 🎉</Text>
              <Text style={styles.scoreSubtitle}>{getScoreMessage(correctAnswers, totalQuestions)}</Text>
            </View>

            <View style={styles.scoreStatsContainer}>
              <View style={styles.scoreStatItem}>
                <Text style={[styles.scoreStatNumber, { color: getScoreColor(correctAnswers, totalQuestions) }]}>
                  {finalScore}
                </Text>
                <Text style={styles.scoreStatLabel}>Points Earned</Text>
              </View>

              <View style={styles.scoreStatDivider} />

              <View style={styles.scoreStatItem}>
                <Text style={styles.scoreStatNumber}>
                  {correctAnswers}/{totalQuestions}
                </Text>
                <Text style={styles.scoreStatLabel}>Correct Answers</Text>
              </View>

              <View style={styles.scoreStatDivider} />

              <View style={styles.scoreStatItem}>
                <Text style={styles.scoreStatNumber}>
                  {Math.round((correctAnswers / totalQuestions) * 100)}%
                </Text>
                <Text style={styles.scoreStatLabel}>Accuracy</Text>
              </View>
            </View>

            <View style={styles.scoreProgressContainer}>
              <View style={styles.scoreProgressBar}>
                <View 
                  style={[
                    styles.scoreProgressFill, 
                    { 
                      width: `${(correctAnswers / totalQuestions) * 100}%`,
                      backgroundColor: getScoreColor(correctAnswers, totalQuestions)
                    }
                  ]} 
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.scoreButton, { backgroundColor: getScoreColor(correctAnswers, totalQuestions) }]}
              onPress={() => saveQuizScore(finalScore)}
            >
              <Text style={styles.scoreButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}