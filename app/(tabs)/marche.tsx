import React, { useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// ===== Types =====
type ItemCategory = "cosmetic" | "powerup";
type ItemRarity   = "common" | "rare" | "epic" | "legendary";
type CosmeticTag  = "Avatar" | "Carte";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  price: number;
  category: ItemCategory;
  rarity: ItemRarity;
  inventoryKey?: string;
  tag?: string;
  boostDuration?: string; // ex: "30 min" pour les boosters
}

// ===== Catalogue =====
const SHOP_ITEMS: ShopItem[] = [
  // ── Avatars ──
  { id:"c1",  name:"Avatar Renard",     description:"Un renard espiègle visible par tous sur la carte lors de vos explorations.", emoji:"🦊",  price:300,  category:"cosmetic", rarity:"common",    tag:"Avatar" },
  { id:"c2",  name:"Avatar Dragon",     description:"Un dragon légendaire pour marquer votre territoire sur la carte.",           emoji:"🐉",  price:800,  category:"cosmetic", rarity:"epic",      tag:"Avatar" },
  { id:"c3",  name:"Avatar Sorcier",    description:"Mystérieux et puissant. Les autres explorateurs vous remarqueront.",         emoji:"🧙",  price:500,  category:"cosmetic", rarity:"rare",      tag:"Avatar" },
  { id:"c4",  name:"Avatar Robot",      description:"Futuriste et précis. L'avatar idéal pour les chasseurs high-tech.",          emoji:"🤖",  price:450,  category:"cosmetic", rarity:"rare",      tag:"Avatar" },
  { id:"c5",  name:"Avatar Astronaute", description:"Pour les explorateurs qui ne connaissent pas de limites.",                   emoji:"👨‍🚀", price:600,  category:"cosmetic", rarity:"rare",      tag:"Avatar" },
  { id:"c6",  name:"Avatar Ninja",      description:"Discret, rapide et silencieux. Le chasseur fantôme.",                        emoji:"🥷",  price:550,  category:"cosmetic", rarity:"rare",      tag:"Avatar" },
  { id:"c7",  name:"Avatar Pirate",     description:"Partez à la chasse au trésor comme un vrai pirate des mers.",               emoji:"🏴‍☠️", price:400,  category:"cosmetic", rarity:"common",    tag:"Avatar" },
  { id:"c8",  name:"Aura Légendaire",   description:"Un halo doré entoure votre avatar sur la carte. Réservé aux meilleurs.",    emoji:"👑",  price:2000, category:"cosmetic", rarity:"legendary", tag:"Avatar" },
  // ── Thèmes de carte ──
  { id:"c9",  name:"Carte Parchemin",   description:"Transforme votre carte en vieux parchemin de chasseur de trésors.",          emoji:"🗺️",  price:700,  category:"cosmetic", rarity:"rare",      tag:"Carte" },
  { id:"c10", name:"Carte Nuit",        description:"Mode sombre mystérieux pour votre carte d'exploration.",                     emoji:"🌙",  price:500,  category:"cosmetic", rarity:"rare",      tag:"Carte" },
  { id:"c11", name:"Carte Forêt",       description:"Un thème nature avec des teintes vertes et organiques.",                     emoji:"🌿",  price:400,  category:"cosmetic", rarity:"common",    tag:"Carte" },
  { id:"c12", name:"Carte Pixel",       description:"Un style rétro pixelisé pour les amateurs de jeux vidéo.",                   emoji:"👾",  price:900,  category:"cosmetic", rarity:"epic",      tag:"Carte" },

  // ── Clés d'indices ──
  {
    id:"p1", name:"Clé Bronze",
    description:"Débloque un indice de niveau 1 sur n'importe quel trésor sans perdre de points.\nIndice basique : zone approximative ou thème du trésor.",
    emoji:"🗝️", price:150, category:"powerup", rarity:"common", inventoryKey:"key_bronze", tag:"Indice niv. 1",
  },
  {
    id:"p2", name:"Clé Argent",
    description:"Débloque un indice de niveau 2 sans pénalité de points.\nIndice avancé : description visuelle partielle du trésor et rayon affiné.",
    emoji:"🔑", price:350, category:"powerup", rarity:"rare", inventoryKey:"key_silver", tag:"Indice niv. 2",
  },
  {
    id:"p3", name:"Clé Or",
    description:"Débloque l'indice de niveau 3 — le plus précis — sans perdre un seul point.\nIndice complet : position approximative et description détaillée du trésor.",
    emoji:"✨", price:700, category:"powerup", rarity:"epic", inventoryKey:"key_gold", tag:"Indice niv. 3",
  },

  // ── Boosters de Pièces ──
  {
    id:"p4", name:"Relique Dorée",
    description:"Active un multiplicateur ×2 sur toutes les Pièces gagnées pendant toute votre prochaine expédition, du début à la fin. Activez-la juste avant de démarrer.",
    emoji:"🏺", price:900, category:"powerup", rarity:"epic", inventoryKey:"relic_gold",
    tag:"Boost ×2 Pièces — toute l'expédition",
  },
  {
    id:"p5", name:"Jackpot",
    description:"Booste aléatoirement vos gains de Pièces, de ×1,5 à ×3, pendant 30 minutes. Tentez votre chance !",
    emoji:"🎰", price:400, category:"powerup", rarity:"rare", inventoryKey:"jackpot",
    tag:"Boost ×1,5–3 Pièces", boostDuration:"30 min",
  },
];

// ===== Config rareté =====
const RARITY: Record<ItemRarity, { label:string; color:string; bg:string; border:string }> = {
  common:    { label:"Commun",      color:"#6B7280", bg:"#F3F4F6", border:"#E5E7EB" },
  rare:      { label:"Rare",       color:"#1D4ED8", bg:"#EFF6FF", border:"#BFDBFE" },
  epic:      { label:"Épique",     color:"#7C3AED", bg:"#F5F3FF", border:"#DDD6FE" },
  legendary: { label:"Légendaire", color:"#B45309", bg:"#FFFBEB", border:"#FDE68A" },
};

// ===== État initial =====
const INITIAL_INVENTORY: Record<string, number> = {
  key_bronze: 3, key_silver: 1, key_gold: 0,
  relic_gold: 1, jackpot: 5,
};
const INITIAL_PIECES = 1840;

// ===================================================================
export default function MarcheScreen() {
  const [tab, setTab]                         = useState<ItemCategory>("cosmetic");
  const [cosmeticTag, setCosmeticTag]         = useState<CosmeticTag>("Avatar");
  const [pieces, setPieces]                   = useState(INITIAL_PIECES);
  const [inventory, setInventory]             = useState(INITIAL_INVENTORY);
  const [ownedCosmetics, setOwnedCosmetics]   = useState(new Set<string>());
  const [selectedItem, setSelectedItem]       = useState<ShopItem | null>(null);
  const [confirmModal, setConfirmModal]       = useState(false);
  const [feedback, setFeedback]               = useState<{ visible:boolean; success:boolean; message:string }>({ visible:false, success:true, message:"" });

  const powerupGroups = [
    { title: "🗝️ Clés d'indices", subtitle:"Débloquez des indices sans perdre de points", ids:["p1","p2","p3"] },
    { title: "🪙 Boosters de Pièces", subtitle:"Multipliez vos gains de Pièces en expédition", ids:["p4","p5"] },
  ];

  const filtered = tab === "cosmetic"
    ? SHOP_ITEMS.filter(i => i.category === "cosmetic" && i.tag === cosmeticTag)
    : [];

  const isOwned = (item: ShopItem) =>
    item.category === "cosmetic" && ownedCosmetics.has(item.id);

  const openConfirm = (item: ShopItem) => { setSelectedItem(item); setConfirmModal(true); };
  const cancelBuy   = () => { setConfirmModal(false); setSelectedItem(null); };

  const confirmBuy = () => {
    if (!selectedItem) return;
    setConfirmModal(false);
    if (pieces < selectedItem.price) {
      setFeedback({ visible:true, success:false, message:"Vous n'avez pas assez de Pièces pour cet achat." });
      return;
    }
    setPieces(p => p - selectedItem.price);
    if (selectedItem.category === "cosmetic") {
      setOwnedCosmetics(prev => new Set([...prev, selectedItem.id]));
      setFeedback({ visible:true, success:true, message:`${selectedItem.emoji} "${selectedItem.name}" est maintenant dans votre collection !` });
    } else if (selectedItem.inventoryKey) {
      setInventory(prev => ({ ...prev, [selectedItem.inventoryKey!]: (prev[selectedItem.inventoryKey!] ?? 0) + 1 }));
      const extra = selectedItem.boostDuration
        ? `\n⏱ Durée : ${selectedItem.boostDuration}. Activez-le depuis l'écran d'une expédition.`
        : `\nRetrouvez-le dans votre inventaire dans le Profil.`;
      setFeedback({ visible:true, success:true, message:`${selectedItem.emoji} "${selectedItem.name}" ajouté à votre inventaire !${extra}` });
    }
    setSelectedItem(null);
  };

  const renderCard = (item: ShopItem) => {
    const rar = RARITY[item.rarity];
    const owned = isOwned(item);
    const canAfford = pieces >= item.price;
    return (
      <View key={item.id} style={[s.card, { backgroundColor: rar.bg, borderColor: rar.border }]}>
        <View style={s.cardTopRow}>
          <View style={[s.rarityBadge, { backgroundColor: rar.border }]}>
            <Text style={[s.rarityText, { color: rar.color }]}>{rar.label}</Text>
          </View>
          {item.tag && (
            <View style={s.tagBadge}>
              <Text style={s.tagText}>{item.tag}</Text>
            </View>
          )}
          {item.boostDuration && (
            <View style={[s.tagBadge, { backgroundColor: "#FEF3C7" }]}>
              <Text style={[s.tagText, { color: "#92400E" }]}>⏱ {item.boostDuration}</Text>
            </View>
          )}
        </View>
        <Text style={s.cardEmoji}>{item.emoji}</Text>
        <Text style={s.cardName}>{item.name}</Text>
        <Text style={s.cardDesc}>{item.description}</Text>
        <View style={s.cardFooter}>
          <View style={s.priceRow}>
            <Text style={s.piecesEmojiSm}>🪙</Text>
            <Text style={[s.priceValue, !canAfford && { color:"#EF4444" }]}>{item.price}</Text>
            <Text style={s.priceUnit}> Pièces</Text>
          </View>
          {owned ? (
            <View style={s.ownedBadge}><Text style={s.ownedText}>✓ Possédé</Text></View>
          ) : (
            <Pressable style={[s.buyBtn, !canAfford && s.buyBtnDisabled]} onPress={() => openConfirm(item)} disabled={!canAfford}>
              <Text style={[s.buyBtnText, !canAfford && { color:"#9CA3AF" }]}>
                {canAfford ? "Acheter" : "Insuffisant"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Marché</Text>
          <Text style={s.headerSub}>Dépensez vos Pièces</Text>
        </View>
        <View style={s.piecesBadge}>
          <Text style={s.piecesEmoji}>🪙</Text>
          <Text style={s.piecesValue}>{pieces.toLocaleString("fr-FR")}</Text>
        </View>
      </View>

      {/* Mini-inventaire */}
      <View style={s.keyStrip}>
        <Text style={s.keyStripLabel}>Mon inventaire</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.keyStripRow}>
          {[
            { key:"key_bronze", emoji:"🗝️", label:"Bronze",  color:"#78350F" },
            { key:"key_silver", emoji:"🔑", label:"Argent",  color:"#1E3A5F" },
            { key:"key_gold",   emoji:"✨", label:"Or",      color:"#7C3AED" },
            { key:"relic_gold", emoji:"🏺", label:"Reliques",color:"#B45309" },
            { key:"jackpot",    emoji:"🎰", label:"Jackpots", color:"#064E3B" },
          ].map(k => (
            <View key={k.key} style={s.keyPill}>
              <Text style={s.keyPillEmoji}>{k.emoji}</Text>
              <View>
                <Text style={[s.keyPillCount, { color: k.color }]}>{inventory[k.key] ?? 0}</Text>
                <Text style={s.keyPillLabel}>{k.label}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Onglets */}
      <View style={s.tabs}>
        <Pressable style={[s.tab, tab === "cosmetic" && s.tabActive]} onPress={() => setTab("cosmetic")}>
          <Text style={[s.tabText, tab === "cosmetic" && s.tabTextActive]}>🎨 Cosmétiques</Text>
        </Pressable>
        <Pressable style={[s.tab, tab === "powerup" && s.tabActive]} onPress={() => setTab("powerup")}>
          <Text style={[s.tabText, tab === "powerup" && s.tabTextActive]}>⚡ Power-ups</Text>
        </Pressable>
      </View>

      {/* Sous-onglets cosmétiques */}
      {tab === "cosmetic" && (
        <View style={s.subTabs}>
          {(["Avatar","Carte"] as CosmeticTag[]).map(t => (
            <Pressable key={t} style={[s.subTab, cosmeticTag === t && s.subTabActive]} onPress={() => setCosmeticTag(t)}>
              <Text style={[s.subTabText, cosmeticTag === t && s.subTabTextActive]}>
                {t === "Avatar" ? "👤 Avatars" : "🗺️ Thèmes de carte"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={s.grid}>
        {/* Cosmétiques */}
        {tab === "cosmetic" && filtered.map(renderCard)}

        {/* Power-ups groupés */}
        {tab === "powerup" && powerupGroups.map(group => {
          const groupItems = SHOP_ITEMS.filter(i => group.ids.includes(i.id));
          return (
            <View key={group.title}>
              <View style={s.groupHeader}>
                <Text style={s.groupTitle}>{group.title}</Text>
                <Text style={s.groupSub}>{group.subtitle}</Text>
              </View>
              {groupItems.map(renderCard)}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal confirmation */}
      <Modal transparent animationType="fade" visible={confirmModal} onRequestClose={cancelBuy}>
        <View style={s.overlay}>
          <View style={s.modalBox}>
            {selectedItem && (<>
              <Text style={s.modalEmoji}>{selectedItem.emoji}</Text>
              <Text style={s.modalTitle}>{selectedItem.name}</Text>
              <Text style={s.modalDesc}>{selectedItem.description}</Text>
              <View style={s.modalDivider} />
              {[
                { label:"Prix",            value:`🪙 ${selectedItem.price} Pièces`,     color:"#111827" },
                { label:"Votre solde",     value:`🪙 ${pieces} Pièces`,                  color: pieces >= selectedItem.price ? "#10B981" : "#EF4444" },
                { label:"Solde après",     value:`🪙 ${pieces - selectedItem.price} Pièces`, color:"#6B7280" },
              ].map(r => (
                <View key={r.label} style={s.modalRow}>
                  <Text style={s.modalRowLabel}>{r.label}</Text>
                  <Text style={[s.modalRowValue, { color: r.color }]}>{r.value}</Text>
                </View>
              ))}
              <View style={s.modalBtns}>
                <Pressable style={s.btnCancel} onPress={cancelBuy}><Text style={s.btnCancelText}>Annuler</Text></Pressable>
                <Pressable style={s.btnConfirm} onPress={confirmBuy}><Text style={s.btnConfirmText}>Confirmer</Text></Pressable>
              </View>
            </>)}
          </View>
        </View>
      </Modal>

      {/* Modal feedback */}
      <Modal transparent animationType="fade" visible={feedback.visible} onRequestClose={() => setFeedback(f => ({ ...f, visible:false }))}>
        <View style={s.overlay}>
          <View style={s.feedbackBox}>
            <Text style={s.feedbackIcon}>{feedback.success ? "🎉" : "😕"}</Text>
            <Text style={s.feedbackTitle}>{feedback.success ? "Achat réussi !" : "Impossible"}</Text>
            <Text style={s.feedbackMsg}>{feedback.message}</Text>
            <Pressable style={[s.btnConfirm, { alignSelf:"center", paddingHorizontal:32 }]} onPress={() => setFeedback(f => ({ ...f, visible:false }))}>
              <Text style={s.btnConfirmText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ===== Styles =====
const s = StyleSheet.create({
  safeArea: { flex:1, backgroundColor:"#F9FAFB" },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:20, paddingTop:16, paddingBottom:14 },
  headerTitle: { fontSize:26, fontWeight:"800", color:"#111827" },
  headerSub: { fontSize:13, color:"#9CA3AF", marginTop:2 },
  piecesBadge: { flexDirection:"row", alignItems:"center", gap:6, backgroundColor:"#111827", paddingHorizontal:14, paddingVertical:9, borderRadius:20 },
  piecesEmoji: { fontSize:16 },
  piecesValue: { fontSize:16, fontWeight:"800", color:"#F59E0B" },

  keyStrip: { backgroundColor:"white", borderTopWidth:1, borderBottomWidth:1, borderColor:"#F3F4F6", paddingHorizontal:20, paddingVertical:12 },
  keyStripLabel: { fontSize:11, fontWeight:"700", color:"#9CA3AF", letterSpacing:0.5, marginBottom:8 },
  keyStripRow: { gap:10 },
  keyPill: { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#F9FAFB", borderWidth:1, borderColor:"#E5E7EB", borderRadius:14, paddingHorizontal:14, paddingVertical:8 },
  keyPillEmoji: { fontSize:22 },
  keyPillCount: { fontSize:18, fontWeight:"800", lineHeight:22 },
  keyPillLabel: { fontSize:10, color:"#9CA3AF", fontWeight:"600" },

  tabs: { flexDirection:"row", marginHorizontal:20, marginTop:14, marginBottom:4, backgroundColor:"#F3F4F6", borderRadius:14, padding:4 },
  tab: { flex:1, paddingVertical:10, alignItems:"center", borderRadius:10 },
  tabActive: { backgroundColor:"#111827" },
  tabText: { fontSize:13, fontWeight:"600", color:"#9CA3AF" },
  tabTextActive: { color:"white" },

  subTabs: { flexDirection:"row", marginHorizontal:20, marginVertical:8, gap:8 },
  subTab: { flex:1, paddingVertical:8, alignItems:"center", borderRadius:10, borderWidth:1.5, borderColor:"#E5E7EB", backgroundColor:"white" },
  subTabActive: { backgroundColor:"#EFF6FF", borderColor:"#BFDBFE" },
  subTabText: { fontSize:12, fontWeight:"600", color:"#9CA3AF" },
  subTabTextActive: { color:"#1D4ED8" },

  grid: { paddingHorizontal:20, paddingTop:8, gap:14 },

  groupHeader: { marginTop:8, marginBottom:6 },
  groupTitle: { fontSize:15, fontWeight:"800", color:"#111827" },
  groupSub: { fontSize:12, color:"#9CA3AF", marginTop:2 },

  card: { borderRadius:20, borderWidth:1.5, padding:18, shadowColor:"#000", shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  cardTopRow: { flexDirection:"row", gap:6, flexWrap:"wrap", marginBottom:14 },
  rarityBadge: { alignSelf:"flex-start", paddingHorizontal:10, paddingVertical:3, borderRadius:20 },
  rarityText: { fontSize:10, fontWeight:"700", letterSpacing:0.4 },
  tagBadge: { alignSelf:"flex-start", paddingHorizontal:10, paddingVertical:3, borderRadius:20, backgroundColor:"rgba(0,0,0,0.07)" },
  tagText: { fontSize:10, fontWeight:"700", color:"#6B7280", letterSpacing:0.3 },
  cardEmoji: { fontSize:48, textAlign:"center", marginBottom:10 },
  cardName: { fontSize:17, fontWeight:"800", color:"#111827", textAlign:"center", marginBottom:6 },
  cardDesc: { fontSize:13, color:"#6B7280", textAlign:"center", lineHeight:20, marginBottom:18 },
  cardFooter: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  priceRow: { flexDirection:"row", alignItems:"center" },
  piecesEmojiSm: { fontSize:15, marginRight:4 },
  priceValue: { fontSize:18, fontWeight:"800", color:"#111827" },
  priceUnit: { fontSize:11, color:"#9CA3AF", fontWeight:"600", marginTop:3 },
  buyBtn: { backgroundColor:"#111827", paddingHorizontal:20, paddingVertical:10, borderRadius:12 },
  buyBtnDisabled: { backgroundColor:"#F3F4F6" },
  buyBtnText: { color:"white", fontWeight:"700", fontSize:13 },
  ownedBadge: { backgroundColor:"#D1FAE5", paddingHorizontal:14, paddingVertical:8, borderRadius:12 },
  ownedText: { color:"#065F46", fontWeight:"700", fontSize:13 },

  overlay: { flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", alignItems:"center", padding:28 },
  modalBox: { backgroundColor:"white", borderRadius:24, padding:24, width:"100%", maxWidth:390, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:8}, shadowOpacity:0.15, shadowRadius:24, elevation:12 },
  modalEmoji: { fontSize:56, marginBottom:10 },
  modalTitle: { fontSize:20, fontWeight:"800", color:"#111827", marginBottom:6, textAlign:"center" },
  modalDesc: { fontSize:13, color:"#6B7280", textAlign:"center", lineHeight:20, marginBottom:16 },
  modalDivider: { width:"100%", height:1, backgroundColor:"#F3F4F6", marginBottom:14 },
  modalRow: { flexDirection:"row", width:"100%", justifyContent:"space-between", marginBottom:8 },
  modalRowLabel: { fontSize:13, color:"#9CA3AF" },
  modalRowValue: { fontSize:14, fontWeight:"700", color:"#111827" },
  modalBtns: { flexDirection:"row", gap:12, marginTop:20, width:"100%" },
  btnCancel: { flex:1, padding:14, backgroundColor:"#F3F4F6", borderRadius:14, alignItems:"center" },
  btnCancelText: { fontWeight:"700", color:"#374151", fontSize:14 },
  btnConfirm: { flex:1, padding:14, backgroundColor:"#111827", borderRadius:14, alignItems:"center" },
  btnConfirmText: { fontWeight:"700", color:"white", fontSize:14 },
  feedbackBox: { backgroundColor:"white", borderRadius:24, padding:28, width:"100%", maxWidth:320, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:8}, shadowOpacity:0.15, shadowRadius:24, elevation:12 },
  feedbackIcon: { fontSize:56, marginBottom:12 },
  feedbackTitle: { fontSize:20, fontWeight:"800", color:"#111827", marginBottom:8 },
  feedbackMsg: { fontSize:13, color:"#6B7280", textAlign:"center", lineHeight:20, marginBottom:24 },
});
