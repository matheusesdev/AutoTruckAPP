import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat } from 'vision-camera-code-scanner';
import { theme } from '../utils/theme';
import { fetchParts } from '../services/api';
import { Vibration } from 'react-native';

export default function ScannerScreen({ navigation }) {
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const devices = useCameraDevices();
  const device = devices.back;

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.ALL_FORMATS], {
    checkInverted: true,
  });

  useEffect(() => {
    const requestPermission = async () => {
      const status = await Camera.getCameraPermissionStatus();
      if (status !== 'authorized') {
        const newStatus = await Camera.requestCameraPermission();
        if (newStatus !== 'authorized') {
          Alert.alert(
            'Permissão de câmera',
            'É necessário permitir o uso da câmera para escanear códigos.',
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
          return;
        }
      }
      setPermissionStatus('authorized');
      setIsActive(true);
    };

    requestPermission();
  }, [navigation]);

  useEffect(() => {
    if (!scanned && barcodes?.length > 0) {
      const rawValue = barcodes[0].displayValue || barcodes[0].rawValue;
      if (rawValue) {
        handleDetectedCode(rawValue);
      }
    }
  }, [barcodes, scanned]);

  async function handleDetectedCode(code) {
    Vibration.vibrate([0, 80, 50, 80]);
    setScanned(true);
    try {
      const resultado = await fetchParts({ codigo: code, page: 1, limit: 1 });
      const items = Array.isArray(resultado.data) ? resultado.data : resultado.data || [];
      const found = items[0];
      if (found) {
        navigation.replace('DetalhePeca', { partId: found.id });
        return;
      }
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.warn('Erro buscando código', error);
      }
    }

    Alert.alert(
      'Código não encontrado',
      'Não encontramos uma peça com esse código.',
      [
        {
          text: 'Escanear novamente',
          onPress: () => setScanned(false),
        },
        {
          text: 'Solicitar orçamento',
          onPress: () => navigation.navigate('SolicitarOrcamento'),
        },
        {
          text: 'Buscar por VIN',
          onPress: () => navigation.navigate('MainTabs', {
            screen: 'Peças',
            params: { initialVin: code, initialModoBusca: 'vin' },
          }),
        },
      ],
      { cancelable: true },
    );
  }

  const handleManualSubmit = () => {
    const trimmedCode = manualCode.trim();
    if (!trimmedCode) return;
    setManualModalVisible(false);
    setManualCode('');
    setScanned(false);
    handleDetectedCode(trimmedCode);
  };

  if (permissionStatus !== 'authorized') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Aguardando permissão da câmera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Carregando câmera...</Text>
        </View>
      )}

      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.topText}>Ou aponte para o QR Code / código VIN</Text>
        <View style={styles.scanAreaWrapper}>
          <View style={styles.scanArea} />
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>
        <Text style={styles.bottomText}>Aponte para o código de barras da peça</Text>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.manualButton} onPress={() => setManualModalVisible(true)}>
        <Text style={styles.manualButtonText}>Digitar código manualmente</Text>
      </TouchableOpacity>

      <Modal visible={manualModalVisible} transparent animationType="fade" onRequestClose={() => setManualModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Digite o código</Text>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Código da peça ou VIN"
              placeholderTextColor={theme.colors.disabledText}
              style={styles.modalInput}
              autoCapitalize="characters"
              keyboardType={Platform.OS === 'ios' ? 'default' : 'visible-password'}
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalActionButton} onPress={() => setManualModalVisible(false)}>
                <Text style={styles.modalActionText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalActionButton, styles.modalActionPrimary]} onPress={handleManualSubmit}>
                <Text style={[styles.modalActionText, styles.modalActionPrimaryText]}>Buscar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFF',
    fontSize: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  topText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  scanAreaWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 240,
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#E87722',
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderRightWidth: 4,
    borderTopWidth: 4,
  },
  cornerBottomLeft: {
    bottom: -1,
    left: -1,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },
  cornerBottomRight: {
    bottom: -1,
    right: -1,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  bottomText: {
    color: '#FFF',
    fontSize: 15,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 24,
    left: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 24,
  },
  manualButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
  },
  manualButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    color: theme.colors.text,
  },
  modalInput: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.text,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalActionPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalActionText: {
    fontSize: 15,
    color: theme.colors.text,
  },
  modalActionPrimaryText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
