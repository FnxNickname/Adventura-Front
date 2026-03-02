import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import Slider from "@react-native-community/slider";
import { LinearGradient } from 'expo-linear-gradient'; // Indispensable pour le carré de couleur

// ===== Types & Constants =====
type Status = "published" | "pending" | "draft" | "removed";
type Tool = "brush" | "eraser" | "eyedropper" | "bucket";

const PALETTE_KEY = "adventura_palette_v4";

// ===== Helpers (Color Math) =====
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hsvToHex(h: number, s: number, v: number) {
  const c = v * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = v - c;
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

function createGrid(size: number) {
  return Array.from({ length: size * size }, () => "#FFFFFF");
}

function paintSquare(colors: string[], size: number, index: number, color: string, brushSize: number) {
  const next = [...colors];
  const row = Math.floor(index / size);
  const col = index % size;
  const half = Math.floor(brushSize / 2);
  for (let dr = -half; dr < -half + brushSize; dr++) {
    for (let dc = -half; dc < -half + brushSize; dc++) {
      const r = row + dr; const c = col + dc;
      if (r >= 0 && r < size && c >= 0 && c < size) next[r * size + c] = color;
    }
  }
  return next;
}

// ===== Main Editor Component =====
export default function PixelEditor({ onCancel, onSaveDraft }: any) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [gridSize, setGridSize] = useState(24);
  const [pixels, setPixels] = useState(() => createGrid(24));
  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(1);
  const [color, setColor] = useState("#FF6B00");
  
  // États de la couleur HSV
  const [h, setH] = useState(20);
  const [sv, setSV] = useState({ s: 1, v: 1 });
  
  const [palette, setPalette] = useState<string[]>(["#FF6B00", "#111827", "#22C55E", "#3B82F6", "#EF4444", "#FFFFFF"]);

  // Synchronisation de la couleur finale
  useEffect(() => {
    const hex = hsvToHex(h, sv.s, sv.v);
    setColor(hex);
  }, [h, sv]);

  const cellSize = useMemo(() => clamp(Math.round(22 * (24 / gridSize)), 8, 22), [gridSize]);

  // Touch logic pour la grille
  const gridRef = useRef<View>(null);
  const [gridAbs, setGridAbs] = useState({ x: 0, y: 0 });
  const [scroll, setScroll] = useState({ x: 0, y: 0 });

  const paintAt = (pageX: number, pageY: number) => {
    const localX = pageX - gridAbs.x + scroll.x;
    const localY = pageY - gridAbs.y + scroll.y;
    const col = Math.floor(localX / cellSize);
    const row = Math.floor(localY / cellSize);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      const index = row * gridSize + col;
      if (tool === "eyedropper") {
        const picked = pixels[index];
        setColor(picked);
        // Note: Idéalement il faudrait convertir le HEX picked en HSV ici
      } else {
        const c = tool === "eraser" ? "#FFFFFF" : color;
        setPixels(prev => paintSquare(prev, gridSize, index, c, brushSize));
      }
    }
  };

  const panGrid = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => paintAt(e.nativeEvent.pageX, e.nativeEvent.pageY),
    onPanResponderMove: (e) => paintAt(e.nativeEvent.pageX, e.nativeEvent.pageY),
  }), [gridAbs, scroll, cellSize, gridSize, tool, brushSize, color, pixels]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Atelier Pixel</Text>
            <View style={styles.headerBtns}>
              <Pressable style={styles.closeBtn} onPress={onCancel}><Text>Annuler</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={() => onSaveDraft({ pixels, gridSize })}><Text style={{color:'white'}}>Sauver</Text></Pressable>
            </View>
          </View>

          {/* Grille */}
          <View 
            ref={gridRef} 
            onLayout={() => gridRef.current?.measureInWindow((x, y) => setGridAbs({ x, y }))}
            style={[styles.gridWrapper, isDrawerOpen ? { height: 180 } : { flex: 1 }]}
          >
            <ScrollView horizontal onScroll={(e) => setScroll(s => ({...s, x: e.nativeEvent.contentOffset.x}))} scrollEventThrottle={16}>
              <ScrollView onScroll={(e) => setScroll(s => ({...s, y: e.nativeEvent.contentOffset.y}))} scrollEventThrottle={16}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", width: gridSize * cellSize }}>
                  {pixels.map((c, i) => <View key={i} style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: c }]} />)}
                </View>
              </ScrollView>
            </ScrollView>
            <View style={StyleSheet.absoluteFill} pointerEvents="box-only" {...panGrid.panHandlers} />
          </View>

          {/* Drawer Menu */}
          <View style={[styles.drawer, isDrawerOpen && { flex: 1.8 }]}>
            <Pressable style={styles.handle} onPress={() => setIsDrawerOpen(!isDrawerOpen)}>
              <View style={styles.handleBar} />
              <Text style={styles.handleText}>{isDrawerOpen ? "Réduire" : "Outils & Couleurs"}</Text>
            </Pressable>

            <View style={styles.quickTools}>
              <ToolIcon label="🖌" active={tool === "brush"} onPress={() => setTool("brush")} />
              <ToolIcon label="🩹" active={tool === "eraser"} onPress={() => setTool("eraser")} />
              <ToolIcon label="🧪" active={tool === "eyedropper"} onPress={() => setTool("eyedropper")} />
              <View style={[styles.currentColorPreview, { backgroundColor: color }]} />
            </View>

            {isDrawerOpen && (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.drawerScroll}>
                
                {/* Sélecteur de couleur visuel */}
                <View style={styles.section}>
                  <Text style={styles.label}>Sélecteur de Couleur</Text>
                  
                  <SVSquare hue={h} s={sv.s} v={sv.v} onChange={setSV} />

                  <Text style={styles.subLabel}>Teinte : {Math.round(h)}°</Text>
                  <Slider 
                    style={{width: '100%', height: 40}}
                    minimumValue={0} 
                    maximumValue={360} 
                    value={h} 
                    onValueChange={setH} 
                    minimumTrackTintColor="#111"
                  />
                </View>

                {/* Palette */}
                <View style={styles.section}>
                  <Text style={styles.label}>Palette</Text>
                  <View style={styles.row}>
                    {palette.map((p, i) => (
                      <Pressable key={i} onPress={() => setColor(p)} style={[styles.swatch, { backgroundColor: p }, color === p && styles.swatchActive]} />
                    ))}
                    <Pressable style={styles.addBtn} onPress={() => setPalette([color, ...palette].slice(0, 12))}><Text>+</Text></Pressable>
                  </View>
                </View>

                {/* Taille Grille */}
                <View style={styles.section}>
                  <Text style={styles.label}>Grille</Text>
                  <View style={styles.row}>
                    {[16, 24, 32].map(s => (
                      <Pressable key={s} onPress={() => { setGridSize(s); setPixels(createGrid(s)); }} style={[styles.pill, gridSize === s && styles.pillActive]}>
                        <Text style={gridSize === s && {color: 'white'}}>{s}x{s}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable style={styles.clearBtn} onPress={() => setPixels(createGrid(gridSize))}>
                  <Text style={styles.clearText}>Réinitialiser le dessin</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Composant Sélecteur de Saturation / Luminosité
function SVSquare({ hue, s, v, onChange }: any) {
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const ref = useRef<View>(null);

  const handleTouch = (e: any) => {
    // Utilisation de locationX/Y pour éviter les décalages de coordonnées globales
    const { locationX, locationY } = e.nativeEvent;
    const sat = clamp(locationX / dims.w, 0, 1);
    const val = clamp(1 - (locationY / dims.h), 0, 1);
    onChange({ s: sat, v: val });
  };

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => handleTouch(e),
    onPanResponderMove: (e) => handleTouch(e),
  }), [dims]);

  return (
    <View 
      ref={ref}
      onLayout={(e) => setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={styles.svSquare}
      {...pan.panHandlers}
    >
      {/* 1. La teinte de base choisie par le slider */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: hsvToHex(hue, 1, 1) }]} />
      
      {/* 2. Le dégradé horizontal Blanc -> Transparent (Saturation) */}
      <LinearGradient 
        colors={['#ffffff', 'transparent']} 
        start={{x: 0, y: 0}} 
        end={{x: 1, y: 0}} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* 3. Le dégradé vertical Transparent -> Noir (Luminosité/Valeur) */}
      <LinearGradient 
        colors={['transparent', '#000000']} 
        start={{x: 0, y: 0}} 
        end={{x: 0, y: 1}} 
        style={StyleSheet.absoluteFill} 
      />
      
      {/* Curseur */}
      <View style={[styles.marker, { left: dims.w * s - 12, top: dims.h * (1 - v) - 12 }]} />
    </View>
  );
}

function ToolIcon({ label, active, onPress }: any) {
  return (
    <Pressable style={[styles.toolIcon, active && styles.toolIconActive]} onPress={onPress}>
      <Text style={styles.iconText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  container: { flex: 1, paddingHorizontal: 15 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  headerBtns: { flexDirection: 'row', gap: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
  closeBtn: { padding: 10, backgroundColor: "#F3F4F6", borderRadius: 10 },
  saveBtn: { padding: 10, backgroundColor: "#111", borderRadius: 10 },
  gridWrapper: { backgroundColor: "#F9FAFB", borderRadius: 15, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" },
  cell: { borderWidth: 0.2, borderColor: "#DDD" },
  
  drawer: { backgroundColor: "white", borderTopWidth: 1, borderColor: "#F3F4F6", marginTop: 5 },
  handle: { alignItems: "center", paddingVertical: 10 },
  handleBar: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  handleText: { fontSize: 10, color: "#9CA3AF", marginTop: 4, fontWeight: '600' },
  quickTools: { flexDirection: "row", justifyContent: "space-around", paddingBottom: 10, alignItems: "center" },
  toolIcon: { width: 50, height: 50, backgroundColor: "#F3F4F6", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  toolIconActive: { backgroundColor: "#111" },
  iconText: { fontSize: 22 },
  currentColorPreview: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: "#F3F4F6" },
  
  drawerScroll: { paddingBottom: 60, gap: 15 },
  section: { backgroundColor: "#F9FAFB", padding: 15, borderRadius: 15 },
  label: { fontWeight: "bold", marginBottom: 12, color: "#111" },
  subLabel: { fontSize: 12, color: "#6B7280", marginTop: 10, marginBottom: 5 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  pill: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: "#E5E7EB", borderRadius: 25 },
  pillActive: { backgroundColor: "#111" },
  swatch: { width: 38, height: 38, borderRadius: 10 },
  swatchActive: { borderWidth: 3, borderColor: "#111" },
  addBtn: { width: 38, height: 38, backgroundColor: "#E5E7EB", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  
  svSquare: { height: 180, borderRadius: 15, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: '#EEE' },
  marker: { position: "absolute", width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
  
  clearBtn: { padding: 18, backgroundColor: "#FEF2F2", borderRadius: 15, alignItems: "center" },
  clearText: { color: "#EF4444", fontWeight: "bold" }
});