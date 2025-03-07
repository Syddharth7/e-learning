import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../supabase';

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

  const submitQuiz = async (quizId) => {
    try {
      const quiz = quizzes.find(q => q.id === quizId);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user.id;
      const userName = userData.user.user_metadata.name;

      const score = userAnswer === quiz.correct_answer ? 100 : 0;
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

      alert(`Quiz completed! Score: ${score}`);
      setSelectedQuiz(null);
      setUserAnswer('');
      setSelectedSubjectId(null);
    } catch (error) {
      alert('Error submitting quiz: ' + error.message);
    }
  };

  const renderSubjectItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.name}</Text>
      <Button
        title={isSubjectUnlocked(item.order_num) ? 'View Quizzes' : 'Locked'}
        onPress={() => isSubjectUnlocked(item.order_num) && setSelectedSubjectId(item.id)}
        disabled={!isSubjectUnlocked(item.order_num)}
      />
    </View>
  );

  const renderLessonItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.title}</Text>
      <Button
        title={isLessonUnlocked(item.order_num) ? 'View Lesson' : 'Locked'}
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
    </View>
  );

  const renderQuizItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.title}</Text>
      <Button
        title={isQuizUnlocked(item) ? 'Take Quiz' : 'Locked'}
        onPress={() => isQuizUnlocked(item) && setSelectedQuiz(item)}
        disabled={!isQuizUnlocked(item)}
      />
    </View>
  );

  if (loading) return <Text>Loading...</Text>;

  if (selectedQuiz) {
    const options = selectedQuiz.options;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{selectedQuiz.title}</Text>
        <Text style={styles.question}>{selectedQuiz.question}</Text>
        {Object.entries(options).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[styles.option, userAnswer === key && styles.selectedOption]}
            onPress={() => setUserAnswer(key)}
          >
            <Text>{`${key}. ${value}`}</Text>
          </TouchableOpacity>
        ))}
        <Button title="Submit" onPress={() => submitQuiz(selectedQuiz.id)} disabled={!userAnswer} />
      </View>
    );
  }

  if (mode === 'quizzes' && !selectedSubjectId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select Subject for Quizzes</Text>
        <FlatList data={subjects} keyExtractor={item => item.id.toString()} renderItem={renderSubjectItem} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'subjects' ? 'Lessons' : 'Quizzes'}</Text>
      <FlatList
        data={mode === 'subjects' ? lessons : quizzes}
        keyExtractor={item => item.id.toString()}
        renderItem={mode === 'subjects' ? renderLessonItem : renderQuizItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10 },
  itemText: { fontSize: 18, color: '#333' },
  question: { fontSize: 20, marginBottom: 20 },
  option: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10 },
  selectedOption: { backgroundColor: '#d1e7ff' },
});