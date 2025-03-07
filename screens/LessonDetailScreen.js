import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../supabase';

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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.content}>{lesson.content}</Text>
      {!isCompleted && (
        <Button title="Complete Lesson" onPress={completeLesson} style={styles.completeButton} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  content: { fontSize: 16, color: '#666', marginBottom: 20 },
  completeButton: { marginTop: 20 },
});