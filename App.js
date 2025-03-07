import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ChoiceScreen from './screens/ChoiceScreen';
import SubjectScreen from './screens/SubjectScreen';
import QuizScreen from './screens/QuizScreen';
import LessonDetail from './screens/LessonDetailScreen'; // New screen

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Choice" component={ChoiceScreen} />
        <Stack.Screen name="Subjects" component={SubjectScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="LessonDetail" component={LessonDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}