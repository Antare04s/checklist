import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, lightTheme as t } from "../../src/theme";
import { api } from "../../src/api";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = async () => {
    setError("");
    if (!email.trim() || !name.trim() || !newPassword.trim()) {
      setError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Reset failed. Check your email and name.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Modal visible={success} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Ionicons name="checkmark-circle" size={48} color={palette.success} style={{ alignSelf: "center" }} />
            <Text style={styles.modalTitle}>Password reset!</Text>
            <Text style={styles.modalMsg}>You can now log in with your new password.</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.modalBtnText}>Go to login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity onPress={() => router.back()} style={{ padding: 16 }}>
        <Ionicons name="chevron-back" size={28} color={t.text} />
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={styles.h1}>Reset password</Text>
        <Text style={styles.sub}>Enter your email and the name you registered with to verify your identity.</Text>

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="your@email.com"
          placeholderTextColor={t.textSecondary}
        />

        <Text style={styles.label}>FULL NAME (as registered)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Exactly as you typed during sign up"
          placeholderTextColor={t.textSecondary}
        />

        <Text style={styles.label}>NEW PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Min 6 characters"
          placeholderTextColor={t.textSecondary}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.cta, busy && { opacity: 0.6 }]} onPress={reset} disabled={busy}>
          <Text style={styles.ctaText}>{busy ? "Resetting…" : "Reset password"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  body: { padding: 24 },
  h1: { fontSize: 24, fontWeight: "700", color: t.text },
  sub: { fontSize: 14, color: t.textSecondary, marginTop: 6, marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 12, fontWeight: "700", color: t.textSecondary, letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  input: { height: 48, backgroundColor: t.surface, borderRadius: 8, borderWidth: 0.5, borderColor: t.border, paddingHorizontal: 14, fontSize: 15, color: t.text },
  error: { color: palette.danger, fontSize: 13, marginTop: 12 },
  cta: { marginTop: 24, height: 52, borderRadius: 12, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  ctaText: { color: palette.white, fontWeight: "700", fontSize: 16 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modalBox: { backgroundColor: t.surface, borderRadius: 16, padding: 24, width: 300 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: t.text, textAlign: "center", marginTop: 12 },
  modalMsg: { fontSize: 14, color: t.textSecondary, textAlign: "center", marginVertical: 12 },
  modalBtn: { height: 44, borderRadius: 10, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  modalBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});