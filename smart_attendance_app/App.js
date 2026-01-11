import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity } from 'react-native';

import { COLORS } from './Theme';
import api from './services/api';
import LoginScreen from './screens/LoginScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import ScannerScreen from './screens/ScannerScreen';
import LessonDetailScreen from './screens/LessonDetailScreen';

import ProfileScreen from './screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      try {
        const response = await api.get('me/');
        setUserRole(response.data.role);
        setIsAuthenticated(true);
      } catch (e) {
        await handleLogout();
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  const handleLoginSuccess = () => {
    checkAuth(); 
  };

  function MainTabs() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Расписание') iconName = 'calendar';
            else if (route.name === 'Сканировать') iconName = 'qr-code-outline';
            else if (route.name === 'Профиль') iconName = 'person-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: COLORS.white, height: 100, paddingBottom: 15 },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Расписание" component={ScheduleScreen} />
        
        {userRole === 'student' && (
          <Tab.Screen name="Сканировать" component={ScannerScreen} />
        )}
        
        <Tab.Screen name="Профиль">
          {props => <ProfileScreen {...props} onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    );
  }

  if (isLoading) return null;

  return (
    <SafeAreaProvider> 
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen 
                name="LessonDetail" 
                component={LessonDetailScreen} 
                options={{ 
                  headerShown: true, 
                  title: 'Детали урока',
                  headerStyle: { backgroundColor: COLORS.primary },
                  headerTintColor: '#fff' 
                }} 
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}