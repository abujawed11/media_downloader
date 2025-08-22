import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useDownloadStore } from '../store/downloadStore';
import { downloadService } from '../services/downloadService';
import { mediaPlayerService } from '../services/mediaPlayer';
import { fileStorageService } from '../services/fileStorage';

const DownloadsScreen: React.FC = () => {
    const {
        downloads,
        removeDownload,
        updateDownload,
    } = useDownloadStore();

    const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
    const [playbackInfo, setPlaybackInfo] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [processingDownloads, setProcessingDownloads] = useState<Set<string>>(new Set());

    // Cleanup media player when component unmounts
    useEffect(() => {
        return () => {
            mediaPlayerService.cleanup();
        };
    }, []);

    // Refresh downloads list
    const onRefresh = async () => {
        setRefreshing(true);
        // Add any refresh logic here if needed
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    const handleStart = async (downloadId: string) => {
        try {
            const download = downloads.find(d => d.id === downloadId);
            if (!download) return;

            // Prevent multiple clicks
            if (processingDownloads.has(downloadId)) return;
            setProcessingDownloads(prev => new Set([...prev, downloadId]));

            // Update status immediately
            updateDownload(downloadId, {
                status: 'downloading',
                progress: 0
            });

            // Start the download
            await downloadService.startDownload(downloadId);

            Alert.alert(
                'Download Started',
                `"${download.title}" download has been started and will begin shortly.`,
                [{ text: 'OK' }]
            );

        } catch (error) {
            console.error('Start download error:', error);
            updateDownload(downloadId, { status: 'error', progress: 0 });
            Alert.alert(
                'Download Error',
                'Failed to start download. Please check your connection and try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setProcessingDownloads(prev => {
                const newSet = new Set(prev);
                newSet.delete(downloadId);
                return newSet;
            });
        }
    };

    const handlePauseResume = async (downloadId: string, currentStatus: string) => {
        try {
            const download = downloads.find(d => d.id === downloadId);
            if (!download) return;

            if (currentStatus === 'downloading') {
                downloadService.pauseDownload(downloadId);
                updateDownload(downloadId, { status: 'paused' });
                Alert.alert(
                    'Download Paused',
                    `"${download.title}" has been paused. You can resume it later.`,
                    [{ text: 'OK' }]
                );
            } else if (currentStatus === 'paused') {
                updateDownload(downloadId, { status: 'downloading' });
                downloadService.resumeDownload(downloadId);
                Alert.alert(
                    'Download Resumed',
                    `"${download.title}" download has been resumed.`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Pause/Resume error:', error);
            Alert.alert('Error', 'Failed to pause/resume download.');
        }
    };

    const handleCancel = (downloadId: string, title: string) => {
        Alert.alert(
            'Cancel Download',
            `Are you sure you want to cancel "${title}"?\n\nThis action cannot be undone.`,
            [
                {
                    text: 'No',
                    style: 'cancel'
                },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => {
                        downloadService.cancelDownload(downloadId);
                        removeDownload(downloadId);
                        Alert.alert(
                            'Download Cancelled',
                            `"${title}" download has been cancelled and removed from the list.`,
                            [{ text: 'OK' }]
                        );
                    }
                }
            ]
        );
    };

    const handlePlay = async (downloadId: string, filePath: string) => {
        try {
            const download = downloads.find(d => d.id === downloadId);
            if (!download) return;

            setCurrentlyPlaying(downloadId);

            await mediaPlayerService.playFile(filePath, (info) => {
                setPlaybackInfo(info);
            });

        } catch (error) {
            console.error('Error playing file:', error);
            Alert.alert(
                'Playback Error',
                `Could not play "${downloads.find(d => d.id === downloadId)?.title}". The file may be corrupted or missing.`,
                [{ text: 'OK' }]
            );
            setCurrentlyPlaying(null);
            setPlaybackInfo(null);
        }
    };

    const handleStop = async () => {
        try {
            await mediaPlayerService.stop();
            setCurrentlyPlaying(null);
            setPlaybackInfo(null);
        } catch (error) {
            console.error('Error stopping playback:', error);
            Alert.alert('Error', 'Failed to stop playback.');
        }
    };

    const handleOpenFile = async (filePath: string, title: string) => {
        try {
            const fileInfo = await fileStorageService.getFileInfo(filePath);
            if (!fileInfo.exists) {
                Alert.alert('File Not Found', 'The downloaded file could not be found.');
                return;
            }

            Alert.alert(
                'File Information',
                `File: ${title}\nLocation: ${filePath}\nSize: ${(fileInfo.size / 1024 / 1024).toFixed(2)} MB\n\nThe file is saved in your device storage.`,
                [
                    { text: 'OK' }
                ]
            );
        } catch (error) {
            console.error('Error getting file info:', error);
            Alert.alert('Error', 'Could not access file information.');
        }
    };

    const handleDelete = async (downloadId: string, title: string, filePath?: string) => {
        Alert.alert(
            'Delete Download',
            `Are you sure you want to delete "${title}"?\n\nThis will remove the download from the list and delete the file from your device storage.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Stop playback if this file is currently playing
                            if (currentlyPlaying === downloadId) {
                                await handleStop();
                            }

                            // Delete file from storage if it exists
                            if (filePath) {
                                const deleted = await fileStorageService.deleteFile(filePath);
                                console.log('File deleted:', deleted);
                            }

                            // Remove from store
                            removeDownload(downloadId);

                            Alert.alert(
                                'Download Deleted',
                                `"${title}" has been removed from the list and deleted from storage.`,
                                [{ text: 'OK' }]
                            );

                        } catch (error) {
                            console.error('Error deleting download:', error);
                            Alert.alert('Error', 'Failed to delete the download completely.');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#00C851';
            case 'downloading':
                return '#FAD90E';
            case 'paused':
                return '#FF8800';
            case 'error':
                return '#FF4444';
            case 'pending':
                return '#a0a0a0';
            default:
                return '#a0a0a0';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return '✅';
            case 'downloading':
                return '⏳';
            case 'paused':
                return '⏸️';
            case 'error':
                return '❌';
            case 'pending':
                return '📥';
            default:
                return '📥';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Completed';
            case 'downloading':
                return 'Downloading';
            case 'paused':
                return 'Paused';
            case 'error':
                return 'Error';
            case 'pending':
                return 'Pending';
            default:
                return 'Unknown';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Filter downloads by status for better organization
    const pendingDownloads = downloads.filter(d => d.status === 'pending');
    const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'paused');
    const completedDownloads = downloads.filter(d => d.status === 'completed');
    const errorDownloads = downloads.filter(d => d.status === 'error');

    if (downloads.length === 0) {
        return (
            <View style={styles.container}>
                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📥</Text>
                        <Text style={styles.emptyTitle}>No downloads yet</Text>
                        <Text style={styles.emptyText}>
                            Start downloading media from the Home tab{'\n'}
                            Supported platforms: YouTube, Instagram, Facebook, Twitter
                        </Text>
                    </View>

                    <View style={styles.statsContainer}>
                        <Text style={styles.statsTitle}>App Features:</Text>
                        <Text style={styles.stat}>✅ Progress tracking with pause/resume</Text>
                        <Text style={styles.stat}>✅ Quality selection (360p/720p/1080p)</Text>
                        <Text style={styles.stat}>✅ Audio-only MP3 downloads</Text>
                        <Text style={styles.stat}>✅ Background downloading</Text>
                        <Text style={styles.stat}>✅ Platform organization</Text>
                        <Text style={styles.stat}>✅ Download queue management</Text>
                        <Text style={styles.stat}>✅ Built-in media player</Text>
                        <Text style={styles.stat}>✅ File management</Text>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Downloads</Text>
                    <Text style={styles.subtitle}>
                        {downloads.length} total • {activeDownloads.length} active • {completedDownloads.length} completed
                    </Text>
                </View>

                {downloads.map((download) => (
                    <View key={download.id} style={styles.downloadItem}>
                        <View style={styles.downloadHeader}>
                            <Image
                                source={{ uri: download.thumbnail }}
                                style={styles.downloadThumbnail}
                                resizeMode="cover"
                                onError={(error) => {
                                    console.log('Thumbnail load error:', error);
                                }}
                            />
                            <View style={styles.downloadInfo}>
                                <Text style={styles.downloadTitle} numberOfLines={2}>
                                    {download.title}
                                </Text>
                                <Text style={styles.downloadPlatform}>
                                    {download.platform.toUpperCase()} • {download.format.toUpperCase()}
                                    {download.filePath && ' • Saved to Device'}
                                </Text>
                                <View style={styles.statusContainer}>
                                    <Text style={styles.statusIcon}>
                                        {getStatusIcon(download.status)}
                                    </Text>
                                    <Text style={[styles.downloadStatus, { color: getStatusColor(download.status) }]}>
                                        {getStatusText(download.status)}
                                    </Text>
                                    {download.createdAt && (
                                        <Text style={styles.downloadDate}>
                                            • {new Date(download.createdAt).toLocaleDateString()}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        {(download.progress > 0 || download.status === 'downloading') && download.status !== 'completed' && (
                            <View style={styles.progressContainer}>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${download.progress}%`,
                                                backgroundColor: getStatusColor(download.status)
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressText}>
                                    {download.progress}%
                                    {download.status === 'downloading' && ' • Downloading...'}
                                    {download.status === 'paused' && ' • Paused'}
                                </Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            {download.status === 'pending' && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.startButton]}
                                        onPress={() => handleStart(download.id)}
                                        disabled={processingDownloads.has(download.id)}
                                    >
                                        {processingDownloads.has(download.id) ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Text style={styles.actionButtonText}>▶️ Start</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.cancelButton]}
                                        onPress={() => handleCancel(download.id, download.title)}
                                    >
                                        <Text style={styles.actionButtonText}>❌ Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {download.status === 'downloading' && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.pauseButton]}
                                        onPress={() => handlePauseResume(download.id, download.status)}
                                    >
                                        <Text style={styles.actionButtonText}>⏸️ Pause</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.cancelButton]}
                                        onPress={() => handleCancel(download.id, download.title)}
                                    >
                                        <Text style={styles.actionButtonText}>❌ Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {download.status === 'paused' && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.resumeButton]}
                                        onPress={() => handlePauseResume(download.id, download.status)}
                                    >
                                        <Text style={styles.actionButtonText}>▶️ Resume</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.cancelButton]}
                                        onPress={() => handleCancel(download.id, download.title)}
                                    >
                                        <Text style={styles.actionButtonText}>❌ Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {download.status === 'error' && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.retryButton]}
                                        onPress={() => handleStart(download.id)}
                                    >
                                        <Text style={styles.actionButtonText}>🔄 Retry</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDelete(download.id, download.title, download.filePath)}
                                    >
                                        <Text style={styles.actionButtonText}>🗑️ Remove</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                            {download.status === 'completed' && download.filePath && (
                                <>
                                    {currentlyPlaying === download.id ? (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.stopButton]}
                                            onPress={handleStop}
                                        >
                                            <Text style={styles.actionButtonText}>⏹️ Stop</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.playButton]}
                                            onPress={() => handlePlay(download.id, download.filePath!)}
                                        >
                                            <Text style={styles.actionButtonText}>▶️ Play</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.openButton]}
                                        onPress={() => handleOpenFile(download.filePath!, download.title)}
                                    >
                                        <Text style={styles.actionButtonText}>📁 Info</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDelete(download.id, download.title, download.filePath)}
                                    >
                                        <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {/* Playback Info */}
                        {currentlyPlaying === download.id && playbackInfo && (
                            <View style={styles.playbackInfo}>
                                <Text style={styles.playbackText}>
                                    🎵 Currently Playing • {playbackInfo.isPlaying ? 'Playing' : 'Paused'}
                                </Text>
                            </View>
                        )}
                    </View>
                ))}

                {/* Download Statistics */}
                <View style={styles.statisticsContainer}>
                    <Text style={styles.statisticsTitle}>Download Statistics</Text>
                    <View style={styles.statisticsRow}>
                        <Text style={styles.statisticsItem}>📥 Pending: {pendingDownloads.length}</Text>
                        <Text style={styles.statisticsItem}>⏳ Active: {activeDownloads.length}</Text>
                    </View>
                    <View style={styles.statisticsRow}>
                        <Text style={styles.statisticsItem}>✅ Completed: {completedDownloads.length}</Text>
                        <Text style={styles.statisticsItem}>❌ Errors: {errorDownloads.length}</Text>
                    </View>
                </View>
            </ScrollView>
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
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FAD90E',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#a0a0a0',
        textAlign: 'center',
        marginTop: 5,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 50,
        marginBottom: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        color: '#ffffff',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 16,
        color: '#a0a0a0',
        textAlign: 'center',
        lineHeight: 24,
    },
    statsContainer: {
        marginTop: 20,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
    },
    statsTitle: {
        fontSize: 18,
        color: '#FAD90E',
        fontWeight: 'bold',
        marginBottom: 15,
    },
    stat: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 8,
        lineHeight: 20,
    },
    downloadItem: {
        backgroundColor: '#2a2a2a',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333333',
    },
    downloadHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    downloadThumbnail: {
        width: 64,
        height: 64,
        borderRadius: 8,
        marginRight: 15,
        backgroundColor: '#333333',
    },
    downloadInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    downloadTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 6,
        lineHeight: 20,
    },
    downloadPlatform: {
        fontSize: 13,
        color: '#FAD90E',
        fontWeight: '600',
        marginBottom: 6,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    downloadStatus: {
        fontSize: 13,
        fontWeight: '600',
    },
    downloadDate: {
        fontSize: 12,
        color: '#888888',
        marginLeft: 6,
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#444444',
        borderRadius: 3,
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#a0a0a0',
        textAlign: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 2,
    },
    startButton: {
        backgroundColor: '#00C851',
    },
    pauseButton: {
        backgroundColor: '#FF8800',
    },
    resumeButton: {
        backgroundColor: '#00C851',
    },
    cancelButton: {
        backgroundColor: '#FF4444',
    },
    retryButton: {
        backgroundColor: '#2196F3',
    },
    playButton: {
        backgroundColor: '#2196F3',
    },
    stopButton: {
        backgroundColor: '#FF5722',
    },
    openButton: {
        backgroundColor: '#9C27B0',
    },
    deleteButton: {
        backgroundColor: '#666666',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },
    playbackInfo: {
        backgroundColor: '#1a4d1a',
        padding: 8,
        borderRadius: 6,
        marginTop: 10,
    },
    playbackText: {
        color: '#ffffff',
        fontSize: 12,
        textAlign: 'center',
    },
    statisticsContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
    },
    statisticsTitle: {
        fontSize: 16,
        color: '#FAD90E',
        fontWeight: 'bold',
        marginBottom: 12,
    },
    statisticsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    statisticsItem: {
        fontSize: 13,
        color: '#ffffff',
    },
});

export default DownloadsScreen;
