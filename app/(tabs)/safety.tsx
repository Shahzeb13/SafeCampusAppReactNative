import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const SAFETY_TIPS = [
    {
        title: 'Movement Around Campus (Dhamtour Side)',
        icon: 'map-marker-path',
        tips: [
            'Avoid walking alone on the Dhamtour road after Maghrib—traffic gets sparse and areas become quiet.',
            'If you stay late on campus, leave in groups or arrange transport beforehand.',
            'Stick to main roads; avoid shortcuts through empty plots or hilly paths.',
            'Keep your phone charged—network can drop in some areas.'
        ]
    },
    {
        title: 'Transport & Commute Safety',
        icon: 'car-outline',
        tips: [
            'Prefer known rickshaws or ride services—avoid random lifts, even if offered by students.',
            'Share your live location with a friend when heading home at night.',
            'Note the vehicle number if using local transport regularly.',
            'Avoid standing alone for long on isolated bus stops.'
        ]
    },
    {
        title: 'Mobile & Theft Awareness',
        icon: 'cellphone-lock',
        tips: [
            'Don’t use your phone openly while walking near roads—snatching cases do happen.',
            'Keep your phone and wallet in front pockets or secure bags.',
            'Avoid carrying expensive gadgets unnecessarily to campus.',
            'Use basic phone lock + tracking (Find My Device).'
        ]
    },
    {
        title: 'Emergency & Real Situations',
        icon: 'alert-outline',
        tips: [
            'Save campus security and 15 (police) on speed dial.',
            'If something feels off, trust your instinct and leave immediately.',
            'In case of harassment or threat, go to crowded spots or campus gate.',
            'Use the SOS feature immediately instead of trying to handle things alone.'
        ]
    },
    {
        title: 'Weather & Terrain Awareness',
        icon: 'weather-fog',
        tips: [
            'In winter or fog, visibility drops—avoid late travel on hilly roads.',
            'Roads around Abbottabad can get slippery during rain—be careful on bikes.',
            'Street lighting is weak in some areas—carry a small flashlight if needed.',
            'Avoid isolated viewpoints or hills after dark.'
        ]
    }
];

export default function SafetyScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#F8F9FA' }]} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Safety Guidelines</Text>
                <Text style={[styles.subtitle, { color: theme.icon }]}>Stay safe and informed on campus</Text>
            </View>

            <View style={styles.emergencyBanner}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="white" />
                <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerTitle}>In Case of Emergency</Text>
                    <Text style={styles.bannerSubtitle}>Call campus security immediately</Text>
                </View>
                <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => Linking.openURL('tel:15')}
                >
                    <MaterialCommunityIcons name="phone" size={20} color="#FF3B70" />
                </TouchableOpacity>
            </View>

            {SAFETY_TIPS.map((section, idx) => (
                <View key={idx} style={[styles.section, { backgroundColor: theme.background }]}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name={section.icon as any} size={24} color="#FF3B70" />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                    </View>
                    <View style={styles.tipsList}>
                        {section.tips.map((tip, tipIdx) => (
                            <View key={tipIdx} style={styles.tipItem}>
                                <View style={styles.bullet} />
                                <Text style={[styles.tipText, { color: theme.icon }]}>{tip}</Text>
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
