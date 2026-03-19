import {
  Viro3DObject,
  ViroAmbientLight,
  ViroAnimations,
  ViroARScene,
  ViroARSceneNavigator,
  ViroMaterials,
  ViroNode,
  ViroSpotLight,
} from "@reactvision/react-viro";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
const HOLD_DURATION = 2000;
const TICK_MS = 50;

const chestModel = require("../assets/chest.glb");

ViroMaterials.createMaterials({
  cubeFace: {
    diffuseColor: "#20d3c2",
    lightingModel: "Blinn",
  },
  cubeCharging: {
    diffuseColor: "#ff6644",
    lightingModel: "Blinn",
  },
});

ViroAnimations.registerAnimations({
  rotate: {
    properties: { rotateY: "+=90" },
    duration: 1000,
  },
});

function ARScene() {
  const [shakeOffset, setShakeOffset] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [cubeScale, setCubeScale] = useState<[number, number, number]>([
    0.3, 0.3, 0.3,
  ]);
  const [isHolding, setIsHolding] = useState(false);
  const [rewardCount, setRewardCount] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startHold = () => {
    setIsHolding(true);
    holdStartRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (holdStartRef.current ?? Date.now());
      const progress = Math.min(elapsed / HOLD_DURATION, 1);

      // Vibration de plus en plus forte sur le cube
      const intensity = progress * 0.06;
      setShakeOffset([
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        0,
      ]);

      // Grossit légèrement pendant le chargement
      const s = 0.3 + progress * 0.15;
      setCubeScale([s, s, s]);

      // Haptics de plus en plus fort
      if (progress < 0.4) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (progress < 0.75) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      if (progress >= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        holdStartRef.current = null;
        setIsHolding(false);
        setShakeOffset([0, 0, 0]);
        setCubeScale([0.3, 0.3, 0.3]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRewardCount((c) => c + 1);
        Alert.alert("Coffre ouvert ! 🎉", "+1 récompense obtenue");
      }
    }, TICK_MS);
  };

  const cancelHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    holdStartRef.current = null;
    setIsHolding(false);
    setShakeOffset([0, 0, 0]);
    setCubeScale([0.3, 0.3, 0.3]);
  };

  // onClickState: 1=down, 2=up, 3=clicked
  const handleClickState = (stateValue: number) => {
    if (stateValue === 1) {
      startHold();
    } else {
      cancelHold();
    }
  };

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" intensity={200} />
      <ViroSpotLight
        position={[0, 5, 0]}
        direction={[0, -1, 0]}
        color="#ffffff"
      />
      <ViroNode>
        <Viro3DObject
          source={chestModel}
          type="GLB"
          position={[shakeOffset[0], 0 + shakeOffset[1], -1 + shakeOffset[2]]}
          scale={cubeScale}
          animation={{ name: "rotate", run: true, loop: true }}
          onClickState={handleClickState}
          onLoadEnd={() => console.log("Chest model loaded")}
          onLoadError={(error) => console.log("Chest model error:", error)}
        />
      </ViroNode>
    </ViroARScene>
  );
}

export default function ARScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ViroARSceneNavigator
        initialScene={{ scene: ARScene }}
        style={styles.arView}
        autofocus={true}
      />

      <View style={styles.overlay}>
        <Text style={styles.info}>Maintiens le coffre 2s pour l'ouvrir</Text>
      </View>

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.btnText}>← Retour</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  arView: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  info: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  backBtn: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
