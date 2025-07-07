import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { supabase } from '../supabase';
import { 
  ArrowLeft, 
  Settings, 
  CircleCheck as CheckCircle, 
  AlertTriangle,
  Mic,
  Star,
  Trophy,
  Clock,
  BookOpen,
  Award,
  Zap
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LessonDetailScreen({ route, navigation }) {
  const { lessonId, subjectId, progress } = route.params;
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [starAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    fetchLesson();
    // Animate stars periodically
    const starInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(starAnimation, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(starAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }, 3000);

    return () => clearInterval(starInterval);
  }, [lessonId, progress]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();
        
      if (error) throw error;
      
      setLesson(data);
      setIsCompleted(progress.some(p => p.lesson_id === lessonId && p.is_completed));
    } catch (error) {
      setError(error.message);
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData || !userData.user) {
        throw new Error('User not authenticated');
      }
      
      const userId = userData.user.id;
      const { error: progressError } = await supabase.from('user_progress').upsert({
        user_id: userId,
        subject_id: subjectId,
        lesson_id: lessonId,
        is_completed: true,
      });
      
      if (progressError) throw progressError;
      
      setIsCompleted(true);

      // Fetch the quiz associated with this lesson
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (quizError || !quizData) {
        console.warn('No quiz found for this lesson or error fetching quiz:', quizError?.message);
        alert('Lesson completed! 🎉 You earned 50 XP! No quiz available for this lesson.');
        navigation.goBack();
        return;
      }

      // Navigate to QuizScreen with the quiz data
      navigation.navigate('Quiz', {
        mode: 'quizzes',
        subjectId,
        selectedQuiz: quizData,
      });

    } catch (error) {
      console.error('Error completing lesson:', error);
      alert('Unable to complete lesson: ' + error.message);
    }
  };

  const handleReadLesson = () => {
    setIsReading(!isReading);
    // Here you would integrate with text-to-speech functionality
    // For now, we'll just toggle the state for visual feedback
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !lesson) {
    return <ErrorState message={error} onRetry={fetchLesson} onGoBack={() => navigation.goBack()} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      <Header navigation={navigation} />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BlackboardHeroSection title={lesson.title} isCompleted={isCompleted} starAnimation={starAnimation} />
        
        <ProgressIndicator />
        
        <EnhancedLessonContent content={lesson.content} />
      </ScrollView>

      <Footer 
        isCompleted={isCompleted} 
        onComplete={completeLesson} 
        onReadLesson={handleReadLesson}
        isReading={isReading}
      />
    </SafeAreaView>
  );
}

// Enhanced Header with gamification elements
const Header = ({ navigation }) => (
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => navigation.goBack()}
      accessibilityLabel="Go back"
    >
      <ArrowLeft size={22} color="#FFFFFF" />
    </TouchableOpacity>
    
    <View style={styles.headerCenter}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="App logo"
      />
      <View style={styles.xpContainer}>
        <Star size={16} color="#FFD700" />
      </View>
    </View>
    
    <TouchableOpacity 
      style={styles.iconButton}
      accessibilityLabel="Settings"
    >
      <Settings size={22} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
);

// Blackboard-style hero section
const BlackboardHeroSection = ({ title, isCompleted, starAnimation }) => (
  <View style={styles.blackboardContainer}>
    {/* Decorative elements */}
    <View style={styles.decorativeElements}>
      <Animated.View style={[styles.starDecoration, { transform: [{ scale: starAnimation }] }]}>
        <Star size={20} color="#FFD700" fill="#FFD700" />
      </Animated.View>
      <Animated.View style={[styles.starDecoration, styles.starRight, { transform: [{ scale: starAnimation }] }]}>
        <Star size={16} color="#FFD700" fill="#FFD700" />
      </Animated.View>
    </View>
    
    <View style={styles.blackboard}>
      {/* Chalk dust effect */}
      <View style={styles.chalkDustTop} />
      <View style={styles.chalkDustBottom} />
      
      {/* Title with chalk effect */}
      <Text style={styles.chalkTitle}>{title}</Text>
      
      {/* Completion badge */}
      {isCompleted && (
        <View style={styles.completedBadgeBlackboard}>
          <Trophy size={18} color="#FFD700" />
          <Text style={styles.completedTextBlackboard}>MASTERED!</Text>
        </View>
      )}
      
      {/* Decorative underline */}
      <View style={styles.chalkUnderline} />
    </View>
  </View>
);

// Progress indicator with gamification
const ProgressIndicator = () => (
  <View style={styles.progressContainer}>
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Clock size={16} color="#6366F1" />
        <Text style={styles.statText}>15 min read</Text>
      </View>
      <View style={styles.statItem}>
        <BookOpen size={16} color="#10B981" />
        <Text style={styles.statText}>Beginner</Text>
      </View>
      <View style={styles.statItem}>
        <Award size={16} color="#F59E0B" />
      </View>
    </View>
  </View>
);

// Enhanced lesson content with better formatting
const EnhancedLessonContent = ({ content }) => {
  // Process content to identify sections and important parts
  const processContent = (rawContent) => {
    // Define keywords for sections and trends
    const trendKeywords = [
      "Superapps the ICT supertrend",
      "Explosion of the metaverse",
      "Digital twins",
      "MedTech, the revolution in medicine",
      "Artificial Intelligence and Cybersecurity",
      "Blockchain, one of the most secure ICT trends",
      "Issues in Information and Communications Technology (ICT)",
      "Cybersecurity threats",
      "Data privacy and regulation",
      "Artificial Intelligence (AI) and automation",
      "Slow Internet Connections",
      "Viruses"
    ];
    
    // Special keywords for career paths - preserved from original
    const keyCareerPaths = [
      "Web and game developer",
      "Visual Arts Animator/Illustrator",
      "Computer System Servicing",
      "Computer/Network technician",
      "Call center agents",
      "Telecommunication"
    ];
    
    // Split by lines to identify sections
    const lines = rawContent.split('\n');
    
    // First pass: identify major sections
    let sections = [];
    let currentSection = [];
    let currentSectionTitle = "Introduction";
    let inTrendsList = false;
    
    lines.forEach((line, index) => {
      // Check if this line starts a new trend or section
      let foundTrend = null;
      for (const trend of trendKeywords) {
        if (line.includes(trend)) {
          foundTrend = trend;
          break;
        }
      }
      
      // Check for career paths as in original code
      let foundCareerPath = null;
      for (const path of keyCareerPaths) {
        if (line.includes(path)) {
          foundCareerPath = path;
          break;
        }
      }
      
      // If we found a trend or new section
      if (foundTrend || foundCareerPath) {
        // Save current section if it has content
        if (currentSection.length > 0) {
          sections.push({
            title: currentSectionTitle,
            content: currentSection,
            type: inTrendsList ? 'trend' : 'section'
          });
        }
        
        // Start new section
        currentSectionTitle = foundTrend || foundCareerPath;
        currentSection = [line];
        
        // Track if we're in trends list
        if (line.includes("the following patterns") || 
            foundTrend === "Superapps the ICT supertrend" ||
            line.includes("Issues in Information")) {
          inTrendsList = true;
        }
      } else if (currentSection.length > 0 || line.trim() !== '') {
        // Add line to current section if not empty
        currentSection.push(line);
      }
    });
    
    // Add the last section if not empty
    if (currentSection.length > 0) {
      sections.push({
        title: currentSectionTitle,
        content: currentSection,
        type: inTrendsList ? 'trend' : 'section'
      });
    }
    
    // Second pass: Process each section to identify paragraphs and bullet points
    return sections.map(section => {
      const lines = section.content;
      const paragraphs = [];
      let currentParagraph = [];
      let inListSection = false;
      
      lines.forEach((line, index) => {
        const isBulletPoint = /^•\s/.test(line) || line.trim().startsWith('-');
        
        if (isBulletPoint) {
          if (!inListSection) {
            if (currentParagraph.length > 0) {
              paragraphs.push({
                type: 'paragraph',
                content: currentParagraph.join(' ')
              });
              currentParagraph = [];
            }
            inListSection = true;
            paragraphs.push({
              type: 'list',
              items: [line.replace(/^•\s|-\s/, '').trim()]
            });
          } else {
            const lastParagraph = paragraphs[paragraphs.length - 1];
            lastParagraph.items.push(line.replace(/^•\s|-\s/, '').trim());
          }
        } else {
          inListSection = false;
          
          if (line.trim() === '' && currentParagraph.length > 0) {
            paragraphs.push({
              type: 'paragraph',
              content: currentParagraph.join(' ')
            });
            currentParagraph = [];
          } else if (line.trim() !== '') {
            currentParagraph.push(line);
          }
        }
      });
      
      if (currentParagraph.length > 0) {
        paragraphs.push({
          type: 'paragraph',
          content: currentParagraph.join(' ')
        });
      }
      
      return {
        ...section,
        paragraphs
      };
    });
  };
  
  const processCareerPaths = (rawContent) => {
    const keyCareerPaths = [
      "Web and game developer",
      "Visual Arts Animator/Illustrator",
      "Computer System Servicing",
      "Computer/Network technician",
      "Call center agents",
      "Telecommunication"
    ];
    
    const lines = rawContent.split('\n');
    let careerPathSegments = [];
    let currentSegment = [];
    let currentCareerPath = null;
    
    lines.forEach((line, index) => {
      let foundCareerPath = null;
      for (const path of keyCareerPaths) {
        if (line.includes(path)) {
          foundCareerPath = path;
          break;
        }
      }
      
      if (foundCareerPath) {
        if (currentSegment.length > 0) {
          careerPathSegments.push({
            careerPath: currentCareerPath,
            lines: currentSegment
          });
        }
        
        currentCareerPath = foundCareerPath;
        currentSegment = [line];
      } else if (currentSegment.length > 0 || line.trim() !== '') {
        currentSegment.push(line);
      }
    });
    
    if (currentSegment.length > 0) {
      careerPathSegments.push({
        careerPath: currentCareerPath,
        lines: currentSegment
      });
    }
    
    const processedSegments = careerPathSegments.map(segment => {
      const lines = segment.lines;
      const sections = [];
      let currentSection = [];
      let inListSection = false;
      
      lines.forEach((line, index) => {
        const isBulletPoint = /^•\s/.test(line);
        
        if (isBulletPoint) {
          if (!inListSection) {
            if (currentSection.length > 0) {
              sections.push({
                type: 'paragraph',
                content: currentSection.join(' ')
              });
              currentSection = [];
            }
            inListSection = true;
            sections.push({
              type: 'list',
              items: [line.replace('•\t', '').replace('•', '').trim()]
            });
          } else {
            const lastSection = sections[sections.length - 1];
            lastSection.items.push(line.replace('•\t', '').replace('•', '').trim());
          }
        } else {
          inListSection = false;
          
          if (line.trim() === '' && currentSection.length > 0) {
            sections.push({
              type: 'paragraph',
              content: currentSection.join(' ')
            });
            currentSection = [];
          } else if (line.trim() !== '') {
            currentSection.push(line);
          }
        }
      });
      
      if (currentSection.length > 0) {
        sections.push({
          type: 'paragraph',
          content: currentSection.join(' ')
        });
      }
      
      return {
        careerPath: segment.careerPath,
        sections: sections
      };
    });
    
    return processedSegments;
  };
  
  const isICTTrendsLesson = content.includes("ICT trends") && 
                            content.includes("Superapps") && 
                            content.includes("metaverse");
  
  const contentToRender = isICTTrendsLesson ? 
    processContent(content) : 
    processCareerPaths(content);
  
  if (isICTTrendsLesson) {
    return (
      <View style={styles.contentContainer}>
        {contentToRender.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`} style={styles.sectionContainer}>
            {sectionIndex > 0 && <View style={styles.sectionDivider} />}
            
            {section.title !== "Introduction" && (
              <View style={styles.sectionHeader}>
                <Zap size={20} color={section.type === 'trend' ? '#10B981' : '#6366F1'} />
                <Text style={section.type === 'trend' ? styles.trendTitle : styles.sectionTitle}>
                  {section.title}
                </Text>
              </View>
            )}
            
            <View style={[
              section.type === 'trend' ? styles.trendSection : styles.contentSection,
              section.title.includes("Issues in Information") ? styles.issuesSection : null
            ]}>
              {section.paragraphs.map((paragraph, paragraphIndex) => {
                if (paragraph.type === 'paragraph') {
                  return (
                    <Text 
                      key={`paragraph-${sectionIndex}-${paragraphIndex}`} 
                      style={[styles.content, paragraphIndex < section.paragraphs.length - 1 && styles.contentParagraph]}
                    >
                      {paragraph.content}
                    </Text>
                  );
                } else if (paragraph.type === 'list') {
                  return (
                    <View 
                      key={`list-${sectionIndex}-${paragraphIndex}`}
                      style={[styles.listContainer, paragraphIndex < section.paragraphs.length - 1 && styles.contentParagraph]}
                    >
                      {paragraph.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.listItemContainer}>
                          <View style={styles.bulletPoint}>
                            <Text style={styles.listBullet}>•</Text>
                          </View>
                          <Text style={styles.listItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </View>
        ))}
      </View>
    );
  } else {
    return (
      <View style={styles.contentContainer}>
        {contentToRender.map((segment, segmentIndex) => (
          <View key={`segment-${segmentIndex}`}>
            {segmentIndex > 0 && <View style={styles.careerPathDivider} />}
            
            <View style={styles.careerPathSection}>
              {segment.careerPath && (
                <View style={styles.careerPathHeader}>
                  <Award size={20} color="#065F46" />
                  <Text style={styles.careerPathTitle}>
                    {segment.careerPath}
                  </Text>
                </View>
              )}
              
              {segment.sections.map((section, sectionIndex) => {
                if (section.type === 'paragraph') {
                  return (
                    <Text 
                      key={`section-${segmentIndex}-${sectionIndex}`} 
                      style={[styles.content, sectionIndex < segment.sections.length - 1 && styles.contentParagraph]}
                    >
                      {section.content}
                    </Text>
                  );
                } else if (section.type === 'list') {
                  return (
                    <View 
                      key={`section-${segmentIndex}-${sectionIndex}`}
                      style={[styles.listContainer, sectionIndex < segment.sections.length - 1 && styles.contentParagraph]}
                    >
                      {section.items.map((item, itemIndex) => (
                        <View key={itemIndex} style={styles.listItemContainer}>
                          <View style={styles.bulletPoint}>
                            <Text style={styles.listBullet}>•</Text>
                          </View>
                          <Text style={styles.listItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </View>
        ))}
      </View>
    );
  }
};

// Loading state component with gamification
const LoadingState = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingSpinner}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Star size={24} color="#FFD700" style={styles.loadingStar} />
    </View>
    <Text style={styles.loadingText}>Loading your adventure...</Text>
  </View>
);

// Error state component
const ErrorState = ({ message, onRetry, onGoBack }) => (
  <View style={styles.errorContainer}>
    <AlertTriangle size={48} color="#EF4444" />
    <Text style={styles.errorText}>
      {message || 'Lesson not found'}
    </Text>
    <View style={styles.errorButtonContainer}>
      <TouchableOpacity
        style={[styles.errorButton, styles.retryButton]}
        onPress={onRetry}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.errorButton}
        onPress={onGoBack}
      >
        <Text style={styles.errorButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Enhanced footer with read lesson button
const Footer = ({ isCompleted, onComplete, onReadLesson, isReading }) => (
  <View style={styles.footer}>
    <View style={styles.footerButtons}>
      <TouchableOpacity
        style={[styles.readButton, isReading && styles.readButtonActive]}
        onPress={onReadLesson}
        activeOpacity={0.8}
        accessibilityLabel={isReading ? "Stop reading lesson" : "Read lesson aloud"}
      >
        <Mic size={20} color={isReading ? "#FFFFFF" : "#6366F1"} />
        <Text style={[styles.readButtonText, isReading && styles.readButtonTextActive]}>
          {isReading ? 'Stop Reading' : 'Read Lesson'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.completeButton,
          isCompleted && styles.completedButton
        ]}
        onPress={onComplete}
        disabled={isCompleted}
        activeOpacity={0.8}
        accessibilityLabel={isCompleted ? "Lesson already completed" : "Mark lesson as complete and proceed to quiz"}
        accessibilityState={{ disabled: isCompleted }}
      >
        <Text style={styles.completeButtonText}>
          {isCompleted ? 'Mastered!' : 'Complete Lesson'}
        </Text>
        {isCompleted ? (
          <Trophy size={20} color="#FFF" style={styles.checkIcon} />
        ) : (
          <CheckCircle size={20} color="#FFF" style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  loadingSpinner: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingStar: {
    position: 'absolute',
    top: -12,
    right: -12,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  errorButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  retryButton: {
    backgroundColor: '#475569',
  },
  retryButtonText: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerCenter: {
    alignItems: 'center',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: 28,
    width: 80,
    tintColor: '#FFFFFF',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  xpText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Blackboard styles
  blackboardContainer: {
    margin: 16,
    marginBottom: 8,
    position: 'relative',
  },
  decorativeElements: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  starDecoration: {
    position: 'absolute',
    top: 0,
    left: 20,
  },
  starRight: {
    left: 'auto',
    right: 20,
  },
  blackboard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    paddingTop: 32,
    borderWidth: 4,
    borderColor: '#8B5A3C',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  chalkDustTop: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#64748B',
    opacity: 0.3,
    borderRadius: 1,
  },
  chalkDustBottom: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    width: 60,
    height: 1,
    backgroundColor: '#64748B',
    opacity: 0.4,
    borderRadius: 1,
  },
  chalkTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 32,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  chalkUnderline: {
    height: 2,
    backgroundColor: '#F1F5F9',
    marginTop: 12,
    marginHorizontal: 20,
    opacity: 0.7,
    borderRadius: 1,
  },
  completedBadgeBlackboard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065F46',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  completedTextBlackboard: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
  },
  // Progress indicator styles
  progressContainer: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Scroll container styles
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Content styles
  contentContainer: {
    margin: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#475569',
    marginVertical: 20,
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginLeft: 8,
    lineHeight: 24,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 8,
    lineHeight: 24,
  },
  contentSection: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  trendSection: {
    backgroundColor: '#065F46',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  issuesSection: {
    backgroundColor: '#7F1D1D',
    borderLeftColor: '#EF4444',
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  contentParagraph: {
    marginBottom: 16,
  },
  // Career path styles
  careerPathDivider: {
    height: 2,
    backgroundColor: '#475569',
    marginVertical: 24,
    borderRadius: 1,
  },
  careerPathSection: {
    backgroundColor: '#065F46',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginBottom: 16,
  },
  careerPathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  careerPathTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 8,
    lineHeight: 24,
  },
  // List styles
  listContainer: {
    marginVertical: 8,
  },
  listItemContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 20,
    alignItems: 'center',
    marginTop: 2,
  },
  listBullet: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  // Footer styles
  footer: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  readButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  readButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  readButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  readButtonTextActive: {
    color: '#FFFFFF',
  },
  completeButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
    elevation: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  completedButton: {
    backgroundColor: '#059669',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
});