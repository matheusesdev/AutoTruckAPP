import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../utils/theme';
import { useVeiculos } from '../hooks/useVeiculos';
import { orcamentoService } from '../services/api';
import { showToast } from '../utils/toast';
import ScreenHeader from '../components/ScreenHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STEPS = ['Ve�culo', 'Descri��o', 'Foto'];

export default function SolicitarOrcamentoScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { veiculos, isLoading: loadingVehicles } = useVeiculos();

  const progressAnimations = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress circles on step change
    Animated.parallel(
      progressAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: index < currentStep ? 2 : index === currentStep ? 1 : 0,
          duration: 300,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [currentStep, progressAnimations]);

  const handleNext = () => {
    if (currentStep === 0 && !selectedVehicle) return;
    if (currentStep === 1 && !description.trim()) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSelectPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permiss�o necess�ria', 'Precisamos de acesso � galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicle || !description.trim()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('veiculo_id', selectedVehicle.id);
      formData.append('descricao', description.trim());

      if (photo) {
        const uriParts = photo.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('foto', {
          uri: photo.uri,
          name: `peca.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      await orcamentoService.solicitarOrcamento(formData);

      // Success animation
      Animated.sequence([
        Animated.timing(successScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ]).start(() => {
        showToast('Or�amento solicitado com sucesso!', 'success');
        setTimeout(() => navigation.goBack(), 600);
      });
    } catch (error) {
      Alert.alert('Erro', error.message || 'Erro ao enviar solicita��o');
      setIsSubmitting(false);
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {STEPS.map((step, index) => {
        const animatedValue = progressAnimations[index];
        const backgroundColor = animatedValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [theme.colors.surfaceElevated, theme.colors.primary, '#30D158'],
        });
        const borderColor = animatedValue.interpolate({
          inputRange: [0, 1, 2],
          outputRange: ['#444', 'transparent', 'transparent'],
        });

        return (
          <React.Fragment key={step}>
            <Animated.View
              style={[
                styles.progressCircle,
                { backgroundColor, borderColor },
              ]}
            >
              {animatedValue.__getValue() === 2 ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Animated.Text
                  style={[
                    styles.progressText,
                    {
                      color: animatedValue.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [theme.colors.disabledText, '#fff', '#fff'],
                      }),
                    },
                  ]}
                >
                  {index + 1}
                </Animated.Text>
              )}
            </Animated.View>
            {index < STEPS.length - 1 && <View style={styles.progressLine} />}
          </React.Fragment>
        );
      })}
      <View style={styles.stepLabels}>
        {STEPS.map((step, index) => (
          <Text key={step} style={styles.stepLabel}>
            {step}
          </Text>
        ))}
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, theme.typography.h3]}>
              Qual ve�culo precisa da pe�a?
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.vehiclesList}>
              {loadingVehicles ? (
                <Text style={styles.loadingText}>Carregando ve�culos...</Text>
              ) : veiculos.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum ve�culo cadastrado</Text>
              ) : (
                veiculos.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleCard,
                      selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected,
                    ]}
                    onPress={() => setSelectedVehicle(vehicle)}
                  >
                    <Ionicons
                      name="car-sport-outline"
                      size={24}
                      color={selectedVehicle?.id === vehicle.id ? '#fff' : theme.colors.accent}
                    />
                    <View style={styles.vehicleInfo}>
                      <Text
                        style={[
                          styles.vehicleName,
                          selectedVehicle?.id === vehicle.id && styles.vehicleTextSelected,
                        ]}
                      >
                        {vehicle.marca} {vehicle.modelo}
                      </Text>
                      <Text
                        style={[
                          styles.vehiclePlate,
                          selectedVehicle?.id === vehicle.id && styles.vehicleTextSelected,
                        ]}
                      >
                        {vehicle.placa}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>Descreva a pe�a que voc� precisa</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Ex: Filtro de �leo para motor 2.0 turbo..."
                value={description}
                onChangeText={setDescription}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text
                style={[
                  styles.charCount,
                  description.length > 400 && description.length <= 490 && styles.charCountWarning,
                  description.length > 490 && styles.charCountError,
                ]}
              >
                {description.length}/500
              </Text>
            </View>
            <Text style={styles.hintText}>Inclua marca, modelo e c�digo se souber</Text>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Adicione uma foto da pe�a (opcional)</Text>
            {!photo ? (
              <TouchableOpacity style={styles.photoButton} onPress={handleSelectPhoto}>
                <Ionicons name="camera-outline" size={48} color="#2A5298" />
                <Text style={styles.photoButtonText}>Toque para adicionar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <TouchableOpacity style={styles.removePhotoButton} onPress={() => setPhoto(null)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const renderNavigationButtons = () => {
    if (isSubmitting) {
      return (
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successCircle,
              { transform: [{ scale: successScale }] },
            ]}
          >
            <Ionicons name="checkmark" size={32} color="#fff" />
          </Animated.View>
        </View>
      );
    }

    const isNextDisabled =
      (currentStep === 0 && !selectedVehicle) ||
      (currentStep === 1 && !description.trim());

    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleBack}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Text>
        </TouchableOpacity>
        {currentStep < STEPS.length - 1 ? (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isNextDisabled && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={isNextDisabled}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Pr�ximo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
          >
            <Text style={[styles.buttonText, styles.submitButtonText]}>Enviar Solicita��o</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Solicitar Or�amento" onBack={handleBack} />
      {renderProgressIndicator()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>
      {renderNavigationButtons()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressLine: {
    height: 1,
    backgroundColor: '#333',
    flex: 1,
    marginHorizontal: 8,
  },
  stepLabels: {
    position: 'absolute',
    top: 60,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    fontSize: 12,
    color: theme.colors.disabledText,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  stepTitle: {
    marginBottom: 24,
    color: '#fff',
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  vehiclesList: {
    paddingBottom: 24,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: theme.colors.surfaceElevated,
    backgroundColor: theme.colors.surfaceElevated,
  },
  vehicleCardSelected: {
    borderWidth: 2,
    borderColor: '#2A5298',
    backgroundColor: '#0D1F3C',
  },
  vehicleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  vehicleTextSelected: {
    color: '#fff',
  },
  vehiclePlate: {
    fontSize: 14,
    color: theme.colors.disabledText,
    marginTop: 2,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: theme.colors.surfaceElevated,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: theme.colors.disabledText,
  },
  charCountWarning: {
    color: theme.colors.warning,
  },
  charCountError: {
    color: theme.colors.error,
  },
  hintText: {
    fontSize: 14,
    color: theme.colors.disabledText,
    marginTop: 8,
  },
  photoButton: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#2A5298',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceElevated,
  },
  photoButtonText: {
    fontSize: 16,
    color: '#2A5298',
    marginTop: 8,
  },
  photoPreview: {
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  submitButton: {
    backgroundColor: '#FF9500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  primaryButtonText: {
    color: '#fff',
  },
  submitButtonText: {
    color: '#000',
  },
  successContainer: {
    padding: 16,
    alignItems: 'center',
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0D3320',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.disabledText,
    marginTop: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.disabledText,
    marginTop: 24,
  },
});
