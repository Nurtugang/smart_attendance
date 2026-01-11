import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { COLORS } from '../Theme';
import api from '../services/api';

export default function ScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!permission) {
        return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>Нужен доступ к камере</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={{color: 'white'}}>Разрешить</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ data }) => {
        setScanned(true);
        setLoading(true);
        
        const deviceInfo = `${Device.brand} ${Device.modelName} (OS: ${Device.osName} ${Device.osVersion})`;
        const deviceId = Constants.installationId || Constants.sessionId;
        const finalDeviceId = `${deviceId} | ${deviceInfo}`;

        try {
            const response = await api.post('attendance/mark/', {
                qr_token: data,
                device_id: finalDeviceId
            });

            Alert.alert("Успех!", response.data.success, [
                { text: "OK", onPress: () => navigation.navigate('Расписание') }
            ]);
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Ошибка соединения с сервером";
            Alert.alert("Ошибка", errorMsg, [
                { text: "OK", onPress: () => setScanned(false) }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={StyleSheet.absoluteFillObject}
            />
            
            <View style={styles.overlay}>
                <Text style={styles.instruction}>Наведите на QR-код урока</Text>
                <View style={styles.scannerFrame} />
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.white} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    button: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10 },
    overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    instruction: { color: 'white', fontSize: 18, marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5 },
    scannerFrame: { width: 250, height: 250, borderWidth: 2, borderColor: COLORS.secondary, borderRadius: 20, backgroundColor: 'transparent' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }
});