import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle } from "react-native-maps";

interface Treasure {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  radius: number;
  color: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function CarteScreen() {
  const modeDev = false;

  const mapRef = useRef<MapView>(null);
  const router = useRouter();

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const [treasures] = useState<Treasure[]>([
    {
      id: "treasure1",
      latitude: 48.89764,
      longitude: 2.23664,
      name: "Trésor Bleu",
      radius: 50,
      color: "#007AFF",
    },
    {
      id: "treasure2",
      latitude: 48.89603,
      longitude: 2.23419,
      name: "Trésor Vert",
      radius: 50,
      color: "#34C759",
    },
    {
      id: "treasure3",
      latitude: 48.89353,
      longitude: 2.23869,
      name: "Trésor Rouge",
      radius: 50,
      color: "#FF3B30",
    },
  ]);

  const [zoomLevel, setZoomLevel] = useState(16);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let positionSub: Location.LocationSubscription | null = null;

    const start = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission refusée",
            "Permission d'accès à la localisation refusée",
          );
          setLoading(false);
          return;
        }

        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setUserLocation({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          accuracy: initial.coords.accuracy || 0,
        });

        mapRef.current?.animateToRegion(
          {
            latitude: initial.coords.latitude,
            longitude: initial.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          500,
        );

        positionSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 1000,
            distanceInterval: 2,
          },
          (loc) => {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracy: loc.coords.accuracy || 0,
            });
          },
        );
        setLoading(false);
      } catch (e) {
        console.error(e);
        Alert.alert("Erreur", "Impossible d'accéder à votre localisation");
        setLoading(false);
      }
    };

    start();

    return () => {
      positionSub?.remove();
    };
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 1, 20);
    setZoomLevel(newZoom);

    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05 / Math.pow(2, newZoom - 16),
          longitudeDelta: 0.05 / Math.pow(2, newZoom - 16),
        },
        300,
      );
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 1, 10);
    setZoomLevel(newZoom);

    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05 / Math.pow(2, newZoom - 16),
          longitudeDelta: 0.05 / Math.pow(2, newZoom - 16),
        },
        300,
      );
    }
  };

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.007,
          longitudeDelta: 0.007,
        },
        500,
      );
    }
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement de la localisation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? "google" : undefined}
        initialRegion={{
          latitude: userLocation?.latitude || 48.8566,
          longitude: userLocation?.longitude || 2.3522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass
      >
        {treasures.map((treasure) => (
          <Circle
            key={treasure.id}
            center={{
              latitude: treasure.latitude,
              longitude: treasure.longitude,
            }}
            radius={treasure.radius}
            fillColor={hexToRgba(treasure.color, 0.2)}
            strokeColor={hexToRgba(treasure.color, 0.6)}
            strokeWidth={2}
          />
        ))}
      </MapView>

      <View style={styles.zoomButtons}>
        <TouchableOpacity style={styles.button} onPress={handleZoomIn}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { borderBottomWidth: 0 }]}
          onPress={handleZoomOut}
        >
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.centerButton}
        onPress={handleCenterOnUser}
      >
        <Text style={styles.centerButtonText}>🎯</Text>
      </TouchableOpacity>

      {/* Bouton AR en bas à droite */}
      <TouchableOpacity
        style={styles.arButton}
        onPress={() => router.push("/ar")}
      >
        <Text style={styles.arButtonText}>AR</Text>
      </TouchableOpacity>

      {modeDev && userLocation && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            Lat: {userLocation.latitude.toFixed(5)}
          </Text>
          <Text style={styles.infoText}>
            Lon: {userLocation.longitude.toFixed(5)}
          </Text>
          <Text style={styles.infoText}>
            Précision: ±{Math.round(userLocation.accuracy)}m
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },

  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
    color: "#666",
  },

  zoomButtons: {
    position: "absolute",
    right: 15,
    bottom: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 5,
  },

  button: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  buttonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },

  centerButton: {
    position: "absolute",
    right: 15,
    bottom: 125,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },

  centerButtonText: { fontSize: 24 },

  arButton: {
    position: "absolute",
    right: 15,
    bottom: 180,
    width: 50,
    height: 50,
    borderRadius: 28,
    backgroundColor: "#20d3c2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },

  arButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },

  infoPanel: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },

  infoText: {
    fontSize: 12,
    color: "#333",
    marginVertical: 2,
  },
});
