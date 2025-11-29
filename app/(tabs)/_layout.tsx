import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="carte" options={{ title: "Carte" }} />
      <Tabs.Screen name="marche" options={{ title: "Marché" }} />
      <Tabs.Screen name="classement" options={{ title: "Classement" }} />
      <Tabs.Screen name="atelier" options={{ title: "Atelier" }} />
      <Tabs.Screen name="profil" options={{ title: "Profil" }} />
    </Tabs>
  );
}
