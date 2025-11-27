import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, Upload, X, CheckCircle, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ReturnItemCameraProps {
  onNext: () => void;
  orderId: string;
}

const { width } = Dimensions.get('window');

export default function ReturnItemCamera({ onNext, orderId }: ReturnItemCameraProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const handleStartCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }
    }
    setCameraActive(true);
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo) {
          setCapturedImage(photo.uri);
          setCameraActive(false);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCameraActive(true);
  };

  const handleUpload = () => {
      setUploading(true);
      setTimeout(() => {
          setUploading(false);
          Alert.alert('Success', 'Image uploaded successfully for verification!');
        }, 1500);
        onNext();
    };
    
  return (
    <LinearGradient
      colors={['#4F46E5', '#7C3AED', '#EC4899']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Camera color="#fff" size={40} />
          </View>
          <Text style={styles.title}>Return Verification</Text>
          <Text style={styles.subtitle}>Take a photo of your item for verification</Text>
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {/* Camera/Preview Area */}
          <View style={styles.cameraContainer}>
            {capturedImage ? (
              <>
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                <View style={styles.capturedBadge}>
                  <CheckCircle color="#fff" size={16} />
                  <Text style={styles.capturedText}>Captured</Text>
                </View>
              </>
            ) : cameraActive ? (
              <View style={styles.cameraViewContainer}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="back"
                />
                <View style={styles.cameraOverlay}>
                  <View style={styles.scanFrame}>
                    <View style={styles.cameraPulse}>
                      <Camera color="#fff" size={80} />
                    </View>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                  <Text style={styles.cameraText}>Position item in frame</Text>
                  <Text style={styles.cameraSubtext}>Ensure good lighting</Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <View style={styles.placeholderIcon}>
                  <Camera color="#4F46E5" size={64} />
                </View>
                <Text style={styles.placeholderTitle}>Ready to capture</Text>
                <Text style={styles.placeholderSubtitle}>Tap the button below to start</Text>
              </View>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!capturedImage ? (
              <>
                {!cameraActive ? (
                  <TouchableOpacity onPress={handleStartCamera} style={styles.primaryButton}>
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      <Camera color="#fff" size={24} />
                      <Text style={styles.primaryButtonText}>Open Camera</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      onPress={() => setCameraActive(false)}
                      style={[styles.button, styles.secondaryButton]}
                    >
                      <X color="#475569" size={20} />
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCapture} style={[styles.button, styles.captureButton]}>
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Camera color="#fff" size={20} />
                        <Text style={styles.captureButtonText}>Capture</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.buttonColumn}>
                <TouchableOpacity
                  onPress={handleUpload}
                  disabled={uploading}
                  style={[styles.primaryButton, uploading && styles.disabledButton]}
                >
                  <LinearGradient
                    colors={uploading ? ['#94A3B8', '#64748B'] : ['#4F46E5', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {uploading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.primaryButtonText}>Uploading...</Text>
                      </>
                    ) : (
                      <>
                        <Upload color="#fff" size={24} />
                        <Text style={styles.primaryButtonText}>Submit for Verification</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRetake}
                  disabled={uploading}
                  style={[styles.outlineButton, uploading && styles.disabledButton]}
                >
                  <RotateCcw color="#475569" size={20} />
                  <Text style={styles.outlineButtonText}>Retake Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <View style={styles.infoDot} />
                <Text style={styles.infoTitle}>Photo Guidelines</Text>
              </View>
              <View style={styles.infoList}>
                <View style={styles.infoItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.infoText}>Ensure item is clearly visible</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.infoText}>Capture any defects or damage</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.infoText}>Use good lighting for best results</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    width: '100%',
    maxWidth: 500,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 40,
    overflow: 'hidden',
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  cameraViewContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
  },
  scanFrame: {
    width: 256,
    height: 256,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
  },
  cameraPulse: {
    opacity: 0.8,
  },
  corner: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderColor: '#60A5FA',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 24,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 24,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 24,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 24,
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  cameraSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  capturedBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  capturedText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderIcon: {
    width: 128,
    height: 128,
    backgroundColor: '#E0E7FF',
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  controls: {
    padding: 32,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  secondaryButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  captureButton: {
    overflow: 'hidden',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonColumn: {
    gap: 16,
  },
  outlineButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  infoCard: {
    marginTop: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoDot: {
    width: 8,
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#1E293B',
    fontSize: 14,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoText: {
    color: '#475569',
    fontSize: 14,
    flex: 1,
  },
});