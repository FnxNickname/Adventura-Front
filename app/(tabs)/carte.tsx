import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ─── Cube constants ───────────────────────────────────────────────────────────
const S = 100; // face size (points)
const H = S / 2; // half-size
const CHEST_HOLD_MS = 2000;

// ─── Rotating 3D Cube ─────────────────────────────────────────────────────────
//
// Each face is a SIZE×SIZE View positioned with ONLY RN-supported transforms
// (rotateX, rotateY, translateX, translateY – no translateZ).
//
// translateZ(h) ≡ [rotateX('90deg'), translateY(h), rotateX('-90deg')]
// because rotating around X swaps Y ↔ Z, so a Y-translation in that rotated
// frame becomes a Z-translation in world space.

function RotatingCube() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [progress]);

  const rotateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const floatY = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -14, 0, 14, 0],
  });

  return (
    <View style={styles.cubeWrap}>
      <Animated.View
        style={[
          styles.cubeInner,
          {
            transform: [
              { perspective: 500 },
              { translateY: floatY },
              { rotateY },
              { rotateX: "15deg" },
            ],
          },
        ]}
      >
        {/* Front — translateZ +H via rotateX sandwich */}
        <View
          style={[
            styles.face,
            { backgroundColor: "#20d3c2" },
            {
              transform: [
                { rotateX: "90deg" },
                { translateY: H },
                { rotateX: "-90deg" },
              ],
            },
          ]}
        />

        {/* Back — translateZ -H then rotateY 180° */}
        <View
          style={[
            styles.face,
            { backgroundColor: "#0f6e66" },
            {
              transform: [
                { rotateX: "90deg" },
                { translateY: -H },
                { rotateX: "-90deg" },
                { rotateY: "180deg" },
              ],
            },
          ]}
        />

        {/* Left — translateX -H then rotateY -90° */}
        <View
          style={[
            styles.face,
            { backgroundColor: "#14a094" },
            { transform: [{ translateX: -H }, { rotateY: "-90deg" }] },
          ]}
        />

        {/* Right — translateX +H then rotateY +90° */}
        <View
          style={[
            styles.face,
            { backgroundColor: "#0a504a" },
            { transform: [{ translateX: H }, { rotateY: "90deg" }] },
          ]}
        />

        {/* Top — translateY -H then rotateX -90° */}
        <View
          style={[
            styles.face,
            { backgroundColor: "#64e6da" },
            { transform: [{ translateY: -H }, { rotateX: "-90deg" }] },
          ]}
        />

        {/* Bottom — translateY +H then rotateX +90° */}
        <View
          style={[
            styles.face,
            { backgroundColor: "#083c37" },
            { transform: [{ translateY: H }, { rotateX: "90deg" }] },
          ]}
        />
      </Animated.View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CarteScreen() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [rewardCount, setRewardCount] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const chargeProgress = useRef(new Animated.Value(0)).current;
  const shakePhase = useRef(new Animated.Value(0)).current;
  const chargeAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const shakeLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      chargeAnimRef.current?.stop();
      shakeLoopRef.current?.stop();
    };
  }, []);

  const handleOpen = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          "Permission requise",
          "Autorise la caméra pour voir le cube 3D.",
        );
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const stopShake = () => {
    shakeLoopRef.current?.stop();
    shakeLoopRef.current = null;
    Animated.spring(shakePhase, {
      toValue: 0,
      damping: 10,
      stiffness: 220,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  };

  const handleCubePressIn = () => {
    setIsCharging(true);
    chargeAnimRef.current?.stop();
    shakeLoopRef.current?.stop();

    chargeProgress.setValue(0);
    shakePhase.setValue(0);

    shakeLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shakePhase, {
          toValue: 1,
          duration: 40,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shakePhase, {
          toValue: -1,
          duration: 40,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    shakeLoopRef.current.start();

    chargeAnimRef.current = Animated.timing(chargeProgress, {
      toValue: 1,
      duration: CHEST_HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    chargeAnimRef.current.start(({ finished }) => {
      if (!finished) {
        return;
      }

      setIsCharging(false);
      setRewardCount((prev) => prev + 1);
      Alert.alert("Coffre ouvert", "+1 recompense obtenue.");
      stopShake();

      Animated.timing(chargeProgress, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCubePressOut = () => {
    chargeAnimRef.current?.stop();
    chargeAnimRef.current = null;
    setIsCharging(false);
    stopShake();

    Animated.timing(chargeProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const shakeStrength = chargeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 12],
  });

  const shakeX = Animated.multiply(shakePhase, shakeStrength);

  const chargeScale = chargeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });

  const pulseOpacity = chargeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.7],
  });

  const progressBarScale = chargeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 1],
  });

  if (isCameraOpen) {
    return (
      <View style={styles.fullScreen}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" />

        <View style={styles.hud}>
          <Text style={styles.hudText}>Recompenses: {rewardCount}</Text>
        </View>

        <View style={styles.overlay}>
          <Pressable
            style={styles.cubeTapArea}
            onPressIn={handleCubePressIn}
            onPressOut={handleCubePressOut}
          >
            <Animated.View
              style={[
                styles.chargeAura,
                {
                  opacity: pulseOpacity,
                  transform: [{ scale: chargeScale }],
                },
              ]}
            />
            <Animated.View
              style={{
                transform: [{ translateX: shakeX }, { scale: chargeScale }],
              }}
            >
              <RotatingCube />
            </Animated.View>
          </Pressable>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { transform: [{ scaleX: progressBarScale }] },
              ]}
            />
          </View>

          <Text style={styles.label}>
            {isCharging
              ? "Charge du coffre... maintiens 3 secondes"
              : "Maintiens le cube 3 secondes pour ouvrir le coffre"}
          </Text>
        </View>

        <Pressable
          style={styles.closeBtn}
          onPress={() => setIsCameraOpen(false)}
        >
          <Text style={styles.btnText}>Fermer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.menu}>
      <Text style={styles.title}>Carte</Text>
      <Text style={styles.subtitle}>
        Ouvre la caméra pour voir un cube 3D dans l'espace en 3D.
      </Text>
      {/* <Pressable style={styles.openBtn} onPress={handleOpen}>
        <Text style={styles.btnText}>Ouvrir la caméra</Text>
      </Pressable> */}
      <Pressable
        style={[styles.openBtn, { marginTop: 14 }]}
        onPress={() => router.push("/ar")}
      >
        <Text style={styles.btnText}>Ouvrir la caméra AR</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  menu: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1a2538",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#475a74",
    textAlign: "center",
    marginBottom: 22,
  },
  openBtn: {
    backgroundColor: "#1f6feb",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  hud: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  hudText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  cubeTapArea: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  chargeAura: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#37fff0",
  },
  progressTrack: {
    width: 220,
    height: 10,
    marginTop: 18,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  progressFill: {
    flex: 1,
    backgroundColor: "#7dff55",
    transformOrigin: "left",
  },
  label: {
    marginTop: 110,
    color: "#e0fffd",
    fontSize: 15,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cubeWrap: {
    width: S,
    height: S,
    alignItems: "center",
    justifyContent: "center",
  },
  cubeInner: {
    width: S,
    height: S,
  },
  face: {
    position: "absolute",
    width: S,
    height: S,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backfaceVisibility: "hidden",
  },
});
