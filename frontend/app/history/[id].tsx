import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { lightTheme as t, palette, droneTypeLabel } from "../../src/theme";
import { api } from "../../src/api";

export default function HistoryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [logs, setLogs] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [clRes, logsRes] = await Promise.all([
          api.get(`/checklists/${id}`),
          api.get(`/flight_logs/by_checklist/${id}`),
        ]);
        setChecklist(clRes.data);
        setLogs(logsRes.data || []);
      } catch {
        // checklist may not belong to user
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={t.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="history-detail-screen">
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={t.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.h1} numberOfLines={1}>{checklist?.name ?? "Flight history"}</Text>
          <Text style={styles.sub}>{droneTypeLabel(checklist?.drone_type)} · {logs.length} flights</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {logs.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="archive" size={40} color={t.textSecondary} />
            <Text style={{ color: t.textSecondary, marginTop: 12 }}>No flights logged yet</Text>
          </View>
        ) : (
          logs.map((log) => {
            const passed = (log.executions || []).filter((e: any) => e.state === "pass").length;
            const failed = (log.executions || []).filter((e: any) => e.state === "fail").length;
            const total = (log.executions || []).length;
            const dateStr = (log.completed_at || log.created_at || "").slice(0, 10);
            return (
              <View key={log.id} style={styles.card} testID={`flight-log-${log.id}`}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconBox, { backgroundColor: palette.primary + "15" }]}>
                    <MaterialCommunityIcons name="airplane-takeoff" size={22} color={palette.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.flightId}>{log.flight_id || `Flight #${log.serial_number}`}</Text>
                    <Text style={styles.meta}>{log.operator_name} · {dateStr}</Text>
                    {log.location_name ? (
                      <Text style={styles.meta}><Feather name="map-pin" size={11} /> {log.location_name}</Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    {log.damage_severity && log.damage_severity !== "none" ? (
                      <View style={[styles.badge, { backgroundColor: palette.danger + "20" }]}>
                        <Text style={[styles.badgeText, { color: palette.danger }]}>{log.damage_severity}</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: palette.success + "20" }]}>
                        <Text style={[styles.badgeText, { color: palette.success }]}>OK</Text>
                      </View>
                    )}
                  </View>
                </View>

                {total > 0 && (
                  <View style={styles.checkRow}>
                    <View style={[styles.miniChip, { backgroundColor: palette.success + "20" }]}>
                      <Text style={[styles.miniText, { color: palette.success }]}>✓ {passed} passed</Text>
                    </View>
                    {failed > 0 && (
                      <View style={[styles.miniChip, { backgroundColor: palette.danger + "20" }]}>
                        <Text style={[styles.miniText, { color: palette.danger }]}>✗ {failed} failed</Text>
                      </View>
                    )}
                    <Text style={styles.miniText}>{total} items</Text>
                  </View>
                )}

                {log.remarks ? (
                  <Text style={styles.remarks} numberOfLines={2}>{log.remarks}</Text>
                ) : null}

                {log.flight_duration_seconds ? (
                  <Text style={styles.duration}>
                    <Feather name="clock" size={11} /> {Math.floor(log.flight_duration_seconds / 60)}m {log.flight_duration_seconds % 60}s
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  topBar: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 0.5, borderBottomColor: t.border, backgroundColor: t.surface },
  h1: { fontSize: 18, fontWeight: "700", color: t.text },
  sub: { fontSize: 12, color: t.textSecondary, marginTop: 1 },
  empty: { padding: 48, alignItems: "center", borderRadius: 12, borderWidth: 0.5, borderColor: t.border, borderStyle: "dashed" },
  card: { backgroundColor: t.surface, borderRadius: 12, borderWidth: 0.5, borderColor: t.border, padding: 14, marginBottom: 10 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  flightId: { fontSize: 14, fontWeight: "700", color: t.text },
  meta: { fontSize: 12, color: t.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" },
  miniChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  miniText: { fontSize: 11, color: t.textSecondary },
  remarks: { fontSize: 12, color: t.textSecondary, marginTop: 8, fontStyle: "italic" },
  duration: { fontSize: 11, color: t.textSecondary, marginTop: 6 },
});