import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../Theme';
import api from '../services/api';

export default function LessonDetailScreen({ route }) {
    const { lessonId } = route.params;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`lessons/${lessonId}/details/`)
            .then(res => setData(res.data))
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <ActivityIndicator style={{flex:1}} color={COLORS.primary} />;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{data?.course_name}</Text>
            
            <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, {flex: 2}]}>Студент</Text>
                <Text style={styles.headerCell}>Статус</Text>
                <Text style={styles.headerCell}>Время</Text>
            </View>

            <FlatList
                data={data?.students_attendance}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.row}>
                        <Text style={[styles.cell, {flex: 2}]}>{item.full_name}</Text>
                        <Text style={[styles.cell, {color: item.is_present ? COLORS.success : COLORS.error}]}>
                            {item.is_present ? 'Пришел' : 'Отсутствует'}
                        </Text>
                        <Text style={styles.cell}>{item.scan_time}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white, padding: 20 },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 20 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: COLORS.background, paddingBottom: 10 },
    headerCell: { fontWeight: 'bold', flex: 1, color: '#666' },
    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12 },
    cell: { flex: 1, fontSize: 14 }
});