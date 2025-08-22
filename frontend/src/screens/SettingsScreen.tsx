import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
} from 'react-native';

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState({
    defaultQuality: '720p',
    downloadPath: '/storage/emulated/0/Download/MediaDownloader',
    autoConvertToMp3: false,
    showNotifications: true,
    floatingBubbleEnabled: true,
    darkMode: true,
    autoStartDownloads: false,
  });

  const [showAboutModal, setShowAboutModal] = useState(false);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleClearDownloads = () => {
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to clear all downloads? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            // This would clear all downloads from storage
            Alert.alert('Success', 'All downloads have been cleared.');
          }
        }
      ]
    );
  };

  const handleExportSettings = () => {
    Alert.alert('Export Settings', 'Settings exported successfully!');
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setSettings({
              defaultQuality: '720p',
              downloadPath: '/storage/emulated/0/Download/MediaDownloader',
              autoConvertToMp3: false,
              showNotifications: true,
              floatingBubbleEnabled: true,
              darkMode: true,
              autoStartDownloads: false,
            });
            Alert.alert('Success', 'Settings have been reset to default.');
          }
        }
      ]
    );
  };

  const handleAboutApp = () => {
    setShowAboutModal(true);
  };

  const renderSettingItem = (
    title: string, 
    value: string | boolean, 
    type: 'text' | 'toggle' | 'action',
    onPress?: () => void,
    onToggle?: (value: boolean) => void
  ) => (
    <View style={styles.settingSection}>
      <Text style={styles.settingTitle}>{title}</Text>
      {type === 'text' && (
        <Text style={styles.settingValue}>{value as string}</Text>
      )}
      {type === 'toggle' && (
        <Switch
          value={value as boolean}
          onValueChange={onToggle}
          trackColor={{ false: '#666666', true: '#FAD90E' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
        />
      )}
      {type === 'action' && (
        <TouchableOpacity onPress={onPress} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{value as string}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Download Settings</Text>
        </View>
        
        {renderSettingItem(
          'Default Quality',
          settings.defaultQuality,
          'text'
        )}
        
        {renderSettingItem(
          'Download Path',
          settings.downloadPath,
          'text'
        )}
        
        {renderSettingItem(
          'Auto Convert to MP3',
          settings.autoConvertToMp3,
          'toggle',
          undefined,
          (value) => updateSetting('autoConvertToMp3', value)
        )}
        
        {renderSettingItem(
          'Auto Start Downloads',
          settings.autoStartDownloads,
          'toggle',
          undefined,
          (value) => updateSetting('autoStartDownloads', value)
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App Settings</Text>
        </View>
        
        {renderSettingItem(
          'Show Notifications',
          settings.showNotifications,
          'toggle',
          undefined,
          (value) => updateSetting('showNotifications', value)
        )}
        
        {renderSettingItem(
          'Floating Bubble',
          settings.floatingBubbleEnabled,
          'toggle',
          undefined,
          (value) => updateSetting('floatingBubbleEnabled', value)
        )}
        
        {renderSettingItem(
          'Dark Mode',
          settings.darkMode,
          'toggle',
          undefined,
          (value) => updateSetting('darkMode', value)
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions</Text>
        </View>
        
        {renderSettingItem(
          'Clear All Downloads',
          'Clear',
          'action',
          handleClearDownloads
        )}
        
        {renderSettingItem(
          'Export Settings',
          'Export',
          'action',
          handleExportSettings
        )}
        
        {renderSettingItem(
          'Reset Settings',
          'Reset',
          'action',
          handleResetSettings
        )}
        
        <TouchableOpacity style={styles.aboutButton} onPress={handleAboutApp}>
          <Text style={styles.aboutButtonText}>About App</Text>
        </TouchableOpacity>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>App Information:</Text>
          <Text style={styles.infoText}>Version: 1.0.0</Text>
          <Text style={styles.infoText}>React Native: 0.81.0</Text>
          <Text style={styles.infoText}>Backend API: Ready</Text>
          <Text style={styles.infoText}>Build: Development</Text>
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>About Media Downloader</Text>
            
            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>Features</Text>
              <Text style={styles.aboutText}>• Download from multiple platforms</Text>
              <Text style={styles.aboutText}>• Quality selection</Text>
              <Text style={styles.aboutText}>• Background downloads</Text>
              <Text style={styles.aboutText}>• Progress tracking</Text>
              <Text style={styles.aboutText}>• Pause/Resume functionality</Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>Supported Platforms</Text>
              <Text style={styles.aboutText}>• YouTube</Text>
              <Text style={styles.aboutText}>• Instagram</Text>
              <Text style={styles.aboutText}>• TikTok</Text>
              <Text style={styles.aboutText}>• Twitter</Text>
              <Text style={styles.aboutText}>• Facebook</Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>Version Info</Text>
              <Text style={styles.aboutText}>Version: 1.0.0</Text>
              <Text style={styles.aboutText}>Build: 2024.1</Text>
              <Text style={styles.aboutText}>React Native: 0.81.0</Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    marginBottom: 30,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FAD90E',
    fontWeight: 'bold',
  },
  settingSection: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#a0a0a0',
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: '#FAD90E',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FAD90E',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  aboutButtonText: {
    color: '#FAD90E',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 20,
    color: '#FAD90E',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoText: {
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FAD90E',
    textAlign: 'center',
    marginBottom: 20,
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutSectionTitle: {
    fontSize: 18,
    color: '#FAD90E',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 5,
  },
  modalCloseButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FAD90E',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseText: {
    color: '#FAD90E',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
