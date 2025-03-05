const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
