import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StatusBar } from 'react-native';
import { supabase } from '../supabase';
import { useFonts } from 'expo-font';
import QuizSubjectSelection from './QuizSubjectSelection.js';
import QuizList from './QuizList';
import QuizQuestion from './QuizQuestion';
import { styles } from './styles';

export default function QuizScreen({ route, navigation }) {
  const { mode, subjectId: initialSubjectId } = route.params;
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    'DynaPuff': require('../assets/fonts/Dynapuff.ttf'),
    'DynaPuff-Bold': require('../assets/fonts/Dynapuff.ttf'),
  });

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
          
          let totalPoints = 0;
          progressData?.forEach(item => {
            if (item.quiz_score) {
              totalPoints += item.quiz_score;
            }
          });
          setPoints(totalPoints);
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

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (selectedQuiz) {
    return (
      <QuizQuestion
        quiz={selectedQuiz}
        quizzes={quizzes}
        points={points}
        setPoints={setPoints}
        selectedSubjectId={selectedSubjectId || initialSubjectId}
        onBack={() => setSelectedQuiz(null)}
      />
    );
  }

  if (mode === 'quizzes' && !selectedSubjectId) {
    return (
      <QuizSubjectSelection
        subjects={subjects}
        progress={progress}
        points={points}
        navigation={navigation}
        onSelectSubject={setSelectedSubjectId}
      />
    );
  }

  return (
    <QuizList
      quizzes={quizzes}
      lessons={lessons}
      progress={progress}
      navigation={navigation}
      onSelectQuiz={setSelectedQuiz}
      onBack={() => setSelectedSubjectId(null)}
    />
  );
}