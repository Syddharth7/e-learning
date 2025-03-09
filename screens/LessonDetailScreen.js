import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView } from 'react-native';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';

export default function LessonDetailScreen({ route, navigation }) {
  const { lessonId, subjectId, progress } = route.params;
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();
        if (error) throw error;
        setLesson(data);

        const completed = progress.some(p => p.lesson_id === lessonId && p.is_completed);
        setIsCompleted(completed);
      } catch (error) {
        alert('Error fetching lesson: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId, progress]);

  const completeLesson = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;

      const { error } = await supabase.from('user_progress').upsert({
        user_id: userId,
        subject_id: subjectId,
        lesson_id: lessonId,
        is_completed: true,
      });
      if (error) throw error;

      setIsCompleted(true);
      alert('Lesson completed!');
      navigation.goBack();
    } catch (error) {
      alert('Error completing lesson: ' + error.message);
    }
  };

  if (loading) return <Text>Loading...</Text>;
  if (!lesson) return <Text>Lesson not found</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonCircle}>
             <Ionicons name="arrow-back" size={24} color="#1E88E5" />
          </View>
        </TouchableOpacity>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.chalkboardContainer}>
          <View style={styles.chalkboard}>
            <Text style={styles.chalkboardTitle}>{lesson.title}</Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.content}>{lesson.content}</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={completeLesson}
          disabled={isCompleted}
        >
          <Text style={styles.completeButtonText}>Complete Lesson</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'white' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: 'white',
    zIndex: 1
  },
  backButton: {
    padding: 5
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6EEFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonText: {
    fontSize: 20,
    color: '#333'
  },
  logo: {
    height: 40,
    width: 120
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24
  },
  scrollContainer: {
    flex: 1
  },
  chalkboardContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20
  },
  chalkboard: {
    width: '100%',
    aspectRatio: 1.8,
    backgroundColor: '#2A7E3C',
    borderRadius: 8,
    padding: 20,
    borderWidth: 8,
    borderColor: '#C4996C',
    justifyContent: 'center',
    alignItems: 'center'
  },
  chalkboardTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32
  },
  contentContainer: {
    padding: 20,
    paddingTop: 0
  },
  content: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'white'
  },
  completeButton: {
    backgroundColor: '#4A8FE7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: 200,
    alignItems: 'center'
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});