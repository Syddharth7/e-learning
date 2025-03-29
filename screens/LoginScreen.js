import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, SafeAreaView, Animated, Easing, Dimensions } from 'react-native';
import { supabase } from '../supabase';
import { useFonts } from 'expo-font';
import { Audio } from 'expo-av';
import AppLoading from 'expo-app-loading';

import logo from '../assets/logo.png';
import character from '../assets/3d characters.png';

// Get device dimensions
const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [backgroundSound, setBackgroundSound] = useState(null);
  const [buttonSound, setButtonSound] = useState(null);
  const characterAnim = useRef(new Animated.Value(0)).current;
  
  // State to track screen dimensions when they change
  const [screenDimensions, setScreenDimensions] = useState({ width, height });

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'DynaPuff-Regular': require('../assets/fonts/Dynapuff.ttf'),
  });

  // Listen for dimension changes
  useEffect(() => {
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

  // Character floating animation
  useEffect(() => {
    const floatAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(characterAnim, {
            toValue: -10, // Move up
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(characterAnim, {
            toValue: 10, // Move down
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    floatAnimation();
  }, []);

  useEffect(() => {
    let loginSound, bgSound;

    const playSounds = async () => {
      try {
        // Load the login sound
        loginSound = new Audio.Sound();
        await loginSound.loadAsync(require('../assets/sounds/login_sound2.mp3'));
        await loginSound.playAsync();

        // Listen for when the login sound finishes
        loginSound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.didJustFinish) {
            await loginSound.unloadAsync();

            // Background music setup
            bgSound = new Audio.Sound();
            await bgSound.loadAsync(require('../assets/sounds/bgSoundd.mp3'), { isLooping: true });
            await bgSound.playAsync();

            setBackgroundSound(bgSound);
          }
        });
      } catch (error) {
        console.error('Error playing sounds:', error);
      }
    };

    playSounds();

    return () => {
      if (loginSound) loginSound.unloadAsync();
      if (bgSound) bgSound.unloadAsync();
    };
  }, []);

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  const handleLogin = async () => {
    try {
      // Play button click sound
      const buttonClickSound = new Audio.Sound();
      await buttonClickSound.loadAsync(require('../assets/sounds/button_click.mp3'));
      await buttonClickSound.playAsync();

      buttonClickSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await buttonClickSound.unloadAsync();

          // Proceed with login
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error) {
            navigation.navigate('Choice');
          } else {
            alert(error.message);
          }
        }
      });

    } catch (error) {
      console.error('Error playing button click sound:', error);
    }
  };

  // Calculate responsive sizes based on screen dimensions
  const logoSize = screenDimensions.width * 0.5 > 250 ? 250 : screenDimensions.width * 0.5;
  const characterSize = {
    width: screenDimensions.width * 0.9,
    height: screenDimensions.height * 0.25,
  };
  const isSmallScreen = screenDimensions.width < 360;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.imageContainer, { marginBottom: isSmallScreen ? 10 : 20 }]}>
        <Image 
          source={logo} 
          style={[styles.logoImage, { width: logoSize, height: logoSize }]} 
          resizeMode="contain" 
        />
        <Animated.Image 
          source={character} 
          style={[
            styles.charactersImage, 
            { 
              transform: [{ translateY: characterAnim }],
              width: characterSize.width,
              height: characterSize.height,
            }
          ]} 
          resizeMode="contain" 
        />
      </View>

      <View style={[styles.formContainer, { width: screenDimensions.width > 600 ? '70%' : '90%' }]}>
        <Text style={[styles.label, { fontSize: isSmallScreen ? 14 : 16 }]}>Username:</Text>
        <TextInput
          style={[styles.input, { fontSize: isSmallScreen ? 14 : 16, padding: isSmallScreen ? 8 : 12 }]}
          placeholder="Enter Username"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#8b9cb5"
        />

        <Text style={[styles.label, { fontSize: isSmallScreen ? 14 : 16 }]}>Password:</Text>
        <TextInput
          style={[styles.input, { fontSize: isSmallScreen ? 14 : 16, padding: isSmallScreen ? 8 : 12 }]}
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#8b9cb5"
        />

        <TouchableOpacity 
          style={[
            styles.loginButton, 
            { 
              height: isSmallScreen ? 50 : 60,
              marginBottom: isSmallScreen ? 10 : 20 
            }
          ]} 
          onPress={handleLogin}
        >
          <Text style={[styles.loginButtonText, { fontSize: isSmallScreen ? 20 : 24 }]}>LOG IN</Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { fontSize: isSmallScreen ? 14 : 16 }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={[styles.signupLink, { fontSize: isSmallScreen ? 14 : 16 }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 250, 
    height: 250,
  },
  charactersImage: {
    width: 350,
    height: 250,
  },
  formContainer: {
    width: '90%',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily: 'DynaPuff-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 15,
    borderRadius: 25,
    backgroundColor: '#E8F0FE',
    fontSize: 16,
    fontFamily: 'DynaPuff-Regular',
  },
  loginButton: {
    backgroundColor: '#4A86E8',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#000000',
    // 3D effect with shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    borderColor: '#000'
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 16,
    fontFamily: 'DynaPuff-Regular',
  },
  signupLink: {
    fontSize: 16,
    color: '#4A86E8',
    fontWeight: 'bold',
    fontFamily: 'DynaPuff-Regular',
  },
});