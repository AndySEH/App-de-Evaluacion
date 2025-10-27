import { StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';


export default function SettingScreen() {
    return (
        <Surface style={styles.container}>
            <Text>Settings..</Text>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
