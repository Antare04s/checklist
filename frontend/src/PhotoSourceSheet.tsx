import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { palette, lightTheme as t } from "./theme";

export type PickedImage = { dataUrl: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onPicked: (img: PickedImage) => void;
  quality?: number;
  title?: string;
};

export function PhotoSourceSheet({ visible, onClose, onPicked, quality = 0.5, title = "Add photo" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleWebFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onPicked({ dataUrl: reader.result });
      }
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const fromCamera = async () => {
    if (Platform.OS === "web") {
      // On web, open file picker with camera capture
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = () => handleWebFile(input.files?.[0]);
      input.click();
      return;
    }
    setBusy(true);
    try {
      const ImagePicker = await import("expo-image-picker");
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== "granted") {
        setError("Camera permission needed. Enable camera access in Settings.");
        onClose();
        return;
      }
      const r = await ImagePicker.launchCameraAsync({ base64: true, quality, allowsEditing: false });
      if (!r.canceled && r.assets?.[0]?.base64) {
        onPicked({ dataUrl: `data:image/jpeg;base64,${r.assets[0].base64}` });
      }
    } catch (e: any) {
      setError(e?.message || "Could not open camera");
    } finally {
      setBusy(false);
      onClose();
    }
  };

  const fromGallery = async () => {
    if (Platform.OS === "web") {
      // On web, open file picker
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => handleWebFile(input.files?.[0]);
      input.click();
      return;
    }
    setBusy(true);
    try {
      const ImagePicker = await import("expo-image-picker");
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        setError("Photo permission needed. Enable photo library access in Settings.");
        onClose();
        return;
      }
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true, quality, allowsEditing: false,
      });
      if (!r.canceled && r.assets?.[0]?.base64) {
        onPicked({ dataUrl: `data:image/jpeg;base64,${r.assets[0].base64}` });
      }
    } catch (e: any) {
      setError(e?.message || "Could not open gallery");
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <>
      <Modal visible={!!error} transparent animationType="fade">
        <View style={styles.errOverlay}>
          <View style={styles.errBox}>
            <Text style={styles.errTitle}>Error</Text>
            <Text style={styles.errMsg}>{error}</Text>
            <TouchableOpacity style={styles.errBtn} onPress={() => setError(null)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity testID="photo-source-camera" disabled={busy} style={styles.row} onPress={fromCamera}>
              <View style={styles.iconBox}><Feather name="camera" size={22} color={palette.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Take a photo</Text>
                <Text style={styles.rowSub}>Use the camera</Text>
              </View>
              <Feather name="chevron-right" size={20} color={t.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity testID="photo-source-gallery" disabled={busy} style={styles.row} onPress={fromGallery}>
              <View style={styles.iconBox}><Feather name="image" size={22} color={palette.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Choose from gallery</Text>
                <Text style={styles.rowSub}>Pick an existing photo</Text>
              </View>
              <Feather name="chevron-right" size={20} color={t.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity testID="photo-source-cancel" style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: t.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "700", color: t.text, marginBottom: 12, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: palette.primary + "15" },
  rowTitle: { color: t.text, fontSize: 15, fontWeight: "600" },
  rowSub: { color: t.textSecondary, fontSize: 12, marginTop: 2 },
  cancelBtn: { marginTop: 8, padding: 14, alignItems: "center", borderRadius: 10, backgroundColor: t.background },
  cancelText: { color: palette.danger, fontWeight: "700", fontSize: 14 },
  errOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  errBox: { backgroundColor: t.surface, borderRadius: 16, padding: 24, width: 300 },
  errTitle: { fontSize: 17, fontWeight: "700", color: t.text, marginBottom: 8 },
  errMsg: { fontSize: 14, color: t.textSecondary, marginBottom: 16 },
  errBtn: { height: 44, borderRadius: 10, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
});
