import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

export const CustomButton = ({ title, onPress, disabled = false }) => (
  <TouchableOpacity style={[styles.customButton, disabled && styles.disabledButton]} onPress={onPress} disabled={disabled}>
    <View style={styles.buttonInnerShadow}>
      <Text style={styles.buttonText}>{title}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  customButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4b86f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: '#000',
  },
  buttonInnerShadow: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'DynaPuff',
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#a3c2f8',
  },
});