import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_H } = Dimensions.get("window");
// Hauteur fixe du sheet en pixels — les enfants flex: 1 ont une base connue
const SHEET_H = Math.round(SCREEN_H * 0.85);

// ===== Types =====
type ModalType = "none" | "theme" | "notifications" | "report" | "collection" | "edit_profile";
type ReportStep = "type" | "message";

interface Notification {
  id: string;
  title: string;
  body: string;
  date: string;
  type: "update" | "gift" | "info";
  gift?: { emoji: string; label: string; claimed: boolean };
}

// ===== Data =====
const OWNED_THEMES = [
  { id: "t1", name: "Carte Parchemin", emoji: "🗺️" },
  { id: "t2", name: "Carte Forêt",     emoji: "🌿" },
];

const REPORT_TYPES = [
  { id: "localization", label: "📍 Trésor mal localisé",  desc: "La position du trésor semble incorrecte sur la carte." },
  { id: "content",      label: "⚠️ Contenu non éthique",  desc: "Message offensant, discriminatoire ou inapproprié." },
  { id: "bug",          label: "🐛 Bug de l'application", desc: "L'application a eu un comportement inattendu." },
  { id: "other",        label: "💬 Autre",                desc: "Tout autre problème ne correspondant pas aux catégories." },
];

const INITIAL_NOTIFS: Notification[] = [
  {
    id: "n1", type: "update",
    title: "🚀 Mise à jour v1.2 — Marché & Profil",
    body: "Le Marché est maintenant disponible ! Achetez des avatars, des thèmes de carte et des clés d'indices. Le profil a aussi été enrichi avec la gestion des thèmes, les notifications et le signalement.",
    date: "19 mars 2026",
  },
  {
    id: "n2", type: "gift",
    title: "🎁 Cadeau de lancement v1.2",
    body: "Pour fêter la sortie du Marché, on vous offre une Clé Argent ! Utilisez-la pour débloquer un indice de niveau 2 sans perdre de points lors de votre prochaine chasse au trésor.",
    date: "19 mars 2026",
    gift: { emoji: "🔑", label: "1 Clé Argent", claimed: false },
  },
  {
    id: "n3", type: "update",
    title: "🎉 Mise à jour v1.1 — Atelier amélioré",
    body: "L'Atelier a maintenant une page d'accueil triée par statut (brouillon, en attente, publié). L'éditeur de dessin a reçu des corrections : zoom stabilisé, barre d'outils swipeable vers le haut.",
    date: "17 mars 2026",
  },
  {
    id: "n4", type: "gift",
    title: "🎁 Pack de démarrage",
    body: "Bienvenue dans Adventura ! Pour bien commencer votre aventure, un pack de démarrage vous attend : 3 Clés Bronze et 500 Pièces. Bonne chasse !",
    date: "15 mars 2026",
    gift: { emoji: "🎒", label: "3 Clés Bronze + 500 Pièces", claimed: true },
  },
  {
    id: "n5", type: "info",
    title: "ℹ️ Maintenance prévue le 22 mars",
    body: "Une maintenance technique est prévue le dimanche 22 mars de 2h à 4h du matin. L'application sera temporairement indisponible. Nous nous excusons pour la gêne.",
    date: "14 mars 2026",
  },
  {
    id: "n6", type: "update",
    title: "🚀 Lancement officiel v1.0",
    body: "Adventura est officiellement lancé ! Explorez votre ville, trouvez des trésors dessinés par la communauté, gagnez des PX et grimpez dans le classement. Bonne chance !",
    date: "10 mars 2026",
  },
  {
    id: "n7", type: "gift",
    title: "🎁 Bonus premiers explorateurs",
    body: "Vous faites partie des 500 premiers explorateurs d'Adventura ! En récompense, une Relique Dorée exclusive vous est offerte. Elle doublera vos Pièces pendant toute votre prochaine expédition.",
    date: "10 mars 2026",
    gift: { emoji: "🏺", label: "1 Relique Dorée", claimed: false },
  },
];

const NOTIF_COLORS = {
  update: { bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  gift:   { bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" },
  info:   { bg: "#F3F4F6", border: "#E5E7EB", dot: "#9CA3AF" },
};

// ===================================================================
// SlideSheet — bottom sheet avec swipe-to-dismiss
// Structure : [Backdrop flex:1 au dessus] + [Sheet hauteur fixe en dessous]
// Pas d'absoluteFillObject, pas de Pressable qui enveloppe le sheet.
// Les enfants flex:1 fonctionnent grâce à la hauteur fixe du sheet.
// ===================================================================
interface SlideSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function SlideSheet({ visible, onClose, children }: SlideSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_H)).current;

  // Entrée animée
  useEffect(() => {
    if (visible) {
      translateY.setValue(SHEET_H);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 58,
        friction: 12,
      }).start();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: SHEET_H,
      duration: 280,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 4 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 100 || gs.vy > 0.6) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 58,
            friction: 12,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={dismiss}>
      {/*
        Layout colonne :
          1. Pressable backdrop (flex:1) → prend tout l'espace AU DESSUS du sheet
          2. Animated.View sheet (hauteur fixe) → collé en bas de l'écran
        Ainsi le backdrop ne recouvre JAMAIS le sheet → 0 conflit de touches.
      */}
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        {/* Zone sombre au-dessus du sheet — tap pour fermer */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.46)" }}
          onPress={dismiss}
        />

        {/* Sheet — hauteur fixe = enfants flex:1 fonctionnent */}
        <Animated.View
          style={{
            height: SHEET_H,
            backgroundColor: "white",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            transform: [{ translateY }],
          }}
        >
          {/* Handle — zone de drag */}
          <View style={sh.handleZone} {...pan.panHandlers}>
            <View style={sh.handleBar} />
          </View>

          {/* Contenu : paddingHorizontal + paddingBottom ici */}
          <View style={sh.content}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ===================================================================
// Écran Profil
// ===================================================================
export default function ProfilScreen() {
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [activeTheme, setActiveTheme] = useState("t1");
  const [notifs, setNotifs]           = useState<Notification[]>(INITIAL_NOTIFS);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [reportStep, setReportStep]   = useState<ReportStep>("type");
  const [reportType, setReportType]   = useState<string | null>(null);
  const [reportMsg, setReportMsg]     = useState("");
  const [reportSent, setReportSent]   = useState(false);

  // States pour profil
  const [username, setUsername]       = useState("Explorateur Ilyass");
  const [avatarEmoji, setAvatarEmoji] = useState("🥷");
  const [editUser, setEditUser]       = useState("Explorateur Ilyass");
  const [editAvatar, setEditAvatar]   = useState("🥷");

  const open  = (m: ModalType) => {
    setActiveModal(m);
    if (m === "edit_profile") {
      setEditUser(username);
      setEditAvatar(avatarEmoji);
    }
  };
  const close = () => {
    setActiveModal("none");
    setTimeout(() => {
      setReportStep("type");
      setReportType(null);
      setReportMsg("");
      setReportSent(false);
    }, 380);
  };

  const claimGift = (id: string) =>
    setNotifs(prev =>
      prev.map(n => n.id === id && n.gift
        ? { ...n, gift: { ...n.gift!, claimed: true } }
        : n
      )
    );

  const unclaimedCount = notifs.filter(n => n.gift && !n.gift.claimed).length;
  const activeThemeName =
    activeTheme === "default"
      ? "Par défaut"
      : OWNED_THEMES.find(t => t.id === activeTheme)?.name ?? "Par défaut";

  const stats = [
    { label: "PX totaux",             value: "1 240" },
    { label: "Trésors créés",         value: "2" },
    { label: "Trésors trouvés",       value: "18" },
    { label: "Expéditions terminées", value: "5" },
    { label: "Badges obtenus",        value: "12/76" },
    { label: "Cosmétiques possédés",  value: "8/23" },
  ];
  const inventory = [
    { emoji: "🗝️", label: "Clés Bronze", value: 3 },
    { emoji: "🔑", label: "Clés Argent", value: 1 },
    { emoji: "✨", label: "Clés Or",     value: 0 },
    { emoji: "🏺", label: "Reliques",    value: 1 },
    { emoji: "🎰", label: "Jackpots",    value: 5 },
  ];
  const collection = [
    { name: "Château de Versailles", theme: "Histoire",    emoji: "🏛️" },
    { name: "Falaises d'Etretat",    theme: "Nature",      emoji: "🏞️" },
    { name: "Paris-Brest",           theme: "Gastronomie", emoji: "🍽️" },
    { name: "Sabre Laser",           theme: "Cinéma",      emoji: "🎞️" },
    { name: "Champignon 1UP",        theme: "Jeux vidéos", emoji: "👾" },
    { name: "Canada",                theme: "Drapeaux",    emoji: "🗺️" },
  ];

  return (
    <View style={ps.container}>
      <ScrollView contentContainerStyle={ps.scroll}>

        {/* Avatar */}
        <View style={ps.headerRow}>
          <View style={ps.avatar}>
            <Text style={{ fontSize: 32 }}>{avatarEmoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ps.username}>{username}</Text>
            <Text style={ps.role}>Aspirant</Text>
            <Text style={ps.sub}>Niveau 7 · 15 PX avant le prochain niveau</Text>
          </View>
          <Pressable style={ps.editBtn} onPress={() => open("edit_profile")}>
            <Text style={ps.editBtnTxt}>Modifier</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View style={ps.section}>
          <Text style={ps.sTitle}>Statistiques</Text>
          <Text style={ps.sSub}>Résumé de ton aventure</Text>
          <View style={ps.statsGrid}>
            {stats.map(s => (
              <View key={s.label} style={ps.statCard}>
                <Text style={ps.statVal}>{s.value}</Text>
                <Text style={ps.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Inventaire */}
        <View style={ps.section}>
          <Text style={ps.sTitle}>Inventaire</Text>
          <Text style={ps.sSub}>Objets et clés disponibles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {inventory.map(it => (
              <View key={it.label} style={ps.invCard}>
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{it.emoji}</Text>
                <Text style={ps.invVal}>{it.value}</Text>
                <Text style={ps.invLbl}>{it.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Collection */}
        <View style={ps.section}>
          <Text style={ps.sTitle}>Collection</Text>
          <Text style={ps.sSub}>Répertoire de tes trouvailles</Text>
          <View style={ps.collGrid}>
            {collection.map((it, i) => (
              <View key={i} style={ps.collCard}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{it.emoji}</Text>
                <Text style={ps.collName} numberOfLines={1}>{it.name}</Text>
                <Text style={ps.collTheme}>{it.theme}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={ps.collBtn} onPress={() => open("collection")}>
            <Text style={ps.collBtnTxt}>Voir toute la collection</Text>
          </TouchableOpacity>
        </View>

        {/* Paramètres */}
        <View style={ps.section}>
          <Text style={ps.sTitle}>Paramètres</Text>
          <View style={ps.settingsList}>

            <Pressable style={ps.settRow} onPress={() => open("theme")}>
              <View style={ps.settLeft}>
                <Text style={{ fontSize: 22 }}>🎨</Text>
                <View>
                  <Text style={ps.settLbl}>Thème de carte</Text>
                  <Text style={ps.settDesc}>Actif : {activeThemeName}</Text>
                </View>
              </View>
              <Text style={ps.arrow}>›</Text>
            </Pressable>

            <Pressable style={ps.settRow} onPress={() => open("notifications")}>
              <View style={ps.settLeft}>
                <Text style={{ fontSize: 22 }}>🔔</Text>
                <View>
                  <Text style={ps.settLbl}>Notifications</Text>
                  <Text style={ps.settDesc}>Mises à jour et cadeaux</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {unclaimedCount > 0 && (
                  <View style={ps.badge}>
                    <Text style={ps.badgeTxt}>{unclaimedCount}</Text>
                  </View>
                )}
                <Text style={ps.arrow}>›</Text>
              </View>
            </Pressable>

            <Pressable style={[ps.settRow, { borderBottomWidth: 0 }]} onPress={() => open("report")}>
              <View style={ps.settLeft}>
                <Text style={{ fontSize: 22 }}>🚩</Text>
                <View>
                  <Text style={ps.settLbl}>Signaler un problème</Text>
                  <Text style={ps.settDesc}>Trésor, contenu, bug…</Text>
                </View>
              </View>
              <Text style={ps.arrow}>›</Text>
            </Pressable>

          </View>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════
          SHEET THÈME
      ══════════════════════════════════════════════ */}
      <SlideSheet visible={activeModal === "theme"} onClose={close}>
        <Text style={sh.title}>🎨 Mes thèmes de carte</Text>
        <Text style={sh.sub}>Glissez vers le bas pour fermer.</Text>
        <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          {/* Par défaut */}
          <Pressable
            style={[sh.themeRow, activeTheme === "default" && sh.themeRowOn]}
            onPress={() => setActiveTheme("default")}
          >
            <Text style={{ fontSize: 28 }}>🗾</Text>
            <View style={{ flex: 1 }}>
              <Text style={sh.themeName}>Par défaut</Text>
              <Text style={sh.themeTag}>Toujours disponible</Text>
            </View>
            {activeTheme === "default" && <Text style={sh.check}>✓</Text>}
          </Pressable>
          {OWNED_THEMES.map(t => (
            <Pressable
              key={t.id}
              style={[sh.themeRow, activeTheme === t.id && sh.themeRowOn]}
              onPress={() => setActiveTheme(t.id)}
            >
              <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={sh.themeName}>{t.name}</Text>
                <Text style={sh.themeTag}>Possédé</Text>
              </View>
              {activeTheme === t.id && <Text style={sh.check}>✓</Text>}
            </Pressable>
          ))}
          <Text style={sh.hint}>
            🛒 Achetez d'autres thèmes dans le Marché → Cosmétiques → Thèmes de carte
          </Text>
        </ScrollView>
      </SlideSheet>

      {/* ══════════════════════════════════════════════
          SHEET NOTIFICATIONS
      ══════════════════════════════════════════════ */}
      <SlideSheet visible={activeModal === "notifications"} onClose={close}>
        <Text style={sh.title}>🔔 Notifications</Text>
        {unclaimedCount > 0 && (
          <View style={sh.giftBanner}>
            <Text style={sh.giftBannerTxt}>
              🎁 {unclaimedCount} cadeau{unclaimedCount > 1 ? "x" : ""} à récupérer !
            </Text>
          </View>
        )}
        {/* flex:1 fonctionne car le parent (sh.content) a flex:1 sur une hauteur connue */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {notifs.map(n => {
            const col   = NOTIF_COLORS[n.type];
            const open  = expandedId === n.id;
            const hasG  = !!n.gift;
            const unclm = hasG && !n.gift!.claimed;
            return (
              <View
                key={n.id}
                style={[
                  sh.notifCard,
                  { backgroundColor: col.bg, borderColor: unclm ? col.dot : col.border, borderWidth: unclm ? 2 : 1 },
                ]}
              >
                <Pressable
                  style={sh.notifHeader}
                  onPress={() => setExpandedId(open ? null : n.id)}
                >
                  <View style={[sh.dot, { backgroundColor: col.dot }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={sh.notifTitle}>{n.title}</Text>
                    <Text style={sh.notifDate}>{n.date}</Text>
                  </View>
                  <Text style={open ? sh.chevronOpen : sh.chevron}>⌄</Text>
                </Pressable>

                {open && (
                  <View style={{ marginTop: 6, gap: 10 }}>
                    <Text style={sh.notifBody}>{n.body}</Text>
                    {unclm && (
                      <Pressable style={sh.claimBtn} onPress={() => claimGift(n.id)}>
                        <Text style={sh.claimBtnTxt}>
                          {n.gift!.emoji} Récupérer : {n.gift!.label}
                        </Text>
                      </Pressable>
                    )}
                    {hasG && n.gift!.claimed && (
                      <View style={sh.claimedBadge}>
                        <Text style={sh.claimedTxt}>✓ Cadeau déjà récupéré</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SlideSheet>

      {/* ══════════════════════════════════════════════
          SHEET SIGNALEMENT
      ══════════════════════════════════════════════ */}
      <SlideSheet visible={activeModal === "report"} onClose={close}>
        <Text style={sh.title}>🚩 Signaler un problème</Text>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {!reportSent ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
            >
              {reportStep === "type" && (
                <>
                  <Text style={sh.sub}>Quel type de problème souhaitez-vous signaler ?</Text>
                  {REPORT_TYPES.map(rt => (
                    <Pressable
                      key={rt.id}
                      style={[sh.repRow, reportType === rt.id && sh.repRowOn]}
                      onPress={() => setReportType(rt.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={sh.repLbl}>{rt.label}</Text>
                        <Text style={sh.repDesc}>{rt.desc}</Text>
                      </View>
                      {reportType === rt.id && <Text style={sh.check}>✓</Text>}
                    </Pressable>
                  ))}
                  <Pressable
                    style={[sh.btn, !reportType && sh.btnOff]}
                    onPress={() => reportType && setReportStep("message")}
                    disabled={!reportType}
                  >
                    <Text style={[sh.btnTxt, !reportType && { color: "#9CA3AF" }]}>
                      Suivant →
                    </Text>
                  </Pressable>
                </>
              )}

              {reportStep === "message" && (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Pressable onPress={() => setReportStep("type")}>
                      <Text style={{ color: "#0ea5e9", fontWeight: "600", fontSize: 14 }}>
                        ← Retour
                      </Text>
                    </Pressable>
                    <Text style={{ fontSize: 12, color: "#6B7280", flex: 1, textAlign: "right" }} numberOfLines={1}>
                      {REPORT_TYPES.find(r => r.id === reportType)?.label}
                    </Text>
                  </View>
                  <Text style={sh.sub}>Décrivez brièvement le problème (facultatif).</Text>
                  <TextInput
                    style={sh.input}
                    placeholder="Ex : Le trésor semble être placé dans la mer..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxLength={300}
                    value={reportMsg}
                    onChangeText={setReportMsg}
                    scrollEnabled={false}
                    autoFocus
                  />
                  <Text style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right" }}>
                    {reportMsg.length}/300
                  </Text>
                  <Pressable style={sh.btn} onPress={() => setReportSent(true)}>
                    <Text style={sh.btnTxt}>Envoyer le signalement</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
              <Text style={{ fontSize: 56 }}>✅</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>
                Signalement envoyé
              </Text>
              <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 20, paddingHorizontal: 16 }}>
                Merci ! Notre équipe modère chaque signalement et prend les mesures nécessaires sous 48h.
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SlideSheet>

      {/* ══════════════════════════════════════════════
          SHEET COLLECTION
      ══════════════════════════════════════════════ */}
      <SlideSheet visible={activeModal === "collection"} onClose={close}>
        <Text style={sh.title}>Toute la collection</Text>
        <Text style={sh.sub}>Trésors uniques trouvés lors de vos chasses.</Text>
        <ScrollView
          style={{ flex: 1, marginTop: 10 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={ps.collGrid}>
            {[...collection, ...collection].map((it, i) => (
              <View key={i} style={ps.collCard}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{it.emoji}</Text>
                <Text style={ps.collName} numberOfLines={1}>{it.name}</Text>
                <Text style={ps.collTheme}>{it.theme}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SlideSheet>

      {/* ══════════════════════════════════════════════
          SHEET MODIFIER PROFIL
      ══════════════════════════════════════════════ */}
      <SlideSheet visible={activeModal === "edit_profile"} onClose={close}>
        <Text style={sh.title}>Modifier le profil</Text>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingBottom: 24, paddingTop: 12 }}
          >
            <View>
              <Text style={sh.lbl}>Émoji Avatar</Text>
              <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                {["🥷", "🤠", "👩‍🚀", "🧙‍♂️", "🕵️‍♀️", "🐻", "🦊", "🐯"].map(e => (
                  <Pressable
                    key={e}
                    style={[sh.emojiBtn, editAvatar === e && sh.emojiBtnOn]}
                    onPress={() => setEditAvatar(e)}
                  >
                    <Text style={{ fontSize: 28 }}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <View>
              <Text style={sh.lbl}>Nom d'explorateur</Text>
              <TextInput
                style={[sh.input, { minHeight: 48, marginTop: 8, paddingVertical: 12, textAlignVertical: "center" }]}
                value={editUser}
                onChangeText={setEditUser}
                maxLength={20}
              />
            </View>

            <Pressable
              style={[sh.btn, { marginTop: 10 }]}
              onPress={() => {
                setUsername(editUser);
                setAvatarEmoji(editAvatar);
                close();
              }}
            >
              <Text style={sh.btnTxt}>Enregistrer les modifications</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SlideSheet>
    </View>
  );
}

// ===================================================================
// Styles SlideSheet (sh) + ProfilScreen (ps)
// ===================================================================
const CARD_BG     = "#ffffff";
const CARD_BORDER = "#e5e7eb";
const ACCENT      = "#0ea5e9";

const sh = StyleSheet.create({
  // Structure interne du sheet
  handleZone: { alignItems: "center", paddingTop: 12, paddingBottom: 8 },
  handleBar:  { width: 40, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  // Zone de contenu : flex:1 depuis la hauteur fixe SHEET_H
  content:    { flex: 1, paddingHorizontal: 24, paddingBottom: 40, gap: 12 },

  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  sub:   { fontSize: 13, color: "#6B7280", lineHeight: 20 },
  hint:  { fontSize: 12, color: "#9CA3AF", textAlign: "center", lineHeight: 18, marginTop: 6 },

  // Thème
  themeRow:   { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, backgroundColor: "#F9FAFB", borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB" },
  themeRowOn: { backgroundColor: "#EFF6FF", borderColor: "#3B82F6" },
  themeName:  { fontSize: 15, fontWeight: "700", color: "#111827" },
  themeTag:   { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  check:      { fontSize: 18, color: "#3B82F6", fontWeight: "800" },

  // Notifications
  giftBanner:    { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 12, padding: 12, alignItems: "center" },
  giftBannerTxt: { color: "#92400E", fontWeight: "700", fontSize: 14 },
  notifCard:    { borderRadius: 14, padding: 14 },
  notifHeader:  { flexDirection: "row", alignItems: "center", gap: 10 },
  dot:          { width: 9, height: 9, borderRadius: 5, flexShrink: 0, marginTop: 2 },
  notifTitle:   { fontSize: 14, fontWeight: "700", color: "#111827", lineHeight: 20 },
  notifDate:    { fontSize: 11, color: "#9CA3AF" },
  chevron:      { fontSize: 20, color: "#9CA3AF" },
  chevronOpen:  { fontSize: 20, color: "#9CA3AF", transform: [{ rotate: "180deg" }] },
  notifBody:    { fontSize: 13, color: "#374151", lineHeight: 20 },
  claimBtn:     { backgroundColor: "#111827", padding: 13, borderRadius: 12, alignItems: "center" },
  claimBtnTxt:  { color: "white", fontWeight: "700", fontSize: 13 },
  claimedBadge: { backgroundColor: "#D1FAE5", padding: 10, borderRadius: 10, alignItems: "center" },
  claimedTxt:   { color: "#065F46", fontWeight: "600", fontSize: 13 },

  // Signalement
  repRow:   { padding: 14, backgroundColor: "#F9FAFB", borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB", flexDirection: "row", alignItems: "center", gap: 10 },
  repRowOn: { backgroundColor: "#FFF1F2", borderColor: "#FCA5A5" },
  repLbl:   { fontSize: 14, fontWeight: "700", color: "#111827" },
  repDesc:  { fontSize: 12, color: "#6B7280", marginTop: 2 },
  input:    { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 14, fontSize: 14, color: "#111827", minHeight: 110, textAlignVertical: "top" },
  btn:      { backgroundColor: "#111827", padding: 15, borderRadius: 14, alignItems: "center" },
  btnOff:   { backgroundColor: "#E5E7EB" },
  btnTxt:   { color: "white", fontWeight: "700", fontSize: 15 },

  lbl:      { fontSize: 13, fontWeight: "600", color: "#374151" },
  emojiBtn: { padding: 10, backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB" },
  emojiBtnOn:{ backgroundColor: "#EFF6FF", borderColor: "#3B82F6" },
});

const ps = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scroll:    { padding: 16, paddingBottom: 40 },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  avatar:    { width: 72, height: 72, borderRadius: 36, backgroundColor: "#f9fafb", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: ACCENT, marginRight: 16 },
  username:  { color: "#1f2937", fontSize: 20, fontWeight: "700", marginBottom: 4 },
  role:      { color: "#9ca3af", fontSize: 14, marginBottom: 2 },
  sub:       { color: "#9ca3af", fontSize: 12 },
  editBtn:   { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#F3F4F6", borderRadius: 999 },
  editBtnTxt:{ fontSize: 13, fontWeight: "600", color: "#4B5563" },

  section: { marginBottom: 24 },
  sTitle:  { color: "#1f2937", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  sSub:    { color: "#9ca3af", fontSize: 12, marginBottom: 10 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard:  { backgroundColor: CARD_BG, borderColor: CARD_BORDER, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, width: "48%", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statVal:   { color: "#1f2937", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  statLbl:   { color: "#9ca3af", fontSize: 12 },

  invCard: { backgroundColor: CARD_BG, borderColor: CARD_BORDER, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center", minWidth: 90 },
  invVal:  { color: "#1f2937", fontSize: 18, fontWeight: "700" },
  invLbl:  { color: "#9ca3af", fontSize: 11, marginTop: 2, textAlign: "center" },

  collGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  collCard:  { backgroundColor: CARD_BG, borderColor: CARD_BORDER, borderWidth: 1, borderRadius: 12, padding: 10, width: "47%" },
  collName:  { color: "#1f2937", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  collTheme: { color: "#9ca3af", fontSize: 11 },
  collBtn:     { marginTop: 12, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: ACCENT, alignItems: "center" },
  collBtnTxt:  { color: ACCENT, fontSize: 14, fontWeight: "600" },

  settingsList: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, borderRadius: 16, overflow: "hidden", marginTop: 8 },
  settRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" },
  settLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settLbl:   { fontSize: 15, fontWeight: "600", color: "#1f2937" },
  settDesc:  { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  arrow:     { fontSize: 22, color: "#9CA3AF" },
  badge:     { backgroundColor: "#EF4444", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  badgeTxt:  { color: "white", fontSize: 11, fontWeight: "700" },
});
