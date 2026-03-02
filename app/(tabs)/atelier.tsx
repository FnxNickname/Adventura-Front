import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
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
import { LinearGradient } from 'expo-linear-gradient';

// ===== Types & Constants =====
type Tool = "brush" | "eraser" | "eyedropper" | "bucket";
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===== Helpers =====
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

function floodFill(pixels: string[], size: number, startIndex: number, newColor: string) {
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gridSize, setGridSize] = useState(24);
  const [pixels, setPixels] = useState(() => createGrid(24));
  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(1);
  const [color, setColor] = useState("#FF6B00");
  
  const [h, setH] = useState(20);
  const [sv, setSV] = useState({ s: 1, v: 1 });
  const [palette, setPalette] = useState<string[]>(["#FF6B00", "#111827", "#22C55E", "#3B82F6", "#EF4444", "#FFFFFF"]);

  // Pour gérer la hauteur dynamique de la zone de dessin
  const [mainAreaHeight, setMainAreaHeight] = useState(0);

  useEffect(() => {
    const hex = hsvToHex(h, sv.s, sv.v);
    setColor(hex);
  }, [h, sv]);

  useEffect(() => {
    const timer = setTimeout(() => measureGrid(), 500);
    return () => clearTimeout(timer);
  }, [isFullscreen, isDrawerOpen, mainAreaHeight]);

  const cellSize = useMemo(() => {
    // On utilise soit la largeur de l'écran, soit la hauteur disponible (la plus petite des deux)
    const padding = isFullscreen ? 40 : 60;
    const availableSize = Math.min(SCREEN_WIDTH - padding, mainAreaHeight - padding);
    
    if (availableSize <= 0) return 10; // Valeur de repli sécurisée

    const baseSize = Math.floor(availableSize / gridSize);
    return clamp(baseSize, 4, 30);
  }, [gridSize, isFullscreen, mainAreaHeight]);

  const gridRef = useRef<View>(null);
  const [gridAbs, setGridAbs] = useState({ x: 0, y: 0 });

  const measureGrid = () => {
    gridRef.current?.measureInWindow((x, y) => {
        if (x !== 0 || y !== 0) setGridAbs({ x, y });
    });
  };

  const paintAt = (pageX: number, pageY: number) => {
    const localX = pageX - gridAbs.x;
    const localY = pageY - gridAbs.y;
    const col = Math.floor(localX / cellSize);
    const row = Math.floor(localY / cellSize);

    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      const index = row * gridSize + col;
      if (tool === "eyedropper") {
        setColor(pixels[index]);
        return;
      }
      if (tool === "bucket") {
        setPixels(prev => floodFill(prev, gridSize, index, color));
        return;
      }
      const c = tool === "eraser" ? "#FFFFFF" : color;
      setPixels(prev => paintSquare(prev, gridSize, index, c, brushSize));
    }
  };

  const panGrid = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => paintAt(e.nativeEvent.pageX, e.nativeEvent.pageY),
    onPanResponderMove: (e) => {
        if (tool !== "bucket") paintAt(e.nativeEvent.pageX, e.nativeEvent.pageY);
    },
  }), [gridAbs, cellSize, gridSize, tool, brushSize, color, pixels]);

  const renderGrid = () => (
    <View 
      ref={gridRef} 
      onLayout={measureGrid}
      style={[
        styles.gridWrapper, 
        { width: gridSize * cellSize, height: gridSize * cellSize },
        isFullscreen && styles.gridFullscreenBorder
      ]}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", width: gridSize * cellSize }}>
        {pixels.map((c, i) => <View key={i} style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: c }]} />)}
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-only" {...panGrid.panHandlers} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.container}>
          
          {!isFullscreen && (
            <View style={styles.header}>
              <Text style={styles.title}>Atelier Pixel</Text>
              <View style={styles.headerBtns}>
                <Pressable style={styles.fullscreenBtn} onPress={() => setIsFullscreen(true)}>
                   <Text style={{fontSize: 18}}>⤢</Text>
                </Pressable>
                <Pressable style={styles.closeBtn} onPress={onCancel}><Text>Annuler</Text></Pressable>
                <Pressable style={styles.saveBtn} onPress={() => onSaveDraft({ pixels, gridSize })}><Text style={{color:'white'}}>Sauver</Text></Pressable>
              </View>
            </View>
          )}

          {/* Zone Grille : On mesure sa hauteur pour adapter la grille */}
          <View 
            style={[styles.mainArea, isFullscreen && styles.fullscreenOverlay]}
            onLayout={(e) => setMainAreaHeight(e.nativeEvent.layout.height)}
          >
              {isFullscreen && (
                <View style={styles.headerFullscreen}>
                    <View style={styles.colorBadgeFullscreen}>
                        <View style={[styles.miniSwatch, { backgroundColor: color }]} />
                        <Text style={styles.colorTextFullscreen}>{color}</Text>
                    </View>
                    <Pressable style={styles.closeFullscreen} onPress={() => setIsFullscreen(false)}>
                        <Text style={{color: 'white', fontWeight: 'bold'}}>Quitter</Text>
                    </Pressable>
                </View>
              )}

              <View style={styles.centerContainer}>
                  {mainAreaHeight > 0 && renderGrid()}
              </View>

              {isFullscreen && (
                <View style={styles.floatingToolBar}>
                    <Pressable onPress={() => setTool("brush")} style={[styles.floatingToolBtn, tool === "brush" && styles.floatingToolBtnActive]}>
                        <Text style={styles.floatingIcon}>🖌</Text>
                    </Pressable>
                    <Pressable onPress={() => setTool("eraser")} style={[styles.floatingToolBtn, tool === "eraser" && styles.floatingToolBtnActive]}>
                        <Text style={styles.floatingIcon}>🩹</Text>
                    </Pressable>
                    <Pressable onPress={() => setTool("bucket")} style={[styles.floatingToolBtn, tool === "bucket" && styles.floatingToolBtnActive]}>
                        <Text style={styles.floatingIcon}>🪣</Text>
                    </Pressable>
                    <Pressable onPress={() => setTool("eyedropper")} style={[styles.floatingToolBtn, tool === "eyedropper" && styles.floatingToolBtnActive]}>
                        <Text style={styles.floatingIcon}>🧪</Text>
                    </Pressable>
                    <View style={styles.divider} />
                    <View style={[styles.currentColorCircle, { backgroundColor: color }]} />
                </View>
              )}
          </View>

          {!isFullscreen && (
            <View style={[styles.drawer, isDrawerOpen && { flex: 1.8 }]}>
                <Pressable style={styles.handle} onPress={() => setIsDrawerOpen(!isDrawerOpen)}>
                <View style={styles.handleBar} />
                <Text style={styles.handleText}>{isDrawerOpen ? "Réduire" : "Outils & Couleurs"}</Text>
                </Pressable>

                <View style={styles.quickTools}>
                <ToolIcon label="🖌" active={tool === "brush"} onPress={() => setTool("brush")} />
                <ToolIcon label="🩹" active={tool === "eraser"} onPress={() => setTool("eraser")} />
                <ToolIcon label="🪣" active={tool === "bucket"} onPress={() => setTool("bucket")} />
                <ToolIcon label="🧪" active={tool === "eyedropper"} onPress={() => setTool("eyedropper")} />
                <View style={[styles.currentColorPreview, { backgroundColor: color }]} />
                </View>

                {isDrawerOpen && (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.drawerScroll}>
                    <View style={styles.section}>
                        <Text style={styles.label}>Sélecteur de Couleur</Text>
                        <SVSquare hue={h} s={sv.s} v={sv.v} onChange={setSV} />
                        <Text style={styles.subLabel}>Teinte : {Math.round(h)}°</Text>
                        <Slider style={{width: '100%', height: 40}} minimumValue={0} maximumValue={360} value={h} onValueChange={setH} minimumTrackTintColor="#111" />
                    </View>
                    <View style={styles.section}>
                        <Text style={styles.label}>Palette</Text>
                        <View style={styles.row}>
                            {palette.map((p, i) => (
                            <Pressable key={i} onPress={() => setColor(p)} style={[styles.swatch, { backgroundColor: p }, color === p && styles.swatchActive]} />
                            ))}
                            <Pressable style={styles.addBtn} onPress={() => setPalette([color, ...palette].slice(0, 12))}><Text>+</Text></Pressable>
                        </View>
                    </View>
                    <View style={styles.section}>
                        <Text style={styles.label}>Taille de la Grille</Text>
                        <View style={styles.row}>
                            {[16, 24, 32, 48, 64].map(s => (
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
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SVSquare({ hue, s, v, onChange }: any) {
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const ref = useRef<View>(null);
  const handleTouch = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    onChange({ s: clamp(locationX / dims.w, 0, 1), v: clamp(1 - (locationY / dims.h), 0, 1) });
  };
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => handleTouch(e),
    onPanResponderMove: (e) => handleTouch(e),
  }), [dims]);
  return (
    <View ref={ref} onLayout={(e) => setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} style={styles.svSquare} {...pan.panHandlers}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: hsvToHex(hue, 1, 1) }]} />
      <LinearGradient colors={['#ffffff', 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', '#000000']} start={{x: 0, y: 0}} end={{x: 0, y: 1}} style={StyleSheet.absoluteFill} />
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
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: 15 },
  headerBtns: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: "bold" },
  fullscreenBtn: { padding: 8, backgroundColor: "#E5E7EB", borderRadius: 10, width: 40, alignItems: 'center' },
  closeBtn: { padding: 10, backgroundColor: "#F3F4F6", borderRadius: 10 },
  saveBtn: { padding: 10, backgroundColor: "#111", borderRadius: 10 },
  
  // Zone principale flexible
  mainArea: { flex: 1, overflow: 'hidden' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  gridWrapper: { backgroundColor: "#F9FAFB", borderRadius: 15, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB" },
  gridFullscreenBorder: { borderWidth: 2, borderColor: '#111' },
  cell: { borderWidth: 0.2, borderColor: "#DDD" },

  drawer: { backgroundColor: "white", borderTopWidth: 1, borderColor: "#F3F4F6" },
  handle: { alignItems: "center", paddingVertical: 10 },
  handleBar: { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  handleText: { fontSize: 10, color: "#9CA3AF", marginTop: 4, fontWeight: '600' },
  quickTools: { flexDirection: "row", justifyContent: "space-around", paddingBottom: 10, alignItems: "center" },
  toolIcon: { width: 46, height: 46, backgroundColor: "#F3F4F6", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  toolIconActive: { backgroundColor: "#111" },
  iconText: { fontSize: 22 },
  currentColorPreview: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: "#F3F4F6" },
  drawerScroll: { paddingBottom: 60, gap: 15, paddingHorizontal: 15 },
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
  marker: { position: "absolute", width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: "white" },
  clearBtn: { padding: 18, backgroundColor: "#FEF2F2", borderRadius: 15, alignItems: "center" },
  clearText: { color: "#EF4444", fontWeight: "bold" },
  
  // Fullscreen Styles
  fullscreenOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'white', zIndex: 1000, padding: 15 },
  headerFullscreen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeFullscreen: { paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#111', borderRadius: 20 },
  colorBadgeFullscreen: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 8, borderRadius: 15, gap: 8 },
  miniSwatch: { width: 16, height: 16, borderRadius: 4 },
  colorTextFullscreen: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  
  // Floating Toolbar
  floatingToolBar: { 
    position: 'absolute', 
    bottom: 50, 
    alignSelf: 'center',
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    padding: 10, 
    borderRadius: 30, 
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 1100
  },
  floatingToolBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
  floatingToolBtnActive: { backgroundColor: '#E5E7EB' },
  floatingIcon: { fontSize: 22 },
  divider: { width: 1, height: 25, backgroundColor: '#E5E7EB' },
  currentColorCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'white' }
});