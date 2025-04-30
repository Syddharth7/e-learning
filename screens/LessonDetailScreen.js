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
} from 'react-native';
import { supabase } from '../supabase';
import { ArrowLeft, Settings, CircleCheck as CheckCircle, AlertTriangle, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LessonDetailScreen({ route, navigation }) {
  const { lessonId, subjectId, progress } = route.params;
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLesson();
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
      const { error } = await supabase.from('user_progress').upsert({
        user_id: userId,
        subject_id: subjectId,
        lesson_id: lessonId,
        is_completed: true,
      });
      
      if (error) throw error;
      
      setIsCompleted(true);
      
      // Show success message and navigate back
      alert('Lesson completed successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error completing lesson:', error);
      alert('Unable to complete lesson: ' + error.message);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !lesson) {
    return <ErrorState message={error} onRetry={fetchLesson} onGoBack={() => navigation.goBack()} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Header navigation={navigation} />

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection title={lesson.title} isCompleted={isCompleted} />

        <EnhancedLessonContent content={lesson.content} />
      </ScrollView>

      <Footer isCompleted={isCompleted} onComplete={completeLesson} />
    </SafeAreaView>
  );
}

// Component for the header section
const Header = ({ navigation }) => (
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => navigation.goBack()}
      accessibilityLabel="Go back"
    >
      <ArrowLeft size={22} color="#4F46E5" />
    </TouchableOpacity>
    
    <Image
      source={require('../assets/logo.png')}
      style={styles.logo}
      resizeMode="contain"
      accessibilityLabel="App logo"
    />
    
    <TouchableOpacity 
      style={styles.iconButton}
      accessibilityLabel="Settings"
    >
      <Settings size={22} color="#4F46E5" />
    </TouchableOpacity>
  </View>
);

// Component for the hero section with title
const HeroSection = ({ title, isCompleted }) => (
  <View style={styles.heroSection}>
    {isCompleted && (
      <View style={styles.completedBadge}>
        <CheckCircle size={16} color="#047857" />
        <Text style={styles.completedText}>Completed</Text>
      </View>
    )}
    <Text style={styles.lessonTitle}>{title}</Text>
  </View>
);

// Enhanced component for the lesson content with better formatting and highlighting
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
        // Check if this is a bullet point (can be expanded for other formats)
        const isBulletPoint = /^•\s/.test(line) || line.trim().startsWith('-');
        
        // Process bullet points
        if (isBulletPoint) {
          if (!inListSection) {
            // Add any accumulated paragraph content first
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
            // Add to the current list
            const lastParagraph = paragraphs[paragraphs.length - 1];
            lastParagraph.items.push(line.replace(/^•\s|-\s/, '').trim());
          }
        } else {
          // Not a bullet point
          inListSection = false;
          
          // If blank line and we have content, create a new paragraph
          if (line.trim() === '' && currentParagraph.length > 0) {
            paragraphs.push({
              type: 'paragraph',
              content: currentParagraph.join(' ')
            });
            currentParagraph = [];
          } 
          // Add content to current paragraph if it's not empty
          else if (line.trim() !== '') {
            currentParagraph.push(line);
          }
        }
      });
      
      // Add any remaining paragraph content
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
  
  // For lesson 1, use the original career path processing logic
  const processCareerPaths = (rawContent) => {
    // Special keywords for career paths - exact phrases to look for
    const keyCareerPaths = [
      "Web and game developer",
      "Visual Arts Animator/Illustrator",
      "Computer System Servicing",
      "Computer/Network technician",
      "Call center agents",
      "Telecommunication"
    ];
    
    // Split by lines first to identify sections
    const lines = rawContent.split('\n');
    
    // First pass: identify career path boundaries
    let careerPathSegments = [];
    let currentSegment = [];
    let currentCareerPath = null;
    
    lines.forEach((line, index) => {
      // Check if this line starts a new career path
      let foundCareerPath = null;
      for (const path of keyCareerPaths) {
        if (line.includes(path)) {
          foundCareerPath = path;
          break;
        }
      }
      
      if (foundCareerPath) {
        // If we already have content in the current segment, save it
        if (currentSegment.length > 0) {
          careerPathSegments.push({
            careerPath: currentCareerPath,
            lines: currentSegment
          });
        }
        
        // Start a new segment with this career path
        currentCareerPath = foundCareerPath;
        currentSegment = [line];
      } else if (currentSegment.length > 0 || line.trim() !== '') {
        // Add line to current segment if not empty
        currentSegment.push(line);
      }
    });
    
    // Add the last segment if not empty
    if (currentSegment.length > 0) {
      careerPathSegments.push({
        careerPath: currentCareerPath,
        lines: currentSegment
      });
    }
    
    // Second pass: Process each segment to identify sub-sections and formatting
    const processedSegments = careerPathSegments.map(segment => {
      const lines = segment.lines;
      const sections = [];
      let currentSection = [];
      let inListSection = false;
      
      lines.forEach((line, index) => {
        // Check if this is a bullet point
        const isBulletPoint = /^•\s/.test(line);
        
        // Process bullet points
        if (isBulletPoint) {
          if (!inListSection) {
            // Add any accumulated paragraph content first
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
            // Add to the current list
            const lastSection = sections[sections.length - 1];
            lastSection.items.push(line.replace('•\t', '').replace('•', '').trim());
          }
        } else {
          // Not a bullet point
          inListSection = false;
          
          // If blank line and we have content, create a new paragraph
          if (line.trim() === '' && currentSection.length > 0) {
            sections.push({
              type: 'paragraph',
              content: currentSection.join(' ')
            });
            currentSection = [];
          } 
          // Add content to current section if it's not empty
          else if (line.trim() !== '') {
            currentSection.push(line);
          }
        }
      });
      
      // Add any remaining content
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
  
  // Check if this is the ICT trends lesson by looking for specific keywords
  const isICTTrendsLesson = content.includes("ICT trends") && 
                            content.includes("Superapps") && 
                            content.includes("metaverse");
  
  // Use the appropriate content processing method based on lesson content
  const contentToRender = isICTTrendsLesson ? 
    processContent(content) : 
    processCareerPaths(content);
  
  // Render the content based on which lesson it is
  if (isICTTrendsLesson) {
    // Render ICT trends lesson (Lesson 2)
    return (
      <View style={styles.contentContainer}>
        {contentToRender.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`} style={styles.sectionContainer}>
            {/* Only show divider after the first section */}
            {sectionIndex > 0 && (
              <View style={styles.sectionDivider} />
            )}
            
            {/* Section title if it's not the introduction */}
            {section.title !== "Introduction" && (
              <Text style={section.type === 'trend' ? styles.trendTitle : styles.sectionTitle}>
                {section.title}
              </Text>
            )}
            
            {/* Section content */}
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
                          <Text style={styles.listBullet}>•</Text>
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
    // Render original career paths lesson (Lesson 1) using original rendering logic
    return (
      <View style={styles.contentContainer}>
        {contentToRender.map((segment, segmentIndex) => (
          <View key={`segment-${segmentIndex}`}>
            {/* Only show divider after the first segment */}
            {segmentIndex > 0 && (
              <View style={styles.careerPathDivider} />
            )}
            
            <View style={styles.careerPathSection}>
              {/* First line typically contains the career path title */}
              {segment.careerPath && (
                <Text style={styles.careerPathTitle}>
                  {segment.careerPath}
                </Text>
              )}
              
              {/* Render the sections of this career path */}
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
                          <Text style={styles.listBullet}>•</Text>
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

// Loading state component
const LoadingState = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4F46E5" />
    <Text style={styles.loadingText}>Loading lesson...</Text>
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

// Component for the footer with complete button
const Footer = ({ isCompleted, onComplete }) => (
  <View style={styles.footer}>
    <TouchableOpacity
      style={[
        styles.completeButton,
        isCompleted && styles.completedButton
      ]}
      onPress={onComplete}
      disabled={isCompleted}
      activeOpacity={0.8}
      accessibilityLabel={isCompleted ? "Lesson already completed" : "Mark lesson as complete"}
      accessibilityState={{ disabled: isCompleted }}
    >
      <Text style={styles.completeButtonText}>
        {isCompleted ? 'Lesson Completed' : 'Complete Lesson'}
      </Text>
      {isCompleted && <CheckCircle size={20} color="#FFF" style={styles.checkIcon} />}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  retryButton: {
    backgroundColor: '#F3F4F6',
  },
  retryButtonText: {
    color: '#4B5563',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: 32,
    width: 100,
  },
  // Scroll container styles
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Hero section styles
  heroSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 36,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  completedText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Content styles
  contentContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    letterSpacing: 0.2,
  },
  contentParagraph: {
    marginBottom: 16,
  },
  // Strong divider between career paths
  careerPathDivider: {
    height: 2,
    backgroundColor: '#D1D5DB',
    marginVertical: 24,
    borderRadius: 1,
  },
  // Container for each career path
  careerPathSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  // Title style for career paths
  careerPathTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 12,
    lineHeight: 24,
  },
  importantSection: {
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 20,
  },
  importantContent: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  starIcon: {
    marginRight: 6,
  },
  sectionSpacer: {
    height: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  // List styles
  listContainer: {
    marginBottom: 16,
  },
  listItemContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  listBullet: {
    fontSize: 18,
    color: '#10B981',
    marginRight: 8,
    lineHeight: 26,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    letterSpacing: 0.2,
  },
  // Footer styles
  footer: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  completeButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
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
  // New styles for enhanced content separation
  sectionContainer: {
    marginBottom: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 28,
  },
  trendSection: {
    backgroundColor: '#F0FDF4', // Light green background
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginBottom: 16,
  },
  issuesSection: {
    backgroundColor: '#FEF2F2', // Light red background for issues
    borderLeftColor: '#EF4444',
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46', // Dark green
    marginBottom: 10,
    lineHeight: 24,
  },
  // Old spacer - keep for compatibility
  sectionSpacer: {
    height: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },
  // New spacer specifically for career paths
  careerPathSpacer: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    marginBottom: 20,
  },
  // New style for career path sections
  careerPathSection: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginTop: 12,
    marginBottom: 20,
  },
  // New style for career path titles
  careerPathTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    lineHeight: 28,
  },
});