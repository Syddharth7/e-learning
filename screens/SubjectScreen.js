import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../supabase';

export default function SubjectScreen({ route, navigation }) {
  const { mode } = route.params;
  const [subjects, setSubjects] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.name}</Text>
      <Button
        title={isSubjectUnlocked(item.order_num) ? 'View Lessons' : 'Locked'}
        onPress={() =>
          isSubjectUnlocked(item.order_num) && navigation.navigate('Quiz', { subjectId: item.id, mode: 'subjects' })
        }
        disabled={!isSubjectUnlocked(item.order_num)}
      />
    </View>
  );

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Subject</Text>
      <FlatList data={subjects} keyExtractor={item => item.id.toString()} renderItem={renderItem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10 },
  itemText: { fontSize: 18, color: '#333' },
});