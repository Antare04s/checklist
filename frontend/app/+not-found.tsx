import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, lightTheme as t } from "../src/theme";

export default function NotFound() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page not found</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/(tabs)/home")}>
          <Text style={styles.btnText}>Go home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  code: { fontSize: 64, fontWeight: "700", color: palette.primary },
  title: { fontSize: 18, color: t.textSecondary, marginTop: 8, marginBottom: 32 },
  btn: { backgroundColor: palette.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});