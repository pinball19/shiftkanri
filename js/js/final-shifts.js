// 確定シフト管理機能
// このファイルはシフト確定と確定シフトの表示機能を実装します

// 管理者用の確定シフト機能を初期化
function initFinalShifts() {
  // DOM要素の参照を取得
  const adminContainer = document.getElementById('admin-container');
  
  // UI要素を追加
  addFinalShiftUI(adminContainer);
  
  // イベントリスナーを設定
  setupFinalShiftEventListeners();
}

// 確定シフトUI要素の追加
function addFinalShiftUI(container) {
  // 確定シフトセクションを作成
  const finalShiftSection = document.createElement('div');
  finalShiftSection.className = 'card mb-4';
  finalShiftSection.innerHTML = `
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="card-title">シフト確定</h2>
        <div>
          <select id="required-staff-slot" class="form-select me-2">
            <option value="">時間帯を選択...</option>
            <!-- 動的に生成 -->
          </select>
          <input type="number" id="required-staff-count" class="form-control me-2" min="1" value="1" placeholder="必要人数">
          <button id="add-required-staff-btn" class="btn btn-outline-secondary me-2">追加</button>
        </div>
      </div>
      
      <div class="alert alert-info mb-3">
        各時間帯の必要人数を設定し、自動生成ボタンを押すとシフトが自動的に生成されます。
      </div>
      
      <div class="mb-3">
        <h5>必要人数設定</h5>
        <table id="required-staff-table" class="table table-sm table-bordered">
          <thead>
            <tr>
              <th>時間帯</th>
              <th>必要人数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <!-- 動的に生成 -->
          </tbody>
        </table>
      </div>
      
      <div class="mb-3">
        <h5>制約条件</h5>
        <div class="row g-3">
          <div class="col-md-4">
            <label for="max-consecutive-days" class="form-label">最大連続勤務日数</label>
            <input type="number" id="max-consecutive-days" class="form-control" min="1" value="5">
          </div>
          <div class="col-md-4">
            <label for="max-shifts-per-day" class="form-label">1日の最大シフト数</label>
            <input type="number" id="max-shifts-per-day" class="form-control" min="1" value="1">
          </div>
          <div class="col-md-4">
            <label for="rest-between-shifts" class="form-label">シフト間休憩時間(時間)</label>
            <input type="number" id="rest-between-shifts" class="form-control" min="0" value="8">
          </div>
        </div>
      </div>
      
      <div class="text-end mb-3">
        <button id="generate-shifts-btn" class="btn btn-primary">シフト自動生成</button>
        <button id="save-final-shifts-btn" class="btn btn-success" disabled>確定シフトを保存</button>
      </div>
      
      <div id="generated-shift-container" class="mt-3">
        <!-- 生成されたシフトがここに表示される -->
      </div>
    </div>
  `;
  
  // 管理者コンテナに追加
  container.appendChild(finalShiftSection);
  
  // スロットオプションを初期化
  populateSlotOptions();
}

// スロットオプションの初期化
function populateSlotOptions() {
  const slotSelect = document.getElementById('required-staff-slot');
  const shiftSlots = app.getShiftSlots();
  
  // オプションをクリア
  slotSelect.innerHTML = '<option value="">時間帯を選択...</option>';
  
  // スロットごとのオプションを追加
  shiftSlots.forEach(slot => {
    const option = document.createElement('option');
    option.value = slot.id;
    option.textContent = `${slot.name} (${slot.startTime}～${slot.endTime})`;
    slotSelect.appendChild(option);
  });
}

// 必要人数のテーブルを更新
function updateRequiredStaffTable(requiredStaff) {
  const tableBody = document.getElementById('required-staff-table').querySelector('tbody');
  const shiftSlots = app.getShiftSlots();
  
  // テーブルをクリア
  tableBody.innerHTML = '';
  
  // 各スロットの設定を表示
  Object.entries(requiredStaff).forEach(([slotId, count]) => {
    const slot = shiftSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${slot.name} (${slot.startTime}～${slot.endTime})</td>
      <td>${count}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger remove-staff-btn" data-slot-id="${slotId}">
          削除
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// イベントリスナーの設定
function setupFinalShiftEventListeners() {
  // 必要人数追加ボタン
  document.getElementById('add-required-staff-btn').addEventListener('click', function() {
    const slotSelect = document.getElementById('required-staff-slot');
    const countInput = document.getElementById('required-staff-count');
    
    const slotId = slotSelect.value;
    const count = parseInt(countInput.value, 10);
    
    if (!slotId) {
      alert('時間帯を選択してください');
      return;
    }
    
    if (isNaN(count) || count < 1) {
      alert('有効な人数を入力してください');
      return;
    }
    
    // 必要人数を設定
    requiredStaff[slotId] = count;
    
    // テーブルを更新
    updateRequiredStaffTable(requiredStaff);
  });
  
  // 必要人数削除ボタン（動的に生成される要素に対してイベント委譲を使用）
  document.getElementById('required-staff-table').addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-staff-btn')) {
      const slotId = e.target.dataset.slotId;
      
      // 設定を削除
      delete requiredStaff[slotId];
      
      // テーブルを更新
      updateRequiredStaffTable(requiredStaff);
    }
  });
  
  // シフト自動生成ボタン
  document.getElementById('generate-shifts-btn').addEventListener('click', generateShifts);
  
  // 確定シフト保存ボタン
  document.getElementById('save-final-shifts-btn').addEventListener('click', saveFinalShifts);
}

// 全員の希望データを読み込む
async function loadAllPreferences(yearMonth) {
  try {
    const prefSnapshot = await db.collection('monthlyShiftPreferences')
      .where('month', '==', yearMonth)
      .get();
    
    const preferencesObj = {};
    
    prefSnapshot.docs.forEach(doc => {
      const data = doc.data();
      preferencesObj[data.employeeId] = data;
    });
    
    return preferencesObj;
  } catch (error) {
    console.error('希望データの読み込みエラー:', error);
    throw error;
  }
}

// 全従業員データを読み込む
async function loadAllEmployees() {
  try {
    const employeesSnapshot = await db.collection('employees').get();
    
    return employeesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('従業員データの読み込みエラー:', error);
    throw error;
  }
}

// 必要人数の設定を保持するオブジェクト
let requiredStaff = {};

// 生成されたシフトを保持する変数
let generatedShifts = null;

// シフトを自動生成する
async function generateShifts() {
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const yearMonth = adminShiftMonth.value;
  
  if (!yearMonth) {
    alert('月を選択してください');
    return;
  }
  
  if (Object.keys(requiredStaff).length === 0) {
    alert('少なくとも1つの時間帯の必要人数を設定してください');
    return;
  }
  
  try {
    // 生成中の表示
    const generatedShiftContainer = document.getElementById('generated-shift-container');
    generatedShiftContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border"></div><p class="mt-3">シフトを生成中...</p></div>';
    
    // 制約条件を
