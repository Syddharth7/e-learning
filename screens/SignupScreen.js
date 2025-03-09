import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, SafeAreaView, Animated } from 'react-native';
import { supabase } from '../supabase';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Animation values
  const characterYPosition = useRef(new Animated.Value(0)).current;
  const createAccountPosition = useRef(new Animated.Value(-300)).current;
  
  // Load the DynaPuff font
  const [fontsLoaded] = useFonts({
    'DynaPuff': require('../assets/fonts/Dynapuff.ttf'),
  });
  
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
    
    // Create Account text slide-in animation
    Animated.timing(createAccountPosition, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignup = async () => {
    try {
      // Register user in Supabase Authentication
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }, // Store name in user metadata
      });
      
      if (authError) throw authError;
      
      // Insert user into the users table
      const { error: dbError } = await supabase.from('users').insert({
        id: data.user.id, // Use the auth user ID
        name,
        email,
        password, // Note: In production, hash the password instead of storing it plain
      });
      
      if (dbError) throw dbError;
      
      alert('Signup successful! Please log in.');
      navigation.navigate('Login');
    } catch (error) {
      alert(error.message);
    }
  };

  // Wait for fonts to load
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <View style={styles.backButtonCircle}>
        <Ionicons name="arrow-back" size={24} color="#1E88E5" />
        </View>
      </TouchableOpacity>
      
      <View style={styles.logoContainer}>
        {/* Logo image - replacing text with image */}
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
        
      </View>
      
      <View style={styles.characterContainer}>
        {/* Animated character image */}
        <Animated.Image 
          source={require('../assets/characterr.png')} 
          style={[
            styles.charactersImage,
            { transform: [{ translateY: characterYPosition }] }
          ]} 
          resizeMode="contain"
        />
      </View>
      
      {/* Animated Create Account Text */}
      <Animated.Text 
        style={[
          styles.createAccountText,
          { transform: [{ translateX: createAccountPosition }] }
        ]}
      >
        CREATE AN ACCOUNT
      </Animated.Text>
      
      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Name"
          value={name}
          onChangeText={setName}
        />
        
        <Text style={styles.inputLabel}>Email:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <Text style={styles.inputLabel}>Password:</Text>
        <TextInput
          style={styles.input}
          placeholder="Create password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.signUpButton}
          onPress={handleSignup}>
          <Text style={styles.signUpButtonText}>SIGN UP</Text>
        </TouchableOpacity>
        
        <View style={styles.loginLinkContainer}>
          <Text style={styles.alreadyHaveAccountText}>
            Already have an Account? 
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>Log in</Text>
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
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'DynaPuff',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  logoImage: {
    height: 80,
    width: 280,
  },
  lightbulbIcon: {
    width: 24,
    height: 24,
    marginLeft: 5,
  },
  characterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  charactersImage: {
    width: 260,
    height: 90,
  },
  createAccountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3366CC',
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'DynaPuff',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'DynaPuff',
  },
  input: {
    backgroundColor: '#E6F0FF',
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderColor: '#D0D0D0',
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'DynaPuff',
  },
  signUpButton: {
    backgroundColor: '#3366CC',
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  signUpButtonText: {
    fontFamily: 'DynaPuff',
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    borderColor: '#000'
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  alreadyHaveAccountText: {
    fontSize: 16,
    marginRight: 5,
    fontFamily: 'DynaPuff',
  },
  loginLinkText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3366CC',
    fontFamily: 'DynaPuff',
  },
});