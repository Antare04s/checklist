import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { palette, lightTheme as t, droneTypeLabel } from "../../src/theme";
import { api, formatApiError } from "../../src/api";

export default function Maintenance() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logModal, setLogModal] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get("/maintenance/overview");
      setItems(data || []);
    } catch (e: any) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const logMaintenance = async () => {
    if (!logModal) return;
    setSaving(true);
    try {
      await api.post("/maintenance/log", {
        checklist_id: logModal.checklist_id,
        notes: notes.trim(),
      });
      setLogModal(null);
      setNotes("");
      load();
    } catch (e: any) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (item: any) => {
    if (item.maintenance_due) return palette.danger;
    if (item.due_soon) return palette.warning;
    return palette.success;
  };

  const statusLabel = (item: any) => {
    if (item.maintenance_due) return "Maintenance due";
    if (item.due_soon) return "Due soon";
    return "OK";
  };

  const progressPct = (item: any) => Math.min((item.flight_count / 50) * 100, 100);

  if (loading) return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topBar}>
        <Text style={styles.h1}>Maintenance</Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="maintenance-screen">
      <View style={styles.topBar}>
        <Text style={styles.h1}>Maintenance</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Feather name="refresh-cw" size={20} color={t.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Log maintenance modal */}
      <Modal visible={!!logModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Log maintenance</Text>
            <Text style={styles.modalSub}>{logModal?.name}</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional) — parts replaced, issues found…"
              placeholderTextColor={t.textSecondary}
              multiline
              numberOfLines={4}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, flex: 1 }]}
                onPress={() => { setLogModal(null); setNotes(""); }}
              >
                <Text style={{ color: t.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: palette.primary, flex: 1 }]}
                onPress={logMaintenance}
                disabled={saving}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{saving ? "Saving…" : "Confirm"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Error modal */}
      <Modal visible={!!error} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={{ color: t.textSecondary, marginVertical: 12 }}>{error}</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: palette.primary }]} onPress={() => setError(null)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="wrench-outline" size={48} color={t.textSecondary} />
            <Text style={{ color: t.textSecondary, marginTop: 12, fontSize: 15 }}>No drones tracked yet</Text>
            <Text style={{ color: t.textSecondary, fontSize: 13, marginTop: 4, textAlign: "center" }}>
              Create a checklist and log flights to start tracking maintenance
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: palette.success }]} />
                <Text style={styles.legendText}>OK</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: palette.warning }]} />
                <Text style={styles.legendText}>Due soon (40+ flights)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: palette.danger }]} />
                <Text style={styles.legendText}>Overdue (50+ flights)</Text>
              </View>
            </View>

            {items.map((item) => (
              <View key={item.checklist_id} style={styles.card} testID={`maint-card-${item.checklist_id}`}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: statusColor(item) + "15" }]}>
                    <MaterialCommunityIcons
                      name={item.drone_type === "fixed_wing" ? "airplane" : item.drone_type === "vtol" ? "airplane-takeoff" : "quadcopter"}
                      size={24} color={statusColor(item)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.cardMeta}>{droneTypeLabel(item.drone_type)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: statusColor(item) + "20" }]}>
                    <Text style={[styles.badgeText, { color: statusColor(item) }]}>{statusLabel(item)}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Flights since last maintenance</Text>
                  <Text style={[styles.progressCount, { color: statusColor(item) }]}>
                    {item.flight_count} / 50
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, {
                    width: `${progressPct(item)}%` as any,
                    backgroundColor: statusColor(item),
                  }]} />
                </View>

                {item.last_maintenance_at && (
                  <Text style={styles.lastMaint}>
                    <Feather name="clock" size={11} /> Last maintenance: {item.last_maintenance_at.slice(0, 10)}
                  </Text>
                )}

                <Text style={styles.totalFlights}>
                  Total flights logged: {item.total_flight_count}
                </Text>

                <TouchableOpacity
                  style={styles.logBtn}
                  onPress={() => { setLogModal(item); setNotes(""); }}
                  testID={`log-maint-${item.checklist_id}`}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color={palette.primary} />
                  <Text style={styles.logBtnText}>Log maintenance done</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 0.5, borderBottomColor: t.border, backgroundColor: t.surface },
  h1: { fontSize: 20, fontWeight: "700", color: t.text },
  empty: { padding: 48, alignItems: "center", borderRadius: 12, borderWidth: 0.5, borderColor: t.border, borderStyle: "dashed", marginTop: 32 },
  legendRow: { flexDirection: "row", gap: 16, marginBottom: 16, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: t.textSecondary },
  card: { backgroundColor: t.surface, borderRadius: 14, borderWidth: 0.5, borderColor: t.border, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardName: { fontSize: 15, fontWeight: "700", color: t.text },
  cardMeta: { fontSize: 12, color: t.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  progressLabel: { fontSize: 12, color: t.textSecondary },
  progressCount: { fontSize: 13, fontWeight: "700" },
  progressTrack: { height: 8, backgroundColor: t.border, borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 4 },
  lastMaint: { fontSize: 12, color: t.textSecondary, marginBottom: 4 },
  totalFlights: { fontSize: 12, color: t.textSecondary, marginBottom: 12 },
  logBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 42, borderRadius: 10, borderWidth: 1, borderColor: palette.primary, backgroundColor: palette.primary + "10" },
  logBtnText: { color: palette.primary, fontWeight: "700", fontSize: 14 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  modalBox: { backgroundColor: t.surface, borderRadius: 16, padding: 24, width: 320 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: t.text },
  modalSub: { fontSize: 13, color: t.textSecondary, marginTop: 4, marginBottom: 12 },
  notesInput: { backgroundColor: t.background, borderRadius: 10, borderWidth: 0.5, borderColor: t.border, padding: 12, fontSize: 14, color: t.text, minHeight: 90, textAlignVertical: "top" },
  modalBtn: { height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});