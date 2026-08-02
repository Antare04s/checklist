import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette, lightTheme as t } from "../src/theme";
import { api, formatApiError } from "../src/api";
import { useFlightDraft } from "../src/flightDraft";
import { useAuthStore } from "../src/auth";

function WebQrScanner({ onScan }: { onScan: (data: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !containerRef.current) return;
        const scanner = new Html5Qrcode("web-qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScan(decodedText);
            scanner.stop().catch(() => {});
          },
          () => {}
        );
      } catch (e) {
        console.warn("Web QR scanner error:", e);
      }
    })();
    return () => {
      mounted = false;
      scannerRef.current?.stop?.().catch(() => {});
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="web-qr-reader"
      style={{ width: "100%", maxWidth: 400, margin: "0 auto", borderRadius: 12, overflow: "hidden" }}
    />
  );
}

export default function Scan() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const user = useAuthStore((s) => s.user);
  const [scanned, setScanned] = useState(false);
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const extractId = (data: string): string => {
    let id = data.trim();
    if (id.includes("id=")) id = id.split("id=").pop()?.split("&")[0] || id;
    if (id.startsWith("flyready://checklist/")) id = id.replace("flyready://checklist/", "");
    if (id.includes("/checklist/")) id = id.split("/checklist/").pop() || id;
    id = id.split("/")[0].split("?")[0].trim();
    return id;
  };

  const handleCode = async (data: string) => {
    if (scanned || busy) return;
    setScanned(true);
    setBusy(true);
    setError(null);
    const id = extractId(data);

    if (!id) {
      setError("No checklist ID found. Check the QR code or ID and try again.");
      setScanned(false);
      setBusy(false);
      return;
    }

    if (!user) {
      try { localStorage.setItem("flyready_pending_checklist", id); } catch {}
      setError("Please log in first to start a flight with this checklist.");
      setScanned(false);
      setBusy(false);
      return;
    }

    try {
      const { data: cl } = await api.get(`/checklists/${id}`);
      router.replace(`/flight/operator-details?checklist_id=${cl.id}`);
    } catch (e: any) {
      setError(formatApiError(e) || "Checklist not found. Check the ID and try again.");
      setScanned(false);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (params.id && !scanned && !busy) {
      handleCode(params.id);
    }
  }, [params.id, user]);

  const ErrorModal = () => (
    <Modal visible={!!error} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>
            {error?.includes("log in") ? "Login required" : "Checklist not found"}
          </Text>
          <Text style={styles.modalMsg}>{error}</Text>
          {error?.includes("log in") ? (
            <View style={{ gap: 8 }}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => { setError(null); router.push("/(auth)/login"); }}>
                <Text style={styles.modalBtnText}>Log in</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: t.border }]} onPress={() => { setError(null); setScanned(false); }}>
                <Text style={[styles.modalBtnText, { color: t.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.modalBtn} onPress={() => { setError(null); setScanned(false); }}>
              <Text style={styles.modalBtnText}>Try again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  if (params.id && busy) {
    return (
      <SafeAreaView style={styles.center}>
        <ErrorModal />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: t.textSecondary, marginTop: 16 }}>Loading checklist…</Text>
      </SafeAreaView>
    );
  }

  if (manual) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <ErrorModal />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%", padding: 24 }}>
          <TouchableOpacity onPress={() => { setManual(false); setScanned(false); setError(null); }} style={{ marginBottom: 16 }}>
            <Ionicons name="chevron-back" size={28} color={t.text} />
          </TouchableOpacity>
          <Text style={styles.h1}>Enter checklist ID</Text>
          <Text style={styles.sub}>Paste the checklist ID or the full QR link</Text>
          <TextInput
            testID="scan-manual-input"
            style={styles.input}
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            placeholder="e.g. 4c911c10-cbe4-492b-..."
            placeholderTextColor={t.textSecondary}
          />
          <TouchableOpacity
            testID="scan-manual-submit"
            style={[styles.cta, busy && { opacity: 0.6 }]}
            onPress={() => handleCode(code)}
            disabled={busy}
          >
            <Text style={styles.ctaText}>{busy ? "Looking up…" : "Continue"}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <ErrorModal />
        <View style={styles.topBarSolid}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={28} color={t.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan drone QR code</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", padding: 16 }}>
          {scanned ? (
            <View style={{ alignItems: "center" }}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={{ color: t.textSecondary, marginTop: 16 }}>Loading checklist…</Text>
            </View>
          ) : (
            <WebQrScanner onScan={handleCode} />
          )}
        </View>
        <View style={{ padding: 16 }}>
          <TouchableOpacity style={styles.manualBtnSolid} onPress={() => setManual(true)}>
            <Feather name="edit-3" size={18} color={palette.primary} />
            <Text style={{ color: palette.primary, fontWeight: "600" }}>Enter checklist ID manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const NativeScanner = () => {
    const { CameraView: CV, useCameraPermissions: useCP } = require("expo-camera");
    const [perm, reqPerm] = useCP();
    if (!perm) return <SafeAreaView style={styles.center}><Text style={{ color: t.text }}>Loading…</Text></SafeAreaView>;
    if (!perm.granted) {
      return (
        <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
          <ErrorModal />
          <MaterialCommunityIcons name="camera-off-outline" size={64} color={t.textSecondary} />
          <Text style={styles.h1}>Camera permission needed</Text>
          <TouchableOpacity style={styles.cta} onPress={reqPerm}><Text style={styles.ctaText}>Grant access</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setManual(true)} style={{ marginTop: 16 }}>
            <Text style={{ color: palette.primary, fontWeight: "600" }}>Enter ID manually</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <ErrorModal />
        <CV style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={(e: any) => handleCode(e.data)} />
        <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}><Ionicons name="chevron-back" size={28} color={palette.white} /></TouchableOpacity>
            <Text style={styles.scanHeader}>Scan drone QR code</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
        <View pointerEvents="none" style={styles.viewfinder}>
          <View style={styles.frame} />
          <Text style={styles.hint}>Align QR code within frame</Text>
        </View>
        <SafeAreaView edges={["bottom"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24 }}>
          <TouchableOpacity style={styles.manualBtnOverlay} onPress={() => setManual(true)}>
            <Feather name="edit-3" size={18} color={palette.white} />
            <Text style={{ color: palette.white, fontWeight: "600" }}>Enter checklist ID manually</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  };

  return <NativeScanner />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.background, padding: 24 },
  topBarSolid: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 0.5, borderBottomColor: t.border, backgroundColor: t.surface },
  topTitle: { fontSize: 16, fontWeight: "700", color: t.text },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  scanHeader: { color: palette.white, fontSize: 16, fontWeight: "700" },
  viewfinder: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  frame: { width: 260, height: 260, borderWidth: 3, borderColor: palette.success, borderRadius: 16 },
  hint: { color: palette.white, marginTop: 16, fontSize: 14, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  manualBtnOverlay: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.6)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  manualBtnSolid: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12, borderWidth: 1, borderColor: palette.primary, backgroundColor: palette.primary + "10" },
  h1: { color: t.text, fontSize: 22, fontWeight: "700", marginTop: 16 },
  sub: { color: t.textSecondary, fontSize: 14, marginTop: 8, textAlign: "center" },
  input: { height: 48, marginTop: 16, backgroundColor: t.surface, borderRadius: 8, borderWidth: 0.5, borderColor: t.border, paddingHorizontal: 16, fontSize: 15, color: t.text, width: "100%" },
  cta: { marginTop: 16, height: 50, borderRadius: 12, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  ctaText: { color: palette.white, fontWeight: "700", fontSize: 16 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modalBox: { backgroundColor: t.surface, borderRadius: 16, padding: 24, width: 300 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: t.text, marginBottom: 8 },
  modalMsg: { fontSize: 14, color: t.textSecondary, lineHeight: 22, marginBottom: 20 },
  modalBtn: { height: 44, borderRadius: 10, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  modalBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});