import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, SafeAreaView, Dimensions } from 'react-native';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import logo from '../assets/logo.png'
import booksGif from '../assets/book.gif'

export default function SubjectScreen({ route, navigation }) {
  const { mode } = route.params;
  const [subjects, setSubjects] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get screen dimensions and set up state to track them
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  // Update dimensions when screen size changes
  useEffect(() => {
    const updateDimensions = () => {
      setScreenDimensions(Dimensions.get('window'));
    };
    
    const dimensionsListener = Dimensions.addEventListener('change', updateDimensions);
    
    return () => {
      dimensionsListener.remove();
    };
  }, []);
  
  // Calculate responsive sizes based on screen dimensions
  const isSmallScreen = screenDimensions.width < 360;
  const isMediumScreen = screenDimensions.width >= 360 && screenDimensions.width < 768;
  const isLargeScreen = screenDimensions.width >= 768;
  
  // Responsive values
  const logoWidth = isSmallScreen ? 250 : (isMediumScreen ? 300 : 350);
  const logoHeight = isSmallScreen ? 90 : (isMediumScreen ? 100 : 120);
  const booksWidth = isSmallScreen ? 300 : (isMediumScreen ? 350 : 400);
  const booksHeight = isSmallScreen ? 120 : (isMediumScreen ? 140 : 160);
  const topSectionHeight = isSmallScreen ? 260 : (isMediumScreen ? 290 : 320);
  const titleSize = isSmallScreen ? 22 : (isMediumScreen ? 25 : 28);
  const buttonHeight = isSmallScreen ? 50 : (isMediumScreen ? 55 : 60);
  const buttonTextSize = isSmallScreen ? 20 : (isMediumScreen ? 22 : 24);
  const horizontalPadding = isSmallScreen ? 15 : (isMediumScreen ? 20 : 25);
  const iconSize = isSmallScreen ? 20 : 24;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const userId = userData.user.id;

        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .order('order_num');
        if (subjectsError) throw subjectsError;

        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId);
        if (progressError) throw progressError;

        setSubjects(subjectsData || []);
        setProgress(progressData || []);
      } catch (error) {
        alert('Error fetching data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isSubjectUnlocked = (subjectOrder) => {
    if (subjectOrder === 1) return true;
    const prevSubject = subjects.find(s => s.order_num === subjectOrder - 1);
    if (!prevSubject) return false;

    // Check if all lessons in the previous subject are completed
    const prevLessonsCompleted = progress.filter(p => p.subject_id === prevSubject.id && p.lesson_id && p.is_completed).length;
    const totalLessons = 5; // Assuming 5 lessons per subject
    return prevLessonsCompleted === totalLessons;
  };

  const getButtonColor = (subject) => {
    // Match button colors from prototype
    switch(subject.name) {
      case 'ICT': return '#4285F4';
      case 'INDUSTRIAL ARTS': return '#FF6B8B';
      case 'AGRICULTURE': return '#4CAF50';
      case 'TOURISM': return '#E6DD3B';
      default: return '#4285F4'; // Default color
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: getButtonColor(item),
          height: buttonHeight,
        },
        !isSubjectUnlocked(item.order_num) && styles.lockedButton
      ]}
      onPress={() =>
        isSubjectUnlocked(item.order_num) && navigation.navigate('Subjects', { subjectId: item.id, mode: 'subjects' })
      }
      disabled={!isSubjectUnlocked(item.order_num)}
    >
      <Text style={[styles.buttonText, { fontSize: buttonTextSize }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      {/* Header with back button and settings */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={iconSize} color="#1E88E5" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={iconSize} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Top section with logo and images */}
      <View style={[styles.topSection, { height: topSectionHeight }]}>
        {/* Logo container with fixed height */}
        <View style={[styles.logoContainer, { height: isSmallScreen ? 90 : 120 }]}>
          <Image 
            source={logo} 
            style={{ width: logoWidth, height: logoHeight }}
            resizeMode="contain"
          />
        </View>
        
        {/* Books gif container with fixed height */}
        <View style={[styles.booksContainer, { height: isSmallScreen ? 150 : 180 }]}>
          <Image 
            source={booksGif}
            style={{ width: booksWidth, height: booksHeight }}
            resizeMode="contain"
          />
        </View>
      </View>

      <Text style={[styles.title, { fontSize: titleSize, marginBottom: isSmallScreen ? 15 : 20 }]}>SELECT A SUBJECT</Text>
      
      <View style={styles.buttonContainer}>
        <FlatList 
          data={subjects} 
          keyExtractor={item => item.id.toString()} 
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: isSmallScreen ? 10 : 20
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontFamily: 'DynaPuff',
    fontSize: 18,
    color: '#3D72CD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
    height: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    height: 320, // Fixed height for the entire top section
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    height: 120, // Fixed height for logo container
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 350,  // Increased from 300
    height: 120,  // Increased from 80
    marginVertical: 10,
  },
  booksContainer: {
    height: 180, // Fixed height for books container
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  booksImage: {
    width: 400,
    height: 160,
  },
  title: {
    fontFamily: 'DynaPuff',
    fontSize: 28,
    textAlign: 'center',
    color: '#3D72CD',
    marginBottom: 20,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
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
  buttonText: {
    fontFamily: 'DynaPuff',
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    borderColor: '#000'
  },
  lockedButton: {
    opacity: 0.5,
  },
});