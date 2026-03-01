import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const deltaP = (lat2 - lat1) * Math.PI / 180;
  const deltaLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaP/2) * Math.sin(deltaP/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c); 
};

export default function Radar() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const targetLat = 48.9194780654108;
  const targetLon = 2.273027470009212;

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission refusée. Impossible de trouver le trésor !');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const dist = getDistance(
            newLocation.coords.latitude,
            newLocation.coords.longitude,
            targetLat,
            targetLon
          );
          setDistance(dist);
          console.log("Nouvelle distance calculée :", dist, "mètres");
        }
      );
    };

    startTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Fonction qui sera lancée quand on cliquera sur le bouton
  const ouvrirCamera = () => {
    Alert.alert("Z", "caméra AR");
    // Plus tard, on mettra ici le code pour changer d'écran ou afficher la 3D
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>🌍 Radar d'Objet</Text>
      
      {errorMsg ? (
        <Text style={styles.erreur}>{errorMsg}</Text>
      ) : distance !== null ? (
        <View style={styles.infoContainer}>
          <Text style={styles.texte}>
            Tu es à {distance} mètres de l'objectif !
          </Text>

          {}
          {distance <= 5 && (
            <TouchableOpacity style={styles.bouton} onPress={ouvrirCamera}>
              <Text style={styles.texteBouton}>📸 Caméra</Text>
            </TouchableOpacity>
          )}

        </View>
      ) : (
        <Text>Recherche du signal GPS en cours...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  infoContainer: { alignItems: 'center' },
  titre: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  texte: { fontSize: 18, color: 'green', fontWeight: 'bold', marginBottom: 30 },
  erreur: { color: 'red', textAlign: 'center' },
  
  bouton: {
    position : 'absolute',
    bottom : -220,
    backgroundColor: '#00aa41ff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Ombre pour Android
  },
  texteBouton: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});