import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfilScreen() {
  const stats = [
    { label: "PXs", value: "1 240" },
    { label: "Pièces", value: "320" },
    { label: "Trésors trouvés", value: "18" },
    { label: "Expéditions", value: "5" },
  ];

  const inventory = [
    { label: "Clés bronze", value: 3 },
    { label: "Clés argent", value: 1 },
    { label: "Clés or", value: 0 },
    { label: "Bonus temps", value: 2 },
    { label: "Skin avatar", value: 4 },
  ];

  const collection = [
    { name: "Totem ancien", theme: "Histoire" },
    { name: "Feuille rare", theme: "Nature" },
    { name: "Tarte locale", theme: "Gastronomie" },
    { name: "Fossile marin", theme: "Nature" },
    { name: "Monnaie ancienne", theme: "Histoire" },
    { name: "Objet mystère", theme: "???"},
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER AVATAR / NOM / RÔLE */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>EX</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.username}>Explorateur Ilyass</Text>
            <Text style={styles.role}>Rang : Artisan</Text>
            <Text style={styles.subtitle}>Niveau 7 • +15 PXs à la prochaine découverte</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <Text style={styles.sectionSubtitle}>Résumé de ton aventure</Text>
          </View>
          <View style={styles.statsContainer}>
            {stats.map((item) => (
              <View key={item.label} style={styles.statCard}>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* INVENTAIRE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventaire</Text>
            <Text style={styles.sectionSubtitle}>Clés & objets bonus</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.inventoryScroll}
          >
            {inventory.map((item) => (
              <View key={item.label} style={styles.inventoryCard}>
                <Text style={styles.inventoryLabel}>{item.label}</Text>
                <Text style={styles.inventoryValue}>{item.value}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* COLLECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collection</Text>
            <Text style={styles.sectionSubtitle}>
              Tes trésors trouvés en expédition
            </Text>
          </View>

          <View style={styles.collectionGrid}>
            {collection.map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.collectionCard}>
                <View style={styles.collectionIcon}>
                  <Text style={styles.collectionIconText}>🏆</Text>
                </View>
                <Text style={styles.collectionName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.collectionTheme}>{item.theme}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.collectionButton}>
            <Text style={styles.collectionButtonText}>Voir toute la collection</Text>
          </TouchableOpacity>
        </View>

        {/* PARAMÈTRES RAPIDES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paramètres rapides</Text>
          </View>

          <View style={styles.quickSettings}>
            <TouchableOpacity style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Thème</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickButton}>
              <Text style={styles.quickButtonText}>Signaler un problème</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const CARD_BG = "#101827"; // fond sombre bleuté
const CARD_BORDER = "#1f2937";
const ACCENT = "#38bdf8";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617", // fond global
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: ACCENT,
    marginRight: 16,
  },
  avatarText: {
    color: "white",
    fontSize: 26,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  role: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 2,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 12,
  },

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#6b7280",
    fontSize: 12,
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: "48%",
  },
  statValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 12,
  },

  // Inventaire
  inventoryScroll: {
    marginTop: 8,
    paddingRight: 8,
  },
  inventoryCard: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    minWidth: 120,
  },
  inventoryLabel: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 4,
  },
  inventoryValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  // Collection
  collectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  collectionCard: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    width: "47%",
  },
  collectionIcon: {
    alignItems: "flex-start",
    marginBottom: 6,
  },
  collectionIconText: {
    fontSize: 20,
  },
  collectionName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  collectionTheme: {
    color: "#6b7280",
    fontSize: 11,
  },
  collectionButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: "center",
  },
  collectionButtonText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "600",
  },

  // Quick settings
  quickSettings: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  quickButton: {
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  quickButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
  },
});
