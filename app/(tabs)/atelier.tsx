import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";

// ===== Types & Constants =====
type Tool = "brush" | "eraser" | "eyedropper" | "bucket";
type CreationStatus = "draft" | "pending" | "published";
type AppView = "home" | "category" | "editor";

interface Creation {
  id: string;
  name: string;
  gridSize: number;
  pixels: string[];
  status: CreationStatus;
  updatedAt: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ===== Mock data =====
const MOCK_CREATIONS: Creation[] = [
  {
    id: "1",
    name: "Dragon violet",
    gridSize: 16,
    pixels: Array.from({ length: 16 * 16 }, (_, i) =>
      i % 7 === 0 ? "#7C3AED" : i % 3 === 0 ? "#C4B5FD" : "#FFFFFF"
    ),
    status: "published",
    updatedAt: "2026-03-15",
  },
  {
    id: "2",
    name: "Soleil couchant",
    gridSize: 16,
    pixels: Array.from({ length: 16 * 16 }, (_, i) =>
      i % 5 === 0 ? "#F97316" : i % 4 === 0 ? "#FCD34D" : "#FFFFFF"
    ),
    status: "published",
    updatedAt: "2026-03-10",
  },
  {
    id: "3",
    name: "Robot pixel",
    gridSize: 24,
    pixels: Array.from({ length: 24 * 24 }, (_, i) =>
      i % 9 === 0 ? "#111827" : i % 6 === 0 ? "#6B7280" : "#FFFFFF"
    ),
    status: "pending",
    updatedAt: "2026-03-18",
  },
  {
    id: "4",
    name: "Fleur de cerisier",
    gridSize: 16,
    pixels: Array.from({ length: 16 * 16 }, (_, i) =>
      i % 4 === 0 ? "#F9A8D4" : i % 11 === 0 ? "#EC4899" : "#FFFFFF"
    ),
    status: "pending",
    updatedAt: "2026-03-19",
  },
  {
    id: "5",
    name: "Brouillon épée",
    gridSize: 24,
    pixels: Array.from({ length: 24 * 24 }, (_, i) =>
      i % 8 === 0 ? "#60A5FA" : "#FFFFFF"
    ),
    status: "draft",
    updatedAt: "2026-03-17",
  },
  {
    id: "6",
    name: "Château fort",
    gridSize: 32,
    pixels: Array.from({ length: 32 * 32 }, () => "#FFFFFF"),
    status: "draft",
    updatedAt: "2026-03-19",
  },
];

// ===== Helpers =====
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = v - c;
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

function createGrid(size: number) {
  return Array.from({ length: size * size }, () => "#FFFFFF");
}

function floodFill(
  pixels: string[],
  size: number,
  startIndex: number,
  newColor: string
) {
  const targetColor = pixels[startIndex];
  if (targetColor === newColor) return pixels;
  const nextPixels = [...pixels];
  const stack = [startIndex];
  while (stack.length > 0) {
    const currentIdx = stack.pop()!;
    if (nextPixels[currentIdx] !== targetColor) continue;
    nextPixels[currentIdx] = newColor;
    const r = Math.floor(currentIdx / size);
    const c = currentIdx % size;
    if (r > 0) stack.push((r - 1) * size + c);
    if (r < size - 1) stack.push((r + 1) * size + c);
    if (c > 0) stack.push(r * size + (c - 1));
    if (c < size - 1) stack.push(r * size + (c + 1));
  }
  return nextPixels;
}

function paintSquare(
  colors: string[],
  size: number,
  index: number,
  color: string,
  brushSize: number
) {
  const next = [...colors];
  const row = Math.floor(index / size);
  const col = index % size;
  const half = Math.floor(brushSize / 2);
  for (let dr = -half; dr < -half + brushSize; dr++) {
    for (let dc = -half; dc < -half + brushSize; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < size && c >= 0 && c < size)
        next[r * size + c] = color;
    }
  }
  return next;
}

// ===== Mini pixel preview =====
function PixelPreview({
  pixels,
  gridSize,
  size = 64,
}: {
  pixels: string[];
  gridSize: number;
  size?: number;
}) {
  const cellSize = size / gridSize;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        overflow: "hidden",
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "#F9FAFB",
      }}
    >
      {pixels.map((c, i) => (
        <View
          key={i}
          style={{ width: cellSize, height: cellSize, backgroundColor: c }}
        />
      ))}
    </View>
  );
}

// ===== Confirmation Modal =====
function ConfirmModal({
  visible,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Oui, continuer",
  confirmColor = "#EF4444",
}: {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmColor?: string;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={edStyles.modalOverlay}>
        <View style={edStyles.modalBox}>
          <Text style={edStyles.modalTitle}>⚠️ Confirmation</Text>
          <Text style={edStyles.modalMessage}>{message}</Text>
          <View style={edStyles.modalBtns}>
            <Pressable style={edStyles.modalBtnCancel} onPress={onCancel}>
              <Text style={edStyles.modalBtnCancelText}>Non</Text>
            </Pressable>
            <Pressable
              style={[edStyles.modalBtnConfirm, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
            >
              <Text style={edStyles.modalBtnConfirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ===== STATUS CONFIG =====
const STATUS_CONFIG: Record<
  CreationStatus,
  { label: string; emoji: string; color: string; bg: string; dot: string }
> = {
  draft: {
    label: "Brouillons",
    emoji: "✏️",
    color: "#374151",
    bg: "#F3F4F6",
    dot: "#9CA3AF",
  },
  pending: {
    label: "En attente de validation",
    emoji: "⏳",
    color: "#92400E",
    bg: "#FEF3C7",
    dot: "#F59E0B",
  },
  published: {
    label: "Publiées",
    emoji: "✅",
    color: "#065F46",
    bg: "#D1FAE5",
    dot: "#10B981",
  },
};

// ===================================================================
// ===== MAIN SCREEN =====
// ===================================================================
export default function AtelierScreen() {
  const [view, setView] = useState<AppView>("home");
  const [creations, setCreations] = useState<Creation[]>(MOCK_CREATIONS);
  const [selectedCategory, setSelectedCategory] =
    useState<CreationStatus | null>(null);
  const [editingCreation, setEditingCreation] = useState<Creation | null>(null);

  // Avertissement "cette création est publiée"
  const [publishedWarnModal, setPublishedWarnModal] = useState<{
    visible: boolean;
    creation: Creation | null;
  }>({ visible: false, creation: null });

  const handleOpenCategory = (status: CreationStatus) => {
    setSelectedCategory(status);
    setView("category");
  };

  const handleNewCreation = () => {
    setEditingCreation(null);
    setView("editor");
  };

  const handleEditCreation = (creation: Creation) => {
    if (creation.status === "pending") return; // non éditable
    if (creation.status === "published") {
      setPublishedWarnModal({ visible: true, creation });
      return;
    }
    setEditingCreation(creation);
    setView("editor");
  };

  const handleSaveDraft = ({
    pixels,
    gridSize,
    name,
  }: {
    pixels: string[];
    gridSize: number;
    name: string;
  }) => {
    if (editingCreation) {
      // Mise à jour
      setCreations((prev) =>
        prev.map((c) =>
          c.id === editingCreation.id
            ? {
                ...c,
                pixels,
                gridSize,
                name: name || c.name,
                status: "draft",
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : c
        )
      );
    } else {
      // Nouvelle création
      const newCreation: Creation = {
        id: Date.now().toString(),
        name: name || "Nouvelle création",
        gridSize,
        pixels,
        status: "draft",
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setCreations((prev) => [newCreation, ...prev]);
    }
    setView("home");
    setEditingCreation(null);
  };

  if (view === "editor") {
    return (
      <PixelEditor
        initialCreation={editingCreation}
        onCancel={() => {
          setView(selectedCategory ? "category" : "home");
        }}
        onSaveDraft={handleSaveDraft}
      />
    );
  }

  if (view === "category" && selectedCategory) {
    const filtered = creations.filter((c) => c.status === selectedCategory);
    const cfg = STATUS_CONFIG[selectedCategory];
    return (
      <SafeAreaView style={homeStyles.safeArea}>
        <View style={homeStyles.catHeader}>
          <Pressable
            style={homeStyles.backBtn}
            onPress={() => setView("home")}
          >
            <Text style={homeStyles.backBtnText}>← Retour</Text>
          </Pressable>
          <Text style={homeStyles.catTitle}>
            {cfg.emoji} {cfg.label}
          </Text>
          {selectedCategory === "draft" && (
            <Pressable style={homeStyles.newBtnSmall} onPress={handleNewCreation}>
              <Text style={homeStyles.newBtnSmallText}>+ Nouveau</Text>
            </Pressable>
          )}
        </View>

        {filtered.length === 0 ? (
          <View style={homeStyles.emptyState}>
            <Text style={homeStyles.emptyEmoji}>🎨</Text>
            <Text style={homeStyles.emptyText}>Aucune création ici</Text>
            <Text style={homeStyles.emptySubText}>
              {selectedCategory === "draft"
                ? "Commence un nouveau pixel art !"
                : "Tes créations apparaîtront ici."}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={homeStyles.catGrid}>
            {filtered.map((creation) => (
              <CreationCard
                key={creation.id}
                creation={creation}
                onPress={() => handleEditCreation(creation)}
              />
            ))}
          </ScrollView>
        )}

        {/* Modal avertissement publiée */}
        <ConfirmModal
          visible={publishedWarnModal.visible}
          message={`⚠️ Cette création est publiée.\n\nSi vous l'éditez, elle repassera en attente de validation et ne sera plus accessible publiquement avant d'être re-validée.\n\nVoulez-vous continuer ?`}
          confirmLabel="Éditer quand même"
          confirmColor="#F59E0B"
          onConfirm={() => {
            const c = publishedWarnModal.creation!;
            setPublishedWarnModal({ visible: false, creation: null });
            setEditingCreation(c);
            setView("editor");
          }}
          onCancel={() =>
            setPublishedWarnModal({ visible: false, creation: null })
          }
        />
      </SafeAreaView>
    );
  }

  // ===== HOME VIEW =====
  const counts = {
    draft: creations.filter((c) => c.status === "draft").length,
    pending: creations.filter((c) => c.status === "pending").length,
    published: creations.filter((c) => c.status === "published").length,
  };

  const recentDrafts = creations
    .filter((c) => c.status === "draft")
    .slice(0, 2);

  return (
    <SafeAreaView style={homeStyles.safeArea}>
      <ScrollView contentContainerStyle={homeStyles.scrollContent}>
        {/* Header */}
        <View style={homeStyles.header}>
          <View>
            <Text style={homeStyles.headerTitle}>Mon Atelier</Text>
            <Text style={homeStyles.headerSub}>
              {creations.length} création{creations.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Catégories */}
        <Text style={homeStyles.sectionLabel}>Mes créations</Text>
        <View style={homeStyles.catCards}>
          {(["published", "pending", "draft"] as CreationStatus[]).map(
            (status) => {
              const cfg = STATUS_CONFIG[status];
              const preview = creations.find((c) => c.status === status);
              return (
                <Pressable
                  key={status}
                  style={[homeStyles.catCard, { backgroundColor: cfg.bg }]}
                  onPress={() => handleOpenCategory(status)}
                >
                  <View style={homeStyles.catCardTop}>
                    <View
                      style={[
                        homeStyles.catDot,
                        { backgroundColor: cfg.dot },
                      ]}
                    />
                    <Text style={[homeStyles.catCardLabel, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>
                  <View style={homeStyles.catCardRow}>
                    {preview ? (
                      <PixelPreview
                        pixels={preview.pixels}
                        gridSize={preview.gridSize}
                        size={56}
                      />
                    ) : (
                      <View style={homeStyles.catCardEmpty}>
                        <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
                      </View>
                    )}
                    <View style={homeStyles.catCardInfo}>
                      <Text
                        style={[homeStyles.catCardCount, { color: cfg.color }]}
                      >
                        {counts[status]}
                      </Text>
                      <Text
                        style={[homeStyles.catCardSub, { color: cfg.color }]}
                      >
                        {counts[status] <= 1 ? "création" : "créations"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[homeStyles.catCardArrow, { color: cfg.color }]}>
                    Voir tout →
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        {/* Brouillons récents */}
        {recentDrafts.length > 0 && (
          <>
            <Text style={homeStyles.sectionLabel}>Brouillons récents</Text>
            <View style={homeStyles.recentList}>
              {recentDrafts.map((c) => (
                <CreationCard
                  key={c.id}
                  creation={c}
                  onPress={() => handleEditCreation(c)}
                  compact
                />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Bouton + flottant */}
      <Pressable style={homeStyles.fab} onPress={handleNewCreation}>
        <Text style={homeStyles.fabText}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// ===== Creation Card =====
function CreationCard({
  creation,
  onPress,
  compact = false,
}: {
  creation: Creation;
  onPress: () => void;
  compact?: boolean;
}) {
  const cfg = STATUS_CONFIG[creation.status];
  const isEditable =
    creation.status === "draft" || creation.status === "published";

  return (
    <Pressable
      style={[homeStyles.creationCard, compact && homeStyles.creationCardCompact]}
      onPress={onPress}
    >
      <PixelPreview
        pixels={creation.pixels}
        gridSize={creation.gridSize}
        size={compact ? 56 : 72}
      />
      <View style={homeStyles.creationCardInfo}>
        <Text style={homeStyles.creationCardName} numberOfLines={1}>
          {creation.name}
        </Text>
        <Text style={homeStyles.creationCardDate}>
          Modifié le {creation.updatedAt}
        </Text>
        <View style={homeStyles.creationCardBadgeRow}>
          <View
            style={[
              homeStyles.creationCardBadge,
              { backgroundColor: cfg.bg },
            ]}
          >
            <View
              style={[homeStyles.catDot, { backgroundColor: cfg.dot, width: 6, height: 6 }]}
            />
            <Text
              style={[homeStyles.creationCardBadgeText, { color: cfg.color }]}
            >
              {cfg.label}
            </Text>
          </View>
        </View>
      </View>
      <View style={homeStyles.creationCardAction}>
        {creation.status === "pending" ? (
          <Text style={homeStyles.lockIcon}>🔒</Text>
        ) : (
          <Text style={homeStyles.editIcon}>✏️</Text>
        )}
      </View>
    </Pressable>
  );
}

// ===================================================================
// ===== PIXEL EDITOR COMPONENT =====
// ===================================================================
function PixelEditor({
  initialCreation,
  onCancel,
  onSaveDraft,
}: {
  initialCreation: Creation | null;
  onCancel: () => void;
  onSaveDraft: (data: {
    pixels: string[];
    gridSize: number;
    name: string;
  }) => void;
}) {
  const [creationName, setCreationName] = useState(
    initialCreation?.name ?? "Nouvelle création"
  );

  // Drawer swipeable
  const DRAWER_CLOSED_HEIGHT = 130; // hauteur minimale (handle + outils rapides)
  const DRAWER_OPEN_HEIGHT = 480;   // hauteur quand complètement ouvert
  const drawerHeight = useRef(new Animated.Value(DRAWER_CLOSED_HEIGHT)).current;
  const drawerIsOpen = useRef(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(DRAWER_CLOSED_HEIGHT);

  const openDrawer = () => {
    drawerIsOpen.current = true;
    Animated.spring(drawerHeight, {
      toValue: DRAWER_OPEN_HEIGHT,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  };

  const closeDrawer = () => {
    drawerIsOpen.current = false;
    Animated.spring(drawerHeight, {
      toValue: DRAWER_CLOSED_HEIGHT,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  };

  const handlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderGrant: (_, gs) => {
        dragStartY.current = gs.y0;
        dragStartHeight.current = drawerIsOpen.current
          ? DRAWER_OPEN_HEIGHT
          : DRAWER_CLOSED_HEIGHT;
      },
      onPanResponderMove: (_, gs) => {
        // dy négatif = glisser vers le haut = ouvrir
        const newH = clamp(
          dragStartHeight.current - gs.dy,
          DRAWER_CLOSED_HEIGHT,
          DRAWER_OPEN_HEIGHT
        );
        drawerHeight.setValue(newH);
      },
      onPanResponderRelease: (_, gs) => {
        const mid = (DRAWER_CLOSED_HEIGHT + DRAWER_OPEN_HEIGHT) / 2;
        const currentH = dragStartHeight.current - gs.dy;
        if (currentH > mid) {
          openDrawer();
        } else {
          closeDrawer();
        }
      },
    })
  ).current;
  const [gridSize, setGridSize] = useState(initialCreation?.gridSize ?? 24);
  const [pixels, setPixels] = useState(
    () => initialCreation?.pixels ?? createGrid(24)
  );
  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(1);
  const [color, setColor] = useState("#FF6B00");

  const [h, setH] = useState(20);
  const [sv, setSV] = useState({ s: 1, v: 1 });
  const [palette, setPalette] = useState<string[]>([
    "#FF6B00",
    "#111827",
    "#22C55E",
    "#3B82F6",
    "#EF4444",
    "#FFFFFF",
  ]);

  const [mainAreaHeight, setMainAreaHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [lastTwoFingerCenter, setLastTwoFingerCenter] = useState({
    x: 0,
    y: 0,
  });

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    pendingSize: number | null;
  }>({ visible: false, pendingSize: null });

  const gridRef = useRef<View>(null);

  useEffect(() => {
    const hex = hsvToHex(h, sv.s, sv.v);
    setColor(hex);
  }, [h, sv]);

  const cellSize = useMemo(() => {
    const padding = 60;
    const availableSize = Math.min(
      SCREEN_WIDTH - padding,
      mainAreaHeight - padding
    );
    if (availableSize <= 0) return 10;
    const baseSize = Math.floor(availableSize / gridSize);
    return clamp(baseSize, 4, 30);
  }, [gridSize, mainAreaHeight]);

  const baseDisplayWidth = gridSize * cellSize;
  const baseDisplayHeight = gridSize * cellSize;
  const displayWidth = baseDisplayWidth * zoom;
  const displayHeight = baseDisplayHeight * zoom;

  const paintAt = (pageX: number, pageY: number) => {
    gridRef.current?.measureInWindow((x, y, w, h) => {
      const gridCenterX = x + w / 2;
      const gridCenterY = y + h / 2;
      const localX =
        (pageX - gridCenterX) / zoom + baseDisplayWidth / 2 - offsetX / zoom;
      const localY =
        (pageY - gridCenterY) / zoom + baseDisplayHeight / 2 - offsetY / zoom;
      const col = Math.floor(localX / cellSize);
      const row = Math.floor(localY / cellSize);
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        const index = row * gridSize + col;
        if (tool === "eyedropper") {
          setColor(pixels[index]);
          return;
        }
        if (tool === "bucket") {
          setPixels((prev) => floodFill(prev, gridSize, index, color));
          return;
        }
        const c = tool === "eraser" ? "#FFFFFF" : color;
        setPixels((prev) => paintSquare(prev, gridSize, index, c, brushSize));
      }
    });
  };

  const panGrid = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          if (e.nativeEvent.touches.length === 2) {
            const [t1, t2] = e.nativeEvent.touches;
            setLastTwoFingerCenter({
              x: (t1.pageX + t2.pageX) / 2,
              y: (t1.pageY + t2.pageY) / 2,
            });
            return;
          }
          if (e.nativeEvent.touches.length === 1) {
            paintAt(e.nativeEvent.pageX, e.nativeEvent.pageY);
          }
        },
        onPanResponderMove: (e) => {
          if (e.nativeEvent.touches.length === 2) {
            const [t1, t2] = e.nativeEvent.touches;
            const newCenter = {
              x: (t1.pageX + t2.pageX) / 2,
              y: (t1.pageY + t2.pageY) / 2,
            };
            if (zoom > 1) {
              const dx = newCenter.x - lastTwoFingerCenter.x;
              const dy = newCenter.y - lastTwoFingerCenter.y;
              const maxOffsetX = (displayWidth - baseDisplayWidth) / 2;
              const maxOffsetY = (displayHeight - baseDisplayHeight) / 2;
              setOffsetX((prev) => clamp(prev + dx, -maxOffsetX, maxOffsetX));
              setOffsetY((prev) => clamp(prev + dy, -maxOffsetY, maxOffsetY));
            }
            setLastTwoFingerCenter(newCenter);
            return;
          }
          if (tool !== "bucket" && e.nativeEvent.touches.length === 1) {
            paintAt(e.nativeEvent.pageX, e.nativeEvent.pageY);
          }
        },
        onPanResponderRelease: () => {},
      }),
    [
      gridSize,
      tool,
      brushSize,
      color,
      pixels,
      zoom,
      cellSize,
      lastTwoFingerCenter,
      offsetX,
      offsetY,
      displayWidth,
      displayHeight,
      baseDisplayWidth,
      baseDisplayHeight,
    ]
  );

  const requestGridChange = (newSize: number) => {
    if (newSize === gridSize) return;
    const hasDrawing = pixels.some((p) => p !== "#FFFFFF");
    if (hasDrawing) {
      setConfirmModal({ visible: true, pendingSize: newSize });
    } else {
      applyGridChange(newSize);
    }
  };

  const applyGridChange = (size: number) => {
    setGridSize(size);
    setPixels(createGrid(size));
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setConfirmModal({ visible: false, pendingSize: null });
  };

  const renderGrid = () => (
    <View
      ref={gridRef}
      style={[
        edStyles.gridWrapper,
        {
          width: baseDisplayWidth,
          height: baseDisplayHeight,
          transform: [
            { translateX: offsetX },
            { translateY: offsetY },
            { scale: zoom },
          ],
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          width: baseDisplayWidth,
        }}
      >
        {pixels.map((c, i) => (
          <View
            key={i}
            style={[
              edStyles.cell,
              { width: cellSize, height: cellSize, backgroundColor: c },
            ]}
          />
        ))}
      </View>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents="box-only"
        {...panGrid.panHandlers}
      />
    </View>
  );

  return (
    <SafeAreaView style={edStyles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={edStyles.container}>
          {/* Confirmation grille */}
          <ConfirmModal
            visible={confirmModal.visible}
            message={`Changer la taille de la grille effacera votre dessin actuel.\nVoulez-vous continuer ?`}
            onConfirm={() => applyGridChange(confirmModal.pendingSize!)}
            onCancel={() =>
              setConfirmModal({ visible: false, pendingSize: null })
            }
          />

          {/* Header éditeur */}
          <View style={edStyles.header}>
            <Pressable style={edStyles.closeBtn} onPress={onCancel}>
              <Text style={{ fontWeight: "600" }}>← Retour</Text>
            </Pressable>
            <Text style={edStyles.title} numberOfLines={1}>
              {creationName}
            </Text>
            <Pressable
              style={edStyles.saveBtn}
              onPress={() =>
                onSaveDraft({ pixels, gridSize, name: creationName })
              }
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Sauver</Text>
            </Pressable>
          </View>

          {/* Zone de dessin */}
          <View
            style={edStyles.mainArea}
            onLayout={(e) =>
              setMainAreaHeight(e.nativeEvent.layout.height)
            }
          >
            <View style={[edStyles.centerContainer, { overflow: "hidden" }]}>
              {mainAreaHeight > 0 && renderGrid()}
            </View>
          </View>

          {/* Barre de zoom */}
          <View style={edStyles.zoomBar}>
            <Pressable
              onPress={() => {
                setZoom((z) => clamp(z - 0.2, 0.8, 3));
                setOffsetX(0);
                setOffsetY(0);
              }}
              style={edStyles.zoomBtn}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                −
              </Text>
            </Pressable>
            <Text style={edStyles.zoomText}>{Math.round(zoom * 100)}%</Text>
            <Pressable
              onPress={() => {
                setZoom((z) => clamp(z + 0.2, 0.8, 3));
                setOffsetX(0);
                setOffsetY(0);
              }}
              style={edStyles.zoomBtn}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                +
              </Text>
            </Pressable>
            <Pressable
              style={edStyles.resetZoomBtn}
              onPress={() => {
                setZoom(1);
                setOffsetX(0);
                setOffsetY(0);
              }}
            >
              <Text style={{ color: "#111", fontWeight: "bold", fontSize: 11 }}>
                Reset
              </Text>
            </Pressable>
            <View
              style={{
                width: 1,
                height: 25,
                backgroundColor: "rgba(255,255,255,0.3)",
              }}
            />
            <View
              style={[edStyles.currentColorCircle, { backgroundColor: color }]}
            />
          </View>

          {/* Drawer outils — swipeable */}
          <Animated.View style={[edStyles.drawer, { height: drawerHeight, overflow: 'hidden' }]}>
            {/* Zone de drag (handle) */}
            <View style={edStyles.handle} {...handlePan.panHandlers}>
              <View style={edStyles.handleBar} />
              <Text style={edStyles.handleText}>Outils &amp; Couleurs</Text>
            </View>

            {/* Outils rapides toujours visibles */}
            <View style={edStyles.quickTools}>
              <ToolIcon
                label="🖌"
                active={tool === "brush"}
                onPress={() => setTool("brush")}
              />
              <ToolIcon
                label="🩹"
                active={tool === "eraser"}
                onPress={() => setTool("eraser")}
              />
              <ToolIcon
                label="🪣"
                active={tool === "bucket"}
                onPress={() => setTool("bucket")}
              />
              <ToolIcon
                label="🧪"
                active={tool === "eyedropper"}
                onPress={() => setTool("eyedropper")}
              />
              <View
                style={[
                  edStyles.currentColorPreview,
                  { backgroundColor: color },
                ]}
              />
            </View>

            {/* Contenu étendu — toujours monté, visible grâce à la hauteur animée */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={edStyles.drawerScroll}
              scrollEnabled={true}
            >
              <View style={edStyles.section}>
                <Text style={edStyles.label}>Sélecteur de Couleur</Text>
                <SVSquare hue={h} s={sv.s} v={sv.v} onChange={setSV} />
                <Text style={edStyles.subLabel}>Teinte : {Math.round(h)}°</Text>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={0}
                  maximumValue={360}
                  value={h}
                  onValueChange={setH}
                  minimumTrackTintColor="#111"
                />
              </View>
              <View style={edStyles.section}>
                <Text style={edStyles.label}>Palette</Text>
                <View style={edStyles.row}>
                  {palette.map((p, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setColor(p)}
                      style={[
                        edStyles.swatch,
                        { backgroundColor: p },
                        color === p && edStyles.swatchActive,
                      ]}
                    />
                  ))}
                  <Pressable
                    style={edStyles.addBtn}
                    onPress={() =>
                      setPalette([color, ...palette].slice(0, 12))
                    }
                  >
                    <Text>+</Text>
                  </Pressable>
                </View>
              </View>
              <View style={edStyles.section}>
                <Text style={edStyles.label}>Taille de la Grille</Text>
                <View style={edStyles.row}>
                  {[16, 24, 32, 48, 64].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => requestGridChange(s)}
                      style={[
                        edStyles.pill,
                        gridSize === s && edStyles.pillActive,
                      ]}
                    >
                      <Text style={gridSize === s && { color: "white" }}>
                        {s}x{s}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Pressable
                style={edStyles.clearBtn}
                onPress={() => setPixels(createGrid(gridSize))}
              >
                <Text style={edStyles.clearText}>Réinitialiser le dessin</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===== SVSquare & ToolIcon =====
function SVSquare({ hue, s, v, onChange }: any) {
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const ref = useRef<View>(null);
  const handleTouch = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    onChange({
      s: clamp(locationX / dims.w, 0, 1),
      v: clamp(1 - locationY / dims.h, 0, 1),
    });
  };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => handleTouch(e),
        onPanResponderMove: (e) => handleTouch(e),
      }),
    [dims]
  );
  return (
    <View
      ref={ref}
      onLayout={(e) =>
        setDims({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
      style={edStyles.svSquare}
      {...pan.panHandlers}
    >
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: hsvToHex(hue, 1, 1) }]}
      />
      <LinearGradient
        colors={["#ffffff", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          edStyles.marker,
          { left: dims.w * s - 12, top: dims.h * (1 - v) - 12 },
        ]}
      />
    </View>
  );
}

function ToolIcon({ label, active, onPress }: any) {
  return (
    <Pressable
      style={[edStyles.toolIcon, active && edStyles.toolIconActive]}
      onPress={onPress}
    >
      <Text style={edStyles.iconText}>{label}</Text>
    </Pressable>
  );
}

// ===================================================================
// ===== STYLES =====
// ===================================================================

// --- Home styles ---
const homeStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 18, paddingBottom: 100 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },

  newBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  newBtnText: { color: "white", fontWeight: "700", fontSize: 14 },

  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
    marginTop: 4,
  },

  catCards: { gap: 12, marginBottom: 28 },
  catCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  catCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  catCardLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  catCardRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  catCardEmpty: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  catCardInfo: {},
  catCardCount: { fontSize: 32, fontWeight: "800" },
  catCardSub: { fontSize: 12, fontWeight: "500", opacity: 0.8 },
  catCardArrow: { fontSize: 12, fontWeight: "600", marginTop: 12, opacity: 0.7 },

  recentList: { gap: 10 },

  creationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  creationCardCompact: { padding: 10 },
  creationCardInfo: { flex: 1 },
  creationCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  creationCardDate: { fontSize: 11, color: "#9CA3AF", marginBottom: 6 },
  creationCardBadgeRow: { flexDirection: "row" },
  creationCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  creationCardBadgeText: { fontSize: 10, fontWeight: "600" },
  creationCardAction: { paddingLeft: 4 },
  lockIcon: { fontSize: 18 },
  editIcon: { fontSize: 18 },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: { color: "white", fontSize: 26, fontWeight: "300", lineHeight: 30 },

  // Category view
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "white",
    gap: 8,
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  backBtnText: { fontWeight: "600", color: "#374151", fontSize: 13 },
  catTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  newBtnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#111827",
    borderRadius: 10,
  },
  newBtnSmallText: { color: "white", fontWeight: "600", fontSize: 12 },
  catGrid: { padding: 16, gap: 10 },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});

// --- Editor styles ---
const edStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginHorizontal: 8,
  },
  closeBtn: {
    padding: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  saveBtn: { padding: 10, backgroundColor: "#111", borderRadius: 10 },

  mainArea: { flex: 1, overflow: "hidden" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  gridWrapper: {
    backgroundColor: "#F9FAFB",
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cell: { borderWidth: 0.2, borderColor: "#DDD" },

  zoomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#111",
    marginHorizontal: 40,
    marginBottom: 6,
    borderRadius: 20,
    alignSelf: "center",
  },
  zoomBtn: {
    width: 28,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    minWidth: 45,
    textAlign: "center",
  },
  resetZoomBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
  },
  currentColorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },

  drawer: { backgroundColor: "white", borderTopWidth: 1, borderColor: "#F3F4F6" },
  handle: { alignItems: "center", paddingVertical: 10 },
  handleBar: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  handleText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
    fontWeight: "600",
  },
  quickTools: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 10,
    alignItems: "center",
  },
  toolIcon: {
    width: 46,
    height: 46,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toolIconActive: { backgroundColor: "#111" },
  iconText: { fontSize: 22 },
  currentColorPreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#F3F4F6",
  },
  drawerScroll: { paddingBottom: 60, gap: 15, paddingHorizontal: 15 },
  section: { backgroundColor: "#F9FAFB", padding: 15, borderRadius: 15 },
  label: { fontWeight: "bold", marginBottom: 12, color: "#111" },
  subLabel: { fontSize: 12, color: "#6B7280", marginTop: 10, marginBottom: 5 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#E5E7EB",
    borderRadius: 25,
  },
  pillActive: { backgroundColor: "#111" },
  swatch: { width: 38, height: 38, borderRadius: 10 },
  swatchActive: { borderWidth: 3, borderColor: "#111" },
  addBtn: {
    width: 38,
    height: 38,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  svSquare: {
    height: 180,
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  marker: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: "white",
  },
  clearBtn: {
    padding: 18,
    backgroundColor: "#FEF2F2",
    borderRadius: 15,
    alignItems: "center",
  },
  clearText: { color: "#EF4444", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalBox: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBtns: { flexDirection: "row", gap: 12 },
  modalBtnCancel: {
    flex: 1,
    padding: 14,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnCancelText: { fontWeight: "600", color: "#374151" },
  modalBtnConfirm: {
    flex: 1,
    padding: 14,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnConfirmText: { fontWeight: "600", color: "white" },
});