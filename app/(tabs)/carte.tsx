import { Text, View } from "react-native";
import Radar from '../radar';

export default function CarteScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Carte</Text>
      <Radar />
    </View>
  );
}

