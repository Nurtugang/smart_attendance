import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../Theme';
import api from '../services/api';

export default function ProfileScreen({ onLogout }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('me/')
            .then(res => setUser(res.data))
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={60} color={COLORS.white} />
                </View>
                <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
                <Text style={styles.roleText}>{user?.role === 'teacher' ? 'Преподаватель' : 'Студент'}</Text>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoCard}>
                    <Ionicons name="at-outline" size={20} color={COLORS.primary} />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.label}>Логин</Text>
                        <Text style={styles.value}>{user?.username}</Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="people-outline" size={20} color={COLORS.primary} />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.label}>Группы</Text>
                        <Text style={styles.value}>
                            {user?.academic_groups?.join(', ') || 'Нет группы'}
                        </Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
                <Text style={styles.logoutText}>Выйти из системы</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { 
        backgroundColor: COLORS.primary, 
        paddingVertical: 40, 
        alignItems: 'center', 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30 
    },
    avatarCircle: { 
        width: 100, 
        height: 100, 
        borderRadius: 50, 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: 15
    },
    name: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },
    roleText: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 5 },
    infoSection: { padding: 20, marginTop: 10 },
    infoCard: { 
        flexDirection: 'row', 
        backgroundColor: COLORS.white, 
        padding: 15, 
        borderRadius: 15, 
        marginBottom: 15,
        alignItems: 'center',
        elevation: 2
    },
    infoTextContainer: { marginLeft: 15 },
    label: { color: '#888', fontSize: 12 },
    value: { color: '#333', fontSize: 16, fontWeight: '500' },
    logoutButton: { 
        flexDirection: 'row',
        backgroundColor: COLORS.error, 
        marginHorizontal: 20, 
        padding: 15, 
        borderRadius: 15, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginTop: 20
    },
    logoutText: { color: COLORS.white, fontWeight: 'bold', marginLeft: 10 }
});