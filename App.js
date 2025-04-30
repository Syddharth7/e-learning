import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ChoiceScreen from './screens/ChoiceScreen2';
import SubjectScreen from './screens/SubjectScreen2';
import QuizScreen from './screens/QuizScreen2';
import LessonDetail from './screens/LessonDetailScreen'; // New screen
import LessonListScreen from './screens/LessonListScreen';
import RankingScreen from './screens/RankingScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login"  options={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Choice" component={ChoiceScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Subjects" component={SubjectScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="LessonDetail" component={LessonDetail} options={{ headerShown: false }}/>
        <Stack.Screen name="LessonListScreen" component={LessonListScreen} />
        <Stack.Screen name="Ranking" component={RankingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}