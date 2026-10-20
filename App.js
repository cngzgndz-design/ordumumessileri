import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Modal, Linking, Platform, Image, Alert, Switch, SafeAreaView } from 'react-native';
import { initializeApp, getApp } from 'firebase/app';
import { getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, setDoc, getDocs, getDoc, increment, writeBatch } from 'firebase/firestore';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['props.pointerEvents is deprecated']);

const REKLAMLARI_AKTIF_ET = true;

let BannerAd = null;
let BannerAdSize = null;
let TestIds = null;

/*if (REKLAMLARI_AKTIF_ET && Platform.OS !== 'web') {
  try {
    const ads = require('react-native-google-mobile-ads');
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
  } catch (e) {
    console.log("Reklam modülü yüklenemedi:", e);
  }
} 
*/
const adUnitId = (__DEV__ && typeof TestIds !== 'undefined' && TestIds !== null) ? TestIds.BANNER : 'ca-app-pub-8577494064582289/4504789547';

const firebaseConfig = {
 apiKey: "AIzaSyDyDyTUpsPc8C60cgt3kNWs3kFCY_6x9J0",
 authDomain: "ordumumessilleri.firebaseapp.com",
 projectId: "ordumumessilleri",
 storageBucket: "ordumumessilleri.firebasestorage.app",
 messagingSenderId: "235964320544",
 appId: "1:235964320544:web:1e7c0c54fc33c27a85a545",
 measurementId: "G-9ZXQVQ2TZ4"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

function MumessilIndirimLogosu() {
  return (
    <View style={logoStyles.logoMerkezKonteyner}>
      <Image 
        source={require('./assets/logo.png')} 
        resizeMode="contain"
        style={{ width: 140, height: 140, marginBottom: 5 }} 
      />
    </View>
  );
}

const TURKIYE_ILLERI_VE_ILCELERI = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Adıyaman": ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kâhta", "Merkez", "Samsat", "Sincik", "Tut"],
  "Afyonkarahisar": ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sinanpaşa", "Sultandağı", "Şuhut"],
  "Ağrı": ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"],
  "Aksaray": ["Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Merkez", "Ortaköy", "Sarıyahşi", "Sultanhanı"],
  "Amasya": ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "Artvin": ["Ardanuç", "Arhavi", "Borçka", "Hopa", "Kemalpaşa", "Merkez", "Murgul", "Şavşat", "Yusufeli"],
  "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
  "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
  "Bartın": ["Amasra", "Kurucaşile", "Merkez", "Ulus"],
  "Batman": ["Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Merkez", "Sason"],
  "Bayburt": ["Aydıntepe", "Demirözü", "Merkez"],
  "Bilecik": ["Bozüyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
  "Bingöl": ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"],
  "Bitlis": ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"],
  "Bolu": ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"],
  "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"],
  "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
  "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
  "Çankırı": ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"],
  "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
  "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkezefendi", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
  "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"],
  "Düzce": ["Akçakoca", "Cumayeri", "Çilimli", "Gümüşova", "Kaynaşlı", "Merkez", "Yığılca"],
  "Edirne": ["Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Merkez", "Süloğlu", "Uzunköprü"],
  "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Merkez", "Palu", "Sivrice"],
  "Erzincan": ["Çayırlı", "İliç", "Kemah", "Kemaliye", "Merkez", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
  "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
  "Eskişehir": ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"],
  "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  "Giresun": ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Merkez", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"],
  "Gümüşhane": ["Kelkit", "Köse", "Kürtün", "Merkez", "Şiran", "Torul"],
  "Hakkâri": ["Çukurca", "Merkez", "Şemdinli", "Yüksekova"],
  "Hatay": ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
  "Iğdır": ["Aralık", "Karakoyunlu", "Merkez", "Tuzluca"],
  "Isparta": ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kâğıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
  "Kahramanmaraş": ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"],
  "Karabük": ["Eflani", "Eskipazar", "Merkez", "Ovacık", "Safranbolu", "Yenice"],
  "Karaman": ["Ayrancı", "Başyayla", "Ermenek", "Kazımkarabekir", "Merkez", "Sarıveliler"],
  "Kars": ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz"],
  "Kastamonu": ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Cide", "Çatalzeytin", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Merkez", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"],
  "Kayseri": ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
  "Kırıkkale": ["Bahşılı", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Merkez", "Sulakyurt", "Yahşihan"],
  "Kırklareli": ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"],
  "Kırşehir": ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Merkez", "Mucur"],
  "Kilis": ["Elbeyli", "Merkez", "Musabeyli", "Polateli"],
  "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  "Kütahya": ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Merkez", "Pazarlar", "Şaphane", "Simav", "Tavşanlı"],
  "Malatya": ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"],
  "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
  "Mardin": ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"],
  "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
  "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
  "Muş": ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"],
  "Nevşehir": ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"],
  "Niğde": ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"],
  "Ordu": ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"],
  "Osmaniye": ["Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Merkez", "Sumbas", "Toprakkale"],
  "Rize": ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"],
  "Sakarya": ["Adapazarı", "Akyazi", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"],
  "Samsun": ["Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "Havza", "Kavak", "Ladik", "Ondokuzmayıs", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"],
  "Siirt": ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan"],
  "Sinop": ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"],
  "Sivas": ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Gürün", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"],
  "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Haliliye", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
  "Şırnak": ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Merkez", "Silopi"],
  "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmaraereğlisi", "Muratlı", "Saray", "Süleymanpaşa"],
  "Tokat": ["Almus", "Artova", "Başçiftlik", "Erbaa", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yeşilyurt", "Zile"],
  "Trabzon": ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Sürmene", "Şalpazarı", "Tonya", "Vakfıkebir", "Yomra"],
  "Tunceli": ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Ovacık", "Pertek", "Pülümür"],
  "Uşak": ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"],
  "Van": ["Bahçesaray", "Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Tuşba"],
  "Yalova": ["Altınova", "Armutlu", "Çınarcık", "Çiftlikköy", "Merkez", "Termal"],
  "Yozgat": ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Merkez", "Saraykent", "Sorgun", "Şefaatli", "Yenifakılı", "Yerköy"],
  "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Gökçebey", "Karadeniz Ereğli", "Merkez"]
};

export default function App() {
  const [mevcutEkran, setMevcutEkran] = useState('uye');
  const [isletmeler, setIsletmeler] = useState([]);
  const [onayBekleyenler, setOnayBekleyenler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [tamEkranGorsel, setTamEkranGorsel] = useState(null);
  const [sponsorReklamlar, setSponsorReklamlar] = useState([]);
  const [defaultBannerAktifMi, setDefaultBannerAktifMi] = useState(true);
  const [googleAdsBannerAktifMi, setGoogleAdsBannerAktifMi] = useState(false);

  const [indirimFiltreAcikMi, setIndirimFiltreAcikMi] = useState(false);

  const [girisYapmisKullanici, setGirisYapmisKullanici] = useState(null); 
  const [profilModalAcikMi, setProfilModalAcikMi] = useState(false);
  const [uyeKayitModu, setUyeKayitModu] = useState(false); 
  const [authAdSoyad, setAuthAdSoyad] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authTelefon, setAuthTelefon] = useState('');
  const [authSifre, setAuthSifre] = useState('');
  const [girisHatasi, setGirisHatasi] = useState('');

  const [profilAdSoyadGuncelle, setProfilAdSoyadGuncelle] = useState('');
  const [profilTelefonGuncelle, setProfilTelefonGuncelle] = useState('');
  const [profilSifreGuncelle, setProfilSifreGuncelle] = useState('');

  const [secilenBasvuruDetay, setSecilenBasvuruDetay] = useState(null);
  const [detayModalAcikMi, setDetayModalAcikMi] = useState(false);

  const [hamburgerMenuAcikMi, setHamburgerMenuAcikMi] = useState(false);
  const [reklamYonetimModalAcikMi, setReklamYonetimModalAcikMi] = useState(false);
  const [sosyalAyarlarModalAcikMi, setSosyalAyarlarModalAcikMi] = useState(false);
  const [sifreDegistirModalAcikMi, setSifreDegistirModalAcikMi] = useState(false);

  const [uyeKurumEkleModalAcikMi, setUyeKurumEkleModalAcikMi] = useState(false);
  const [kurumEkleHatasi, setKurumEkleHatasi] = useState('');

  const [yeniBannerFormAcikMi, setYeniBannerFormAcikMi] = useState(false);
  const [yeniReklamBaslik, setYeniReklamBaslik] = useState('');
  const [yeniReklamLink, setYeniReklamLink] = useState('');
  const [yeniReklamGorsel, setYeniReklamGorsel] = useState('');
  const [yeniReklamBaslangic, setYeniReklamBaslangic] = useState('');
  const [yeniReklamBitis, setYeniReklamBitis] = useState('');

  const [reklamDuzenleModalAcikMi, setReklamDuzenleModalAcikMi] = useState(false);
  const [secilenReklamId, setSecilenReklamId] = useState(null);
  const [reklamFormBaslik, setReklamFormBaslik] = useState('');
  const [reklamFormLink, setReklamFormLink] = useState('');
  const [reklamFormGorsel, setReklamFormGorsel] = useState('');
  const [reklamFormBaslangic, setReklamFormBaslangic] = useState('');
  const [reklamFormBitis, setReklamFormBitis] = useState('');
  const [reklamFormAktif, setReklamFormAktif] = useState(true);

  const [kategoriYonetimModalAcikMi, setKategoriYonetimModalAcikMi] = useState(false);
  const [yeniKategoriAdi, setYeniKategoriAdi] = useState('');
  const [duzenlenenKategoriId, setDuzenlenenKategoriId] = useState(null);
  const [duzenlenenKategoriAdi, setDuzenlenenKategoriAdi] = useState('');

  const [seciliIlFiltre, setSeciliIlFiltre] = useState('Hepsi');
  const [seciliIlceFiltre, setSeciliIlceFiltre] = useState('Hepsi');
  const [seciliKategoriFiltre, setSeciliKategoriFiltre] = useState('Hepsi');

  const [sadeceFavorilerGelsinMi, setSadeceFavorilerGelsinMi] = useState(false);
  const [favoriKurumlar, setFavoriKurumlar] = useState([]);

  const [ilDropdownAcikMi, setIlDropdownAcikMi] = useState(false);
  const [ilceDropdownAcikMi, setIlceDropdownAcikMi] = useState(false);
  const [uyeDropdownAcikMi, setUyeDropdownAcikMi] = useState(false);

  const [adminSeciliIl, setAdminSeciliIl] = useState('Hepsi');
  const [adminSeciliIlce, setAdminSeciliIlce] = useState('Hepsi');
  const [adminSeciliKat, setAdminSeciliKat] = useState('Hepsi');

  const [adminIlDrop, setAdminIlDrop] = useState(false);
  const [adminIlceDrop, setAdminIlceDrop] = useState(false);
  const [adminKatDrop, setAdminKatDrop] = useState(false);

  const [formSeciliIl, setFormSeciliIl] = useState('Ordu');
  const [formSeciliIlce, setFormSeciliIlce] = useState('Altınordu');
  const [formSeciliKategori, setFormSeciliKategori] = useState('');
  const [yeniKategoriGeciciInput, setYeniKategoriGeciciInput] = useState('');
  
  const [formIlDropdownAcikMi, setFormIlDropdownAcikMi] = useState(false);
  const [formIlceDropdownAcikMi, setFormIlceDropdownAcikMi] = useState(false);
  const [formKatDropdownAcikMi, setFormKatDropdownAcikMi] = useState(false);

  const [yeniSifreForm, setYeniSifreForm] = useState('');
  
  const [sosyalFacebook, setSosyalFacebook] = useState('');
  const [sosyalTwitter, setSosyalTwitter] = useState('');
  const [sosyalInstagram, setSosyalInstagram] = useState('');
  const [sosyalLinkedin, setSosyalLinkedin] = useState('');
  const [sosyalWhatsapp, setSosyalWhatsapp] = useState('');
  const [sosyalEposta, setSosyalEposta] = useState('');
  const [sosyalAdres, setSosyalAdres] = useState('');

  const [sosyalAdresAktifMi, setSosyalAdresAktifMi] = useState(true);
  const [sosyalEpostaAktifMi, setSosyalEpostaAktifMi] = useState(true);
  const [sosyalFacebookAktifMi, setSosyalFacebookAktifMi] = useState(true);
  const [sosyalTwitterAktifMi, setSosyalTwitterAktifMi] = useState(true);
  const [sosyalInstagramAktifMi, setSosyalInstagramAktifMi] = useState(true);
  const [sosyalLinkedinAktifMi, setSosyalLinkedinAktifMi] = useState(true);
  const [sosyalWhatsappAktifMi, setSosyalWhatsappAktifMi] = useState(true);

  const [onayBekleyenlerAcikMi, setOnayBekleyenlerAcikMi] = useState(false);
  const [sozlesmesiYaklasanlarAcikMi, setSozlesmesiYaklasanlarAcikMi] = useState(false);
  const [sozlesmesiBitenlerAcikMi, setSozlesmesiBitenlerAcikMi] = useState(false);
  const [pasifOlanlarAcikMi, setPasifOlanlarAcikMi] = useState(false);

  const yedekYukleFileInputRef = useRef(null);

  useEffect(() => {
    const oturumKontrolEt = async () => {
      try {
        const kayitliKullanici = await AsyncStorage.getItem('@giris_yapan_uye');
        if (kayitliKullanici) {
          const parsedUser = JSON.parse(kayitliKullanici);
          setGirisYapmisKullanici(parsedUser);
          setProfilAdSoyadGuncelle(parsedUser.adSoyad || '');
          setProfilTelefonGuncelle(parsedUser.telefon || '');
        }
      } catch (e) {
        console.log("Oturum okunurken hata:", e);
      }
    };
    oturumKontrolEt();
  }, []);

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, "isletmeler"), orderBy("eklenmeTarihi", "desc")), (snap) => {
      const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); setIsletmeler(arr);
    });
    const unsubOnay = onSnapshot(query(collection(db, "onaybekleyenler"), orderBy("eklenmeTarihi", "desc")), (snap) => {
      const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); setOnayBekleyenler(arr);
    });
    const unsub2 = onSnapshot(query(collection(db, "kategoriler"), orderBy("name", "asc")), (snap) => {
      const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); setKategoriler(arr);
    });
    const unsub3 = onSnapshot(query(collection(db, "sponsorlar"), orderBy("eklenmeTarihi", "desc")), (snap) => {
      const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); setSponsorReklamlar(arr);
    });
    const unsub4 = onSnapshot(doc(db, "ayarlar", "reklamayar"), (d) => {
      if (d.exists()) {
        const dat = d.data();
        if (typeof dat.defaultBannerAktif === 'boolean') {
          setDefaultBannerAktifMi(dat.defaultBannerAktif);
        }
        if (typeof dat.googleAdsBannerAktif === 'boolean') {
          setGoogleAdsBannerAktifMi(dat.googleAdsBannerAktif);
        }
      }
    });
    const unsub6 = onSnapshot(doc(db, "ayarlar", "sosyalmedya"), (d) => {
      if (d.exists()) {
        const dat = d.data();
        setSosyalAdres(dat.adres || '');
        setSosyalFacebook(dat.facebook || '');
        setSosyalTwitter(dat.twitter || '');
        setSosyalInstagram(dat.instagram || '');
        setSosyalLinkedin(dat.linkedin || '');
        setSosyalWhatsapp(dat.whatsapp || '');
        setSosyalEposta(dat.eposta || '');

        setSosyalAdresAktifMi(dat.adresAktif !== false);
        setSosyalEpostaAktifMi(dat.epostaAktif !== false);
        setSosyalFacebookAktifMi(dat.facebookAktif !== false);
        setSosyalTwitterAktifMi(dat.twitterAktif !== false);
        setSosyalInstagramAktifMi(dat.instagramAktif !== false);
        setSosyalLinkedinAktifMi(dat.linkedinAktif !== false);
        setSosyalWhatsappAktifMi(dat.whatsappAktif !== false);
      }
    });

    return () => { 
      unsub1(); 
      unsubOnay(); 
      unsub2(); 
      unsub3(); 
      unsub4(); 
      unsub6(); 
    };
  }, []);

  useEffect(() => {
    if (girisYapmisKullanici && girisYapmisKullanici.id) {
      const fetchFavoriler = async () => {
        try {
          const userDoc = await getDoc(doc(db, "uyeler", girisYapmisKullanici.id));
          if (userDoc.exists() && userDoc.data().favoriKurumlar) {
            setFavoriKurumlar(userDoc.data().favoriKurumlar);
          } else {
            setFavoriKurumlar([]);
          }
        } catch (e) {
          console.log("Favoriler yüklenirken hata:", e);
        }
      };
      fetchFavoriler();
    } else {
      setFavoriKurumlar([]);
    }
  }, [girisYapmisKullanici]);

  const favoriToggleEt = async (kurumId) => {
    if (!girisYapmisKullanici) {
      Alert.alert("Uyarı", "⭐ Kurumları favorilere ekleyip filtreleyebilmek için önce üye girişi yapmalısınız!");
      setProfilModalAcikMi(true);
      return;
    }

    let yeniFavoriler = [...favoriKurumlar];
    if (yeniFavoriler.includes(kurumId)) {
      yeniFavoriler = yeniFavoriler.filter(id => id !== kurumId);
    } else {
      yeniFavoriler.push(kurumId);
    }

    setFavoriKurumlar(yeniFavoriler);

    try {
      await updateDoc(doc(db, "uyeler", girisYapmisKullanici.id), {
        favoriKurumlar: yeniFavoriler
      });
    } catch (e) {
      console.log("Favori güncelleme DB hatası:", e);
    }
  };

  const sifrele = (text) => {
    try {
      if (typeof btoa === 'function') {
        return btoa(unescape(encodeURIComponent(text)));
      }
      return Buffer.from(text, 'utf-8').toString('base64');
    } catch (e) {
      return text;
    }
  };

  const sifreCoz = (encodedText) => {
    try {
      if (typeof atob === 'function') {
        return decodeURIComponent(escape(atob(encodedText)));
      }
      return Buffer.from(encodedText, 'base64').toString('utf-8');
    } catch (e) {
      return encodedText;
    }
  };

  const filtreleriSifirlaUye = () => {
    setSeciliIlFiltre('Hepsi');
    setSeciliIlceFiltre('Hepsi');
    setSeciliKategoriFiltre('Hepsi');
    setSadeceFavorilerGelsinMi(false);
  };

  const filtreleriSifirlaAdmin = () => {
    setAdminSeciliIl('Hepsi');
    setAdminSeciliIlce('Hepsi');
    setAdminSeciliKat('Hepsi');
  };

  const filtreyiKaydetVeGuncelle = async (tur, deger) => {
    try {
      if (tur === 'il') {
        setSeciliIlFiltre(deger);
        setSeciliIlceFiltre('Hepsi');
      } else if (tur === 'ilce') {
        setSeciliIlceFiltre(deger);
      } else if (tur === 'kategori') {
        setSeciliKategoriFiltre(deger);
      }
    } catch (e) { console.log("Tercih kayıt hatası:", e); }
  };

  const [adminGirisYaptiMi, setAdminGirisYaptiMi] = useState(false);
  const [girilenSifre, setGirilenSifre] = useState('');
  
  const adminGirisKontrol = async () => {
    try {
      const sifreRef = doc(db, "ayarlar", "guvenlik");
      const docSnap = await getDoc(sifreRef);
      let veritabanindakiSifre = "nemesis123";
      if (docSnap.exists() && docSnap.data().adminSifre) {
        veritabanindakiSifre = docSnap.data().adminSifre;
      }
      if (girilenSifre === veritabanindakiSifre) {
        setAdminGirisYaptiMi(true);
        setGirilenSifre('');
      } else {
        Alert.alert("Hata", "Hatalı şifre!");
      }
    } catch (e) { Alert.alert("Hata", "Giriş sırasında hata: " + e.message); }
  };

  const [dosyaAdi, setDosyaAdi] = useState('');
  const [dosyaUrl, setDosyaUrl] = useState(null);

  const [uyeAramaMetni, setUyeAramaMetni] = useState('');
  const [uyeLimitInput, setUyeLimitInput] = useState('5');
  const [uyeMevcutSayfa, setUyeMevmetSayfa] = useState(1);

  const [adminLimitInput, setAdminLimitInput] = useState('5');
  const [adminMevcutSayfa, setAdminMevcutSayfa] = useState(1);

  useEffect(() => {
    setUyeMevmetSayfa(1);
  }, [uyeLimitInput, seciliIlFiltre, seciliIlceFiltre, seciliKategoriFiltre, uyeAramaMetni, sadeceFavorilerGelsinMi]);

  useEffect(() => {
    setAdminMevcutSayfa(1);
  }, [adminLimitInput, adminSeciliIl, adminSeciliIlce, adminSeciliKat]);

  const [duzenlenenId, setDuzenlenenId] = useState(null);
  const [formAcikMi, setFormAcikMi] = useState(false);
  const [onayBekleyenDuzenlenenId, setOnayBekleyenDuzenlenenId] = useState(null);

  const [formKurumAdi, setFormKurumAdi] = useState('');
  const [formAvantajDetayi, setFormAvantajDetayi] = useState('');
  const [formBaslangic, setFormBaslangic] = useState('');
  const [formBitis, setFormBitis] = useState('');

  const mevcutIller = ['Hepsi', ...Object.keys(TURKIYE_ILLERI_VE_ILCELERI)];
  const mevcutIlceler = seciliIlFiltre === 'Hepsi' ? ['Hepsi'] : ['Hepsi', ...(TURKIYE_ILLERI_VE_ILCELERI[seciliIlFiltre] || [])];

  const adminIllerListesi = ['Hepsi', ...Object.keys(TURKIYE_ILLERI_VE_ILCELERI)];
  const adminIlcelerListesi = adminSeciliIl === 'Hepsi' ? ['Hepsi'] : ['Hepsi', ...(TURKIYE_ILLERI_VE_ILCELERI[adminSeciliIl] || [])];

  const formIllerListesi = Object.keys(TURKIYE_ILLERI_VE_ILCELERI);
  const formIlcelerListesi = TURKIYE_ILLERI_VE_ILCELERI[formSeciliIl] || [];

  const tarihFormatla = (dateObj) => {
    const gun = String(dateObj.getDate()).padStart(2, '0');
    const ay = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yil = dateObj.getFullYear();
    return `${gun}.${ay}.${yil}`;
  };

  const getFormatliTarihStr = () => {
    const d = new Date();
    const gun = String(d.getDate()).padStart(2, '0');
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    const yil = d.getFullYear();
    return `${gun}${ay}${yil}`;
  };

  const yeniSozlesmeFormunuAc = () => {
    if (!formAcikMi) {
      const bugun = new Date();
      const birYilSonra = new Date();
      birYilSonra.setFullYear(bugun.getFullYear() + 1);

      setFormBaslangic(tarihFormatla(bugun));
      setFormBitis(tarihFormatla(birYilSonra));
      setFormKurumAdi('');
      setFormAvantajDetayi('');
      setFormSeciliKategori(kategoriler.length > 0 ? kategoriler[0].name : '');
      setYeniKategoriGeciciInput('');
      setDosyaAdi('');
      setDosyaUrl(null);
      setDuzenlenenId(null);
      setOnayBekleyenDuzenlenenId(null);
    }
    setFormAcikMi(!formAcikMi);
  };

  const uyeKurumEkleFormunuAc = () => {
    if (!girisYapmisKullanici) {
      Alert.alert("Uyarı", "⚠️ Anlaşmalı kurum ekleyebilmek için önce üye girişi yapmalısınız!");
      setProfilModalAcikMi(true);
      return;
    }

    const bugun = new Date();
    const birYilSonra = new Date();
    birYilSonra.setFullYear(bugun.getFullYear() + 1);

    setFormBaslangic(tarihFormatla(bugun));
    setFormBitis(tarihFormatla(birYilSonra));
    setFormKurumAdi('');
    setFormAvantajDetayi('');
    setFormSeciliKategori(kategoriler.length > 0 ? kategoriler[0].name : '');
    setYeniKategoriGeciciInput('');
    setDosyaAdi('');
    setDosyaUrl(null);
    setDuzenlenenId(null);
    setOnayBekleyenDuzenlenenId(null);
    setKurumEkleHatasi('');
    setUyeKurumEkleModalAcikMi(true);
  };

  const kullaniciGirisVeyaKayitYap = async () => {
    setGirisHatasi('');
    if (uyeKayitModu) {
      if (!authAdSoyad.trim() || !authEmail.trim() || !authSifre.trim()) {
        setGirisHatasi('Lütfen Ad Soyad, E-posta ve Şifre alanlarını doldurun.');
        return;
      }
    } else {
      if (!authEmail.trim() || !authSifre.trim()) {
        setGirisHatasi('Lütfen e-posta ve şifre alanlarını doldurun.');
        return;
      }
    }

    try {
      if (uyeKayitModu) {
        const sifrelenmisSifre = sifrele(authSifre);
        const yeniUyeVerisi = {
          adSoyad: authAdSoyad.trim(),
          email: authEmail.trim(),
          telefon: authTelefon.trim() || '',
          sifre: sifrelenmisSifre,
          favoriKurumlar: [],
          kayitTarihi: getFormatliTarihStr()
        };
        const docRef = await addDoc(collection(db, "uyeler"), yeniUyeVerisi);
        const olusturulanUye = { id: docRef.id, adSoyad: authAdSoyad.trim(), email: authEmail.trim(), telefon: authTelefon.trim() };
        
        setGirisYapmisKullanici(olusturulanUye);
        await AsyncStorage.setItem('@giris_yapan_uye', JSON.stringify(olusturulanUye));

        setProfilAdSoyadGuncelle(authAdSoyad.trim());
        setProfilTelefonGuncelle(authTelefon.trim() || '');
        setProfilSifreGuncelle('');
        Alert.alert("Başarılı", "🎉 Başarıyla üye oldunuz ve giriş yapıldı!");
        setProfilModalAcikMi(false);
      } else {
        const q = query(collection(db, "uyeler"));
        const querySnapshot = await getDocs(q);
        let bulunanUye = null;
        querySnapshot.forEach((docSnap) => {
          const dat = docSnap.data();
          const dbSifreCozulmus = sifreCoz(dat.sifre);
          if (dat.email.toLowerCase() === authEmail.trim().toLowerCase() && (dat.sifre === authSifre || dbSifreCozulmus === authSifre)) {
            bulunanUye = { id: docSnap.id, adSoyad: dat.adSoyad || '', email: dat.email, telefon: dat.telefon };
          }
        });

        if (bulunanUye) {
          setGirisYapmisKullanici(bulunanUye);
          await AsyncStorage.setItem('@giris_yapan_uye', JSON.stringify(bulunanUye));

          setProfilAdSoyadGuncelle(bulunanUye.adSoyad || '');
          setProfilTelefonGuncelle(bulunanUye.telefon || '');
          setProfilSifreGuncelle('');
          setProfilModalAcikMi(false);
        } else {
          setGirisHatasi('E-posta adresi veya şifre hatalı.');
        }
      }
      setAuthAdSoyad('');
      setAuthEmail('');
      setAuthTelefon('');
      setAuthSifre('');
    } catch (e) {
      setGirisHatasi('İşlem sırasında hata oluştu.');
    }
  };

  const profilBilgileriniGuncelle = async () => {
    if (!girisYapmisKullanici || !girisYapmisKullanici.id) return;
    try {
      const guncellemeVerisi = { 
        adSoyad: profilAdSoyadGuncelle.trim(), 
        telefon: profilTelefonGuncelle.trim() 
      };
      if (profilSifreGuncelle.trim()) {
        guncellemeVerisi.sifre = sifrele(profilSifreGuncelle.trim());
      }
      await updateDoc(doc(db, "uyeler", girisYapmisKullanici.id), guncellemeVerisi);
      
      const guncelUyeObjesi = { ...girisYapmisKullanici, adSoyad: profilAdSoyadGuncelle.trim(), telefon: profilTelefonGuncelle.trim() };
      setGirisYapmisKullanici(guncelUyeObjesi);
      await AsyncStorage.setItem('@giris_yapan_uye', JSON.stringify(guncelUyeObjesi));

      setProfilSifreGuncelle('');
      
      if (Platform.OS === 'web') {
        window.alert("✅ Profil bilgileriniz başarıyla güncellendi!");
      } else {
        Alert.alert("Başarılı", "✅ Profil bilgileriniz başarıyla güncellendi!");
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert("Hata: " + e.message);
      } else {
        Alert.alert("Hata", "Güncelleme hatası: " + e.message);
      }
    }
  };

  // 📌 DÜZELTİLEN KISIM: Web ve Mobil uyumlu kalıcı üyelik silme fonksiyonu
  const uveyiSil = async () => {
    if (!girisYapmisKullanici || !girisYapmisKullanici.id) return;
    
    const silinsinMi = Platform.OS === 'web' 
      ? window.confirm("Üyeliğinizi kalıcı olarak silmek istediğinize emin misiniz?")
      : await new Promise((resolve) => {
          Alert.alert("Hesabı Sil", "Üyeliğinizi kalıcı olarak silmek istediğinize emin misiniz?", [
            { text: "İptal", onPress: () => resolve(false), style: "cancel" },
            { text: "Evet, Sil", onPress: () => resolve(true), style: "destructive" }
          ]);
        });

    if (!silinsinMi) return;

    try {
      await deleteDoc(doc(db, "uyeler", girisYapmisKullanici.id));
      await AsyncStorage.removeItem('@giris_yapan_uye');
      setGirisYapmisKullanici(null);
      setProfilModalAcikMi(false);
      
      if (Platform.OS === 'web') {
        window.alert("Hesabınız ve üyelik kaydınız veritabanından silindi.");
      } else {
        Alert.alert("Bilgi", "Hesabınız ve üyelik kaydınız veritabanından silindi.");
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert("Üyelik silinirken hata oluştu: " + e.message);
      } else {
        Alert.alert("Hata", "Üyelik silinirken hata oluştu: " + e.message);
      }
    }
  };

  const yeniBannerFormunuAcVeyaKapat = () => {
    if (!yeniBannerFormAcikMi) {
      const bugun = new Date();
      const birYilSonra = new Date();
      birYilSonra.setFullYear(bugun.getFullYear() + 1);

      setYeniReklamBaslangic(tarihFormatla(bugun));
      setYeniReklamBitis(tarihFormatla(birYilSonra));
    }
    setYeniBannerFormAcikMi(!yeniBannerFormAcikMi);
  };

  const yeniBannerFormunuSifirlaVeKapat = () => {
    setYeniReklamBaslik('');
    setYeniReklamLink('');
    setYeniReklamGorsel('');
    setYeniReklamBaslangic('');
    setYeniReklamBitis('');
    setYeniBannerFormAcikMi(false);
  };

  const reklamiHaberVerMailGonder = () => {
    const alici = "cngzgndz@gmail.com";
    const konu = "İndirim Sayfaniza Reklam Vermek Istiyorum";
    const govde = "Merhaba,\n\nİndirim sayfanizda reklam vermek istiyorum.\n\nİyi çalışmalar.";
    Linking.openURL(`mailto:${alici}?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`).catch(() => Alert.alert("Hata", "E-posta uygulaması açılamadı."));
  };

  const uyeKurumBilgisiMailGonder = (item) => {
    if (!item || !item.ekleyenUye) return;
    const alici = item.ekleyenUye;
    const konu = `Anlaşmalı Kurum Başvurunuz Hk. (${item.ad || ''})`;
    const govde = `Merhaba,\n\nGöndermiş olduğunuz kurum bilgileri:\n` +
                `- Kurum Adı: ${item.ad || ''}\n` +
                `- Kategori: ${item.kategori || ''}\n` +
                `- Avantaj: ${item.indirim || ''}\n` +
                `- İl / İlçe: ${item.ilce || ''} / ${item.il || ''}\n` +
                `- Başlangıç / Bitiş: ${item.baslangic || ''} - ${item.bitis || ''}\n\n` +
                `Kurum adı navigasyonda çıkmıyor, kontrol eder misiniz?\n\nİyi çalışmalar.`;

    Linking.openURL(`mailto:${alici}?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`).catch(() => Alert.alert("Hata", "E-posta uygulaması (Mail) açılamadı."));
  };

  const veritabaniniYedekle = async () => {
    try {
      const koleksiyonlar = [
        'isletmeler', 
        'onaybekleyenler', 
        'kategoriler', 
        'ayarlar', 
        'sponsorlar', 
        'uyeler'
      ];
      let yedekPaketi = {};
      for (const kol of koleksiyonlar) {
        const querySnapshot = await getDocs(collection(db, kol));
        yedekPaketi[kol] = [];
        querySnapshot.forEach((d) => { 
          yedekPaketi[kol].push({ id: d.id, ...d.data() }); 
        });
      }
      const jsonVeri = JSON.stringify(yedekPaketi, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonVeri], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yedek_${getFormatliTarihStr()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      const fileUri = FileSystem.cacheDirectory + `yedek_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonVeri, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Bilgi", "Cihazınızda dosya paylaşımı desteklenmiyor.");
      }
    } catch (e) { 
      Alert.alert("Hata", "Yedekleme hatası: " + e.message); 
    }
  };

  const yedekYuklemeIsleminiBaslat = async () => {
    if (Platform.OS === 'web') {
      if (yedekYukleFileInputRef.current) {
        yedekYukleFileInputRef.current.click();
      }
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const jsonString = await FileSystem.readAsStringAsync(fileUri);
        await yedekVerileriniIsle(jsonString);
      }
    } catch (e) {
      Alert.alert("Hata", "Yedek dosyası seçilemedi: " + e.message);
    }
  };

  const yedekYukleWeb = async (event) => {
    const dosya = event.target.files[0];
    if (!dosya) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      await yedekVerileriniIsle(e.target.result);
      event.target.value = '';
    };
    reader.readAsText(dosya);
  };

  const yedekVerileriniIsle = async (jsonString) => {
    try {
      const yedekPaketi = JSON.parse(jsonString);
      if (!yedekPaketi || typeof yedekPaketi !== 'object') {
        if (Platform.OS === 'web') window.alert("Geçersiz yedek dosyası!");
        else Alert.alert("Hata", "Geçersiz yedek dosyası!");
        return;
      }

      const onayVerildi = Platform.OS === 'web'
        ? window.confirm("Mevcut veriler silinecek ve yedek yüklenecektir. Emin misiniz?")
        : await new Promise((resolve) => {
            Alert.alert(
              "Yedek Geri Yükleme",
              "Mevcut veriler silinecek ve yedek yüklenecektir. Emin misiniz?",
              [
                { text: "İptal", onPress: () => resolve(false), style: "cancel" },
                { text: "Evet, Yükle", onPress: () => resolve(true) }
              ]
            );
          });

      if (!onayVerildi) return;

      const koleksiyonlar = ['isletmeler', 'onaybekleyenler', 'kategoriler', 'ayarlar', 'sponsorlar', 'uyeler'];

      for (const kolName of koleksiyonlar) {
        const mevcutDocsSnap = await getDocs(collection(db, kolName));
        if (!mevcutDocsSnap.empty) {
          let deleteBatch = writeBatch(db);
          let delCount = 0;
          mevcutDocsSnap.forEach((d) => {
            deleteBatch.delete(d.ref);
            delCount++;
            if (delCount >= 450) {
              deleteBatch.commit();
              deleteBatch = writeBatch(db);
              delCount = 0;
            }
          });
          if (delCount > 0) {
            await deleteBatch.commit();
          }
        }

        const liste = yedekPaketi[kolName];
        if (Array.isArray(liste) && liste.length > 0) {
          let addBatch = writeBatch(db);
          let operationCount = 0;

          for (const item of liste) {
            const docId = item.id;
            const veriKopyasi = { ...item };
            delete veriKopyasi.id;
            
            const docRef = docId ? doc(db, kolName, docId) : doc(collection(db, kolName));
            addBatch.set(docRef, veriKopyasi);
            operationCount++;

            if (operationCount >= 450) {
              await addBatch.commit();
              addBatch = writeBatch(db);
              operationCount = 0;
            }
          }
          if (operationCount > 0) {
            await addBatch.commit();
          }
        }
      }

      if (Platform.OS === 'web') {
        window.alert("Yedek başarıyla geri yüklendi ve aktif/pasif durumları korundu!");
      } else {
        Alert.alert("Başarılı", "Yedek başarıyla geri yüklendi ve aktif/pasif durumları korundu!");
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert("Hata: " + e.message);
      } else {
        Alert.alert("Hata", "Yedek işleme hatası: " + e.message);
      }
    }
  };

  const sozlesmeBelgesiSec = async (isUyeModal = false) => {
    if (Platform.OS === 'web') {
      try {
        const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          
          if (asset.mimeType === 'application/pdf') {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            if (blob.size > 1048576) {
              window.alert("⚠️ Seçtiğiniz PDF dosyası 1 MB'tan büyük. Lütfen 1 MB altı bir PDF veya görsel seçin.");
              return;
            }
          }

          const img = new window.Image();
          img.src = asset.uri;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            const MAX_WIDTH = 1600;
            const MAX_HEIGHT = 1600;
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            let kalite = 0.85;
            let compressedDataUrl = canvas.toDataURL('image/jpeg', kalite);

            while (compressedDataUrl.length > 1048576 * 1.37 && kalite > 0.1) {
              kalite -= 0.1;
              compressedDataUrl = canvas.toDataURL('image/jpeg', kalite);
            }

            setDosyaUrl(compressedDataUrl);
            setDosyaAdi(asset.name || "Sikistirilmis_Belge.jpg");
            setKurumEkleHatasi('');
          };
        }
      } catch (e) {
        console.log("Web belge seçme hatası:", e);
      }
      return;
    }

    Alert.alert("Belge / Fotoğraf Yükleme", "Nasıl eklemek istiyorsunuz?", [
      { text: "İptal", style: "cancel" },
      { text: "📷 Kamera ile Çek", onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.4, maxWidth: 1200, maxHeight: 1200 });
          if (!res.canceled && res.assets && res.assets.length > 0) {
            const resp = await fetch(res.assets[0].uri);
            const blob = await resp.blob();
            const r = new FileReader();
            r.onloadend = () => {
              setDosyaUrl(r.result);
              setDosyaAdi("Kamera_Fotografi.jpg");
              setKurumEkleHatasi('');
            };
            r.readAsDataURL(blob);
          }
        }
      },
      { text: "📂 Galeriden Seç", onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.4, maxWidth: 1200, maxHeight: 1200 });
          if (!res.canceled && res.assets && res.assets.length > 0) {
            const resp = await fetch(res.assets[0].uri);
            const blob = await resp.blob();
            const r = new FileReader();
            r.onloadend = () => {
              setDosyaUrl(r.result);
              setDosyaAdi("Secilen_Gorsel.jpg");
              setKurumEkleHatasi('');
            };
            r.readAsDataURL(blob);
          }
        }
      }
    ]);
  };

  async function dosyayiSistemeYukleMobil(setImageState) {
    if (Platform.OS === 'web') {
      try {
        const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const r = new FileReader();
          r.onloadend = () => setImageState(r.result);
          r.readAsDataURL(blob);
        }
      } catch (e) {
        console.log("Web görsel seçme hatası:", e);
      }
      return;
    }

    Alert.alert("Görsel Yükleme", "Görseli nasıl yüklemek istiyorsunuz?", [
      { text: "İptal", style: "cancel" },
      { text: "📷 Kamera ile Çek", onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.25, maxWidth: 1000, maxHeight: 1000 });
          if (!res.canceled && res.assets && res.assets.length > 0) {
            const resp = await fetch(res.assets[0].uri);
            const blob = await resp.blob();
            const r = new FileReader();
            r.onloadend = () => setImageState(r.result);
            r.readAsDataURL(blob);
          }
        }
      },
      { text: "📂 Galeriden Seç", onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.25, maxWidth: 1000, maxHeight: 1000 });
          if (!res.canceled && res.assets && res.assets.length > 0) {
            const resp = await fetch(res.assets[0].uri);
            const blob = await resp.blob();
            const r = new FileReader();
            r.onloadend = () => setImageState(r.result);
            r.readAsDataURL(blob);
          }
        }
      }
    ]);
  }

  function formuTemizle() {
    setFormKurumAdi(''); setFormSeciliKategori(''); setFormAvantajDetayi('');
    setFormSeciliIl('Ordu'); setFormSeciliIlce('Altınordu');
    setYeniKategoriGeciciInput('');
    setDosyaAdi(''); setDosyaUrl(null); setDuzenlenenId(null); setOnayBekleyenDuzenlenenId(null);
    setKurumEkleHatasi('');
  }

  async function dosyaGoruntule(url) {
    if (!url) return;
    setTamEkranGorsel(url);
  }

  function haritadaKonumAc(kurumAdi, ilce, il) {
    if (!kurumAdi) return;
    const konumMetni = `${ilce || ''} ${il || ''}`.trim();
    const urlSorgu = encodeURIComponent(`${kurumAdi} ${konumMetni}`);
    
    const haritaUri = Platform.select({
      ios: `maps:0,0?q=${urlSorgu}`,
      android: `geo:0,0?q=${urlSorgu}`,
      default: `https://www.google.com/maps/search/?api=1&query=${urlSorgu}`
    });

    Linking.openURL(haritaUri).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${urlSorgu}`).catch(() => Alert.alert("Hata", "Harita açılamadı."));
    });
  }

  const sozlesmeyiKaydet = async () => {
    setKurumEkleHatasi('');
    const aktifKategori = yeniKategoriGeciciInput.trim() ? yeniKategoriGeciciInput.trim() : formSeciliKategori;

    if(!formKurumAdi || !formAvantajDetayi || !aktifKategori) {
      Alert.alert("Uyarı", "Lütfen kurum adı, kategori ve avantaj detayını doldurun."); return;
    }
    if(!dosyaUrl) {
      setKurumEkleHatasi('⚠️ İlgili belgenin yüklenmesi ZORUNLUDUR! Lütfen belge seçiniz.'); return;
    }
    
    let mevcutEkleyenUye = 'Yönetici';
    let mevcutEkleyenAdSoyad = 'Yönetici';
    let mevcutEkleyenTelefon = 'Yönetici';

    if (duzenlenenId) {
      const eskiKayiit = isletmeler.find(i => i.id === duzenlenenId);
      if (eskiKayiit && eskiKayiit.ekleyenUye) {
        mevcutEkleyenUye = eskiKayiit.ekleyenUye;
        mevcutEkleyenAdSoyad = eskiKayiit.ekleyenAdSoyad || 'Yönetici';
        mevcutEkleyenTelefon = eskiKayiit.ekleyenTelefon || 'Belirtilmemiş';
      }
    }

    const veri = {
      ad: formKurumAdi, 
      kategori: aktifKategori, 
      indirim: formAvantajDetayi, 
      il: formSeciliIl, 
      ilce: formSeciliIlce,
      baslangic: formBaslangic, 
      bitis: formBitis, 
      dosyaUrl: dosyaUrl || null,
      dosyaAdi: dosyaAdi || "", 
      ekleyenUye: mevcutEkleyenUye,
      ekleyenAdSoyad: mevcutEkleyenAdSoyad,
      ekleyenTelefon: mevcutEkleyenTelefon,
      aktifMi: true,
      eklenmeTarihi: new Date().getTime()
    };

    if (onayBekleyenDuzenlenenId) {
      const eskiBasvuru = onayBekleyenler.find(o => o.id === onayBekleyenDuzenlenenId);
      if (eskiBasvuru && eskiBasvuru.ekleyenUye) {
        veri.ekleyenUye = eskiBasvuru.ekleyenUye;
        veri.ekleyenAdSoyad = eskiBasvuru.ekleyenAdSoyad || '';
        veri.ekleyenTelefon = eskiBasvuru.ekleyenTelefon || '';
      }
      await updateDoc(doc(db, "onaybekleyenler", onayBekleyenDuzenlenenId), veri);
      setOnayBekleyenDuzenlenenId(null);
      setFormAcikMi(false); formuTemizle();
      Alert.alert("Başarılı", "Onay bekleyen kurum bilgileri güncellendi!");
      return;
    }

    if (duzenlenenId) {
      await updateDoc(doc(db, "isletmeler", duzenlenenId), veri);
      setDuzenlenenId(null);
    } else {
      await addDoc(collection(db, "isletmeler"), veri);
    }
    setFormAcikMi(false); formuTemizle();
    Alert.alert("Başarılı", "Sözleşme başarıyla kaydedildi!");
  };

  const uyeKurumBasvurusuGonder = async () => {
    setKurumEkleHatasi('');
    if (!girisYapmisKullanici) {
      if (Platform.OS === 'web') {
        window.alert("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      } else {
        Alert.alert("Uyarı", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      }
      setUyeKurumEkleModalAcikMi(false);
      setProfilModalAcikMi(true);
      return;
    }

    const aktifKategori = yeniKategoriGeciciInput.trim() ? yeniKategoriGeciciInput.trim() : formSeciliKategori;

    if(!formKurumAdi || !formAvantajDetayi || !aktifKategori) {
      if (Platform.OS === 'web') {
        window.alert("Lütfen kurum adı, kategori ve avantaj detayını doldurun.");
      } else {
        Alert.alert("Uyarı", "Lütfen kurum adı, kategori ve avantaj detayını doldurun.");
      }
      return;
    }
    if(!dosyaUrl) {
      setKurumEkleHatasi('⚠️ İlgili belgenin yüklenmesi ZORUNLUDUR! Lütfen belge seçiniz.'); 
      return;
    }
    const veri = {
      ad: formKurumAdi, 
      kategori: aktifKategori, 
      indirim: formAvantajDetayi, 
      il: formSeciliIl, 
      ilce: formSeciliIlce,
      baslangic: formBaslangic, 
      bitis: formBitis, 
      dosyaUrl: dosyaUrl || null,
      dosyaAdi: dosyaAdi || "", 
      ekleyenUye: girisYapmisKullanici.email,
      ekleyenAdSoyad: girisYapmisKullanici.adSoyad || '',
      ekleyenTelefon: girisYapmisKullanici.telefon || 'Belirtilmemiş',
      aktifMi: true,
      eklenmeTarihi: new Date().getTime()
    };
    try {
      await addDoc(collection(db, "onaybekleyenler"), veri);
      setUyeKurumEkleModalAcikMi(false);
      formuTemizle();
      
      const basariMesaji = "🚀 Kurum başvurunuz yönetici onayına gönderilmiştir. Onaylandıktan sonra yayına alınacaktır.";
      if (Platform.OS === 'web') {
        window.alert(basariMesaji);
      } else {
        Alert.alert("Başarılı", basariMesaji);
      }
    } catch (e) {
      const hataMesaji = "Başvuru gönderilirken hata oluştu: " + e.message;
      if (Platform.OS === 'web') {
        window.alert(hataMesaji);
      } else {
        Alert.alert("Hata", hataMesaji);
      }
    }
  };

  const kurumAktifPasifDegistir = async (item) => {
    try {
      const yeniDurum = item.aktifMi === false ? true : false;
      await updateDoc(doc(db, "isletmeler", item.id), { aktifMi: yeniDurum });
    } catch (e) {
      Alert.alert("Hata", "Durum değiştirme hatası: " + e.message);
    }
  };

  const onayBekleyenKurumuOnayla = async (item) => {
    try {
      const veriKopyasi = { ...item, aktifMi: true };
      const kategoriAdi = veriKopyasi.kategori;
      delete veriKopyasi.id;

      await addDoc(collection(db, "isletmeler"), veriKopyasi);

      if (kategoriAdi) {
        const kategoriVarMi = kategoriler.some(k => k.name.toLowerCase() === kategoriAdi.toLowerCase());
        if (!kategoriVarMi) {
          await addDoc(collection(db, "kategoriler"), { name: kategoriAdi });
        }
      }

      await deleteDoc(doc(db, "onaybekleyenler", item.id));
      Alert.alert("Başarılı", "Kurum onaylandı, kategorisi ile birlikte veritabanına eklendi ve canlıya alındı!");
    } catch (e) {
      Alert.alert("Hata", "Onaylama hatası: " + e.message);
    }
  };

  const onayBekleyenKurumSil = async (id) => {
    const silinsinMi = Platform.OS === 'web' 
      ? window.confirm("Bu başvuru talebini silmek istediğinize emin misiniz?")
      : await new Promise((resolve) => {
          Alert.alert("Kurum Silme", "Bu başvuru talebini silmek istediğinize emin misiniz?", [
            { text: "İptal", onPress: () => resolve(false), style: "cancel" },
            { text: "Sil", onPress: () => resolve(true), style: "destructive" }
          ]);
        });

    if (!silinsinMi) return;

    try {
      await deleteDoc(doc(db, "onaybekleyenler", id));
      if (Platform.OS === 'web') {
        window.alert("Başvuru silindi.");
      } else {
        Alert.alert("Başarılı", "Başvuru silindi.");
      }
    } catch (e) { 
      if (Platform.OS === 'web') window.alert("Hata: " + e.message);
      else Alert.alert("Hata", "Hata: " + e.message); 
    }
  };

  const onayBekleyenDuzenleHazirlik = (item) => {
    setOnayBekleyenDuzenlenenId(item.id);
    setDuzenlenenId(null);
    setFormKurumAdi(item.ad || '');
    setFormSeciliKategori(item.kategori || '');
    setYeniKategoriGeciciInput('');
    setFormAvantajDetayi(item.indirim || '');
    setFormBaslangic(item.baslangic || '');
    setFormBitis(item.bitis || '');
    setFormSeciliIl(item.il || 'Ordu');
    setFormSeciliIlce(item.ilce || 'Altınordu');
    setDosyaAdi(item.dosyaAdi || (item.dosyaUrl ? 'Mevcut Belge' : ''));
    setDosyaUrl(item.dosyaUrl || null);
    setKurumEkleHatasi('');
    setFormAcikMi(true);
  };

  const sozlesmeSil = async (id) => {
    const silinsinMi = Platform.OS === 'web' 
      ? window.confirm("Bu işletme sözleşmesini silmek istediğinize emin misiniz?")
      : await new Promise((resolve) => {
          Alert.alert("İşletme Sil", "Bu işletme sözleşmesini silmek istediğinize emin misiniz?", [
            { text: "İptal", onPress: () => resolve(false), style: "cancel" },
            { text: "Sil", onPress: () => resolve(true), style: "destructive" }
          ]);
        });

    if (!silinsinMi) return;

    try {
      await deleteDoc(doc(db, "isletmeler", id));
      if (Platform.OS === 'web') {
        window.alert("İşletme başarıyla silindi.");
      } else {
        Alert.alert("Başarılı", "İşletme silindi.");
      }
    } catch (e) { 
      if (Platform.OS === 'web') window.alert("Silme hatası: " + e.message);
      else Alert.alert("Hata", "Silme hatası: " + e.message); 
    }
  };

  const sozlesmeDuzenleHazirlik = (item) => {
    setDuzenlenenId(item.id);
    setOnayBekleyenDuzenlenenId(null);
    setFormKurumAdi(item.ad || '');
    setFormSeciliKategori(item.kategori || '');
    setYeniKategoriGeciciInput('');
    setFormAvantajDetayi(item.indirim || '');
    setFormBaslangic(item.baslangic || '');
    setFormBitis(item.bitis || '');
    setFormSeciliIl(item.il || 'Ordu');
    setFormSeciliIlce(item.ilce || 'Altınordu');
    setDosyaAdi(item.dosyaAdi || (item.dosyaUrl ? 'Mevcut Belge' : ''));
    setDosyaUrl(item.dosyaUrl || null);
    setKurumEkleHatasi('');
    setFormAcikMi(true);
  };

  const kategoriEkle = async () => {
    if (!yeniKategoriAdi.trim()) { Alert.alert("Uyarı", "Kategori adı boş olamaz."); return; }
    try {
      await addDoc(collection(db, "kategoriler"), { name: yeniKategoriAdi.trim() });
      setYeniKategoriAdi('');
      Alert.alert("Başarılı", "Kategori eklendi.");
    } catch (e) { Alert.alert("Hata", "Hata: " + e.message); }
  };

  const kategoriGuncelle = async (id) => {
    if (!duzenlenenKategoriAdi.trim()) { Alert.alert("Uyarı", "Kategori adı boş olamaz."); return; }
    try {
      await updateDoc(doc(db, "kategoriler", id), { name: duzenlenenKategoriAdi.trim() });
      setDuzenlenenKategoriId(null);
      setDuzenlenenKategoriAdi('');
      Alert.alert("Başarılı", "Kategori güncellendi.");
    } catch (e) { Alert.alert("Hata", "Hata: " + e.message); }
  };

  const kategoriSil = async (id) => {
    const silinsinMi = Platform.OS === 'web' 
      ? window.confirm("Bu kategoriyi silmek istiyor musunuz?")
      : await new Promise((resolve) => {
          Alert.alert("Kategori Sil", "Bu kategoriyi silmek istiyor musunuz?", [
            { text: "İptal", onPress: () => resolve(false), style: "cancel" },
            { text: "Sil", onPress: () => resolve(true), style: "destructive" }
          ]);
        });

    if (!silinsinMi) return;

    try {
      await deleteDoc(doc(db, "kategoriler", id));
      if (Platform.OS === 'web') window.alert("Kategori silindi.");
    } catch (e) { Alert.alert("Hata", "Hata: " + e.message); }
  };

  const sosyalAyarlariKaydet = async () => {
    try {
      await setDoc(doc(db, "ayarlar", "sosyalmedya"), {
        adres: sosyalAdres,
        facebook: sosyalFacebook,
        twitter: sosyalTwitter,
        instagram: sosyalInstagram,
        linkedin: sosyalLinkedin,
        whatsapp: sosyalWhatsapp,
        eposta: sosyalEposta,
        adresAktif: sosyalAdresAktifMi,
        epostaAktif: sosyalEpostaAktifMi,
        facebookAktif: sosyalFacebookAktifMi,
        twitterAktif: sosyalTwitterAktifMi,
        instagramAktif: sosyalInstagramAktifMi,
        linkedinAktif: sosyalLinkedinAktifMi,
        whatsappAktif: sosyalWhatsappAktifMi
      });
      Alert.alert("Başarılı", "Kurumsal iletişim ve sosyal ayarlar kaydedildi!");
      setSosyalAyarlarModalAcikMi(false);
    } catch (e) { Alert.alert("Hata", "Hata: " + e.message); }
  };

  const adminSifreGuncelle = async () => {
    if (!yeniSifreForm) { Alert.alert("Uyarı", "Lütfen yeni bir şifre girin."); return; }
    try {
      await setDoc(doc(db, "ayarlar", "guvenlik"), { adminSifre: yeniSifreForm });
      Alert.alert("Başarılı", "Yönetici şifresi güncellendi!");
      setYeniSifreForm('');
      setSifreDegistirModalAcikMi(false);
    } catch (e) { Alert.alert("Hata", "Hata: " + e.message); }
  };

  const sponsorEkle = async () => {
    if (!yeniReklamBaslik) { Alert.alert("Uyarı", "Reklam başlığı zorunludur."); return; }
    try {
      await addDoc(collection(db, "sponsorlar"), {
        baslik: yeniReklamBaslik,
        link: yeniReklamLink || 'https://google.com',
        gorsel: yeniReklamGorsel || '',
        baslangic: yeniReklamBaslangic || '',
        bitis: yeniReklamBitis || '',
        aktif: true,
        gosterimSayisi: 0,
        tiklanmaSayisi: 0,
        eklenmeTarihi: new Date().getTime()
      });
      Alert.alert("Başarılı", "Reklam başarıyla eklendi!");
      yeniBannerFormunuSifirlaVeKapat();
    } catch (e) { Alert.alert("Hata", "Hata: " + e.message); }
  };

  const sponsorSil = async (id) => {
    const silinsinMi = Platform.OS === 'web' 
      ? window.confirm("Bu sponsoru silmek istiyor musunuz?")
      : await new Promise((resolve) => {
          Alert.alert("Sponsor Sil", "Bu sponsoru silmek istiyor musunuz?", [
            { text: "İptal", onPress: () => resolve(false), style: "cancel" },
            { text: "Sil", onPress: () => resolve(true), style: "destructive" }
          ]);
        });

    if (!silinsinMi) return;

    await deleteDoc(doc(db, "sponsorlar", id));
    if (Platform.OS === 'web') window.alert("Sponsor silindi.");
  };

  const sponsorSayaclariSifirla = async (id) => {
    try {
      await updateDoc(doc(db, "sponsorlar", id), { gosterimSayisi: 0, tiklanmaSayisi: 0 });
      Alert.alert("Başarılı", "İstatistikler sıfırlandı.");
    } catch (e) { Alert.alert("Hata", "Hata: " + e.message); }
  };

  const sponsorTiklandi = async (s) => {
    try {
      await updateDoc(doc(db, "sponsorlar", s.id), { tiklanmaSayisi: increment(1) });
    } catch (e) { console.log("Tıklanma artırma hatası:", e); }
    Linking.openURL(s.link || 'https://google.com').catch(() => {});
  };

  const sponsorDuzenleAc = (s) => {
    setSecilenReklamId(s.id);
    setReklamFormBaslik(s.baslik || '');
    setReklamFormLink(s.link || '');
    setReklamFormGorsel(s.gorsel || '');
    setReklamFormBaslangic(s.baslangic || '');
    setReklamFormBitis(s.bitis || '');
    setReklamFormAktif(s.aktif === true || s.aktif === 'true' || s.aktif === 1 || s.aktif === 'Aktif');
    setReklamDuzenleModalAcikMi(true);
  };

  const reklamGuncelleKaydet = async () => {
    if (!secilenReklamId) return;
    try {
      await updateDoc(doc(db, "sponsorlar", secilenReklamId), {
        baslik: reklamFormBaslik,
        link: reklamFormLink,
        gorsel: reklamFormGorsel,
        baslangic: reklamFormBaslangic,
        bitis: reklamFormBitis,
        aktif: Boolean(reklamFormAktif)
      });
      setReklamDuzenleModalAcikMi(false);
      Alert.alert("Başarılı", "Reklam başarıyla güncellendi!");
    } catch (e) { Alert.alert("Hata", "Güncelleme hatası: " + e.message); }
  };

  const defaultBannerAyariniKaydet = async (yeniDeger) => {
    setDefaultBannerAktifMi(yeniDeger);
    try {
      await setDoc(doc(db, "ayarlar", "reklamayar"), { defaultBannerAktif: yeniDeger }, { merge: true });
    } catch (e) { console.log("Default banner ayar kaydetme hatası:", e); }
  };

  const googleAdsBannerAyariniKaydet = async (yeniDeger) => {
    setGoogleAdsBannerAktifMi(yeniDeger);
    try {
      await setDoc(doc(db, "ayarlar", "reklamayar"), { googleAdsBannerAktif: yeniDeger }, { merge: true });
    } catch (e) { console.log("Google Ads banner ayar kaydetme hatası:", e); }
  };

  useEffect(() => {
    const kontrolEtVePasifeAl = async () => {
      const bugun = new Date();
      bugun.setHours(0,0,0,0);

      for (const item of isletmeler) {
        if (!item.bitis) continue;
        if (item.aktifMi === false) continue; 

        const m = item.bitis.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (!m) continue;
        const bitisTarihi = new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]));

        if (bitisTarihi.getTime() < bugun.getTime()) {
          try {
            await updateDoc(doc(db, "isletmeler", item.id), { aktifMi: false });
          } catch (e) {
            console.log("Otomatik pasife alma hatası:", e);
          }
        }
      }
    };

    if (isletmeler.length > 0) {
      kontrolEtVePasifeAl();
    }
  }, [isletmeler]);

  const aktifSponsorlariFiltrele = () => {
    const bugun = new Date(); 
    bugun.setHours(0,0,0,0);

    return sponsorReklamlar.filter(item => {
      const isAktif = item.aktif === true || item.aktif === 'true' || item.aktif === 1 || item.aktif === 'Aktif';
      if (!isAktif) return false;

      if (!item.bitis || typeof item.bitis !== 'string' || !item.bitis.trim()) return true;

      const m = item.bitis.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (!m) return true;

      const bitisTarihi = new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]));
      bitisTarihi.setHours(0,0,0,0);

      return bitisTarihi.getTime() >= bugun.getTime();
    });
  };

  const sliderOgeleri = aktifSponsorlariFiltrele().map(s => ({ tip: 'sponsor', data: s }));
  if (defaultBannerAktifMi) {
    sliderOgeleri.push({ tip: 'default_reklam' });
  }

  const [aktifSliderIndex, setAktifSliderIndex] = useState(0);
  
  useEffect(() => {
    if (sliderOgeleri.length <= 1) return;
    const interval = setInterval(() => {
      setAktifSliderIndex(prev => {
        const yeniIndex = (prev + 1) % sliderOgeleri.length;
        const oge = sliderOgeleri[yeniIndex];
        if (oge && oge.tip === 'sponsor' && oge.data && oge.data.id) {
          updateDoc(doc(db, "sponsorlar", oge.data.id), { gosterimSayisi: increment(1) }).catch(()=>{});
        }
        return yeniIndex;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [sliderOgeleri.length]);

  const sonBesKurum = isletmeler.filter(i => i.aktifMi !== false).slice(0, 5);
  const [aktifSonKurumIndex, setAktifSonKurumIndex] = useState(0);

  useEffect(() => {
    if (sonBesKurum.length <= 1) return;
    const interval = setInterval(() => {
      setAktifSonKurumIndex(prev => (prev + 1) % sonBesKurum.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sonBesKurum.length]);

  const sozlesmesiYaklasanlariFiltrele = () => {
    const bugun = new Date();
    bugun.setHours(0,0,0,0);
    const birAySonra = new Date();
    birAySonra.setMonth(bugun.getMonth() + 1);
    birAySonra.setHours(23,59,59,999);

    return isletmeler.filter(item => {
      if (item.aktifMi === false) return false; 
      if (!item.bitis) return false;
      const m = item.bitis.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (!m) return false;
      const bitisTarihi = new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]));
      return bitisTarihi.getTime() >= bugun.getTime() && bitisTarihi.getTime() <= birAySonra.getTime();
    });
  };

  const sozlesmesiBitenleriFiltrele = () => {
    const bugun = new Date();
    bugun.setHours(0,0,0,0);

    return isletmeler.filter(item => {
      if (!item.bitis) return false;
      const m = item.bitis.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (!m) return false;
      const bitisTarihi = new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]));
      return bitisTarihi.getTime() < bugun.getTime();
    });
  };

  const pasifOlanlariFiltrele = () => {
    const bugun = new Date();
    bugun.setHours(0,0,0,0);

    return isletmeler.filter(item => {
      if (item.aktifMi !== false) return false; 
      
      if (item.bitis) {
        const m = item.bitis.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (m) {
          const bitisTarihi = new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]));
          if (bitisTarihi.getTime() < bugun.getTime()) {
            return false; 
          }
        }
      }
      return true;
    });
  };

  const sozlesmesiYaklasanListesi = sozlesmesiYaklasanlariFiltrele();
  const sozlesmesiBitenListesi = sozlesmesiBitenleriFiltrele();
  const pasifOlanlarListesi = pasifOlanlariFiltrele();

  const filtrelenmisUyeIsletmeler = useMemo(() => {
    return isletmeler.filter(isletme => {
      if (isletme.aktif === false || isletme.aktifMi === false) return false; 
      const ilUygun = seciliIlFiltre === 'Hepsi' || (isletme.il && isletme.il.toLowerCase() === seciliIlFiltre.toLowerCase());
      const ilceUygun = seciliIlceFiltre === 'Hepsi' || (isletme.ilce && isletme.ilce.toLowerCase() === seciliIlceFiltre.toLowerCase());
      const katUygun = seciliKategoriFiltre === 'Hepsi' || (isletme.kategori && isletme.kategori.toLowerCase() === seciliKategoriFiltre.toLowerCase());
      const favoriUygun = !sadeceFavorilerGelsinMi || favoriKurumlar.includes(isletme.id);
      const aramaUygun = (isletme.ad || '').toLowerCase().includes(uyeAramaMetni.toLowerCase()) || 
                         (isletme.ilce || '').toLowerCase().includes(uyeAramaMetni.toLowerCase()) || 
                         (isletme.il || '').toLowerCase().includes(uyeAramaMetni.toLowerCase());
      return ilUygun && ilceUygun && katUygun && favoriUygun && aramaUygun;
    });
  }, [isletmeler, seciliIlFiltre, seciliIlceFiltre, seciliKategoriFiltre, sadeceFavorilerGelsinMi, favoriKurumlar, uyeAramaMetni]);

  const parsedLimit = parseInt(uyeLimitInput);
  const uyeLimit = (!uyeLimitInput || isNaN(parsedLimit) || parsedLimit <= 0) 
    ? filtrelenmisUyeIsletmeler.length 
    : Math.min(parsedLimit, filtrelenmisUyeIsletmeler.length);

  const uyeToplamSayfa = Math.ceil(filtrelenmisUyeIsletmeler.length / (uyeLimit || 1)) || 1;
  const sayfalanmisUyeIsletmeler = filtrelenmisUyeIsletmeler.slice((uyeMevcutSayfa - 1) * (uyeLimit || filtrelenmisUyeIsletmeler.length), (uyeMevcutSayfa - 1) * (uyeLimit || filtrelenmisUyeIsletmeler.length) + (uyeLimit || filtrelenmisUyeIsletmeler.length));

  const filtrelenmisAdminIsletmeler = useMemo(() => {
    return isletmeler.filter(isletme => {
      if (isletme.aktifMi === false) return false; 
      
      if (isletme.bitis) {
        const m = isletme.bitis.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (m) {
          const bugun = new Date(); bugun.setHours(0,0,0,0);
          const bitisTarihi = new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1]));
          if (bitisTarihi.getTime() < bugun.getTime()) {
            return false; 
          }
        }
      }

      const ilUygun = adminSeciliIl === 'Hepsi' || (isletme.il && isletme.il.toLowerCase() === adminSeciliIl.toLowerCase());
      const ilceUygun = adminSeciliIlce === 'Hepsi' || (isletme.ilce && isletme.ilce.toLowerCase() === adminSeciliIlce.toLowerCase());
      const katUygun = adminSeciliKat === 'Hepsi' || (isletme.kategori && isletme.kategori.toLowerCase() === adminSeciliKat.toLowerCase());
      return ilUygun && ilceUygun && katUygun;
    });
  }, [isletmeler, adminSeciliIl, adminSeciliIlce, adminSeciliKat]);

  const parsedAdminLimit = parseInt(adminLimitInput);
  const adminLimit = (!adminLimitInput || isNaN(parsedAdminLimit) || parsedAdminLimit <= 0)
    ? filtrelenmisAdminIsletmeler.length
    : Math.min(parsedAdminLimit, filtrelenmisAdminIsletmeler.length);

  const adminToplamSayfa = Math.ceil(filtrelenmisAdminIsletmeler.length / (adminLimit || 1)) || 1;
  const sayfalanmisAdminIsletmeler = filtrelenmisAdminIsletmeler.slice((adminMevcutSayfa - 1) * (adminLimit || filtrelenmisAdminIsletmeler.length), (adminMevcutSayfa - 1) * (adminLimit || filtrelenmisAdminIsletmeler.length) + (adminLimit || filtrelenmisAdminIsletmeler.length));

  const linkAc = (url) => {
    if (!url) return;
    let tamUrl = url;
    if (!tamUrl.startsWith('http://') && !tamUrl.startsWith('https://')) {
      tamUrl = 'https://' + tamUrl;
    }
    Linking.openURL(tamUrl).catch(() => Alert.alert("Hata", "Bağlantı açılamadı."));
  };

  return (
    <SafeAreaView style={styles.safeAreaKonteyner}>
      <ScrollView style={styles.anaScrollKonteyner} contentContainerStyle={styles.anaScrollIcerik} showsVerticalScrollIndicator={true}>
        
        {Platform.OS === 'web' && (
          <View style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }}>
            <input type="file" ref={yedekYukleFileInputRef} onChange={yedekYukleWeb} accept=".json" />
          </View>
        )}

        {googleAdsBannerAktifMi && REKLAMLARI_AKTIF_ET && Platform.OS !== 'web' && BannerAd && BannerAdSize && (
          <View style={{ width: '100%', alignItems: 'center', marginVertical: 8 }}>
            <BannerAd
              unitId={adUnitId}
              size={BannerAdSize.BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        )}

        <View style={styles.ustSponsorBannerKapsul}>
          {sliderOgeleri.length > 0 ? (
            (() => {
              const currentItem = sliderOgeleri[aktifSliderIndex % sliderOgeleri.length];
              if (!currentItem) return null;
              if (currentItem.tip === 'sponsor') {
                const s = currentItem.data;
                return (
                  <TouchableOpacity style={styles.sponsorBannerIcerik} activeOpacity={0.9} onPress={() => sponsorTiklandi(s)}>
                    {s.gorsel ? <Image source={{ uri: s.gorsel }} resizeMode="cover" style={{ width: '100%', height: 75 }} /> : <View style={{ padding: 12, backgroundColor: '#00205B', alignItems: 'center' }}><Text style={{ color: '#fff', fontWeight: 'bold' }}>{s.baslik}</Text></View>}
                  </TouchableOpacity>
                );
              } else {
                return (
                  <TouchableOpacity style={styles.sponsorBannerBos} activeOpacity={0.8} onPress={reklamiHaberVerMailGonder}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, marginRight: 8 }}>📢</Text>
                        <View><Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Buraya Reklam Verebilirsiniz</Text><Text style={{ color: '#cbd5e1', fontSize: 11 }}>İletişim için tıklayın.</Text></View>
                      </View>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>&gt;</Text>
                    </View>
                  </TouchableOpacity>
                );
              }
            })()
          ) : null}
        </View>

        <View style={styles.anaLogoAlani}><MumessilIndirimLogosu /></View>
        
        <View style={styles.ustAksiyonBari}>
          {mevcutEkran === 'admin' && adminGirisYaptiMi ? (
            <TouchableOpacity style={styles.hamburgerMenuAlaniKapsul} onPress={() => setHamburgerMenuAcikMi(true)}>
              <Text style={{ fontSize: 24, color: '#00205B', fontWeight: 'bold' }}>☰</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.navBar}>
          <TouchableOpacity style={[styles.navButon, mevcutEkran === 'uye' && styles.aktifNav]} onPress={() => setMevcutEkran('uye')}>
            <Text style={[styles.navYazi, mevcutEkran === 'uye' && {color: '#fff'}]}>Üye Ekranı</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navButon, mevcutEkran === 'admin' && styles.aktifNav]} onPress={() => setMevcutEkran('admin')}>
            <Text style={[styles.navYazi, mevcutEkran === 'admin' && {color: '#fff'}]}>🛡️ Yönetim Paneli</Text>
          </TouchableOpacity>
        </View>

        {mevcutEkran === 'uye' && (
          <View style={{ width: '100%' }}>
            
            <View style={styles.gridMenuKapsul}>
              <TouchableOpacity style={[styles.gridMenuKutu, { backgroundColor: '#2563eb' }]} onPress={() => setIndirimFiltreAcikMi(!indirimFiltreAcikMi)}>
                <Text style={styles.gridMenuIkon}>🏷️</Text>
                <Text style={styles.gridMenuBaslik}>Anlaşmalı İşletmeler/Kurumlar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridMenuKutu, { backgroundColor: '#16a34a' }]} onPress={uyeKurumEkleFormunuAc}>
                <Text style={styles.gridMenuIkon}>🤝</Text>
                <Text style={styles.gridMenuBaslik}>Anlaşmalı Kurum/İşletme Ekle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridMenuKutu, { backgroundColor: '#8b5cf6' }]} onPress={() => setProfilModalAcikMi(true)}>
                <Text style={styles.gridMenuIkon}>👤</Text>
                <Text style={styles.gridMenuBaslik}>{girisYapmisKullanici ? 'Profilim' : 'Üye Girişi'}</Text>
              </TouchableOpacity>
            </View>

            {sonBesKurum.length > 0 && (
              <View style={styles.sonEklenenlerKapsul}>
                <Text style={styles.sonEklenenlerBaslik}>🌟 Son Eklenen 5 Anlaşmalı Kurum (Yol Tarifi İçin Tıklayın)</Text>
                {(() => {
                  const kurum = sonBesKurum[aktifSonKurumIndex % sonBesKurum.length];
                  return (
                    <TouchableOpacity style={styles.sonEklenenKart} activeOpacity={0.9} onPress={() => haritadaKonumAc(kurum.ad, kurum.ilce, kurum.il)}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sonKurumIsim}>{kurum.ad}</Text>
                          <Text style={styles.sonKurumDetay}>📍 {kurum.ilce || 'Merkez'} / {kurum.il || 'Ordu'} - {kurum.kategori}</Text>
                        </View>
                        <View style={styles.sonKurumAvantajKutu}>
                          <Text style={styles.sonKurumAvantajYazi}>{kurum.indirim || 'Avantaj'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            )}

            {indirimFiltreAcikMi && (
              <View style={{ width: '100%' }}>
                <View style={styles.filtrelemeKutusu}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.filtreBaslik}>📍 Bölge ve Kategori Filtreleme</Text>
                    <TouchableOpacity onPress={filtreleriSifirlaUye} style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#b91c1c' }}>🔄 Filtreleri Sıfırla</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.satir}>
                    <TouchableOpacity style={[styles.dropdownKutusu, { flex: 1, marginRight: 5 }]} onPress={() => setIlDropdownAcikMi(true)}>
                      <Text style={styles.dropdownKutusuYazisi}>İl: {seciliIlFiltre}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.dropdownKutusu, { flex: 1, marginLeft: 5 }]} onPress={() => setIlceDropdownAcikMi(true)}>
                      <Text style={styles.dropdownKutusuYazisi}>İlçe: {seciliIlceFiltre}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={[styles.dropdownKutusu, { marginTop: 5 }]} onPress={() => setUyeDropdownAcikMi(true)}>
                    <Text style={styles.dropdownKutusuYazisi}>Kategori: {seciliKategoriFiltre}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: sadeceFavorilerGelsinMi ? '#e0f2fe' : '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#bae6fd' }} 
                    onPress={() => setSadeceFavorilerGelsinMi(!sadeceFavorilerGelsinMi)}
                  >
                    <Text style={{ fontSize: 16, marginRight: 6 }}>{sadeceFavorilerGelsinMi ? '⭐' : '☆'}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0369a1' }}>Sadece Favori/Seçtiğim Kurumları Göster</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ width: '100%' }}>
                  <TextInput style={styles.aramaBar} placeholder="İşletme adı ile ara..." placeholderTextColor="#777" value={uyeAramaMetni} onChangeText={setUyeAramaMetni} />

                  <div style={styles.manuelLimitSatiri}>
                    <Text style={{ fontSize: 12, fontWeight: '600', flex: 2, color: '#333' }}>Sayfa Başına Gösterim:</Text>
                    <TextInput style={styles.manuelLimitInputKutusu} value={uyeLimitInput} onChangeText={setUyeLimitInput} keyboardType="numeric" />
                  </div>

                  {sayfalanmisUyeIsletmeler.length > 0 ? (
                    sayfalanmisUyeIsletmeler.map(item => {
                      const favorideMi = favoriKurumlar.includes(item.id);
                      return (
                        <View key={item.id} style={styles.kart}>
                          <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, padding: 4 }} onPress={() => favoriToggleEt(item.id)}>
                            <Text style={{ fontSize: 20 }}>{favorideMi ? '⭐' : '☆'}</Text>
                          </TouchableOpacity>
                          <View style={[styles.kartSol, { paddingRight: 25 }]}>
                            <Text style={styles.kartIsim}>{item.ad}</Text>
                            <Text style={styles.kartKategori}>📍 {item.ilce || 'Merkez'} / {item.il || 'Ordu'} - {item.kategori}</Text>
                            <Text style={styles.tarihEtiket}>Süre: {item.baslangic} - {item.bitis}</Text>
                          </View>
                          <View style={styles.kartSagKonteyner}>
                            <View style={styles.kartSag}>
                              <Text style={styles.indirimOrani} numberOfLines={2}>{item.indirim || 'Anlaşmalı'}</Text>
                              <Text style={styles.indirimEtiket}>AVANTAJ</Text>
                            </View>
                            <TouchableOpacity style={styles.yolTarifiButon} onPress={() => haritadaKonumAc(item.ad, item.ilce, item.il)}>
                              <Text style={styles.yolTarifiYazi}>📍 Yol Tarifi</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ textAlign: 'center', color: '#666', marginVertical: 20 }}>Bu kriterlere uygun aktif anlaşmalı işletme bulunamadı.</Text>
                  )}

                  {uyeLimit < filtrelenmisUyeIsletmeler.length && uyeToplamSayfa > 1 && (
                    <View style={styles.sayfalamaNavigasyonSatiri}>
                      <TouchableOpacity style={styles.sayfaGezmeButon} disabled={uyeMevcutSayfa === 1} onPress={() => setUyeMevmetSayfa(uyeMevcutSayfa - 1)}><Text>◀️ Geri</Text></TouchableOpacity>
                      <Text style={styles.sayfaNumaraYazisi}>{uyeMevcutSayfa} / {uyeToplamSayfa}</Text>
                      <TouchableOpacity style={styles.sayfaGezmeButon} disabled={uyeMevcutSayfa === uyeToplamSayfa} onPress={() => setUyeMevmetSayfa(uyeMevcutSayfa + 1)}><Text>İleri ▶️</Text></TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {((sosyalAdres?.trim() && sosyalAdresAktifMi) || 
              (sosyalFacebook?.trim() && sosyalFacebookAktifMi) || 
              (sosyalTwitter?.trim() && sosyalTwitterAktifMi) || 
              (sosyalInstagram?.trim() && sosyalInstagramAktifMi) || 
              (sosyalLinkedin?.trim() && sosyalLinkedinAktifMi) || 
              (sosyalWhatsapp?.trim() && sosyalWhatsappAktifMi) || 
              (sosyalEposta?.trim() && sosyalEpostaAktifMi)) ? (
              <View style={styles.sosyalMedyaDisKapsul}>
                <Text style={styles.sosyalMedyaBaslik}>Bizi Sosyal Medyada Takip Edin</Text>
                {(sosyalAdres?.trim() && sosyalAdresAktifMi) ? (
                  <Text style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginBottom: 12 }}>📍 {sosyalAdres}</Text>
                ) : null}
                <View style={styles.sosyalIkonlarSatiri}>
                  {(sosyalFacebook?.trim() && sosyalFacebookAktifMi) ? (
                    <TouchableOpacity style={styles.sosyalIkonKutusu} onPress={() => linkAc(sosyalFacebook)}>
                      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5968/5968764.png' }} resizeMode="cover" style={styles.sosyalIkonResim} />
                    </TouchableOpacity>
                  ) : null}
                  {(sosyalTwitter?.trim() && sosyalTwitterAktifMi) ? (
                    <TouchableOpacity style={styles.sosyalIkonKutusu} onPress={() => linkAc(sosyalTwitter)}>
                      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5968/5968830.png' }} resizeMode="cover" style={styles.sosyalIkonResim} />
                    </TouchableOpacity>
                  ) : null}
                  {(sosyalInstagram?.trim() && sosyalInstagramAktifMi) ? (
                    <TouchableOpacity style={styles.sosyalIkonKutusu} onPress={() => linkAc(sosyalInstagram)}>
                      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3955/3955024.png' }} resizeMode="cover" style={styles.sosyalIkonResim} />
                    </TouchableOpacity>
                  ) : null}
                  {(sosyalLinkedin?.trim() && sosyalLinkedinAktifMi) ? (
                    <TouchableOpacity style={styles.sosyalIkonKutusu} onPress={() => linkAc(sosyalLinkedin)}>
                      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3536/3536505.png' }} resizeMode="cover" style={styles.sosyalIkonResim} />
                    </TouchableOpacity>
                  ) : null}
                  {(sosyalWhatsapp?.trim() && sosyalWhatsappAktifMi) ? (
                    <TouchableOpacity style={styles.sosyalIkonKutusu} onPress={() => linkAc(sosyalWhatsapp.startsWith('http') ? sosyalWhatsapp : `https://wa.me/${sosyalWhatsapp}`)}>
                      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3670/3670051.png' }} resizeMode="cover" style={styles.sosyalIkonResim} />
                    </TouchableOpacity>
                  ) : null}
                  {(sosyalEposta?.trim() && sosyalEpostaAktifMi) ? (
                    <TouchableOpacity style={styles.sosyalIkonKutusu} onPress={() => Linking.openURL(`mailto:${sosyalEposta}`).catch(() => {})}>
                      <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/732/732200.png' }} resizeMode="cover" style={styles.sosyalIkonResim} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

            <Text style={styles.copyrightMetni}>© CG</Text>
          </View>
        )}

        {mevcutEkran === 'admin' && (
          <View style={{ width: '100%' }}>
            {!adminGirisYaptiMi ? (
              <View style={styles.loginKonteyner}>
                <Text style={styles.loginBaslik}>🛡️ Yönetici Girişi</Text>
                <TextInput style={styles.inputField} placeholder="Yönetici Şifresi" secureTextEntry={true} value={girilenSifre} onChangeText={setGirilenSifre} />
                <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#00205B' }]} onPress={adminGirisKontrol}>
                  <Text style={styles.kaydetButonYazi}>Sisteme Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                
                <View style={styles.adminBlok}>
                  <Text style={styles.blokBaslik}>💾 Veri Yedekleme & Geri Yükleme</Text>
                  <View style={styles.satir}>
                    <TouchableOpacity 
                      style={[styles.kaydetButon, { flex: 1, backgroundColor: '#4B9B28', marginRight: 5, marginTop: 0 }]} 
                      onPress={veritabaniniYedekle}
                    >
                      <Text style={styles.kaydetButonYazi}>📥 Yedek İndir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.kaydetButon, { flex: 1, backgroundColor: '#007A87', marginLeft: 5, marginTop: 0 }]} 
                      onPress={yedekYuklemeIsleminiBaslat}
                    >
                      <Text style={styles.kaydetButonYazi}>📤 Yedek Yükle</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.adminBlok, { marginTop: 15, borderColor: '#f59e0b', borderWidth: 2 }]}>
                  <TouchableOpacity style={styles.akordeonBaslikAlani} onPress={() => setOnayBekleyenlerAcikMi(!onayBekleyenlerAcikMi)}>
                    <Text style={[styles.blokBaslikDokunmatik, { color: '#d97706', marginBottom: 0 }]}>⏳ Onay Bekleyen Kurumlar ({onayBekleyenler.length})</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#d97706' }}>{onayBekleyenlerAcikMi ? '➖' : '➕'}</Text>
                  </TouchableOpacity>

                  {onayBekleyenlerAcikMi && (
                    <View style={{ marginTop: 15 }}>
                      {onayBekleyenler.length > 0 ? (
                        onayBekleyenler.map(item => (
                          <View key={item.id} style={[styles.kart, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                            <View style={styles.kartSol}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                {item.dosyaUrl ? (
                                  <TouchableOpacity onPress={() => dosyaGoruntule(item.dosyaUrl)}>
                                    <Image source={{ uri: item.dosyaUrl }} resizeMode="cover" style={{ width: 45, height: 45, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#cbd5e1' }} />
                                  </TouchableOpacity>
                                ) : null}
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.kartIsim}>{item.ad}</Text>
                                  <TouchableOpacity onPress={() => haritadaKonumAc(item.ad, item.ilce, item.il)}>
                                    <Text style={styles.kartKategori}>📍 {item.ilce || 'Merkez'} / {item.il || 'Ordu'} - <Text style={{ color: '#d97706', fontWeight: 'bold' }}>{item.kategori}</Text></Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <Text style={styles.tarihEtiket}>Avantaj: {item.indirim} | Süre: {item.baslangic} - {item.bitis}</Text>
                              
                              {item.ekleyenUye ? (
                                <TouchableOpacity style={{ marginTop: 4, backgroundColor: '#fef3c7', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#f59e0b', alignSelf: 'flex-start' }} onPress={() => { setSecilenBasvuruDetay(item); setDetayModalAcikMi(true); }}>
                                  <Text style={{ fontSize: 11, color: '#92400e', fontWeight: 'bold' }}>👤 Ekleyen Üye: {item.ekleyenAdSoyad ? `${item.ekleyenAdSoyad} (${item.ekleyenUye})` : item.ekleyenUye} (Detay için tıkla)</Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                            <View style={{ flexDirection: 'column', gap: 5, alignItems: 'center' }}>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0', width: 90, alignItems: 'center' }]} onPress={() => onayBekleyenKurumuOnayla(item)}>
                                <Text style={{ color: '#166534', fontSize: 11, fontWeight: 'bold' }}>✔️ Onayla</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#eff6ff', width: 90, alignItems: 'center' }]} onPress={() => onayBekleyenDuzenleHazirlik(item)}>
                                <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: 'bold' }}>✏️ Düzenle</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.yolTarifiButon} onPress={() => haritadaKonumAc(item.ad, item.ilce, item.il)}>
                                <Text style={styles.yolTarifiYazi}>📍 Yol Tarifi</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#fef2f2', borderColor: '#fecaca', width: 90, alignItems: 'center' }]} onPress={() => onayBekleyenKurumSil(item.id)}>
                                <Text style={{ color: '#b91c1c', fontSize: 11, fontWeight: 'bold' }}>🗑️ Sil</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={{ textAlign: 'center', color: '#666', marginVertical: 10 }}>Onay bekleyen yeni kurum başvurusu bulunmuyor.</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={[styles.adminBlok, { marginTop: 15, borderColor: '#ef4444', borderWidth: 2 }]}>
                  <TouchableOpacity style={styles.akordeonBaslikAlani} onPress={() => setSozlesmesiYaklasanlarAcikMi(!sozlesmesiYaklasanlarAcikMi)}>
                    <Text style={[styles.blokBaslikDokunmatik, { color: '#b91c1c', marginBottom: 0 }]}>🚨 Sözleşmesi Yaklaşanlar / Yenileme Bekleyenler ({sozlesmesiYaklasanListesi.length})</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#b91c1c' }}>{sozlesmesiYaklasanlarAcikMi ? '➖' : '➕'}</Text>
                  </TouchableOpacity>

                  {sozlesmesiYaklasanlarAcikMi && (
                    <View style={{ marginTop: 15 }}>
                      <Text style={{ fontSize: 11, color: '#b91c1c', marginBottom: 10, fontWeight: '600' }}>⚠️ Aşağıdaki kurumların sözleşme bitiş tarihine 1 aydan az süre kalmıştır.</Text>
                      {sozlesmesiYaklasanListesi.length > 0 ? (
                        sozlesmesiYaklasanListesi.map(item => (
                          <View key={item.id} style={[styles.kart, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                            <View style={styles.kartSol}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                {item.dosyaUrl ? (
                                  <TouchableOpacity onPress={() => dosyaGoruntule(item.dosyaUrl)}>
                                    <Image source={{ uri: item.dosyaUrl }} resizeMode="cover" style={{ width: 45, height: 45, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#cbd5e1' }} />
                                  </TouchableOpacity>
                                ) : null}
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.kartIsim}>{item.ad}</Text>
                                  <TouchableOpacity onPress={() => haritadaKonumAc(item.ad, item.ilce, item.il)}>
                                    <Text style={styles.kartKategori}>📍 {item.ilce || 'Merkez'} / {item.il || 'Ordu'} - {item.kategori}</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <Text style={[styles.tarihEtiket, { color: '#b91c1c', fontWeight: 'bold' }]}>Bitiş Tarihi: {item.bitis}</Text>
                              
                              {item.ekleyenUye ? (
                                <TouchableOpacity style={{ marginTop: 4, backgroundColor: '#fef2f2', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#fecaca', alignSelf: 'flex-start' }} onPress={() => { setSecilenBasvuruDetay(item); setDetayModalAcikMi(true); }}>
                                  <Text style={{ fontSize: 11, color: '#991b1b', fontWeight: 'bold' }}>👤 Ekleyen Üye: {item.ekleyenAdSoyad ? `${item.ekleyenAdSoyad} (${item.ekleyenUye})` : item.ekleyenUye} (Detay için tıkla)</Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                            <View style={{ flexDirection: 'column', gap: 5 }}>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#eff6ff' }]} onPress={() => sozlesmeDuzenleHazirlik(item)}>
                                <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: 'bold' }}>✏️ Güncelle</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: item.aktifMi === false ? '#dcfce7' : '#fef08a', borderColor: item.aktifMi === false ? '#bbf7d0' : '#fde047' }]} onPress={() => kurumAktifPasifDegistir(item)}>
                                <Text style={{ color: item.aktifMi === false ? '#166534' : '#854d0e', fontSize: 11, fontWeight: 'bold' }}>{item.aktifMi === false ? '🟢 Aktif Yap' : '🟡 Pasif Yap'}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]} onPress={() => sozlesmeSil(item.id)}>
                                <Text style={{ color: '#b91c1c', fontSize: 11, fontWeight: 'bold' }}>🗑️ Sil</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={{ textAlign: 'center', color: '#666', marginVertical: 10 }}>Sözleşme süresi yaklaşan kurum bulunmuyor.</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={[styles.adminBlok, { marginTop: 15, borderColor: '#64748b', borderWidth: 2 }]}>
                  <TouchableOpacity style={styles.akordeonBaslikAlani} onPress={() => setSozlesmesiBitenlerAcikMi(!sozlesmesiBitenlerAcikMi)}>
                    <Text style={[styles.blokBaslikDokunmatik, { color: '#475569', marginBottom: 0 }]}>🔴 Sözleşmesi Bitenler ({sozlesmesiBitenListesi.length})</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#475569' }}>{sozlesmesiBitenlerAcikMi ? '➖' : '➕'}</Text>
                  </TouchableOpacity>

                  {sozlesmesiBitenlerAcikMi && (
                    <View style={{ marginTop: 15 }}>
                      <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 10, fontWeight: '600' }}>ℹ️ Aşağıdaki kurumların sözleşme süresi dolmuş olup süre uzatılması beklenmektedir.</Text>
                      {sozlesmesiBitenListesi.length > 0 ? (
                        sozlesmesiBitenListesi.map(item => (
                          <View key={item.id} style={[styles.kart, { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }]}>
                            <View style={styles.kartSol}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                {item.dosyaUrl ? (
                                  <TouchableOpacity onPress={() => dosyaGoruntule(item.dosyaUrl)}>
                                    <Image source={{ uri: item.dosyaUrl }} resizeMode="cover" style={{ width: 45, height: 45, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#cbd5e1' }} />
                                  </TouchableOpacity>
                                ) : null}
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.kartIsim}>{item.ad}</Text>
                                    <View style={{ backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fecaca' }}>
                                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#b91c1c' }}>PASİF</Text>
                                    </View>
                                  </View>
                                  <TouchableOpacity onPress={() => haritadaKonumAc(item.ad, item.ilce, item.il)}>
                                    <Text style={styles.kartKategori}>📍 {item.ilce || 'Merkez'} / {item.il || 'Ordu'} - {item.kategori}</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <Text style={[styles.tarihEtiket, { color: '#b91c1c', fontWeight: 'bold' }]}>Bitiş Tarihi (Doldu): {item.bitis}</Text>
                              
                              {item.ekleyenUye ? (
                                <TouchableOpacity style={{ marginTop: 4, backgroundColor: '#f1f5f9', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', alignSelf: 'flex-start' }} onPress={() => { setSecilenBasvuruDetay(item); setDetayModalAcikMi(true); }}>
                                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: 'bold' }}>👤 Ekleyen Üye: {item.ekleyenAdSoyad ? `${item.ekleyenAdSoyad} (${item.ekleyenUye})` : item.ekleyenUye} (Detay için tıkla)</Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                            <View style={{ flexDirection: 'column', gap: 5 }}>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#eff6ff' }]} onPress={() => sozlesmeDuzenleHazirlik(item)}>
                                <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: 'bold' }}>✏️ Süreyi Uzat</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]} onPress={() => sozlesmeSil(item.id)}>
                                <Text style={{ color: '#b91c1c', fontSize: 11, fontWeight: 'bold' }}>🗑️ Sil</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={{ textAlign: 'center', color: '#666', marginVertical: 10 }}>Sözleşmesi biten kurum bulunmuyor.</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={[styles.adminBlok, { marginTop: 15, borderColor: '#475569', borderWidth: 2 }]}>
                  <TouchableOpacity style={styles.akordeonBaslikAlani} onPress={() => setPasifOlanlarAcikMi(!pasifOlanlarAcikMi)}>
                    <Text style={[styles.blokBaslikDokunmatik, { color: '#334155', marginBottom: 0 }]}>🟡 Pasif Olanlar ({pasifOlanlarListesi.length})</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#334155' }}>{pasifOlanlarAcikMi ? '➖' : '➕'}</Text>
                  </TouchableOpacity>

                  {pasifOlanlarAcikMi && (
                    <View style={{ marginTop: 15 }}>
                      <Text style={{ fontSize: 11, color: '#475569', marginBottom: 10, fontWeight: '600' }}>ℹ️ Sözleşme süresi devam ettiği halde manuel olarak pasife alınan kurumlar aşağıda listelenmektedir.</Text>
                      {pasifOlanlarListesi.length > 0 ? (
                        pasifOlanlarListesi.map(item => (
                          <View key={item.id} style={[styles.kart, { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }]}>
                            <View style={styles.kartSol}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                {item.dosyaUrl ? (
                                  <TouchableOpacity onPress={() => dosyaGoruntule(item.dosyaUrl)}>
                                    <Image source={{ uri: item.dosyaUrl }} resizeMode="cover" style={{ width: 45, height: 45, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#cbd5e1' }} />
                                  </TouchableOpacity>
                                ) : null}
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.kartIsim}>{item.ad}</Text>
                                    <View style={{ backgroundColor: '#fef08a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fde047' }}>
                                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#854d0e' }}>PASİF</Text>
                                    </View>
                                  </View>
                                  <TouchableOpacity onPress={() => haritadaKonumAc(item.ad, item.ilce, item.il)}>
                                    <Text style={styles.kartKategori}>📍 {item.ilce || 'Merkez'} / {item.il || 'Ordu'} - {item.kategori}</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <Text style={styles.tarihEtiket}>Süre: {item.baslangic} - {item.bitis}</Text>
                              
                              {item.ekleyenUye ? (
                                <TouchableOpacity style={{ marginTop: 4, backgroundColor: '#f1f5f9', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', alignSelf: 'flex-start' }} onPress={() => { setSecilenBasvuruDetay(item); setDetayModalAcikMi(true); }}>
                                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: 'bold' }}>👤 Ekleyen Üye: {item.ekleyenAdSoyad ? `${item.ekleyenAdSoyad} (${item.ekleyenUye})` : item.ekleyenUye} (Detay için tıkla)</Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                            <View style={{ flexDirection: 'column', gap: 5 }}>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#eff6ff' }]} onPress={() => sozlesmeDuzenleHazirlik(item)}>
                                <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: 'bold' }}>✏️ Düzenle</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]} onPress={() => kurumAktifPasifDegistir(item)}>
                                <Text style={{ color: '#166534', fontSize: 11, fontWeight: 'bold' }}>🟢 Aktif Yap</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]} onPress={() => sozlesmeSil(item.id)}>
                                <Text style={{ color: '#b91c1c', fontSize: 11, fontWeight: 'bold' }}>🗑️ Sil</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={{ textAlign: 'center', color: '#666', marginVertical: 10 }}>Manuel olarak pasife alınmış kurum bulunmuyor.</Text>
                      )}
                    </View>
                  )}
                </View>

                <View style={[styles.adminBlok, { marginTop: 15 }]}>
                  <TouchableOpacity style={styles.akordeonBaslikAlani} onPress={yeniSozlesmeFormunuAc}>
                    <Text style={styles.blokBaslikDokunmatik}>{duzenlenenId ? '✏️ Sözleşme Güncelle' : '➕ Yeni Sözleşme Ekle'}</Text>
                    <Text style={{ fontWeight: 'bold' }}>{formAcikMi ? '➖' : '➕'}</Text>
                  </TouchableOpacity>
                  {formAcikMi && (
                    <View style={{ marginTop: 15 }}>
                      <Text style={styles.inputEtiket}>A4 Belgesi / Fotoğrafı</Text>
                      <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: 'bold', marginBottom: 6 }}>⚠️ İlgili belgenin yüklenmesi ZORUNLUDUR! (Anlaşma metninin fotoğrafı ;başlangıç ve bitiş tarihinin görüleceği şekilde.)</Text>
                      
                      {dosyaUrl ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }}>
                          <TouchableOpacity onPress={() => dosyaGoruntule(dosyaUrl)}>
                            <Image source={{ uri: dosyaUrl }} resizeMode="cover" style={{ width: 60, height: 60, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#cbd5e1' }} />
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00205B' }} numberOfLines={1}>{dosyaAdi || 'Belge Yüklendi'}</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                              <TouchableOpacity onPress={() => sozlesmeBelgesiSec(false)}>
                                <Text style={{ fontSize: 11, color: '#0369a1', fontWeight: 'bold' }}>🔄 Belgeyi Değiştir</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => { setDosyaUrl(null); setDosyaAdi(''); }}>
                                <Text style={{ fontSize: 11, color: '#b91c1c', fontWeight: 'bold' }}>🗑️ Belgeyi Sil</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.dosyaYukleKutusu} onPress={() => sozlesmeBelgesiSec(false)}>
                          <Text style={styles.dosyaYukleYazisi}>📂 Belge Seç veya Kamera ile Çek (Zorunlu)</Text>
                        </TouchableOpacity>
                      )}

                      <Text style={styles.inputEtiket}>Kurum Adı</Text>
                      <TextInput style={styles.inputField} value={formKurumAdi} onChangeText={setFormKurumAdi} placeholder="Kurum Adı" />

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <Text style={styles.inputEtiket}>Kategori Seçin veya Yeni Kategori Yazın</Text>
                        <TouchableOpacity onPress={() => setKategoriYonetimModalAcikMi(true)}>
                          <Text style={{ fontSize: 11, color: '#0369a1', fontWeight: 'bold' }}>⚙️ Kategorileri Yönet</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.dropdownKutusu} onPress={() => setFormKatDropdownAcikMi(true)}>
                        <Text style={styles.dropdownKutusuYazisi}>{formSeciliKategori || 'Kategori Seçiniz...'}</Text>
                      </TouchableOpacity>
                      <TextInput 
                        style={[styles.inputField, { marginTop: 4 }]} 
                        placeholder="Listede yoksa yeni kategori adı yazabilirsiniz..." 
                        value={yeniKategoriGeciciInput} 
                        onChangeText={setYeniKategoriGeciciInput} 
                      />

                      <Text style={styles.inputEtiket}>Avantaj Detayı</Text>
                      <TextInput style={styles.inputField} value={formAvantajDetayi} onChangeText={setFormAvantajDetayi} placeholder="Örn: %20 İndirim" />

                      <View style={styles.satir}>
                        <View style={{ flex: 1, marginRight: 5 }}><Text style={styles.inputEtiket}>Başlangıç</Text><TextInput style={styles.inputField} value={formBaslangic} onChangeText={setFormBaslangic} placeholder="Örn: 01.01.2026" /></View>
                        <View style={{ flex: 1 }}><Text style={styles.inputEtiket}>Bitiş</Text><TextInput style={styles.inputField} value={formBitis} onChangeText={setFormBitis} placeholder="Örn: 31.12.2026" /></View>
                      </View>

                      <Text style={styles.inputEtiket}>İl Seçin</Text>
                      <TouchableOpacity style={styles.dropdownKutusu} onPress={() => setFormIlDropdownAcikMi(true)}>
                        <Text style={styles.dropdownKutusuYazisi}>📍 {formSeciliIl}</Text>
                      </TouchableOpacity>

                      <Text style={styles.inputEtiket}>İlçe Seçin</Text>
                      <TouchableOpacity style={styles.dropdownKutusu} onPress={() => setFormIlceDropdownAcikMi(true)}>
                        <Text style={styles.dropdownKutusuYazisi}>🏘️ {formSeciliIlce}</Text>
                      </TouchableOpacity>

                      {kurumEkleHatasi ? (
                        <Text style={{ color: '#dc3545', fontSize: 12, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' }}>
                          {kurumEkleHatasi}
                        </Text>
                      ) : null}

                      <View style={styles.satir}>
                        <TouchableOpacity style={[styles.kaydetButon, { flex: 2, backgroundColor: '#00205B', marginRight: 5 }]} onPress={sozlesmeyiKaydet}>
                          <Text style={styles.kaydetButonYazi}>💾 Kaydet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.kaydetButon, { flex: 1, backgroundColor: '#64748b', marginLeft: 5 }]} onPress={() => { setFormAcikMi(false); formuTemizle(); }}>
                          <Text style={styles.kaydetButonYazi}>Kapat</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                <View style={[styles.adminBlok, { marginTop: 15 }]}>
                  <Text style={styles.blokBaslik}>📋 Anlaşmalı İşletmeleri Yönet (Aktif Listesi)</Text>
                  
                  <View style={styles.filtrelemeKutusu}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.filtreBaslik}>🔍 Listeleme Filtreleri</Text>
                      <TouchableOpacity onPress={filtreleriSifirlaAdmin} style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#b91c1c' }}>🔄 Filtreleri Sıfırla</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.satir}>
                      <TouchableOpacity style={[styles.dropdownKutusu, { flex: 1, marginRight: 5 }]} onPress={() => setAdminIlDrop(true)}>
                        <Text style={styles.dropdownKutusuYazisi}>İl: {adminSeciliIl}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.dropdownKutusu, { flex: 1, marginLeft: 5 }]} onPress={() => setAdminIlceDrop(true)}>
                        <Text style={styles.dropdownKutusuYazisi}>İlçe: {adminSeciliIlce}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.dropdownKutusu, { marginTop: 5 }]} onPress={() => setAdminKatDrop(true)}>
                      <Text style={styles.dropdownKutusuYazisi}>Kategori: {adminSeciliKat}</Text>
                    </TouchableOpacity>
                  </View>

                  <div style={styles.manuelLimitSatiri}>
                    <Text style={{ fontSize: 12, fontWeight: '600', flex: 2, color: '#333' }}>Sayfa Başına Gösterim:</Text>
                    <TextInput style={styles.manuelLimitInputKutusu} value={adminLimitInput} onChangeText={setAdminLimitInput} keyboardType="numeric" />
                  </div>

                  {sayfalanmisAdminIsletmeler.length > 0 ? (
                    sayfalanmisAdminIsletmeler.map(item => (
                      <View key={item.id} style={[styles.kart, { backgroundColor: '#f8fafc' }]}>
                        <View style={styles.kartSol}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            {item.dosyaUrl ? (
                              <TouchableOpacity onPress={() => dosyaGoruntule(item.dosyaUrl)}>
                                <Image source={{ uri: item.dosyaUrl }} resizeMode="cover" style={{ width: 45, height: 45, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#cbd5e1' }} />
                              </TouchableOpacity>
                            ) : null}
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.kartIsim}>{item.ad}</Text>
                                <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0' }}>
                                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#166534' }}>AKTİF</Text>
                                </View>
                              </View>
                              <TouchableOpacity onPress={() => haritadaKonumAc(item.ad, item.ilce, item.il)}>
                                <Text style={styles.kartKategori}>📍 {item.ilce || 'Merkez'} / {item.il || 'Ordu'} - {item.kategori}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={styles.tarihEtiket}>Avantaj: {item.indirim} | Süre: {item.baslangic} - {item.bitis}</Text>
                          
                          {item.ekleyenUye ? (
                            <TouchableOpacity style={{ marginTop: 4, backgroundColor: '#f1f5f9', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', alignSelf: 'flex-start' }} onPress={() => { setSecilenBasvuruDetay(item); setDetayModalAcikMi(true); }}>
                              <Text style={{ fontSize: 11, color: '#334155', fontWeight: 'bold' }}>👤 Ekleyen Üye: {item.ekleyenAdSoyad ? `${item.ekleyenAdSoyad} (${item.ekleyenUye})` : item.ekleyenUye} (Detay için tıkla)</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                        <View style={{ flexDirection: 'column', gap: 5 }}>
                          <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#eff6ff' }]} onPress={() => sozlesmeDuzenleHazirlik(item)}>
                            <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: 'bold' }}>✏️ Düzenle</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#fef08a', borderColor: '#fde047' }]} onPress={() => kurumAktifPasifDegistir(item)}>
                            <Text style={{ color: '#854d0e', fontSize: 11, fontWeight: 'bold' }}>🟡 Pasif Yap</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.evrakButon, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]} onPress={() => sozlesmeSil(item.id)}>
                            <Text style={{ color: '#b91c1c', fontSize: 11, fontWeight: 'bold' }}>🗑️ Sil</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={{ textAlign: 'center', color: '#666', marginVertical: 15 }}>Bu filtrelere uygun aktif işletme bulunamadı.</Text>
                  )}

                  {adminLimit < filtrelenmisAdminIsletmeler.length && adminToplamSayfa > 1 && (
                    <View style={styles.sayfalamaNavigasyonSatiri}>
                      <TouchableOpacity style={styles.sayfaGezmeButon} disabled={adminMevcutSayfa === 1} onPress={() => setAdminMevcutSayfa(adminMevcutSayfa - 1)}><Text>◀️ Geri</Text></TouchableOpacity>
                      <Text style={styles.sayfaNumaraYazisi}>{adminMevcutSayfa} / {adminToplamSayfa}</Text>
                      <TouchableOpacity style={styles.sayfaGezmeButon} disabled={adminMevcutSayfa === adminToplamSayfa} onPress={() => setAdminMevcutSayfa(adminMevcutSayfa + 1)}><Text>İleri ▶️</Text></TouchableOpacity>
                    </View>
                  )}
                </View>

              </View>
            )}
          </View>
        )}

        <Modal visible={detayModalAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={[styles.dropdownMenuKonteyner, { width: 360 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.modalBaslikYazOriginal, { marginBottom: 0 }]}>👤 Kurumu Ekleyen Üye</Text>
                <TouchableOpacity onPress={() => setDetayModalAcikMi(false)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }}>✕</Text>
                </TouchableOpacity>
              </View>
              {secilenBasvuruDetay && (
                <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 15 }}>
                  <Text style={{ fontSize: 13, color: '#333', marginBottom: 6 }}>🏷️ <Text style={{ fontWeight: 'bold' }}>Ad Soyad:</Text> {secilenBasvuruDetay.ekleyenAdSoyad || 'Belirtilmemiş'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#333', flex: 1 }}>📧 <Text style={{ fontWeight: 'bold' }}>E-posta:</Text> {secilenBasvuruDetay.ekleyenUye}</Text>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#00205B', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 6 }} 
                      onPress={() => uyeKurumBilgisiMailGonder(secilenBasvuruDetay)}
                    >
                      <Text style={{ fontSize: 12 }}>✉️</Text>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Mail Gönder</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: 13, color: '#333' }}>📞 <Text style={{ fontWeight: 'bold' }}>Telefon:</Text> {secilenBasvuruDetay.ekleyenTelefon || 'Belirtilmemiş'}</Text>
                </View>
              )}
              <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#00205B', marginTop: 0 }]} onPress={() => setDetayModalAcikMi(false)}>
                <Text style={styles.kaydetButonYazi}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={profilModalAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={[styles.dropdownMenuKonteyner, { width: '90%', maxWidth: 400 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={[styles.modalBaslikYazOriginal, { marginBottom: 0 }]}>
                  {girisYapmisKullanici ? '👤 Profil ve Bilgi Düzenleme' : (uyeKayitModu ? '📝 Hemen Üye Ol' : '🔐 Üye Girişi')}
                </Text>
                <TouchableOpacity onPress={() => setProfilModalAcikMi(false)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {girisYapmisKullanici ? (
                <ScrollView style={{ maxHeight: 420 }}>
                  <View style={{ backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, marginBottom: 15 }}>
                    <Text style={{ fontSize: 13, color: '#333', marginBottom: 6 }}>📧 <Text style={{ fontWeight: 'bold' }}>E-posta:</Text> {girisYapmisKullanici.email} <Text style={{ fontSize: 10, color: '#64748b' }}>(Değiştirilemez)</Text></Text>
                  </View>

                  <Text style={styles.inputEtiket}>Ad Soyad</Text>
                  <TextInput style={styles.inputField} placeholder="Adınız Soyadınız" value={profilAdSoyadGuncelle} onChangeText={setProfilAdSoyadGuncelle} />

                  <Text style={styles.inputEtiket}>Telefon Numarası</Text>
                  <TextInput style={styles.inputField} placeholder="05XXXXXXXXX" value={profilTelefonGuncelle} onChangeText={setProfilTelefonGuncelle} keyboardType="phone-pad" />

                  <Text style={styles.inputEtiket}>Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</Text>
                  <TextInput style={styles.inputField} placeholder="Yeni şifreniz" value={profilSifreGuncelle} onChangeText={setProfilSifreGuncelle} secureTextEntry={true} />

                  <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#4B9B28', marginTop: 5, marginBottom: 15 }]} onPress={profilBilgileriniGuncelle}>
                    <Text style={styles.kaydetButonYazi}>💾 Bilgileri Güncelle</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#64748b', marginTop: 0, marginBottom: 15 }]} onPress={async () => { 
                    await AsyncStorage.removeItem('@giris_yapan_uye');
                    setGirisYapmisKullanici(null); 
                    setProfilModalAcikMi(false); 
                    Alert.alert("Bilgi", "Oturum kapatıldı."); 
                  }}>
                    <Text style={styles.kaydetButonYazi}>Oturumu Kapat</Text>
                  </TouchableOpacity>

                  <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, alignItems: 'center' }}>
                    <TouchableOpacity onPress={uveyiSil} style={{ padding: 4 }}>
                      <Text style={{ fontSize: 11, color: '#ef4444', textDecorationLine: 'underline', fontWeight: '600' }}>⚠️ Üyeliğimi Kalıcı Olarak İptal Et</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', marginBottom: 15, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 3 }}>
                    <TouchableOpacity style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: !uyeKayitModu ? '#00205B' : 'transparent', borderRadius: 6 }} onPress={() => { setUyeKayitModu(false); setGirisHatasi(''); }}>
                      <Text style={{ color: !uyeKayitModu ? '#fff' : '#64748b', fontWeight: 'bold', fontSize: 12 }}>Giriş Yap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: uyeKayitModu ? '#00205B' : 'transparent', borderRadius: 6 }} onPress={() => { setUyeKayitModu(true); setGirisHatasi(''); }}>
                      <Text style={{ color: uyeKayitModu ? '#fff' : '#64748b', fontWeight: 'bold', fontSize: 12 }}>Kayıt Ol</Text>
                    </TouchableOpacity>
                  </View>

                  {uyeKayitModu && (
                    <>
                      <Text style={styles.inputEtiket}>Ad Soyad *</Text>
                      <TextInput style={styles.inputField} placeholder="Adınız Soyadınız" value={authAdSoyad} onChangeText={setAuthAdSoyad} />
                    </>
                  )}

                  <Text style={styles.inputEtiket}>E-posta Adresi *</Text>
                  <TextInput style={styles.inputField} placeholder="ornek@mail.com" value={authEmail} onChangeText={setAuthEmail} keyboardType="email-address" autoCapitalize="none" />

                  {uyeKayitModu && (
                    <>
                      <Text style={styles.inputEtiket}>Telefon Numarası (Opsiyonel)</Text>
                      <TextInput style={styles.inputField} placeholder="05XXXXXXXXX" value={authTelefon} onChangeText={setAuthTelefon} keyboardType="phone-pad" />
                    </>
                  )}

                  <Text style={styles.inputEtiket}>Şifre *</Text>
                  <TextInput style={styles.inputField} placeholder="Şifreniz" value={authSifre} onChangeText={setAuthSifre} secureTextEntry={true} />

                  {girisHatasi ? (
                    <Text style={{ color: '#dc3545', fontSize: 12, marginBottom: 10, fontWeight: 'bold', textAlign: 'center' }}>
                      {girisHatasi}
                    </Text>
                  ) : null}

                  <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#00205B', marginTop: 5 }]} onPress={kullaniciGirisVeyaKayitYap}>
                    <Text style={styles.kaydetButonYazi}>{uyeKayitModu ? 'Kayıt Ol ve Giriş Yap' : 'Giriş Yap'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={uyeKurumEkleModalAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={[styles.dropdownMenuKonteyner, { width: '90%', maxWidth: 500, maxHeight: '90%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.modalBaslikYazOriginal, { marginBottom: 0 }]}>➕ Anlaşmalı Kurum Ekle (Başvuru)</Text>
                <TouchableOpacity onPress={() => setUyeKurumEkleModalAcikMi(false)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 450 }}>
                <Text style={styles.inputEtiket}>A4 Belgesi / Fotoğrafı</Text>
                <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: 'bold', marginBottom: 6 }}>⚠️ İlgili belgenin yüklenmesi ZORUNLUDUR! (Anlaşma metninin fotoğrafı ;başlangıç ve bitiş tarihinin görüleceği şekilde.)</Text>

                {dosyaUrl ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }}>
                    <TouchableOpacity onPress={() => dosyaGoruntule(dosyaUrl)}>
                      <Image source={{ uri: dosyaUrl }} resizeMode="cover" style={{ width: 60, height: 60, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#cbd5e1' }} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00205B' }} numberOfLines={1}>{dosyaAdi || 'Belge Yüklendi'}</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        <TouchableOpacity onPress={() => sozlesmeBelgesiSec(true)}>
                          <Text style={{ fontSize: 11, color: '#0369a1', fontWeight: 'bold' }}>🔄 Belgeyi Değiştir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setDosyaUrl(null); setDosyaAdi(''); }}>
                          <Text style={{ fontSize: 11, color: '#b91c1c', fontWeight: 'bold' }}>🗑️ Belgeyi Sil</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.dosyaYukleKutusu} onPress={() => sozlesmeBelgesiSec(true)}>
                    <Text style={styles.dosyaYukleYazisi}>📂 Belge Seç veya Kamera ile Çek (Zorunlu)</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.inputEtiket}>Kurum Adı</Text>
                <TextInput style={styles.inputField} value={formKurumAdi} onChangeText={setFormKurumAdi} placeholder="Kurum Adı" />

                <Text style={styles.inputEtiket}>Kategori Seçin veya Yeni Kategori Yazın</Text>
                <TouchableOpacity style={styles.dropdownKutusu} onPress={() => setFormKatDropdownAcikMi(true)}>
                  <Text style={styles.dropdownKutusuYazisi}>{formSeciliKategori || 'Kategori Seçiniz...'}</Text>
                </TouchableOpacity>
                <TextInput 
                  style={[styles.inputField, { marginTop: 4 }]} 
                  placeholder="Listede yoksa yeni kategori adı yazabilirsiniz..." 
                  value={yeniKategoriGeciciInput} 
                  onChangeText={setYeniKategoriGeciciInput} 
                />

                <Text style={styles.inputEtiket}>Avantaj Detayı</Text>
                <TextInput style={styles.inputField} value={formAvantajDetayi} onChangeText={setFormAvantajDetayi} placeholder="Örn: %20 İndirim" />

                <View style={styles.satir}>
                  <View style={{ flex: 1, marginRight: 5 }}><Text style={styles.inputEtiket}>Başlangıç</Text><TextInput style={styles.inputField} value={formBaslangic} onChangeText={setFormBaslangic} placeholder="Örn: 01.01.2026" /></View>
                  <View style={{ flex: 1 }}><Text style={styles.inputEtiket}>Bitiş</Text><TextInput style={styles.inputField} value={formBitis} onChangeText={setFormBitis} placeholder="Örn: 31.12.2026" /></View>
                </View>

                <Text style={styles.inputEtiket}>İl Seçin</Text>
                <TouchableOpacity style={styles.dropdownKutusu} onPress={() => setFormIlDropdownAcikMi(true)}>
                  <Text style={styles.dropdownKutusuYazisi}>📍 {formSeciliIl}</Text>
                </TouchableOpacity>

                <Text style={styles.inputEtiket}>İlçe Seçin</Text>
                <TouchableOpacity style={styles.dropdownKutusu} onPress={() => setFormIlceDropdownAcikMi(true)}>
                  <Text style={styles.dropdownKutusuYazisi}>🏘️ {formSeciliIlce}</Text>
                </TouchableOpacity>

                {kurumEkleHatasi ? (
                  <Text style={{ color: '#dc3545', fontSize: 12, marginVertical: 8, fontWeight: 'bold', textAlign: 'center' }}>
                    {kurumEkleHatasi}
                  </Text>
                ) : null}
              </ScrollView>

              <View style={[styles.satir, { marginTop: 15 }]}>
                <TouchableOpacity 
                  style={[styles.kaydetButon, { flex: 2, backgroundColor: '#00205B', marginRight: 5, marginTop: 0 }]} 
                  onPress={uyeKurumBasvurusuGonder}
                  activeOpacity={0.7}
                >
                  <Text style={styles.kaydetButonYazi}>🚀 Başvuruyu Gönder</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.kaydetButon, { flex: 1, backgroundColor: '#64748b', marginLeft: 5, marginTop: 0 }]} 
                  onPress={() => setUyeKurumEkleModalAcikMi(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.kaydetButonYazi}>İptal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={!!tamEkranGorsel} transparent={true} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 600, height: '80%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
              <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10, zIndex: 99, backgroundColor: '#ef4444', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }} onPress={() => setTamEkranGorsel(null)}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
              {tamEkranGorsel && tamEkranGorsel.startsWith('data:image/') ? (
                <Image source={{ uri: tamEkranGorsel }} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <Text style={{ color: '#333', textAlign: 'center' }}>Önizleme gösteriliyor.</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={kategoriYonetimModalAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={[styles.dropdownMenuKonteyner, { width: 380 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.modalBaslikYazOriginal, { marginBottom: 0 }]}>Kategori Yönetimi</Text>
                <TouchableOpacity onPress={() => setKategoriYonetimModalAcikMi(false)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                <View style={{ backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                  <Text style={styles.inputEtiket}>Yeni Kategori Ekle</Text>
                  <TextInput style={styles.inputField} placeholder="Kategori adı..." value={yeniKategoriAdi} onChangeText={setYeniKategoriAdi} />
                  <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#4B9B28', marginTop: 4 }]} onPress={kategoriEkle}>
                    <Text style={styles.kaydetButonYazi}>➕ Kategori Ekle</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00205B', marginBottom: 6 }}>Mevcut Kategoriler</Text>
                {kategoriler.map(kat => (
                  <View key={kat.id} style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: '#cbd5e1' }}>
                    {duzenlenenKategoriId === kat.id ? (
                      <View>
                        <TextInput style={styles.inputField} value={duzenlenenKategoriAdi} onChangeText={setDuzenlenenKategoriAdi} />
                        <View style={styles.satir}>
                          <TouchableOpacity style={[styles.kaydetButon, { flex: 1, backgroundColor: '#00205B', marginRight: 4, padding: 8 }]} onPress={() => kategoriGuncelle(kat.id)}>
                            <Text style={styles.kaydetButonYazi}>Kaydet</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.kaydetButon, { flex: 1, backgroundColor: '#64748b', marginLeft: 4, padding: 8 }]} onPress={() => setDuzenlenenKategoriId(null)}>
                            <Text style={styles.kaydetButonYazi}>İptal</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{kat.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity style={{ backgroundColor: '#e0f2fe', padding: 6, borderRadius: 6 }} onPress={() => { setDuzenlenenKategoriId(kat.id); setDuzenlenenKategoriAdi(kat.name); }}>
                            <Text style={{ fontSize: 12 }}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={{ backgroundColor: '#fef2f2', padding: 6, borderRadius: 6 }} onPress={() => kategoriSil(kat.id)}>
                            <Text style={{ fontSize: 12 }}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setKategoriYonetimModalAcikMi(false)}>
                <Text style={styles.kaydetButonYazi}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={hamburgerMenuAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.modalBaslikYazOriginal}>Menü</Text>
                <TouchableOpacity onPress={() => setHamburgerMenuAcikMi(false)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                <TouchableOpacity style={styles.dropdownMenuSatir} onPress={() => { setHamburgerMenuAcikMi(false); setReklamYonetimModalAcikMi(true); }}>
                  <Text style={{ color: '#00205B', fontWeight: 'bold' }}>📢 Reklam & Sponsorluk Yönetimi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownMenuSatir} onPress={() => { setHamburgerMenuAcikMi(false); setSosyalAyarlarModalAcikMi(true); }}>
                  <Text style={{ color: '#00205B', fontWeight: 'bold' }}>🌐 Kurumsal İletişim & Sosyal Ayarlar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownMenuSatir} onPress={() => { setHamburgerMenuAcikMi(false); setSifreDegistirModalAcikMi(true); }}>
                  <Text style={{ color: '#00205B', fontWeight: 'bold' }}>🔑 Giriş Şifresini Değiştir</Text>
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#ef4444', marginTop: 15 }]} onPress={() => { setHamburgerMenuAcikMi(false); setAdminGirisYaptiMi(false); }}>
                <Text style={styles.kaydetButonYazi}>Güvenli Çıkış</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={reklamYonetimModalAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={[styles.dropdownMenuKonteyner, { width: 380 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.modalBaslikYazOriginal, { marginBottom: 0 }]}>Reklam & Sponsorluk Yönetimi</Text>
                <TouchableOpacity onPress={() => setReklamYonetimModalAcikMi(false)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled={true}>
                
                <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00205B' }}>Google Ads (AdMob) Banner</Text>
                      <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Mobilde Google reklamlarını aç/kapat</Text>
                    </View>
                    <Switch 
                      value={googleAdsBannerAktifMi} 
                      onValueChange={(val) => googleAdsBannerAyariniKaydet(val)} 
                    />
                  </View>
                </View>

                <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00205B' }}>"Buraya Reklam Verin" Banner'ı</Text>
                      <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Boş kaldığında gösterilen çağrı banner'ını aç/kapat</Text>
                    </View>
                    <Switch 
                      value={defaultBannerAktifMi} 
                      onValueChange={(val) => defaultBannerAyariniKaydet(val)} 
                    />
                  </View>
                </View>

                <TouchableOpacity style={{ backgroundColor: '#00205B', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }} onPress={yeniBannerFormunuAcVeyaKapat}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>➕ Yeni Banner / Reklam Ekle</Text>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{yeniBannerFormAcikMi ? '➖' : '➕'}</Text>
                </TouchableOpacity>

                {yeniBannerFormAcikMi && (
                  <View style={{ backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1' }}>
                    <TextInput style={styles.inputField} placeholder="Reklam / Şirket Başlığı" value={yeniReklamBaslik} onChangeText={setYeniReklamBaslik} />
                    
                    <Text style={styles.inputEtiket}>Banner Görseli (Logo)</Text>
                    <TouchableOpacity style={[styles.dosyaYukleKutusu, { marginBottom: 10 }]} onPress={() => dosyayiSistemeYukleMobil(setYeniReklamGorsel)}>
                      <Text style={styles.dosyaYukleYazisi}>{yeniReklamGorsel ? '📷 Görsel Seçildi' : '📷 Görsel Seç'}</Text>
                    </TouchableOpacity>
                    {yeniReklamGorsel ? (
                      <View style={{ alignItems: 'center', marginBottom: 10 }}>
                        <Image source={{ uri: yeniReklamGorsel }} resizeMode="contain" style={{ width: 100, height: 40, borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1' }} />
                      </View>
                    ) : null}

                    <TextInput style={styles.inputField} placeholder="Hedef Link (https://...)" value={yeniReklamLink} onChangeText={setYeniReklamLink} />
                    
                    <View style={styles.satir}>
                      <View style={{ flex: 1, marginRight: 5 }}>
                        <Text style={styles.inputEtiket}>Başlangıç Tarihi</Text>
                        <TextInput style={styles.inputField} placeholder="GG.AA.YYYY" value={yeniReklamBaslangic} onChangeText={setYeniReklamBaslangic} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={styles.inputEtiket}>Bitiş Tarihi</Text>
                        <TextInput style={styles.inputField} placeholder="GG.AA.YYYY" value={yeniReklamBitis} onChangeText={setYeniReklamBitis} />
                      </View>
                    </View>

                    <View style={styles.satir}>
                      <TouchableOpacity style={[styles.kaydetButon, { flex: 1, backgroundColor: '#4B9B28', marginRight: 5, marginTop: 5 }]} onPress={sponsorEkle}>
                        <Text style={styles.kaydetButonYazi}>Reklamı Ekle</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.kaydetButon, { flex: 1, backgroundColor: '#64748b', marginLeft: 5, marginTop: 5 }]} onPress={yeniBannerFormunuSifirlaVeKapat}>
                        <Text style={styles.kaydetButonYazi}>İptal</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {sponsorReklamlar.map(s => {
                  const isAktif = s.aktif === true || s.aktif === 'true' || s.aktif === 1 || s.aktif === 'Aktif';
                  return (
                    <View key={s.id} style={[styles.kart, { padding: 10, marginVertical: 6, backgroundColor: '#f8fafc' }]}>
                      <View style={styles.kartSol}>
                        <Text style={styles.kartIsim}>{s.baslik}</Text>
                        <Text style={styles.tarihEtiket}>Süre: {s.baslangic || '-'} / {s.bitis || 'Süresiz'}</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                          <Text style={{ fontSize: 11, color: '#00205B', fontWeight: 'bold' }}>👁️ Gösterim: {s.gosterimSayisi || 0}</Text>
                          <Text style={{ fontSize: 11, color: '#4B9B28', fontWeight: 'bold' }}>👆 Tıklanma: {s.tiklanmaSayisi || 0}</Text>
                        </View>
                        <Text style={{ fontSize: 10, color: isAktif ? '#4B9B28' : '#b91c1c', fontWeight: 'bold', marginTop: 2 }}>
                          {isAktif ? 'Aktif' : 'Pasif'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity style={{ backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#bae6fd', paddingVertical: 5, paddingHorizontal: 6, borderRadius: 6 }} onPress={() => sponsorSayaclariSifirla(s.id)}>
                          <Text style={{ color: '#0369a1', fontSize: 10, fontWeight: 'bold' }}>🔄 Sıfırla</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: '#fef08a', borderWidth: 1, borderColor: '#fde047', padding: 6, borderRadius: 6 }} onPress={() => sponsorDuzenleAc(s)}>
                          <Text style={{ fontSize: 12 }}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', padding: 6, borderRadius: 6 }} onPress={() => sponsorSil(s.id)}>
                          <Text style={{ fontSize: 12 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#00205B', marginTop: 15 }]} onPress={() => setReklamYonetimModalAcikMi(false)}>
                <Text style={styles.kaydetButonYazi}>Pencereyi Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={reklamDuzenleModalAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={[styles.dropdownMenuKonteyner, { width: 350 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.modalBaslikYazOriginal, { marginBottom: 0 }]}>Reklamı Düzenle</Text>
                <TouchableOpacity onPress={() => setReklamDuzenleModalAcikMi(false)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 340 }}>
                <Text style={styles.inputEtiket}>Reklam Başlığı</Text>
                <TextInput style={styles.inputField} value={reklamFormBaslik} onChangeText={setReklamFormBaslik} placeholder="Başlık" />

                <Text style={styles.inputEtiket}>Banner Görseli (Logo)</Text>
                <TouchableOpacity style={styles.dosyaYukleKutusu} onPress={() => dosyayiSistemeYukleMobil(setReklamFormGorsel)}>
                  <Text style={styles.dosyaYukleYazisi}>{reklamFormGorsel ? '📷 Görsel Seçildi (Değiştir)' : '📷 Görsel Seçilmedi'}</Text>
                </TouchableOpacity>
                {reklamFormGorsel ? (
                  <View style={{ alignItems: 'center', marginBottom: 10 }}>
                    <Image source={{ uri: reklamFormGorsel }} resizeMode="contain" style={{ width: 120, height: 45, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' }} />
                  </View>
                ) : null}

                <Text style={styles.inputEtiket}>Hedef Link (Web veya YouTube URL)</Text>
                <TextInput style={styles.inputField} value={reklamFormLink} onChangeText={setReklamFormLink} placeholder="https://..." />

                <View style={styles.satir}>
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <Text style={styles.inputEtiket}>Başlangıç Tarihi</Text>
                    <TextInput style={styles.inputField} value={reklamFormBaslangic} onChangeText={setReklamFormBaslangic} placeholder="GG.AA.YYYY" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text style={styles.inputEtiket}>Bitiş Tarihi</Text>
                    <TextInput style={styles.inputField} value={reklamFormBitis} onChangeText={setReklamFormBitis} placeholder="GG.AA.YYYY" />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10, paddingHorizontal: 5 }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#00205B' }}>Reklam Yayında / Aktif</Text>
                  <Switch value={reklamFormAktif} onValueChange={setReklamFormAktif} />
                </View>
              </ScrollView>

              <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={reklamGuncelleKaydet}>
                <Text style={styles.kaydetButonYazi}>Reklamı Güncelle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownKapatButon, { alignItems: 'center', marginTop: 5 }]} onPress={() => setReklamDuzenleModalAcikMi(false)}>
                <Text style={{ color: '#64748b', fontWeight: 'bold' }}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={sosyalAyarlarModalAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={[styles.dropdownMenuKonteyner, { width: 370 }]}>
              <Text style={styles.modalBaslikYazOriginal}>Kurumsal İletişim & Sosyal Ayarlar</Text>
              <ScrollView style={{ maxHeight: 380 }}>
                
                <Text style={styles.inputEtiket}>Adres Bilgisi</Text>
                <TextInput style={styles.inputField} placeholder="Kurumsal adres..." value={sosyalAdres} onChangeText={setSosyalAdres} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: 'bold' }}>Ana Sayfada Göster (Tik)</Text>
                  <Switch value={sosyalAdresAktifMi} onValueChange={setSosyalAdresAktifMi} />
                </View>

                <Text style={styles.inputEtiket}>E-posta Adresi</Text>
                <TextInput style={styles.inputField} placeholder="ornek@kurum.com" value={sosyalEposta} onChangeText={setSosyalEposta} autoCapitalize="none" keyboardType="email-address" />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: 'bold' }}>Ana Sayfada Göster (Tik)</Text>
                  <Switch value={sosyalEpostaAktifMi} onValueChange={setSosyalEpostaAktifMi} />
                </View>

                <Text style={styles.inputEtiket}>Facebook Sayfa Linki</Text>
                <TextInput style={styles.inputField} placeholder="facebook.com/sayfaniz" value={sosyalFacebook} onChangeText={setSosyalFacebook} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: 'bold' }}>Ana Sayfada Göster (Tik)</Text>
                  <Switch value={sosyalFacebookAktifMi} onValueChange={setSosyalFacebookAktifMi} />
                </View>

                <Text style={styles.inputEtiket}>Twitter / X Profil Linki</Text>
                <TextInput style={styles.inputField} placeholder="x.com/kullaniciadi" value={sosyalTwitter} onChangeText={setSosyalTwitter} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: 'bold' }}>Ana Sayfada Göster (Tik)</Text>
                  <Switch value={sosyalTwitterAktifMi} onValueChange={setSosyalTwitterAktifMi} />
                </View>

                <Text style={styles.inputEtiket}>Instagram Profil Linki</Text>
                <TextInput style={styles.inputField} placeholder="instagram.com/..." value={sosyalInstagram} onChangeText={setSosyalInstagram} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: 'bold' }}>Ana Sayfada Göster (Tik)</Text>
                  <Switch value={sosyalInstagramAktifMi} onValueChange={setSosyalInstagramAktifMi} />
                </View>

                <Text style={styles.inputEtiket}>Linkedin Kanal Linki</Text>
                <TextInput style={styles.inputField} placeholder="linkedin.com/in/..." value={sosyalLinkedin} onChangeText={setSosyalLinkedin} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: 'bold' }}>Ana Sayfada Göster (Tik)</Text>
                  <Switch value={sosyalLinkedinAktifMi} onValueChange={setSosyalLinkedinAktifMi} />
                </View>

                <Text style={styles.inputEtiket}>WhatsApp Telefon Numarası / Grup Linki</Text>
                <TextInput style={styles.inputField} placeholder="whatsapp.com/..." value={sosyalWhatsapp} onChangeText={setSosyalWhatsapp} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: 'bold' }}>Ana Sayfada Göster (Tik)</Text>
                  <Switch value={sosyalWhatsappAktifMi} onValueChange={setSosyalWhatsappAktifMi} />
                </View>

              </ScrollView>
              <TouchableOpacity style={[styles.kaydetButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={sosyalAyarlariKaydet}>
                <Text style={styles.kaydetButonYazi}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownKapatButon, { alignItems: 'center', marginTop: 5 }]} onPress={() => setSosyalAyarlarModalAcikMi(false)}>
                <Text style={{ color: '#64748b', fontWeight: 'bold' }}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={sifreDegistirModalAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={[styles.dropdownMenuKonteyner, { width: 320 }]}>
              <Text style={styles.modalBaslikYazOriginal}>🔑 Yönetici Giriş Şifresi Güncelleme</Text>
              <Text style={styles.inputEtiket}>Yeni Giriş Şifresi</Text>
              <TextInput style={styles.inputField} placeholder="Yeni şifre belirleyin..." secureTextEntry={true} value={yeniSifreForm} onChangeText={setYeniSifreForm} />
              <View style={styles.satir}>
                <TouchableOpacity style={[styles.kaydetButon, { flex: 1, backgroundColor: '#00205B', marginRight: 5 }]} onPress={adminSifreGuncelle}>
                  <Text style={styles.kaydetButonYazi}>Güncelle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.kaydetButon, { flex: 1, backgroundColor: '#64748b', marginLeft: 5 }]} onPress={() => setSifreDegistirModalAcikMi(false)}>
                  <Text style={styles.kaydetButonYazi}>İptal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={ilDropdownAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>İl Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                {mevcutIller.map((il, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownMenuSatir} onPress={() => { filtreyiKaydetVeGuncelle('il', il); setIlDropdownAcikMi(false); }}>
                    <Text style={{ fontWeight: seciliIlFiltre === il ? 'bold' : 'normal' }}>📍 {il}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setIlDropdownAcikMi(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={ilceDropdownAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>İlçe Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                {mevcutIlceler.map((ilce, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownMenuSatir} onPress={() => { filtreyiKaydetVeGuncelle('ilce', ilce); setIlceDropdownAcikMi(false); }}>
                    <Text style={{ fontWeight: seciliIlceFiltre === ilce ? 'bold' : 'normal' }}>🏘️ {ilce}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setIlceDropdownAcikMi(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={uyeDropdownAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>Kategori Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                <TouchableOpacity style={styles.dropdownMenuSatir} onPress={() => { filtreyiKaydetVeGuncelle('kategori', 'Hepsi'); setUyeDropdownAcikMi(false); }}>
                  <Text style={{ fontWeight: 'bold' }}>Hepsi</Text>
                </TouchableOpacity>
                {kategoriler.map(kat => (
                  <TouchableOpacity key={kat.id} style={styles.dropdownMenuSatir} onPress={() => { filtreyiKaydetVeGuncelle('kategori', kat.name); setUyeDropdownAcikMi(false); }}>
                    <Text>{kat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setUyeDropdownAcikMi(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={adminIlDrop} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>İl Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                {adminIllerListesi.map((il, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownMenuSatir} onPress={() => { setAdminSeciliIl(il); setAdminSeciliIlce('Hepsi'); setAdminIlDrop(false); }}>
                    <Text style={{ fontWeight: adminSeciliIl === il ? 'bold' : 'normal' }}>📍 {il}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setAdminIlDrop(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={adminIlceDrop} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>İlçe Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                {adminIlcelerListesi.map((ilce, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownMenuSatir} onPress={() => { setAdminSeciliIlce(ilce); setAdminIlceDrop(false); }}>
                    <Text style={{ fontWeight: adminSeciliIlce === ilce ? 'bold' : 'normal' }}>🏘️ {ilce}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setAdminIlceDrop(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={adminKatDrop} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>Kategori Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                <TouchableOpacity style={styles.dropdownMenuSatir} onPress={() => { setAdminSeciliKat('Hepsi'); setAdminKatDrop(false); }}>
                  <Text style={{ fontWeight: 'bold' }}>Hepsi</Text>
                </TouchableOpacity>
                {kategoriler.map(kat => (
                  <TouchableOpacity key={kat.id} style={styles.dropdownMenuSatir} onPress={() => { setAdminSeciliKat(kat.name); setAdminKatDrop(false); }}>
                    <Text>{kat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setAdminKatDrop(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={formIlDropdownAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>İl Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                {formIllerListesi.map((il, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownMenuSatir} onPress={() => { setFormSeciliIl(il); setFormSeciliIlce(TURKIYE_ILLERI_VE_ILCELERI[il][0] || 'Merkez'); setFormIlDropdownAcikMi(false); }}>
                    <Text style={{ fontWeight: formSeciliIl === il ? 'bold' : 'normal' }}>📍 {il}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setFormIlDropdownAcikMi(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={formIlceDropdownAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>İlçe Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                {formIlcelerListesi.map((ilce, idx) => (
                  <TouchableOpacity key={idx} style={styles.dropdownMenuSatir} onPress={() => { setFormSeciliIlce(ilce); setFormIlceDropdownAcikMi(false); }}>
                    <Text style={{ fontWeight: formSeciliIlce === ilce ? 'bold' : 'normal' }}>🏘️ {ilce}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setFormIlceDropdownAcikMi(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={formKatDropdownAcikMi} transparent={true} animationType="fade">
          <View style={styles.modalArkaPlan}>
            <View style={styles.dropdownMenuKonteyner}>
              <Text style={styles.modalBaslikYazOriginal}>Kategori Seçin</Text>
              <ScrollView style={styles.modalDikeyKaydirmaAlani}>
                {kategoriler.map(kat => (
                  <TouchableOpacity key={kat.id} style={styles.dropdownMenuSatir} onPress={() => { setFormSeciliKategori(kat.name); setYeniKategoriGeciciInput(''); setFormKatDropdownAcikMi(false); }}>
                    <Text style={{ fontWeight: formSeciliKategori === kat.name ? 'bold' : 'normal' }}>📂 {kat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.dropdownKapatButon, { backgroundColor: '#00205B', marginTop: 10 }]} onPress={() => setFormKatDropdownAcikMi(false)}><Text style={{ color: '#fff' }}>Kapat</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const logoStyles = StyleSheet.create({
  logoMerkezKonteyner: { flexDirection: 'column', alignItems: 'center', marginVertical: 10 }
});

const styles = StyleSheet.create({
  safeAreaKonteyner: { flex: 1, backgroundColor: '#EBF0F5' },
  anaScrollKonteyner: { flex: 1, backgroundColor: '#EBF0F5' },
  anaScrollIcerik: { paddingHorizontal: '2%', alignSelf: 'center', width: '100%', maxWidth: 1200, paddingBottom: 30 },
  ustSponsorBannerKapsul: { width: '100%', marginBottom: 10, marginTop: 10 },
  sponsorBannerIcerik: { backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1' },
  sponsorBannerBos: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  anaLogoAlani: { alignItems: 'center', marginTop: 10, marginBottom: 10, width: '100%' },
  ustAksiyonBari: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10 },
  hamburgerMenuAlaniKapsul: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 5, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1' },
  navButon: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  aktifNav: { backgroundColor: '#00205B' },
  navYazi: { color: '#475569', fontWeight: 'bold' },
  
  gridMenuKapsul: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  gridMenuKutu: { width: '31%', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 5, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  gridMenuIkon: { fontSize: 24, marginBottom: 6 },
  gridMenuBaslik: { fontSize: 12, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },

  filtrelemeKutusu: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1' },
  filtreBaslik: { fontSize: 13, fontWeight: 'bold', color: '#00205B', marginBottom: 8 },
  sonEklenenlerKapsul: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: '#007A87' },
  sonEklenenlerBaslik: { fontSize: 12, fontWeight: 'bold', color: '#007A87', marginBottom: 6, textAlign: 'center' },
  sonEklenenKart: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  sonKurumIsim: { fontSize: 14, fontWeight: 'bold', color: '#00205B', marginBottom: 2 },
  sonKurumDetay: { fontSize: 11, color: '#475569' },
  sonKurumAvantajKutu: { backgroundColor: '#4B9B28', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sonKurumAvantajYazi: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  aramaBar: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#cbd5e1', color: '#333' },
  kart: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', position: 'relative' },
  kartSol: { flex: 1, marginRight: 10 },
  kartIsim: { fontSize: 16, fontWeight: 'bold', color: '#00205B', marginBottom: 4 },
  kartKategori: { fontSize: 12, color: '#007A87', fontWeight: '600', marginBottom: 4 },
  tarihEtiket: { fontSize: 11, color: '#64748b', marginBottom: 6 },
  evrakButon: { backgroundColor: '#e0f2fe', padding: 6, borderRadius: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#bae6fd', marginTop: 4 },
  evrakButonYazi: { color: '#0369a1', fontSize: 11, fontWeight: 'bold' },
  kartSagKonteyner: { alignItems: 'center', gap: 6, minWidth: 95 },
  yolTarifiButon: { backgroundColor: '#007A87', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 6, width: 90, alignItems: 'center', marginTop: 4 },
  yolTarifiYazi: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  adminBlok: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#cbd5e1' },
  akordeonBaslikAlani: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  blokBaslik: { fontSize: 16, fontWeight: 'bold', color: '#00205B', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 5 },
  blokBaslikDokunmatik: { fontSize: 16, fontWeight: 'bold', color: '#00205B' },
  dosyaYukleKutusu: { backgroundColor: '#f8fafc', borderStyle: 'dashed', borderWidth: 2, borderColor: '#00205B', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  dosyaYukleYazisi: { color: '#00205B', fontWeight: 'bold', fontSize: 13 },
  inputEtiket: { color: '#334155', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  inputField: { backgroundColor: '#EBF0F5', padding: 10, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1', color: '#333' },
  satir: { flexDirection: 'row' },
  kaydetButon: { backgroundColor: '#00205B', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  kaydetButonYazi: { color: '#fff', fontWeight: 'bold' },
  dropdownKutusu: { backgroundColor: '#EBF0F5', height: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  dropdownKutusuYazisi: { color: '#333', fontSize: 12 },
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownMenuKonteyner: { backgroundColor: '#fff', width: 320, padding: 20, borderRadius: 16 },
  modalBaslikYazOriginal: { fontSize: 14, fontWeight: 'bold', color: '#00205B', marginBottom: 15, textAlign: 'center' },
  modalDikeyKaydirmaAlani: { maxHeight: 220 },
  dropdownMenuSatir: { paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownKapatButon: { alignItems: 'center', padding: 12, borderRadius: 8 },
  loginKonteyner: { padding: 20, backgroundColor: '#fff', borderRadius: 12 },
  loginBaslik: { fontSize: 18, fontWeight: 'bold', color: '#00205B', marginBottom: 15, textAlign: 'center' },
  manuelLimitSatiri: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  manuelLimitInputKutusu: { backgroundColor: '#EBF0F5', color: '#4B9B28', width: 70, height: 44, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  sayfalamaNavigasyonSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  sayfaGezmeButon: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  sayfaNumaraYazisi: { color: '#334155', fontSize: 13, fontWeight: 'bold' },
  copyrightMetni: { textAlign: 'center', fontSize: 11, color: '#64748b', fontWeight: 'bold', marginVertical: 10, letterSpacing: 1 },
  kartSag: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, minWidth: 90, borderColor: '#bbf7d0', borderWidth: 1, marginBottom: 4 },
  indirimOrani: { fontSize: 12, fontWeight: 'bold', color: '#4B9B28', textAlign: 'center' },
  indirimEtiket: { fontSize: 9, color: '#475569', fontWeight: 'bold', marginTop: 2 },
  sosyalMedyaDisKapsul: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#cbd5e1', marginTop: 15, width: '100%', alignItems: 'center' },
  sosyalMedyaBaslik: { fontSize: 13, fontWeight: '800', color: '#00205B', marginBottom: 14, letterSpacing: 0.5 },
  sosyalIkonlarSatiri: { flexDirection: 'row', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
  sosyalIkonKutusu: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  sosyalIkonResim: { width: '100%', height: '100%' }
});