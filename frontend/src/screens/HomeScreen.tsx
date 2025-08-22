import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDownloadStore } from '../store/downloadStore';
import { ClipboardService } from '../services/clipboard';
import { ApiService } from '../services/api';
import { VideoFormat } from '../store/types';

const HomeScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  
  const {
    currentMediaInfo,
    isLoading,
    error,
    addDownload,
    setCurrentMediaInfo,
    setLoading,
    setError,
  } = useDownloadStore();

  useEffect(() => {
    checkClipboard();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      setError(null);
    }
  }, [error]);

  const checkClipboard = async () => {
    try {
      setIsPasting(true);
      const clipboardContent = await ClipboardService.getClipboardContent();
      if (ClipboardService.isValidUrl(clipboardContent) && 
          ClipboardService.isSupportedPlatform(clipboardContent)) {
        setUrl(clipboardContent);
        Alert.alert('URL Detected', 'Found a supported URL in your clipboard!');
      }
    } catch (error) {
      console.error('Error checking clipboard:', error);
    } finally {
      setIsPasting(false);
    }
  };

  const handleGetInfo = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    if (!ClipboardService.isValidUrl(url)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    if (!ClipboardService.isSupportedPlatform(url)) {
      Alert.alert('Error', 'This platform is not supported yet. Supported platforms: YouTube, Instagram, TikTok, Twitter, Facebook');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mediaInfo = await ApiService.getMediaInfo(url);
      setCurrentMediaInfo(mediaInfo);
      setShowModal(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get media information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: VideoFormat) => {
    if (!currentMediaInfo) return;

    addDownload({
      url: currentMediaInfo.url,
      title: currentMediaInfo.title,
      thumbnail: currentMediaInfo.thumbnail,
      platform: currentMediaInfo.platform,
      format: format.format_id,
      status: 'pending',
      progress: 0,
    });

    setShowModal(false);
    setCurrentMediaInfo(null);
    setUrl('');
    
    Alert.alert('Success', 'Download added to queue! Check the Downloads tab to see progress.');
  };

  const renderFormatOption = (format: VideoFormat) => (
    <TouchableOpacity
      key={format.format_id}
      style={styles.formatOption}
      onPress={() => handleDownload(format)}
    >
      <View style={styles.formatInfo}>
        <Text style={styles.formatQuality}>{format.quality}</Text>
        <Text style={styles.formatExt}>{format.ext.toUpperCase()}</Text>
      </View>
      {format.filesize && (
        <Text style={styles.formatSize}>
          {(format.filesize / (1024 * 1024)).toFixed(1)} MB
        </Text>
      )}
    </TouchableOpacity>
  );

  const clearUrl = () => {
    setUrl('');
    setCurrentMediaInfo(null);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Media Downloader</Text>
        <Text style={styles.subtitle}>
          Download from YouTube, Instagram, TikTok & more
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Paste URL:</Text>
            {url.length > 0 && (
              <TouchableOpacity onPress={clearUrl} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://youtube.com/watch?v=..."
            placeholderTextColor="#a0a0a0"
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, (isLoading || !url.trim()) && styles.disabledButton]}
          onPress={handleGetInfo}
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.primaryButtonText}>Get Download Options</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryButton, isPasting && styles.disabledButton]} 
          onPress={checkClipboard}
          disabled={isPasting}
        >
          {isPasting ? (
            <ActivityIndicator color="#FAD90E" size="small" />
          ) : (
            <Text style={styles.secondaryButtonText}>📋 Paste from Clipboard</Text>
          )}
        </TouchableOpacity>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Supported Platforms:</Text>
          <Text style={styles.feature}>🎥 YouTube - All resolutions</Text>
          <Text style={styles.feature}>📸 Instagram - Posts & Stories</Text>
          <Text style={styles.feature}>🎵 TikTok - HD quality</Text>
          <Text style={styles.feature}>🐦 Twitter - Videos & GIFs</Text>
          <Text style={styles.feature}>📘 Facebook - Public videos</Text>
        </View>
      </ScrollView>

      {/* Download Options Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentMediaInfo && (
              <>
                <View style={styles.modalHeader}>
                  <Image
                    source={{ uri: currentMediaInfo.thumbnail }}
                    style={styles.modalThumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalTitle} numberOfLines={2}>
                      {currentMediaInfo.title}
                    </Text>
                    <Text style={styles.modalPlatform}>
                      {currentMediaInfo.platform.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Choose Quality:</Text>
                <ScrollView style={styles.formatsContainer} showsVerticalScrollIndicator={false}>
                  {currentMediaInfo.formats.map(renderFormatOption)}
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FAD90E',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearButtonText: {
    color: '#FAD90E',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FAD90E',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#FAD90E',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FAD90E',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  secondaryButtonText: {
    color: '#FAD90E',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    marginTop: 20,
  },
  featuresTitle: {
    fontSize: 20,
    color: '#FAD90E',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  feature: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  modalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  modalPlatform: {
    fontSize: 14,
    color: '#FAD90E',
    fontWeight: '600',
  },
  modalSectionTitle: {
    fontSize: 18,
    color: '#FAD90E',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  formatsContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  formatOption: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatInfo: {
    flex: 1,
  },
  formatQuality: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  formatExt: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  formatSize: {
    fontSize: 14,
    color: '#FAD90E',
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FAD90E',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FAD90E',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
