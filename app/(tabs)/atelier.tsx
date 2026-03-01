import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Status = "published" | "pending" | "draft" | "removed";
type Tool = "brush" | "eraser" | "eyedropper";

type Creation = {
  id: string;
  title: string;
  theme: string;
  status: Status;
  updatedAtISO: string;
  size: number; // grid size NxN
  preview?: string[]; // flattened preview colors (optional)
};

const STATUS_TABS: { key: Status; label: string }[] = [
  { key: "published", label: "Pub" },
  { key: "pending", label: "Att" },
  { key: "draft", label: "Draft" },
  { key: "removed", label: "Sup" },
];

const STATUS_BADGE: Record<Status, { label: string }> = {
  published: { label: "Publié" },
  pending: { label: "En attente" },
  draft: { label: "Brouillon" },
  removed: { label: "Supprimé" },
};

// ===== Helpers =====
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeHex(input: string): string | null {
  const s = input.trim();
  const raw = s.startsWith("#") ? s.slice(1) : s;
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return "#" + raw.toUpperCase();
}

function createGrid(size: number, fill = "#FFFFFF") {
  return Array.from({ length: size * size }, () => fill);
}

function paintSquare(
  colors: string[],
  size: number,
  index: number,
  color: string,
  brushSize: number
) {
  const next = colors.slice();
  const row = Math.floor(index / size);
  const col = index % size;

  const half = Math.floor(brushSize / 2);
  for (let dr = -half; dr < -half + brushSize; dr++) {
    for (let dc = -half; dc < -half + brushSize; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= size || c < 0 || c >= size) continue;
      next[r * size + c] = color;
    }
  }
  return next;
}

// ===== Main Screen =====
export default function AtelierScreen() {
  const [mode, setMode] = useState<"list" | "editor">("list");
  const [status, setStatus] = useState<Status>("draft");

  // Mock data (à remplacer par backend plus tard)
  const [creations, setCreations] = useState<Creation[]>([
    {
      id: "c1",
      title: "Trésor du Jardin",
      theme: "Nature",
      status: "draft",
      updatedAtISO: new Date().toISOString(),
      size: 24,
    },
    {
      id: "c2",
      title: "Relique Romane",
      theme: "Histoire",
      status: "pending",
      updatedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      size: 32,
    },
    {
      id: "c3",
      title: "Gemme Épique",
      theme: "Gastronomie",
      status: "published",
      updatedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      size: 16,
    },
    {
      id: "c4",
      title: "Objet supprimé",
      theme: "Nature",
      status: "removed",
      updatedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      size: 16,
    },
  ]);

  const filtered = useMemo(
    () => creations.filter((c) => c.status === status),
    [creations, status]
  );

  const openCreate = () => setMode("editor");

  const onSaveDraft = (payload: {
    title: string;
    theme: string;
    size: number;
    pixels: string[];
  }) => {
    const newItem: Creation = {
      id: "c" + Math.random().toString(16).slice(2),
      title: payload.title || "Nouveau challenge",
      theme: payload.theme || "Sans thème",
      status: "draft",
      updatedAtISO: new Date().toISOString(),
      size: payload.size,
      preview: payload.pixels.slice(0, Math.min(payload.pixels.length, 64)),
    };
    setCreations((prev) => [newItem, ...prev]);
    setStatus("draft");
    setMode("list");
  };

  if (mode === "editor") {
    return (
      <PixelEditor onCancel={() => setMode("list")} onSaveDraft={onSaveDraft} />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Atelier</Text>

        <Pressable style={styles.primaryBtn} onPress={openCreate}>
          <Text style={styles.primaryBtnText}>+ Créer</Text>
        </Pressable>
      </View>

      {/* tabs compactes */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.tabsRow}
      >
        {STATUS_TABS.map((t) => {
          const active = t.key === status;
          return (
            <Pressable
              key={t.key}
              onPress={() => setStatus(t.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Aucune création dans cette catégorie.
            </Text>
            <Pressable style={styles.secondaryBtn} onPress={openCreate}>
              <Text style={styles.secondaryBtnText}>Créer un challenge</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <CreationCard
            creation={item}
            onOpen={() =>
              Alert.alert(
                "À venir",
                "Ouverture / édition d’un challenge existant (bientôt)."
              )
            }
          />
        )}
      />
    </View>
  );
}

// ===== Creation Card =====
function CreationCard({
  creation,
  onOpen,
}: {
  creation: Creation;
  onOpen: () => void;
}) {
  const date = new Date(creation.updatedAtISO);
  const dateStr = `${date.toLocaleDateString()} • ${date.toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" }
  )}`;

  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={{ flex: 1 }}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {creation.title}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {STATUS_BADGE[creation.status].label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardMeta} numberOfLines={1}>
          {creation.theme} • {creation.size}×{creation.size} • {dateStr}
        </Text>
      </View>
    </Pressable>
  );
}

// ===== Pixel Editor (canvas-first + fullscreen) =====
function PixelEditor({
  onCancel,
  onSaveDraft,
}: {
  onCancel: () => void;
  onSaveDraft: (payload: {
    title: string;
    theme: string;
    size: number;
    pixels: string[];
  }) => void;
}) {
  const [title, setTitle] = useState("Nouveau challenge");
  const [theme, setTheme] = useState("Nature");

  const [gridSize, setGridSize] = useState<number>(24);
  const [pixels, setPixels] = useState<string[]>(() => createGrid(24));

  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState<number>(1);

  const [hexInput, setHexInput] = useState("#FF6B00");
  const [color, setColor] = useState<string>("#FF6B00");

  const [isFullscreen, setIsFullscreen] = useState(false);

  const cellSize = useMemo(() => {
    const base = 22;
    const scale = 24 / gridSize;
    return clamp(Math.round(base * scale), 7, 22);
  }, [gridSize]);

  const applyGridSize = (size: number) => {
    setGridSize(size);
    setPixels(createGrid(size));
  };

  const applyHex = () => {
    const normalized = normalizeHex(hexInput);
    if (!normalized) {
      Alert.alert("Couleur invalide", "Utilise un code hex du type #RRGGBB.");
      return;
    }
    setColor(normalized);
    setHexInput(normalized);
  };

  const onPressCell = (index: number) => {
    if (tool === "eyedropper") {
      const picked = pixels[index];
      setColor(picked);
      setHexInput(picked);
      return;
    }
    const nextColor = tool === "eraser" ? "#FFFFFF" : color;
    setPixels((prev) => paintSquare(prev, gridSize, index, nextColor, brushSize));
  };

  const clearGrid = () => {
    Alert.alert("Vider la grille ?", "Cette action efface tout.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Vider",
        style: "destructive",
        onPress: () => setPixels(createGrid(gridSize)),
      },
    ]);
  };

  const saveDraft = () => {
    onSaveDraft({
      title,
      theme,
      size: gridSize,
      pixels,
    });
  };

  // ===== Fullscreen mode (grid only + floating toolbar) =====
  if (isFullscreen) {
    return (
      <View style={styles.fullscreenContainer}>
        <Pressable style={styles.fabExit} onPress={() => setIsFullscreen(false)}>
          <Text style={styles.fabExitText}>✕</Text>
        </Pressable>

        <View style={styles.fabBar}>
          <ToolButton label="🖌" active={tool === "brush"} onPress={() => setTool("brush")} />
          <ToolButton label="🩹" active={tool === "eraser"} onPress={() => setTool("eraser")} />
          <ToolButton label="🧪" active={tool === "eyedropper"} onPress={() => setTool("eyedropper")} />
          <View style={[styles.colorSwatch, { backgroundColor: color }]} />
        </View>

        <View style={styles.gridFullscreen}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                width: gridSize * cellSize,
                flexDirection: "row",
                flexWrap: "wrap",
              }}
            >
              {pixels.map((c, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => onPressCell(idx)}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize, backgroundColor: c },
                  ]}
                />
              ))}
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ===== Normal editor =====
  return (
    <View style={styles.editorScreen}>
      {/* Top bar */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Créer</Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            style={styles.secondaryBtnSmall}
            onPress={() => setIsFullscreen(true)}
          >
            <Text style={styles.secondaryBtnText}>Plein écran</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtnSmall} onPress={onCancel}>
            <Text style={styles.secondaryBtnText}>Annuler</Text>
          </Pressable>

          <Pressable style={styles.primaryBtn} onPress={saveDraft}>
            <Text style={styles.primaryBtnText}>Enregistrer</Text>
          </Pressable>
        </View>
      </View>

      {/* Meta minimal */}
      <View style={styles.formRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Nom du challenge"
            style={styles.input}
          />
        </View>
        <View style={{ width: 140 }}>
          <Text style={styles.label}>Thème</Text>
          <TextInput
            value={theme}
            onChangeText={setTheme}
            placeholder="Nature, Histoire..."
            style={styles.input}
          />
        </View>
      </View>

      {/* Canvas-first layout */}
      <View style={{ flex: 1 }}>
        {/* Grid full */}
        <View style={styles.gridFull}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                width: gridSize * cellSize,
                flexDirection: "row",
                flexWrap: "wrap",
              }}
            >
              {pixels.map((c, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => onPressCell(idx)}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize, backgroundColor: c },
                  ]}
                />
              ))}
            </ScrollView>
          </ScrollView>
        </View>

        {/* Bottom drawer */}
        <ToolsDrawer
          tool={tool}
          setTool={setTool}
          gridSize={gridSize}
          applyGridSize={applyGridSize}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          color={color}
          setColor={setColor}
          hexInput={hexInput}
          setHexInput={setHexInput}
          applyHex={applyHex}
          clearGrid={clearGrid}
          onFullscreen={() => setIsFullscreen(true)}
        />
      </View>
    </View>
  );
}

// ===== Tools Drawer =====
function ToolsDrawer(props: {
  tool: Tool;
  setTool: (t: Tool) => void;
  gridSize: number;
  applyGridSize: (s: number) => void;
  brushSize: number;
  setBrushSize: (n: number) => void;
  color: string;
  setColor: (c: string) => void;
  hexInput: string;
  setHexInput: (s: string) => void;
  applyHex: () => void;
  clearGrid: () => void;
  onFullscreen: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.drawer}>
      <Pressable style={styles.drawerHandle} onPress={() => setOpen(!open)}>
        <View style={styles.drawerPill} />
        <Text style={styles.drawerTitle}>
          {open ? "Outils" : "Outils (toucher pour ouvrir)"}
        </Text>
      </Pressable>

      {/* Quick bar (toujours visible) */}
      <View style={styles.toolsRow}>
        <ToolButton
          label="Pinceau"
          active={props.tool === "brush"}
          onPress={() => props.setTool("brush")}
        />
        <ToolButton
          label="Gomme"
          active={props.tool === "eraser"}
          onPress={() => props.setTool("eraser")}
        />
        <ToolButton
          label="Pipette"
          active={props.tool === "eyedropper"}
          onPress={() => props.setTool("eyedropper")}
        />

        <Pressable style={styles.secondaryBtnSmall} onPress={props.onFullscreen}>
          <Text style={styles.secondaryBtnText}>⤢</Text>
        </Pressable>

        <Pressable style={styles.dangerBtn} onPress={props.clearGrid}>
          <Text style={styles.dangerBtnText}>Vider</Text>
        </Pressable>
      </View>

      {/* Advanced options */}
      {open && (
        <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: 10 }}>
          <View style={styles.settingBlock}>
            <Text style={styles.label}>Grille</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {[16, 24, 32, 48].map((s) => {
                const active = props.gridSize === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => props.applyGridSize(s)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {s}×{s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.settingBlock}>
            <Text style={styles.label}>Taille pinceau</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 2, 3].map((n) => {
                const active = props.brushSize === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => props.setBrushSize(n)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.settingBlock}>
            <Text style={styles.label}>Couleur (HEX)</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <View style={[styles.colorSwatch, { backgroundColor: props.color }]} />
              <TextInput
                value={props.hexInput}
                onChangeText={props.setHexInput}
                placeholder="#RRGGBB"
                autoCapitalize="characters"
                style={[styles.input, { flex: 1 }]}
              />
              <Pressable style={styles.secondaryBtnSmall} onPress={props.applyHex}>
                <Text style={styles.secondaryBtnText}>OK</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.hint}>
            Astuce : sélectionne la pipette puis touche un pixel pour récupérer sa couleur.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

function ToolButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.toolBtn, active && styles.toolBtnActive]} onPress={onPress}>
      <Text style={[styles.toolBtnText, active && styles.toolBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  // General screens
  screen: { flex: 1, padding: 16, gap: 12 },
  editorScreen: { flex: 1, padding: 16, gap: 12 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "700" },

  // Buttons
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  primaryBtnText: { color: "white", fontWeight: "700" },

  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  secondaryBtnSmall: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  secondaryBtnText: { color: "#111827", fontWeight: "700" },

  // Tabs (compact chips)
  tabsRow: { gap: 8, paddingVertical: 4, alignItems: "center" },
  tab: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    minWidth: 56,
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#111827" },
  tabText: { color: "#111827", fontWeight: "800", fontSize: 12 },
  tabTextActive: { color: "white" },

  // List card
  card: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { flex: 1, fontWeight: "800", fontSize: 16 },
  cardMeta: { marginTop: 6, color: "#6B7280" },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#111827" },

  empty: { paddingTop: 40, alignItems: "center", gap: 12 },
  emptyText: { color: "#6B7280", textAlign: "center" },

  // Form
  formRow: { flexDirection: "row", gap: 12 },
  label: { fontSize: 12, fontWeight: "800", color: "#374151", marginBottom: 6 },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },

  // Canvas full
  gridFull: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    padding: 10,
  },
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },

  // Drawer
  drawer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
    marginTop: 10,
  },
  drawerHandle: { alignItems: "center", gap: 6, paddingBottom: 8 },
  drawerPill: {
    width: 50,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
  },
  drawerTitle: { fontSize: 12, fontWeight: "800", color: "#6B7280" },

  // Tools
  toolsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  toolBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  toolBtnActive: { backgroundColor: "#111827" },
  toolBtnText: { fontWeight: "800", color: "#111827" },
  toolBtnTextActive: { color: "white" },

  dangerBtn: {
    marginLeft: "auto",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  dangerBtnText: { fontWeight: "900", color: "#991B1B" },

  // Drawer settings
  settingBlock: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  pillActive: { backgroundColor: "#111827" },
  pillText: { fontWeight: "800", color: "#111827" },
  pillTextActive: { color: "white" },

  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  hint: { color: "#6B7280", fontSize: 12 },

  // ===== Fullscreen styles =====
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 12,
  },
  gridFullscreen: {
    flex: 1,
    padding: 12,
  },
  fabExit: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 50,
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  fabExitText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  fabBar: {
    position: "absolute",
    top: 14,
    left: 14,
    zIndex: 50,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
});