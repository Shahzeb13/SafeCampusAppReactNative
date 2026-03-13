import { View , Text, StyleSheet } from "react-native";

export default function() {
    return (
        <View>
            <Text style = {styles.text}>Under Construction</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    text: {
        fontWeight: "bold",
        fontSize: 20,
        fontFamily: "roboto",
        color: "white",
        textAlign : "center",
        paddingTop: 50
    }
})