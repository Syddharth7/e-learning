import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { supabase } from '../supabase';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from './components/CustomButton'; // Import shared component
import { styles } from './styles'; // Import shared styles

export default function LessonListScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    'DynaPuff': require('../assets/fonts/Dynapuff.ttf'),
    'DynaPuff-Bold': require('../assets/fonts/Dynapuff.ttf'),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const userId = userData.user.id;

        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('subject_id', subjectId)
          .order('order_num');
        if (lessonsError) throw lessonsError;

        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('subject_id', subjectId);
        if (progressError) throw progressError;

        setLessons(lessonsData || []);
        setProgress(progressData || []);
      } catch (error) {
        alert('Error fetching data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subjectId]);

  const isLessonUnlocked = (lessonOrder) => {
    if (lessonOrder === 1) return true;
    const prevLesson = lessons.find(l => l.order_num === lessonOrder - 1);
    return prevLesson && progress.some(p => p.lesson_id === prevLesson.id && p.is_completed);
  };

  const renderLessonItem = ({ item }) => (
    <CustomButton
      title={`Lesson ${item.order_num}`}
      onPress={() => isLessonUnlocked(item.order_num) && navigation.navigate('LessonDetail', { lessonId: item.id, subjectId, progress })}
      disabled={!isLessonUnlocked(item.order_num)}
    />
  );

  if (loading || !fontsLoaded) return <View style={styles.loadingContainer}><Text style={styles.loadingText}>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#f0f4f8" barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color="#1E88E5" />
        </TouchableOpacity>
      </View>
      <View style={styles.logoContainer}>
        <Text style={styles.subjectTitle}>INFORMATION AND{'\n'}COMMUNICATION TECHNOLOGY</Text>
        <Image source={require('../assets/computer.gif')} style={styles.computerImage} />
      </View>
      <View style={styles.lessonContainer}>
        {lessons.map((lesson) => (
          <View key={lesson.id} style={styles.lessonButtonWrapper}>
            {renderLessonItem({ item: lesson })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}