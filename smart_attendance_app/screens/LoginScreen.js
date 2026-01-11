import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../Theme';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const response = await api.post('login/', { username, password });
            await SecureStore.setItemAsync('access_token', response.data.access);
            await SecureStore.setItemAsync('refresh_token', response.data.refresh);
            onLoginSuccess();
        } catch (error) {
            Alert.alert('Ошибка', 'Неверный логин или пароль');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Farabi Smart Attendance</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Логин" 
                value={username}
                onChangeText={setUsername}
            />
            <TextInput 
                style={styles.input} 
                placeholder="Пароль" 
                secureTextEntry 
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Войти</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 40 },
    input: { backgroundColor: COLORS.white, padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    button: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});