const firebaseConfig = {
  apiKey: "AIzaSyBdZgfENLwij4eRQ8HbvghOBliEBdaA-YU",
  authDomain: "shiftkanri-be018.firebaseapp.com",
  projectId: "shiftkanri-be018",
  storageBucket: "shiftkanri-be018.firebasestorage.app",
  messagingSenderId: "1073758060862",
  appId: "1:1073758060862:web:912d0964d46d03f99c2c6f",
  measurementId: "G-6ZMGWGBY6S"
};

// Firebase の初期化
firebase.initializeApp(firebaseConfig);

// Firestore の参照を取得
const db = firebase.firestore();

// タイムスタンプ設定
db.settings({
  timestampsInSnapshots: true
});

// Firebase 認証機能の参照
const auth = firebase.auth();

// シフトスロット定義（実際の運用では Firestore から動的に取得することも可能）
const SHIFT_SLOTS = [
  {
    id: "early",
    name: "早番",
    startTime: "06:00",
    endTime: "14:00",
    className: "slot-early"
  },
  {
    id: "middle",
    name: "中番",
    startTime: "10:00",
    endTime: "18:00",
    className: "slot-middle"
  },
  {
    id: "late",
    name: "遅番",
    startTime: "14:00",
    endTime: "22:00",
    className: "slot-late"
  },
  {
    id: "night",
    name: "夜勤",
    startTime: "22:00",
    endTime: "06:00",
    className: "slot-night"
  }
];

// 部署リスト（実際の運用では Firestore から動的に取得することも可能）
const DEPARTMENTS = [
  { id: "front", name: "フロント" },
  { id: "housekeeping", name: "ハウスキーピング" },
  { id: "restaurant", name: "レストラン" },
  { id: "travel", name: "旅行受付" }
];
