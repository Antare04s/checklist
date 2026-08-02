import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, lightTheme as t } from "../../src/theme";
import { FlyReadyLogo } from "../../src/Logo";
import { useAuthStore } from "../../src/auth";
import { formatApiError } from "../../src/api";

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!email.trim()) { setErr("Please enter your email"); return; }
    setBusy(true);
    try {
      await login(email.trim());
      router.replace("/(tabs)/home");
    } catch (e: any) {
      const msg = formatApiError(e);
      if (msg.includes("404") || msg.includes("No account")) {
        setErr("No account found. Please register first.");
      } else {
        setErr(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoBox}>
            <View style={styles.logoCircle}>
              <FlyReadyLogo size={64} droneColor={palette.primary} />
            </View>
            <Text style={styles.brand}>FlyReady</Text>
            <Text style={styles.tagline}>Preflight · Inflight · Postflight</Text>
          </View>

          <Text style={styles.h1}>Welcome back</Text>
          <Text style={styles.sub}>Enter your email to continue</Text>

          <View style={{ height: 24 }} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            testID="login-email-input"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={t.textSecondary}
          />

          {err && <Text testID="login-error" style={styles.err}>{err}</Text>}

          <TouchableOpacity
            testID="login-submit-btn"
            disabled={busy}
            style={[styles.cta, busy && { opacity: 0.6 }]}
            onPress={submit}
          >
            <Text style={styles.ctaText}>{busy ? "Signing in…" : "Continue"}</Text>
            <Ionicons name="arrow-forward" size={20} color={palette.white} />
          </TouchableOpacity>

          <TouchableOpacity testID="login-go-register" onPress={() => router.push("/(auth)/register")} style={styles.linkRow}>
            <Text style={styles.linkText}>
              New here? <Text style={{ color: palette.primary, fontWeight: "700" }}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  content: { padding: 24, flexGrow: 1 },
  logoBox: { alignItems: "center", marginTop: 16, marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 16, backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 24, fontWeight: "700", color: t.text, marginTop: 12, letterSpacing: -0.3 },
  tagline: { fontSize: 12, color: t.textSecondary, marginTop: 4 },
  h1: { fontSize: 24, fontWeight: "700", color: t.text, letterSpacing: -0.3 },
  sub: { fontSize: 14, color: t.textSecondary, marginTop: 4 },
  label: { fontSize: 12, color: t.textSecondary, marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "600" },
  input: { height: 48, backgroundColor: t.surface, borderRadius: 8, borderWidth: 0.5, borderColor: t.border, paddingHorizontal: 16, fontSize: 16, color: t.text },
  cta: { marginTop: 24, backgroundColor: palette.primary, height: 52, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { color: palette.white, fontSize: 16, fontWeight: "600" },
  err: { color: palette.danger, marginTop: 12, fontSize: 13 },
  linkRow: { alignItems: "center", marginTop: 24 },
  linkText: { color: t.textSecondary, fontSize: 14 },
});