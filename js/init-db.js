// このスクリプトはFirestoreの初期データをセットアップするためのものです
// 実際の運用では、適切なセキュリティルールと共に使用してください

// Firebase設定が正しく読み込まれた後に実行します
document.addEventListener('DOMContentLoaded', function() {
  // 初期化ボタンを作成 (開発時のみ使用)
  const initButton = document.createElement('button');
  initButton.textContent = 'データベース初期化 (開発用)';
  initButton.className = 'btn btn-warning position-fixed bottom-0 end-0 m-3';
  initButton.style.zIndex = 1000;
  document.body.appendChild(initButton);
  
  initButton.addEventListener('click', async function() {
    if (!confirm('本当にデータベースを初期化しますか？既存のデータはすべて失われます。')) {
      return;
    }
    
    try {
      await initializeDatabase();
      alert('データベースを初期化しました');
      location.reload(); // ページを再読み込み
    } catch (error) {
      console.error('初期化エラー:', error);
      alert('データベースの初期化に失敗しました');
    }
  });
});

// データベース初期化関数
async function initializeDatabase() {
  // 初期従業員データ
  const employees = [
    {
      employeeId: 'E001',
      name: '山田太郎',
      password: 'password1', // 本番環境では適切な認証方法を使用する
      department: 'front',
      role: 'admin',
      employmentType: 'fulltime',
      skills: ['reception', 'reservation']
    },
    {
      employeeId: 'E002',
      name: '鈴木花子',
      password: 'password2',
      department: 'housekeeping',
      role: 'employee',
      employmentType: 'fulltime',
      skills: ['cleaning', 'laundry']
    },
    {
      employeeId: 'E003',
      name: '佐藤次郎',
      password: 'password3',
      department: 'restaurant',
      role: 'employee',
      employmentType: 'fulltime',
      skills: ['cooking', 'serving']
    },
    {
      employeeId: 'E004',
      name: '田中恵子',
      password: 'password4',
      department: 'travel',
      role: 'employee',
      employmentType: 'parttime',
      skills: ['guide', 'reservation']
    },
    {
      employeeId: 'E005',
      name: '高橋健太',
      password: 'password5',
      department: 'front',
      role: 'employee',
      employmentType: 'parttime',
      skills: ['reception']
    }
  ];
  
  // シフトスロット定義 (グローバル変数から取得)
  const shiftSlots = SHIFT_SLOTS;
  
  // バッチ処理でデータを保存
  const batch = db.batch();
  
  // 既存のコレクションをクリア
  await clearCollection('employees');
  await clearCollection('monthlyShiftPreferences');
  await clearCollection('shiftSlots');
  
  // 従業員データを保存
  employees.forEach(emp => {
    const docRef = db.collection('employees').doc(emp.employeeId);
    batch.set(docRef, emp);
  });
  
  // シフトスロット定義を保存
  shiftSlots.forEach(slot => {
    const docRef = db.collection('shiftSlots').doc(slot.id);
    batch.set(docRef, {
      id: slot.id,
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime
    });
  });
  
  // サンプルのシフト希望を生成
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const yearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  
  // 各従業員のサンプルシフト希望
  employees.forEach(emp => {
    const preferences = {};
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // 日付ごとにランダムな希望を生成
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 各スロットについて
      shiftSlots.forEach(slot => {
        const slotKey = `${date}_${slot.id}`;
        
        // フルタイムの場合は基本的にすべてtrue、休み希望をランダムに設定
        // パートタイムの場合は基本的にすべてfalse、勤務可能日をランダムに設定
        let available;
        if (emp.employmentType === 'fulltime') {
          available = Math.random() > 0.2; // 80%の確率でtrue
        } else {
          available = Math.random() > 0.7; // 30%の確率でtrue
        }
        
        preferences[slotKey] = {
          available,
          note: available ? '' : '私用のため'
        };
      });
    }
    
    // シフト希望ドキュメントの作成
    const docId = `${emp.employeeId}_${yearMonth}`;
    const docRef = db.collection('monthlyShiftPreferences').doc(docId);
    
    batch.set(docRef, {
      employeeId: emp.employeeId,
      month: yearMonth,
      preferences,
      updatedAt: firebase.firestore.Timestamp.now()
    });
  });
  
  // バッチ処理を実行
  return batch.commit();
}

// コレクションをクリアする関数
async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  return batch.commit();
}
