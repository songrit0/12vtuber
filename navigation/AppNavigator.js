import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';
import SelectGameScreen from '../screens/SelectGameScreen';
import HomeScreen from '../screens/HomeScreen';
import VTuberSelectionScreen from '../screens/VTuberSelectionScreen';
import SelectVTuberScreen from '../screens/SelectVTuberScreen';
import ResultSelectionScreen from '../screens/ResultSelectionScreen';
import GameBoardScreen from '../screens/GameBoardScreen';
import AdminDataScreen from '../screens/AdminDataScreen';
import SelectionLogScreen from '../screens/SelectionLogScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import VTuberDatabaseScreen from '../screens/VTuberDatabaseScreen';
import SyncVoteLobbyScreen from '../screens/SyncVoteLobbyScreen';
import SyncVoteJoinScreen from '../screens/SyncVoteJoinScreen';
import SyncVoteHostScreen from '../screens/SyncVoteHostScreen';
import SyncVotePlayerScreen from '../screens/SyncVotePlayerScreen';
import SyncVoteThankYouScreen from '../screens/SyncVoteThankYouScreen';
import StreamNotifyScreen from '../screens/StreamNotifyScreen';
import ItemAdminScreen from '../screens/ItemAdminScreen';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SelectGame" component={SelectGameScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="VTuberSelection" component={VTuberSelectionScreen} />
      <Stack.Screen name="SelectVTuber" component={SelectVTuberScreen} />
      <Stack.Screen name="ResultSelection" component={ResultSelectionScreen} />
      <Stack.Screen name="GameBoard" component={GameBoardScreen} />
      <Stack.Screen name="AdminData" component={AdminDataScreen} />
      <Stack.Screen name="SelectionLog" component={SelectionLogScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="VTuberDatabase" component={VTuberDatabaseScreen} />
      <Stack.Screen name="SyncVoteLobby" component={SyncVoteLobbyScreen} />
      <Stack.Screen name="SyncVoteJoin" component={SyncVoteJoinScreen} />
      <Stack.Screen name="SyncVoteHost" component={SyncVoteHostScreen} />
      <Stack.Screen name="SyncVotePlayer" component={SyncVotePlayerScreen} />
      <Stack.Screen name="SyncVoteThankYou" component={SyncVoteThankYouScreen} />
      <Stack.Screen name="StreamNotify" component={StreamNotifyScreen} />
      <Stack.Screen name="ItemAdmin" component={ItemAdminScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return user ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
