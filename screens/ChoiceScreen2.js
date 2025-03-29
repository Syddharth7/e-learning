import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, Dimensions, ScrollView, Animated } from 'react-native';
import { useFonts } from 'expo-font';
import { Audio } from 'expo-av'; // Import Audio from expo-av
import logo from '../assets/logo.png';
import character from '../assets/characters.png';
import { Ionicons } from '@expo/vector-icons';

export default function ChoiceScreen({ navigation }) {
  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  const [screenDimensions, setScreenDimensions] = React.useState({ width, height });
  
  // Animation values
  const characterYPosition = useRef(new Animated.Value(0)).current;
  const startTextPosition = useRef(new Animated.Value(-width)).current; // Changed to start from left (-width)
  
  // Sound references
  const [lessonsSound, setLessonsSound] = React.useState();
  const [quizSound, setQuizSound] = React.useState();
  const [leaderboardSound, setLeaderboardSound] = React.useState();
  
  // Load sound effects
  useEffect(() => {
    // Load sound files
    async function loadSounds() {
      try {
        // You'll need to add these sound files to your assets folder
        const lessonsSoundObject = new Audio.Sound();
        await lessonsSoundObject.loadAsync(require('../assets/sounds/button_click.mp3'));
        setLessonsSound(lessonsSoundObject);
        
        const quizSoundObject = new Audio.Sound();
        await quizSoundObject.loadAsync(require('../assets/sounds/button_click.mp3'));
        setQuizSound(quizSoundObject);
        
        const leaderboardSoundObject = new Audio.Sound();
        await leaderboardSoundObject.loadAsync(require('../assets/sounds/button_click.mp3'));
        setLeaderboardSound(leaderboardSoundObject);
      } catch (error) {
        console.error('Error loading sounds', error);
      }
    }
    
    loadSounds();
    
    // Unload sounds when component unmounts
    return () => {
      if (lessonsSound) lessonsSound.unloadAsync();
      if (quizSound) quizSound.unloadAsync();
      if (leaderboardSound) leaderboardSound.unloadAsync();
    };
  }, []);
  
  // Function to play button sounds
  const playLessonsSound = async () => {
    try {
      if (lessonsSound) {
        await lessonsSound.setPositionAsync(0);
        await lessonsSound.playAsync();
      }
    } catch (error) {
      console.error('Error playing lessons sound', error);
    }
  };
  
  const playQuizSound = async () => {
    try {
      if (quizSound) {
        await quizSound.setPositionAsync(0);
        await quizSound.playAsync();
      }
    } catch (error) {
      console.error('Error playing quiz sound', error);
    }
  };
  
  const playLeaderboardSound = async () => {
    try {
      if (leaderboardSound) {
        await leaderboardSound.setPositionAsync(0);
        await leaderboardSound.playAsync();
      }
    } catch (error) {
      console.error('Error playing leaderboard sound', error);
    }
  };
  
  // Listen for dimension changes
  React.useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      setScreenDimensions({ width, height });
    };
    
    // Add event listener
    const dimensionsSubscription = Dimensions.addEventListener('change', updateDimensions);

    // Clean up event listener
    return () => {
      dimensionsSubscription.remove();
    };
  }, []);
  
  // Set up animations
  useEffect(() => {
    // Character bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(characterYPosition, {
          toValue: -10,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(characterYPosition, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Let's Start! text slide-in animation (from left)
    Animated.timing(startTextPosition, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Determine if we're on a small screen
  const isSmallScreen = screenDimensions.width < 360;
  const isMediumScreen = screenDimensions.width >= 360 && screenDimensions.width < 768;
  const isLargeScreen = screenDimensions.width >= 768;
  
  // Calculate responsive sizes
  const logoWidth = isSmallScreen ? 250 : (isMediumScreen ? 300 : 350);
  const logoHeight = isSmallScreen ? 85 : (isMediumScreen ? 100 : 120);
  const buttonWidth = isSmallScreen ? '90%' : (isMediumScreen ? '70%' : '50%');
  const buttonHeight = isSmallScreen ? 60 : 70;
  const fontSize = isSmallScreen ? 30 : 35;
  const buttonFontSize = isSmallScreen ? 16 : 18;
  const iconSize = isSmallScreen ? 20 : 24;
  
  // Load the DynaPuff font - make sure the font name matches exactly
  const [fontsLoaded] = useFonts({
    'DynaPuff': require('../assets/fonts/Dynapuff.ttf'),
  });
  
  // Make sure we don't render until fonts are loaded
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: isSmallScreen ? 10 : 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button and settings */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={iconSize} color="#1E88E5" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={iconSize} color="#1E88E5" />
          </TouchableOpacity>
        </View>
        
        {/* Logo */}
        <Image 
          source={logo} 
          style={[styles.logoImage, { width: logoWidth, height: logoHeight }]} 
          resizeMode="contain"
        />
        
        {/* Characters with up/down animation */}
        <Animated.Image 
          source={character} 
          style={[
            styles.charactersImage,
            { 
              height: screenDimensions.height * 0.25 > 220 ? 220 : screenDimensions.height * 0.25,
              marginVertical: isSmallScreen ? 5 : 10,
              transform: [{ translateY: characterYPosition }]
            }
          ]}
          resizeMode="contain"
        />
        
        {/* Let's Start! text with slide-in animation from left */}
        <Animated.Text 
          style={[
            styles.startText, 
            { 
              fontSize: fontSize,
              transform: [{ translateX: startTextPosition }] 
            }
          ]}
        >
          LET'S START!
        </Animated.Text>
        
        {/* Menu Buttons */}
        <View style={[styles.buttonContainer, { marginTop: isSmallScreen ? 5 : 10 }]}>
          <TouchableOpacity 
            style={[
              styles.menuButton, 
              styles.lessonsButton,
              styles.buttonShadow,
              { 
                width: buttonWidth, 
                height: buttonHeight,
                marginBottom: isSmallScreen ? 10 : 15
              }
            ]}
            onPress={() => {
              playLessonsSound();
              navigation.navigate('Subjects', { mode: 'subjects' });
            }}
          >
            <Ionicons name="book" size={iconSize} color="white" />
            <Text style={[styles.buttonText, { fontSize: buttonFontSize, fontFamily: 'DynaPuff' }]}>LESSONS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.menuButton, 
              styles.quizButton,
              styles.buttonShadow,
              { 
                width: buttonWidth, 
                height: buttonHeight,
                marginBottom: isSmallScreen ? 10 : 15
              }
            ]}
            onPress={() => {
              playQuizSound();
              navigation.navigate('Quiz', { mode: 'quizzes' });
            }}
          >
            <Ionicons name="list" size={iconSize} color="white" />
            <Text style={[styles.buttonText, { fontSize: buttonFontSize, fontFamily: 'DynaPuff' }]}>QUIZ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.menuButton, 
              styles.leaderboardButton,
              styles.buttonShadow,
              { 
                width: buttonWidth, 
                height: buttonHeight,
                marginBottom: isSmallScreen ? 10 : 15
              }
            ]}
            onPress={() => {
              playLeaderboardSound();
              // Keep your existing navigation or logic here if needed
            }}
          >
            <Ionicons name="trophy" size={iconSize} color="white" />
            <Text style={[styles.buttonText, { fontSize: buttonFontSize, fontFamily: 'DynaPuff' }]}>LEADERBOARD</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 350,
    height: 120,
    marginVertical: 10,
  },
  charactersImage: {
    width: '100%',
    height: 220,
    marginVertical: 10,
  },
  startText: {
    fontSize: 35,
    marginTop: 15,
    marginBottom: 30,
    color: '#4A86E8',
    fontFamily: 'DynaPuff',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  menuButton: {
    flexDirection: 'row',
    width: '70%',
    height: 60,
    borderRadius: 100,
    marginBottom: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'black',
  },
  buttonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  lessonsButton: {
    backgroundColor: '#5091F2',
  },
  quizButton: {
    backgroundColor: '#8FD49A',
  },
  leaderboardButton: {
    backgroundColor: '#FC6D91',
  },
  buttonText: {
    fontFamily: 'DynaPuff',
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    borderColor: '#000'
  },
});