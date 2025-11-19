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
    { label: "PX totaux", value: "1 240" },
    { label: "Trésors créés", value: "2" },
    { label: "Trésors trouvés", value: "18" },
    { label: "Expéditions terminées", value: "5" },
    { label: "Badges obtenus", value: "12/76" },
    { label: "Cosmétiques possédés", value: "8/23" }  
  ];

  const inventory = [
    { label: "Clés bronze", value: 3 },
    { label: "Clés argent", value: 1 },
    { label: "Clés or", value: 0 },
    { label: "Reliques dorées", value: 1 },
    { label: "Jackpots", value: 5 },
    
  ];

  const collection = [
    { name: "Château de Versailles", theme: "Histoire" },
    { name: "Falaises d'Etretat", theme: "Nature" },
    { name: "Paris-Brest", theme: "Gastronomie" },
    { name: "Sabre Laser", theme: "Cinéma" },
    { name: "Champignon 1UP", theme: "Jeux vidéos" },
    { name: "Canada", theme: "Drapeaux"},
  ];

  const themeEmojis: Record<string, string> = {
    Nature: "🏞️",
    Histoire: "🏛️",
    Gastronomie: "🍽️",
    Art: "🎨",
    Science: "🔬",
    Cinéma: "🎞️",
    "Jeux Vidéo": "👾",
    "Drapeaux": "🗺️",
  };



  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AV</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.username}>Explorateur Ilyass</Text>
            <Text style={styles.role}>Artisan</Text>
            <Text style={styles.subtitle}>Niveau 7 | 15 PX avant prochain niveau</Text>
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
            <Text style={styles.sectionSubtitle}>Objets bonus</Text>
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
              Répertoire de tes trouvailles
            </Text>
          </View>

          <View style={styles.collectionGrid}>
            {collection.map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.collectionCard}>
                <View style={styles.collectionIcon}>
                  <Text style={styles.collectionIconText}> {themeEmojis[item.theme] || "❓"} </Text>

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

const CARD_BG = "#ffffff";       // Fond blanc
const CARD_BORDER = "#e5e7eb";   // Gris très clair
const ACCENT = "#0ea5e9";        // Bleu lumineux (accent)


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",  // Gris très clair "app moderne"

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
    color: "#1f2937",
    fontSize: 26,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    color: "#1f2937",
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
    color: "#9ca3af",
    fontSize: 12,
  },

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: "#9ca3af",
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
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
},

  statValue: {
    color: "#1f2937",
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
    color: "#1f2937",
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
    color: "#1f2937",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  collectionTheme: {
    color: "#9ca3af",
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
    color: "#1f2937",
    fontSize: 13,
    fontWeight: "500",
  },
});
