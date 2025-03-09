// QuizQuestionDisplay component to be used in your QuizScreen
const QuizQuestionDisplay = ({ quiz, userAnswer, setUserAnswer, submitQuiz }) => {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.95));
    const [optionAnims] = useState(
      Object.keys(quiz.options).map(() => new Animated.Value(0))
    );
    const [showConfetti, setShowConfetti] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
      // Entrance animations
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
    }, []);
    
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
    
    const handleSubmit = async () => {
      setIsSubmitting(true);
      
      // Check if answer is correct (you'd need to adapt this to your actual logic)
      const isCorrect = userAnswer === quiz.correct_answer;
      
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
      
      // Wait before proceeding to next question
      setTimeout(() => {
        submitQuiz(quiz.id);
      }, 2000);
    };
    
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
        {/* Progress indicator */}
        <View style={styles.progressIndicator}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressText}>Question 3 of 5</Text>
        </View>
        
        {/* Point reward indicator */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <Text style={styles.pointsValue}>+100</Text>
        </View>
        
        {/* Quiz question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>{quiz.title}</Text>
          <Text style={styles.questionText}>{quiz.question}</Text>
          
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
          {Object.entries(quiz.options).map(([key, value], index) => (
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
                  feedback && key === quiz.correct_answer && styles.correctOption,
                  feedback && userAnswer === key && userAnswer !== quiz.correct_answer && styles.incorrectOption
                ]}
                onPress={() => !feedback && handleOptionPress(key)}
                disabled={!!feedback}
              >
                <View style={[styles.optionBadge, userAnswer === key && styles.selectedBadge]}>
                  <Text style={styles.optionBadgeText}>{key}</Text>
                </View>
                <Text style={[
                  styles.optionText,
                  userAnswer === key && styles.selectedOptionText
                ]}>
                  {value}
                </Text>
                
                {feedback && key === quiz.correct_answer && (
                  <View style={styles.feedbackIcon}>
                    <Text style={styles.feedbackIconText}>✓</Text>
                  </View>
                )}
                
                {feedback && userAnswer === key && userAnswer !== quiz.correct_answer && (
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
            onPress={handleSubmit}
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
  };
  
  // Additional styles for the quiz question display
  const quizStyles = StyleSheet.create({
    quizContainer: {
      flex: 1,
      backgroundColor: '#f0f4f8',
      padding: 16,
    },
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
    progressText: {
      fontFamily: 'DynaPuff',
      fontSize: 14,
      color: '#666',
      textAlign: 'right',
    },
    pointsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: '#fff8e1',
      borderRadius: 15,
      paddingVertical: 5,
      paddingHorizontal: 15,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    pointsIcon: {
      fontSize: 18,
      color: '#FFD700',
      marginRight: 5,
    },
    pointsValue: {
      fontFamily: 'DynaPuff-Bold',
      fontSize: 18,
      color: '#ff6f9c',
    },
    questionCard: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 4,
    },
    questionTitle: {
      fontFamily: 'DynaPuff-Bold',
      fontSize: 20,
      color: '#ff6f9c',
      marginBottom: 10,
    },
    questionText: {
      fontFamily: 'DynaPuff',
      fontSize: 18,
      color: '#333',
      marginBottom: 15,
      lineHeight: 26,
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timerBar: {
      flex: 1,
      height: 6,
      backgroundColor: '#eee',
      borderRadius: 3,
      overflow: 'hidden',
      marginRight: 10,
    },
    timerFill: {
      height: '100%',
      backgroundColor: '#ffb347',
      borderRadius: 3,
    },
    timerText: {
      fontFamily: 'DynaPuff',
      fontSize: 14,
      color: '#666',
      width: 40,
      textAlign: 'right',
    },
    optionsContainer: {
      marginBottom: 20,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 12,
      marginBottom: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderWidth: 2,
      borderColor: '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    selectedOption: {
      borderColor: '#4b86f0',
      backgroundColor: '#ebf3ff',
    },
    correctOption: {
      borderColor: '#4CAF50',
      backgroundColor: '#ebfbef',
    },
    incorrectOption: {
      borderColor: '#F44336',
      backgroundColor: '#feeced',
    },
    optionBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#e0e0e0',
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
      color: '#666',
    },
    selectedOptionText: {
      color: '#4b86f0',
    },
    optionText: {
      fontFamily: 'DynaPuff',
      fontSize: 16,
      color: '#333',
      flex: 1,
    },
    feedbackIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    incorrectIcon: {
      backgroundColor: '#F44336',
    },
    feedbackIconText: {
      fontFamily: 'DynaPuff-Bold',
      fontSize: 16,
      color: 'white',
    },
    feedbackContainer: {
      borderRadius: 12,
      padding: 15,
      marginBottom: 20,
      borderWidth: 1,
    },
    feedbackText: {
      fontFamily: 'DynaPuff',
      fontSize: 16,
      textAlign: 'center',
    },
    submitButton: {
      height: 56,
      borderRadius: 28,
      backgroundColor: '#4b86f0',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    disabledButton: {
      backgroundColor: '#a3c2f8',
    },
    buttonInnerShadow: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    submitButtonText: {
      fontFamily: 'DynaPuff-Bold',
      fontSize: 18,
      color: 'white',
      textAlign: 'center',
    },
    confettiContainer: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none',
    },
    confetti: {
      position: 'absolute',
      top: -20,
      width: 10,
      height: 10,
      borderRadius: 5,
    },
  });