import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { COLORS } from '../Theme';
import api from '../services/api';

export default function ScheduleScreen( {navigation}) {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLessons = async () => {
        try {
            const response = await api.get('lessons/');
            setLessons(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchLessons(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLessons();
    };

    const renderItem = ({ item }) => {
        const info = item.attendance_info;
        const isPassed = new Date(item.end_time) < new Date();
        const groupsString = item.lesson_groups.map(g => g.name).join(', ');

        const formatTime = (dateString) => {
            return new Date(dateString).toLocaleTimeString('ru-RU', {
                hour: '2-digit', minute: '2-digit', hour12: false
            });
        };

        const renderBadge = () => {
            if (!info) return null;

            if (info.role === 'student') {
                if (info.is_present) {
                    return (
                        <View style={styles.presentBadge}>
                            <Text style={styles.badgeText}>ВЫ БЫЛИ ({info.scan_time})</Text>
                        </View>
                    );
                }
                if (item.is_active) {
                    return (
                        <View style={styles.activeBadge}>
                            <Text style={styles.badgeText}>ИДЕТ СЕЙЧАС</Text>
                        </View>
                    );
                }
                if (isPassed) {
                    return (
                        <View style={styles.missedBadge}>
                            <Text style={styles.badgeText}>ПРОПУЩЕНО</Text>
                        </View>
                    );
                }
            } 

            if (info.role === 'teacher') {
                return (
                    <TouchableOpacity 
                        style={styles.detailsButton} 
                        onPress={() => navigation.navigate('LessonDetail', { lessonId: item.id })}
                    >
                        <Text style={styles.badgeText}>ДЕТАЛИ</Text>
                    </TouchableOpacity>
                );
            }

            return null;
        };

        return (
            <View style={[styles.card, info?.is_present && styles.presentCard]}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.courseName}>{item.course_name}</Text>
                        <Text style={styles.groupText}>Группы: {groupsString}</Text>
                    </View>
                    {renderBadge()}
                </View>

                <View style={styles.footerRow}>
                    <Text style={styles.teacherText}>
                        {info?.role === 'teacher' ? '✅ Мой урок' : `👨‍🏫 ${item.teacher.first_name} ${item.teacher.last_name}`}
                    </Text>
                    <Text style={styles.timeText}>🕒 {formatTime(item.start_time)} - {formatTime(item.end_time)}</Text>
                </View>
            </View>
        );
    };

    if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{flex:1}} />;

    return (
        <View style={styles.container}>
            <View style={styles.headerBox}>
                <Text style={styles.header}>Расписание</Text>
                <Text style={styles.serverTimeText}>
                    Сегодня: {lessons[0]?.server_time || 'Загрузка...'}
                </Text>
            </View>
            <FlatList
                data={lessons}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={{textAlign:'center', marginTop: 20}}>Уроков пока нет</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 15, paddingTop: 50 },
    headerBox: { marginBottom: 20 },
    header: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
    serverTimeText: { color: COLORS.secondary, fontSize: 14, fontWeight: '500' },
    card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
    presentCard: { borderColor: COLORS.success, borderWidth: 1.5 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    courseName: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, flex: 1, marginRight: 10 },
    groupText: { color: '#888', fontSize: 12, marginTop: 2 },
    badgeText: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
    presentBadge: { backgroundColor: COLORS.success, padding: 6, borderRadius: 6 },
    activeBadge: { backgroundColor: COLORS.secondary, padding: 6, borderRadius: 6 },
    missedBadge: { backgroundColor: COLORS.error, padding: 6, borderRadius: 6 },
    detailsButton: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, elevevation: 2 },
    teacherText: { color: '#444', fontSize: 13, fontWeight: '500' },
    timeText: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#eee' },
});