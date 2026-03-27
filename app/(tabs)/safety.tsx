import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SAFETY_TIPS = [
    {
        title: 'Personal Safety',
        icon: 'account-shield-outline',
        tips: [
            'Avoid walking alone at night in poorly lit areas.',
            'Keep your belongings secure and never leave them unattended.',
            'Be aware of your surroundings at all times.',
            'Keep emergency contacts on speed dial.'
        ]
    },
    {
        title: 'Theft Prevention',
        icon: 'lock-outline',
        tips: [
            'Lock your doors and windows when leaving your room/locker.',
            'Do not display large amounts of cash or expensive gadgets.',
            'Register your electronics with campus security.',
            'Use high-quality locks for bicycles and motorcycles.'
        ]
    },
    {
        title: 'Fire Safety',
        icon: 'fire-extinguisher',
        tips: [
            'Know the nearest fire exit and assembly point.',
            'Never block fire exits or tamper with fire equipment.',
            'In case of fire, use stairs, not elevators.',
            'Notify security immediately if you smell smoke.'
        ]
    }
];

export default function SafetyScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Safety Guidelines</Text>
                <Text style={styles.subtitle}>Stay safe and informed on campus</Text>
            </View>

            <View style={styles.emergencyBanner}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="white" />
                <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerTitle}>In Case of Emergency</Text>
                    <Text style={styles.bannerSubtitle}>Call campus security immediately</Text>
                </View>
                <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => Linking.openURL('tel:1234')}
                >
                    <MaterialCommunityIcons name="phone" size={20} color="#FF3B70" />
                </TouchableOpacity>
            </View>

            {SAFETY_TIPS.map((section, idx) => (
                <View key={idx} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name={section.icon as any} size={24} color="#FF3B70" />
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                    </View>
                    <View style={styles.tipsList}>
                        {section.tips.map((tip, tipIdx) => (
                            <View key={tipIdx} style={styles.tipItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ))}

            <View style={styles.footer}>
                <Text style={styles.footerText}>Report any suspicious activity via the Incident Report section.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A237E',
    },
    subtitle: {
        fontSize: 14,
        color: '#757575',
        marginTop: 5,
    },
    emergencyBanner: {
        backgroundColor: '#FF3B70',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        elevation: 3,
    },
    bannerTextContainer: {
        flex: 1,
        marginLeft: 15,
    },
    bannerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    callButton: {
        backgroundColor: 'white',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A237E',
        marginLeft: 10,
    },
    tipsList: {
        gap: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF3B70',
        marginTop: 8,
        marginRight: 10,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#424242',
        lineHeight: 20,
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#9E9E9E',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
