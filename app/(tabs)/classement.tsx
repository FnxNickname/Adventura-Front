import React, { useState } from "react";
import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Explorer = {
  id: string;
  name: string;
  points: number;
  treasures: number;
  avatar: string; 
};

type Artisan = {
  id: string;
  name: string;
  creations: number;
  avatar: string;
};

export default function ClassementScreen() {
  const [tab, setTab] = useState<"explorateur" | "artisan">("explorateur");

  const explorers: Explorer[] = [
    { id: "1", name: "Ilyass", points: 1280, treasures: 18, avatar: "🥷" },
    { id: "2", name: "Ambre", points: 920, treasures: 11, avatar: "🦊" },
    { id: "3", name: "Pierre", points: 740, treasures: 9, avatar: "🐻" },
    { id: "4", name: "Armel", points: 540, treasures: 4, avatar: "🦁" },
    { id: "5", name: "Karine", points: 210, treasures: 2, avatar: "🐼" },
    { id: "6", name: "Julien", points: 90, treasures: 1, avatar: "🐯" },
  ];

  const artisans: Artisan[] = [
    { id: "1", name: "Pierre", creations: 14, avatar: "🐻" },
    { id: "2", name: "Ambre", creations: 9, avatar: "🦊" },
    { id: "3", name: "Ilyass", creations: 7, avatar: "🥷" },
    { id: "4", name: "Armel", creations: 3, avatar: "🦁" },
    { id: "5", name: "Karine", creations: 1, avatar: "🐼" },
    { id: "6", name: "Julien", creations: 0, avatar: "🐯" },
  ];

  const sortedExplorers = [...explorers].sort((a, b) => b.points - a.points);
  const top3Explorers = sortedExplorers.slice(0, 3);
  const othersExplorers = sortedExplorers.slice(3);

  const sortedArtisans = [...artisans].sort((a, b) => b.creations - a.creations);
  const top3Artisans = sortedArtisans.slice(0, 3);
  const othersArtisans = sortedArtisans.slice(3);

  return (
    <ImageBackground
      source={
      tab === "explorateur"
      ? require("../../assets/images/papyrus.jpg")             
      : require("../../assets/images/artistBG.jpeg")   
      }
      style={styles.background}
      resizeMode="cover"
    >

      <View style={styles.overlay}>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === "explorateur" && styles.tabActive]}
            onPress={() => setTab("explorateur")}
          >
            <Text style={[styles.tabText, tab === "explorateur" && styles.tabTextActive]}>
              Explorateurs 🧭
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tab === "artisan" && styles.tabActive]}
            onPress={() => setTab("artisan")}
          >
            <Text style={[styles.tabText, tab === "artisan" && styles.tabTextActive]}>
              Artisans 🎨
            </Text>
          </TouchableOpacity>
        </View>

        {tab === "explorateur" && (
          <>
            <View style={styles.top3Container}>
              {top3Explorers.map((item, index) => (
                <View key={item.id} style={styles.top3Card}>

                  <View
                    style={[
                      styles.top3Avatar,
                      index === 0 && styles.top1Avatar,
                    ]}
                  >
                    <Text style={{ fontSize: index === 0 ? 28 : 22 }}>{item.avatar}</Text>
                  </View>

                  <Text style={styles.top3Rank}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </Text>

                  <Text style={styles.top3Name}>{item.name}</Text>
                  <Text style={styles.top3Value}>{item.points} PX</Text>
                  <Text style={styles.top3Treasure}>🏺 {item.treasures}{"\u00A0"}trésors</Text>
                </View>
              ))}
            </View>

            <FlatList
              data={othersExplorers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item, index }) => (
                <View style={styles.row}>
                  <Text style={styles.rank}>{index + 4}</Text>

                  <View style={styles.rowLeft}>
                    <View style={styles.avatar}>
                      <Text style={{ fontSize: 18 }}>{item.avatar}</Text>
                    </View>
                    <View>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.subInfo}>🏺 {item.treasures} trésors trouvés</Text>
                    </View>
                  </View>

                  <Text style={styles.value}>{item.points} PX</Text>
                </View>
              )}
            />
          </>
        )}

        {tab === "artisan" && (
          <>
            <View style={styles.top3Container}>
              {top3Artisans.map((item, index) => (
                <View key={item.id} style={styles.top3Card}>

                  <View
                    style={[
                      styles.top3Avatar,
                      index === 0 && styles.top1Avatar,
                    ]}
                  >
                    <Text style={{ fontSize: index === 0 ? 28 : 22 }}>{item.avatar}</Text>
                  </View>

                  <Text style={styles.top3Rank}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </Text>

                  <Text style={styles.top3Name}>{item.name}</Text>
                  <Text style={styles.top3Value}>{item.creations}{"\u00A0"}créations</Text>
                </View>
              ))}
            </View>

            <FlatList
              data={othersArtisans}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item, index }) => (
                <View style={styles.row}>
                  <Text style={styles.rank}>{index + 4}</Text>

                  <View style={styles.rowLeft}>
                    <View style={styles.avatar}>
                      <Text style={{ fontSize: 18 }}>{item.avatar}</Text>
                    </View>
                    <Text style={styles.name}>{item.name}</Text>
                  </View>

                  <Text style={styles.value}>{item.creations} créations</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  tabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c9a66b",
  },
  tabActive: {
    backgroundColor: "#c9a66b",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5a4632",
  },
  tabTextActive: { color: "white" },

  top3Container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 25,
  },
  top3Card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 2,
    borderColor: "#d7c7a0",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    width: 110,
  },

  top3Avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#c9a66b",
    marginBottom: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  top1Avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },

  top3Rank: { fontSize: 26, marginBottom: 4 },
  top3Name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5a4632",
    textAlign: "center",
  },
  top3Value: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7a5e3d",
    marginTop: 4,
  },
  top3Treasure: {
    fontSize: 11,
    marginTop: 2,
    color: "#7a5e3d",
  },

  listContainer: { paddingBottom: 40 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7c7a0",
    marginBottom: 12,
  },

  rank: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5a4632",
    width: 30,
    textAlign: "center",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d7c7a0",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  name: { fontSize: 16, color: "#5a4632" },
  subInfo: { color: "#7a5e3d", fontSize: 13, marginTop: 2 },
  value: { fontSize: 16, fontWeight: "600", color: "#5a4632" },
});
