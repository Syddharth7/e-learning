import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated, SafeAreaView } from 'react-native';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { styles } from './style';

const RankingScreen = ({ navigation }) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const animatedValues = useRef([]).current;

  const [fontsLoaded] = useFonts({
    'DynaPuff': require('../assets/fonts/Dynapuff.ttf'),
    'DynaPuff-Bold': require('../assets/fonts/Dynapuff.ttf'),
  });

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const currentUserId = userData.user.id;

        const { data, error } = await supabase
          .from('users')
          .select('id, name, user_progress(quiz_score)')
          .order('id');

        if (error) throw error;

        // Process data: sum quiz_score per user
        const processedRankings = data
          .map(user => {
            const totalScore = user.user_progress
              .filter(up => up.quiz_score !== null)
              .reduce((sum, up) => sum + up.quiz_score, 0);
            return {
              id: user.id,
              name: user.name || `User ${user.id.slice(0, 4)}`,
              totalScore,
              isCurrentUser: user.id === currentUserId,
            };
          })
          .filter(user => user.totalScore > 0) // Only users with scores
          .sort((a, b) => b.totalScore - a.totalScore) // Highest score first
          .map((user, index) => ({
            ...user,
            rank: index + 1, // Assign rank (1 for highest)
            badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null,
          }));

        // Initialize animation values
        animatedValues.length = 0;
        processedRankings.forEach(() => {
          animatedValues.push(new Animated.Value(0));
        });

        setRankings(processedRankings);

        // Animate entries
        animatedValues.forEach((anim, index) => {
          Animated.spring(anim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            delay: index * 100,
            useNativeDriver: true,
          }).start();
        });
      } catch (error) {
        alert('Error fetching rankings: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const renderRankingItem = ({ item, index }) => {
    const badgeColor = {
      gold: '#FFD700',
      silver: '#C0C0C0',
      bronze: '#CD7F32',
    }[item.badge];

    return (
      <Animated.View
        style={[
          styles.rankingCard,
          item.isCurrentUser && styles.currentUserCard,
          {
            transform: [
              {
                scale: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
            opacity: animatedValues[index],
          },
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{item.rank}</Text>
          {item.badge && (
            <Ionicons
              name="medal"
              size={24}
              color={badgeColor}
              style={styles.badgeIcon}
            />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, item.isCurrentUser && styles.currentUserName]}>
            {item.name}
          </Text>
          <Text style={styles.scoreText}>{item.totalScore} points</Text>
        </View>
      </Animated.View>
    );
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.rankingContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.rankingTitle}>Leaderboard</Text>
        <View style={styles.placeholder} />
      </View>
      <FlatList
        data={rankings}
        renderItem={renderRankingItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.rankingList}
      />
    </SafeAreaView>
  );
};

export default RankingScreen;