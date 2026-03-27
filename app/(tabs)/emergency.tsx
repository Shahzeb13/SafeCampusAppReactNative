import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Linking, 
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { emergencyService, EmergencyContact } from '../../services/emergencyService';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';

export default function EmergencyScreen() {
    const { user } = useAuth();
    const { showSnackbar } = useSnackbar();
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingContact, setEditingContact] = useState<Partial<EmergencyContact> | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        category: 'other' as EmergencyContact['category'],
        isPrimary: false
    });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const data = await emergencyService.getContacts();
            setContacts(data);
        } catch (error) {
            console.error('Error fetching contacts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (number: string) => {
        Linking.openURL(`tel:${number}`);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.phoneNumber) {
            showSnackbar('Please fill in name and phone number', 'error');
            return;
        }

        try {
            if (editingContact?._id) {
                await emergencyService.updateContact(editingContact._id, formData);
                showSnackbar('Contact updated', 'success');
            } else {
                await emergencyService.createContact(formData);
                showSnackbar('Contact created', 'success');
            }
            fetchContacts();
            setModalVisible(false);
            resetForm();
        } catch (error) {
            showSnackbar('Failed to save contact', 'error');
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Contact',
            'Are you sure you want to delete this contact?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await emergencyService.deleteContact(id);
                            showSnackbar('Contact deleted', 'success');
                            fetchContacts();
                        } catch (error) {
                            showSnackbar('Failed to delete contact', 'error');
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setFormData({ name: '', phoneNumber: '', category: 'other', isPrimary: false });
        setEditingContact(null);
    };

    const openEdit = (contact: EmergencyContact) => {
        setEditingContact(contact);
        setFormData({
            name: contact.name,
            phoneNumber: contact.phoneNumber,
            category: contact.category,
            isPrimary: contact.isPrimary
        });
        setModalVisible(true);
    };

    const renderContact = ({ item }: { item: EmergencyContact }) => (
        <View style={[styles.contactCard, item.isPrimary && styles.primaryCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                    <MaterialCommunityIcons 
                        name={getCategoryIcon(item.category)} 
                        size={24} 
                        color="#FF3B70" 
                    />
                </View>
                <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactCategory}>{item.category.toUpperCase()}</Text>
                </View>
                {isAdmin && (
                    <View style={styles.adminActions}>
                        <TouchableOpacity onPress={() => openEdit(item)}>
                            <MaterialCommunityIcons name="pencil-outline" size={20} color="#757575" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item._id)}>
                            <MaterialCommunityIcons name="delete-outline" size={20} color="#FF3B70" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            
            <TouchableOpacity 
                style={styles.callStrip}
                onPress={() => handleCall(item.phoneNumber)}
            >
                <MaterialCommunityIcons name="phone" size={18} color="white" />
                <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
                <Text style={styles.callNow}>CALL NOW</Text>
            </TouchableOpacity>
        </View>
    );

    const getCategoryIcon = (category: string) => {
        switch(category) {
            case 'security': return 'shield-account';
            case 'ambulance': return 'ambulance';
            case 'fire': return 'fire-truck';
            case 'admin': return 'office-building';
            case 'hostel': return 'home-city';
            default: return 'phone';
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF3B70" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Emergency Contacts</Text>
                {isAdmin && (
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => { resetForm(); setModalVisible(true); }}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={contacts}
                keyExtractor={(item) => item._id}
                renderItem={renderContact}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="phone-off" size={60} color="#E0E0E0" />
                        <Text style={styles.emptyText}>No contacts found</Text>
                    </View>
                }
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingContact ? 'Edit Contact' : 'Add New Contact'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput 
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(val) => setFormData({...formData, name: val})}
                                placeholder="e.g. Campus Security Office"
                            />

                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput 
                                style={styles.input}
                                value={formData.phoneNumber}
                                onChangeText={(val) => setFormData({...formData, phoneNumber: val})}
                                placeholder="e.g. 051-1234567"
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoryPicker}>
                                {['security', 'ambulance', 'fire', 'admin', 'hostel', 'other'].map((cat) => (
                                    <TouchableOpacity 
                                        key={cat}
                                        style={[
                                            styles.catChip, 
                                            formData.category === cat && styles.activeCatChip
                                        ]}
                                        onPress={() => setFormData({...formData, category: cat as any})}
                                    >
                                        <Text style={[
                                            styles.catChipText,
                                            formData.category === cat && styles.activeCatChipText
                                        ]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity 
                                style={styles.primaryToggle}
                                onPress={() => setFormData({...formData, isPrimary: !formData.isPrimary})}
                            >
                                <MaterialCommunityIcons 
                                    name={formData.isPrimary ? "checkbox-marked" : "checkbox-blank-outline"} 
                                    size={24} 
                                    color="#FF3B70" 
                                />
                                <Text style={styles.primaryToggleText}>Mark as Primary Emergency Contact</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                                <Text style={styles.saveButtonText}>SAVE CONTACT</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A237E',
    },
    addButton: {
        backgroundColor: '#FF3B70',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    list: {
        padding: 15,
        paddingBottom: 40,
    },
    contactCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 15,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    primaryCard: {
        borderColor: '#FF3B70',
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFF5F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
        marginLeft: 15,
    },
    contactName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A237E',
    },
    contactCategory: {
        fontSize: 10,
        color: '#9E9E9E',
        fontWeight: '900',
        marginTop: 2,
    },
    adminActions: {
        flexDirection: 'row',
        gap: 15,
    },
    callStrip: {
        backgroundColor: '#FF3B70',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 15,
    },
    phoneNumber: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        flex: 1,
    },
    callNow: {
        color: 'white',
        fontSize: 12,
        fontWeight: '900',
    },
    empty: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 20,
        color: '#9E9E9E',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '80%',
        padding: 25,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A237E',
    },
    modalForm: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#424242',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    categoryPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    catChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    activeCatChip: {
        backgroundColor: '#FF3B70',
        borderColor: '#FF3B70',
    },
    catChipText: {
        fontSize: 12,
        color: '#666',
    },
    activeCatChipText: {
        color: 'white',
        fontWeight: 'bold',
    },
    primaryToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 25,
        gap: 10,
    },
    primaryToggleText: {
        fontSize: 14,
        color: '#424242',
    },
    saveButton: {
        backgroundColor: '#FF3B70',
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
        marginTop: 35,
        marginBottom: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
