import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal } from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../src/theme";
import { useAppTheme } from "../../src/themeContext";
import { useAuthStore } from "../../src/auth";

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme: t, isDark, toggleDark } = useAppTheme();
  const [logoutModal, setLogoutModal] = useState(false);

  const doLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const Row = ({ icon, label, onPress, danger, testID, right }: any) => (
    <TouchableOpacity testID={testID} style={[styles.row, { borderBottomColor: t.border }]} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: danger ? palette.danger + "15" : palette.primary + "10" }]}>
        {icon}
      </View>
      <Text style={[styles.rowLabel, { color: danger ? palette.danger : t.text }]}>{label}</Text>
      {right || (!danger && <Feather name="chevron-right" size={18} color={t.textSecondary} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={["top"]} testID="profile-screen">

      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: t.surface }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Log out?</Text>
            <Text style={{ color: t.textSecondary, marginVertical: 12 }}>You'll need to log in again to access your checklists.</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: t.background, borderWidth: 1, borderColor: t.border, flex: 1 }]} onPress={() => setLogoutModal(false)}>
                <Text style={{ color: t.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: palette.danger, flex: 1 }]} onPress={doLogout}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.topBar, { borderBottomColor: t.border, backgroundColor: t.surface }]}>
        <Text style={[styles.h1, { color: t.text }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={[styles.userCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "?").slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={[styles.name, { color: t.text }]}>{user?.name || "—"}</Text>
          <Text style={{ fontSize: 13, color: t.textSecondary, marginTop: 2 }}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{(user?.role || "pilot").toUpperCase()}</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Preferences</Text>
        <View style={[styles.menuCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Row
            testID="profile-dark-mode"
            icon={<Ionicons name={isDark ? "moon" : "sunny-outline"} size={18} color={palette.primary} />}
            label="Dark mode"
            onPress={toggleDark}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleDark}
                trackColor={{ false: t.border, true: palette.primary }}
                thumbColor={palette.white}
              />
            }
          />
        </View>

        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>Account</Text>
        <View style={[styles.menuCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Row
            testID="profile-my-checklists"
            icon={<Feather name="list" size={18} color={palette.primary} />}
            label="My checklists"
            onPress={() => router.push("/(tabs)/history")}
          />
          <Row
            testID="profile-logout"
            icon={<Feather name="log-out" size={18} color={palette.danger} />}
            label="Log out"
            danger
            onPress={() => setLogoutModal(true)}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: t.textSecondary }]}>About</Text>
        <View style={[styles.menuCard, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Row
            icon={<Feather name="info" size={18} color={palette.primary} />}
            label="FlyReady v1.0 — free & open source"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { padding: 16, borderBottomWidth: 0.5 },
  h1: { fontSize: 24, fontWeight: "700" },
  userCard: { alignItems: "center", padding: 24, borderRadius: 12, borderWidth: 0.5, marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: palette.white, fontWeight: "700", fontSize: 28 },
  name: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  roleBadge: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: palette.primary + "15" },
  roleText: { color: palette.primary, fontWeight: "700", fontSize: 11, letterSpacing: 0.5 },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 24, marginBottom: 8 },
  menuCard: { borderRadius: 12, borderWidth: 0.5, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modalBox: { borderRadius: 16, padding: 24, width: 300 },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalBtn: { height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});