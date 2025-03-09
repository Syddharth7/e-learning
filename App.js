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
      <Stack.Navigator initialRouteName="Login"  options={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen}  options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Choice" component={ChoiceScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Subjects" component={SubjectScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="LessonDetail" component={LessonDetail} options={{ headerShown: false }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}