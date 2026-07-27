import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { lightTheme as t, palette, droneTypeColor, droneTypeLabel } from "../../src/theme";
import { api } from "../../src/api";

type Filter = "all" | "week" | "month";

function isWithin(dateStr: string, days: number) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= days;
}

export default function History() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const load = async () => {
    const { data } = await api.get("/checklists");
    setChecklists(data || []);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = checklists.filter((cl) => {
    if (filter === "week") return isWithin(cl.last_flight_at || cl.created_at, 7);
    if (filter === "month") return isWithin(cl.last_flight_at || cl.created_at, 30);
    return true;
  });

  const totalFlights = filtered.reduce((sum, cl) => sum + (cl.flight_count || 0), 0);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All time" },
    { key: "month", label: "This month" },
    { key: "week", label: "This week" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]} testID="history-screen">
      <View style={styles.topBar}>
        <Text style={styles.h1}>History</Text>
        <Text style={styles.sub}>{totalFlights} flight{totalFlights !== 1 ? "s" : ""} logged</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            testID={`history-filter-${f.key}`}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="archive" size={40} color={t.textSecondary} />
            <Text style={{ color: t.textSecondary, marginTop: 12 }}>
              {filter === "all" ? "No checklists yet" : `No flights in the last ${filter === "week" ? "7" : "30"} days`}
            </Text>
          </View>
        ) : (
          filtered.map((cl) => (
            <TouchableOpacity
              key={cl.id}
              testID={`history-group-${cl.id}`}
              style={styles.card}
              onPress={() => router.push(`/history/${cl.id}`)}
            >
              <View style={[styles.image, { backgroundColor: droneTypeColor(cl.drone_type) }]}>
                {cl.drone_photo_url ? (
                  <Image source={{ uri: cl.drone_photo_url }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <MaterialCommunityIcons
                    name={cl.drone_type === "fixed_wing" ? "airplane" : cl.drone_type === "vtol" ? "airplane-takeoff" : "quadcopter"}
                    size={32} color={palette.white}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{cl.name}</Text>
                <Text style={styles.meta}>{droneTypeLabel(cl.drone_type)} · {(cl.created_at || "").slice(0, 10)}</Text>
                <View style={[styles.badge, { backgroundColor: palette.success + "20" }]}>
                  <Text style={[styles.badgeText, { color: palette.success }]}>{cl.flight_count || 0} flights</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={t.textSecondary} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  topBar: { padding: 16, borderBottomWidth: 0.5, borderBottomColor: t.border, backgroundColor: t.surface },
  h1: { fontSize: 24, fontWeight: "700", color: t.text },
  sub: { fontSize: 13, color: t.textSecondary, marginTop: 2 },
  filterRow: { flexDirection: "row", padding: 12, gap: 8, backgroundColor: t.surface, borderBottomWidth: 0.5, borderBottomColor: t.border },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: t.background, borderWidth: 0.5, borderColor: t.border },
  filterTabActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  filterText: { fontSize: 13, fontWeight: "600", color: t.textSecondary },
  filterTextActive: { color: palette.white },
  empty: { padding: 48, alignItems: "center", borderWidth: 0.5, borderColor: t.border, borderStyle: "dashed", borderRadius: 12 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, backgroundColor: t.surface, borderWidth: 0.5, borderColor: t.border, marginBottom: 10 },
  image: { width: 64, height: 64, borderRadius: 10, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  name: { fontSize: 15, fontWeight: "700", color: t.text },
  meta: { fontSize: 12, color: t.textSecondary, marginTop: 2 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 8 },
  badgeText: { fontSize: 11, fontWeight: "600" },
});