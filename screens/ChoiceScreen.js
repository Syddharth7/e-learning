import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function ChoiceScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Button title="View Subjects" onPress={() => navigation.navigate('Subjects', { mode: 'subjects' })} />
      <Button title="Take Quizzes" onPress={() => navigation.navigate('Quiz', { mode: 'quizzes' })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f8' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
});