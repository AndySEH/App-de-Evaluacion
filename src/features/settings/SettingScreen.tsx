import { useAuth } from "@/src/features/auth/presentation/context/authContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from 'react';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;

export default function SettingScreen() {
    const navigation = useNavigation<any>();
    const { user, logout, updateUser } = useAuth();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getUserId = () => {
        return user?.uid || user?.id || user?._id || '';
    };

    const getUserName = () => {
        if (user?.name) return user.name;
        if (user?.email) return user.email.split('@')[0];
        return 'Usuario';
    };

    const handleOpenEditModal = () => {
        setEditName(getUserName());
        setIsEditModalVisible(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalVisible(false);
        setEditName('');
    };

    const handleSaveProfile = async () => {
        const userId = getUserId();
        if (!userId) {
            console.error('No user ID found');
            return;
        }

        setIsLoading(true);
        try {
            await updateUser(userId, { name: editName });
            console.log('Perfil actualizado exitosamente');
            handleCloseEditModal();
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            // Aquí podrías mostrar un mensaje de error al usuario
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header con gradiente */}
            <View style={styles.headerWrapper}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Mi Perfil</Text>
                        <Text style={styles.headerSubtitle}>Gestiona tu información personal</Text>
                    </View>
                </View>
            </View>

            {/* Contenido */}
            <View style={styles.scrollContent}>
                <View style={styles.contentWrapper}>
                    {/* Tarjeta de información del usuario */}
                    <Card style={styles.profileCard} mode="elevated">
                        <Card.Content style={styles.profileCardContent}>
                            {/* Avatar e información básica */}
                            <View style={styles.avatarSection}>
                                <View style={styles.avatarContainer}>
                                    <MaterialCommunityIcons name="account" size={48} color="#5C6BC0" />
                                </View>
                                <View style={styles.userBasicInfo}>
                                    <Text style={styles.userName}>{getUserName()}</Text>
                                </View>
                            </View>

                            {/* Información de contacto */}
                            <View style={styles.infoSection}>
                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <MaterialCommunityIcons name="email-outline" size={20} color="#6B6B6B" />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Email</Text>
                                        <Text style={styles.infoValue}>{user?.email || 'No disponible'}</Text>
                                    </View>
                                </View>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <MaterialCommunityIcons name="account-outline" size={20} color="#6B6B6B" />
                                    </View>
                                    <View style={styles.infoTextContainer}>
                                        <Text style={styles.infoLabel}>Usuario ID</Text>
                                        <Text style={styles.infoValue}>{getUserId()}</Text>
                                    </View>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Botones de acción */}
                    <TouchableOpacity 
                        style={styles.actionButton} 
                        activeOpacity={0.7}
                        onPress={handleOpenEditModal}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={20} color="#1C1C1E" />
                        <Text style={styles.actionButtonText}>Editar perfil</Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Botón de cerrar sesión */}
                    <TouchableOpacity 
                        style={styles.logoutButton} 
                        activeOpacity={0.7}
                        onPress={logout}
                    >
                        <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />
                        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Home')}>
                    <MaterialCommunityIcons name="home-outline" size={24} color="#636E72" />
                    <Text style={styles.navButtonText}>Inicio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Notifications')}>
                    <MaterialCommunityIcons name="bell-outline" size={24} color="#636E72" />
                    <Text style={styles.navButtonText}>Notificaciones</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton}>
                    <MaterialCommunityIcons name="account" size={24} color="#8B5CF6" />
                    <Text style={styles.navButtonTextActive}>Perfil</Text>
                </TouchableOpacity>
            </View>

            {/* Modal de edición de perfil */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseEditModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar Perfil</Text>
                            <TouchableOpacity onPress={handleCloseEditModal}>
                                <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Campo de nombre */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Nombre</Text>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Tu nombre completo"
                                    mode="flat"
                                    style={styles.input}
                                    underlineStyle={{ display: 'none' }}
                                    contentStyle={styles.inputContent}
                                    textColor="#000000"
                                    placeholderTextColor="#999999"
                                    disabled={isLoading}
                                />
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.cancelButton} 
                                onPress={handleCloseEditModal}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
                                onPress={handleSaveProfile}
                                disabled={isLoading}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isLoading ? 'Guardando...' : 'Guardar'}
                                </Text>
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
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
    },
    headerWrapper: {
        width: '100%',
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
    },
    header: {
        width: '100%',
        maxWidth: MAX_CONTENT_WIDTH,
        paddingTop: 48,
        paddingBottom: 24,
        paddingHorizontal: 20,
        backgroundColor: '#8B5CF6',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        gap: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#F3E8FF',
    },
    scrollContent: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    contentWrapper: {
        width: '100%',
        maxWidth: MAX_CONTENT_WIDTH,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    profileCard: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        marginBottom: 24,
    },
    profileCardContent: {
        padding: 20,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F5',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8EAF6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userBasicInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    infoSection: {
        gap: 20,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTextContainer: {
        flex: 1,
        gap: 2,
    },
    infoLabel: {
        fontSize: 13,
        color: '#6B6B6B',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
        elevation: 1,
    },
    actionButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
        elevation: 1,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    bottomNav: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#E8EAED',
        justifyContent: 'space-around',
    },
    navButton: {
        alignItems: 'center',
        gap: 4,
    },
    navButtonText: {
        fontSize: 12,
        color: '#636E72',
    },
    navButtonTextActive: {
        fontSize: 12,
        color: '#8B5CF6',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: 500,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F5',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    modalBody: {
        padding: 20,
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1C1C1E',
    },
    input: {
        backgroundColor: '#F0F0F5',
        borderRadius: 12,
    },
    inputContent: {
        backgroundColor: '#F0F0F5',
        paddingHorizontal: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F5',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B6B6B',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#8B5CF6',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#C4B5FD',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
