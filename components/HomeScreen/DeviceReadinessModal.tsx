// components/HomeScreen/DeviceReadinessModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  BatteryCharging,
  Layers,
  BellRing,
  Navigation,
  ChevronRight,
  Info,
  RefreshCw,
  X,
} from "lucide-react-native";
import {
  checkDeviceReadiness,
  requestLocationPermissions,
  requestNotificationPermissions,
  openLocationSourceSettings,
  openBatteryOptimizationSettings,
  openOverlaySettings,
  getOEMGuidance,
  ReadinessStatus,
} from "@/services/readinessService";

interface Props {
  visible: boolean;
  onClose: () => void;
  onReady: () => void;
  dismissible?: boolean;
  title?: string;
  subtitle?: string;
  primaryBtnText?: string;
}

export default function DeviceReadinessModal({
  visible,
  onClose,
  onReady,
  dismissible = true,
  title = "Rider Duty Readiness",
  subtitle = "Configure these settings so you never miss orders while navigating or with the phone in your pocket.",
  primaryBtnText,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ReadinessStatus>({
    foregroundLocation: false,
    backgroundLocation: false,
    locationServices: false,
    notifications: false,
    batteryOptimized: false,
    overlayPermission: false,
    allPassed: false,
  });

  const oem = getOEMGuidance();

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const res = await checkDeviceReadiness();
      setStatus(res);
      if (res.allPassed) {
        // Automatically proceed if everything passes
        onReady();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      refreshStatus();
    }
  }, [visible]);

  const handleVerifyAndProceed = async () => {
    setLoading(true);
    try {
      const res = await checkDeviceReadiness();
      setStatus(res);

      if (res.allPassed) {
        onReady();
      }
    } finally {
      setLoading(false);
    }
  };

  const isLocationOk = status.foregroundLocation && status.backgroundLocation;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (dismissible) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <ShieldAlert size={28} color={dismissible ? "#2563eb" : "#dc2626"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
            {dismissible && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* 1. Background Location */}
            <View style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <MapPin size={22} color={isLocationOk ? "#16a34a" : "#ea580c"} />
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>Location: "Allow all the time"</Text>
                  <View style={[styles.badge, isLocationOk ? styles.badgeSuccess : styles.badgeWarning]}>
                    <Text style={[styles.badgeText, isLocationOk ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                      {isLocationOk ? "Granted" : "Action Required"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDescription}>
                  Enables order matching and continuous tracking while Google Maps is running or screen is locked.
                </Text>
                {!isLocationOk && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={async () => {
                      await requestLocationPermissions();
                      refreshStatus();
                    }}
                  >
                    <Text style={styles.actionBtnText}>Set to "Allow all the time"</Text>
                    <ChevronRight size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 2. Battery Optimization */}
            <View style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <BatteryCharging size={22} color={status.batteryOptimized ? "#16a34a" : "#ea580c"} />
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>Battery: "Unrestricted"</Text>
                  <View style={[styles.badge, status.batteryOptimized ? styles.badgeSuccess : styles.badgeWarning]}>
                    <Text style={[styles.badgeText, status.batteryOptimized ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                      {status.batteryOptimized ? "Configured" : "Recommended"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDescription}>
                  Prevents Android from freezing the app or disconnecting order alerts when your screen is off.
                </Text>
                {!status.batteryOptimized && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={async () => {
                      await openBatteryOptimizationSettings();
                      refreshStatus();
                    }}
                  >
                    <Text style={styles.actionBtnText}>Disable Battery Restrictions</Text>
                    <ChevronRight size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 3. Display Over Other Apps */}
            <View style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <Layers size={22} color={status.overlayPermission ? "#16a34a" : "#ea580c"} />
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>Display Over Other Apps</Text>
                  <View style={[styles.badge, status.overlayPermission ? styles.badgeSuccess : styles.badgeWarning]}>
                    <Text style={[styles.badgeText, status.overlayPermission ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                      {status.overlayPermission ? "Allowed" : "Action Required"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDescription}>
                  Allows order alert windows to pop up directly over Google Maps so you can accept in 1 tap.
                </Text>
                {!status.overlayPermission && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={async () => {
                      await openOverlaySettings();
                      refreshStatus();
                    }}
                  >
                    <Text style={styles.actionBtnText}>Allow "Appear on top"</Text>
                    <ChevronRight size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 4. Notifications */}
            <View style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <BellRing size={22} color={status.notifications ? "#16a34a" : "#ea580c"} />
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>Notifications & Sound</Text>
                  <View style={[styles.badge, status.notifications ? styles.badgeSuccess : styles.badgeWarning]}>
                    <Text style={[styles.badgeText, status.notifications ? styles.badgeTextSuccess : styles.badgeTextWarning]}>
                      {status.notifications ? "Granted" : "Required"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDescription}>
                  Plays high-importance alerts via Alarm channel when new deliveries are available.
                </Text>
                {!status.notifications && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={async () => {
                      await requestNotificationPermissions();
                      refreshStatus();
                    }}
                  >
                    <Text style={styles.actionBtnText}>Enable Notifications</Text>
                    <ChevronRight size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 5. Location Services / GPS */}
            <View style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <Navigation size={22} color={status.locationServices ? "#16a34a" : "#dc2626"} />
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>Device GPS / Location</Text>
                  <View style={[styles.badge, status.locationServices ? styles.badgeSuccess : styles.badgeDanger]}>
                    <Text style={[styles.badgeText, status.locationServices ? styles.badgeTextSuccess : styles.badgeTextDanger]}>
                      {status.locationServices ? "ON" : "OFF"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDescription}>
                  Phone hardware GPS must be enabled to calculate distances and route assignments.
                </Text>
                {!status.locationServices && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={async () => {
                      await openLocationSourceSettings();
                      refreshStatus();
                    }}
                  >
                    <Text style={styles.actionBtnText}>Turn On GPS</Text>
                    <ChevronRight size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* OEM Specific Tips */}
            <View style={styles.oemCard}>
              <View style={styles.oemHeader}>
                <Info size={18} color="#2563eb" />
                <Text style={styles.oemTitle}>Tip for {oem.brand} Users</Text>
              </View>
              {oem.instructions.map((inst, index) => (
                <Text key={index} style={styles.oemText}>
                  {inst}
                </Text>
              ))}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                !status.allPassed && styles.primaryBtnPending,
              ]}
              onPress={handleVerifyAndProceed}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : status.allPassed ? (
                <>
                  <ShieldCheck size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>
                    {primaryBtnText ? primaryBtnText : "All Set! Go Online"}
                  </Text>
                </>
              ) : (
                <>
                  <RefreshCw size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>
                    {primaryBtnText ? "Verify & Proceed" : "Verify & Go Online"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  scrollList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemContent: {
    flex: 1,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
    marginRight: 8,
  },
  itemDescription: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
  },
  badgeTextSuccess: {
    color: "#15803d",
    fontSize: 11,
    fontWeight: "600",
  },
  badgeWarning: {
    backgroundColor: "#ffedd5",
  },
  badgeTextWarning: {
    color: "#c2410c",
    fontSize: 11,
    fontWeight: "600",
  },
  badgeDanger: {
    backgroundColor: "#fee2e2",
  },
  badgeTextDanger: {
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: "600",
  },
  actionBtn: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  oemCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  oemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  oemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d4ed8",
    marginLeft: 6,
  },
  oemText: {
    fontSize: 11,
    color: "#1e40af",
    lineHeight: 16,
    marginBottom: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  primaryBtn: {
    backgroundColor: "#16a34a",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnPending: {
    backgroundColor: "#2563eb",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
