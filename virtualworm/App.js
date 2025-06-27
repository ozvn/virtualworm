import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import GameScreen from './src/screens/GameScreen';
import GameAreaScreen from './src/screens/GameAreaScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Game">
        <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GameArea" component={GameAreaScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 