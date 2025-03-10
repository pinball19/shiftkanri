// 確定シフト管理機能
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
      </div>
      
      <div class="alert alert-info mb-3">
        各日付と時間帯ごとの必要人数を設定し、自動生成ボタンを押すとシフトが自動的に生成されます。
      </div>
      
      <div class="mb-3">
        <h5>必要人数設定</h5>
        <div class="row mb-3">
          <div class="col-md-6">
            <div class="input-group">
              <select id="requirement-setting-type" class="form-select">
                <option value="default">デフォルト設定（全日程共通）</option>
                <option value="specific">特定日設定</option>
              </select>
              <button id="toggle-requirement-view" class="btn btn-outline-secondary">切り替え</button>
            </div>
          </div>
        </div>
        
        <!-- デフォルト設定（時間帯ごとの共通設定） -->
        <div id="default-requirement-container">
          <table class="table table-sm table-bordered">
            <thead>
              <tr>
                <th>時間帯</th>
                <th>必要人数</th>
              </tr>
            </thead>
            <tbody id="default-requirement-body">
              <!-- 動的に生成 -->
            </tbody>
          </table>
        </div>
        
        <!-- 特定日設定（日付×時間帯ごとの個別設定） -->
        <div id="specific-requirement-container" class="d-none">
          <div class="mb-3 row">
            <div class="col-md-3">
              <label for="specific-date" class="form-label">日付</label>
              <input type="date" id="specific-date" class="form-control">
            </div>
            <div class="col-md-3">
              <label for="specific-slot" class="form-label">時間帯</label>
              <select id="specific-slot" class="form-select">
                <!-- 動的に生成 -->
              </select>
            </div>
            <div class="col-md-3">
              <label for="specific-count" class="form-label">必要人数</label>
              <input type="number" id="specific-count" class="form-control" min="0" value="1">
            </div>
            <div class="col-md-3">
              <label class="form-label">&nbsp;</label>
              <button id="add-specific-requirement-btn" class="btn btn-outline-secondary form-control">設定</button>
            </div>
          </div>
          
          <div class="table-responsive">
            <table class="table table-sm table-bordered">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>時間帯</th>
                  <th>必要人数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="specific-requirement-body">
                <!-- 動的に生成 -->
              </tbody>
            </table>
          </div>
        </div>
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
  
  // デフォルト必要人数設定を初期化
  initDefaultRequirements();
  
  // スプレッドシート機能を追加
  addSpreadsheetInterface(finalShiftSection);
  
  // 必要に応じて Bootstrap のモーダルダイアログ用のスクリプトを追加
  addBootstrapScriptIfNeeded();
  
  // 特定日入力の日付を現在の月に設定
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const [year, month] = adminShiftMonth.value.split('-');
  document.getElementById('specific-date').min = `${year}-${month}-01`;
  document.getElementById('specific-date').max = `${year}-${month}-${app.getDaysInMonth(parseInt(year), parseInt(month))}`;
  document.getElementById('specific-date').value = `${year}-${month}-01`;
}

// Bootstrap のスクリプトを必要に応じて追加
function addBootstrapScriptIfNeeded() {
  if (typeof bootstrap === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js';
    document.head.appendChild(script);
  }
}

// スロットオプションの初期化
function populateSlotOptions() {
  const defaultRequirementBody = document.getElementById('default-requirement-body');
  const specificSlotSelect = document.getElementById('specific-slot');
  const shiftSlots = app.getShiftSlots();
  
  // デフォルト必要人数テーブルのセットアップ
  defaultRequirementBody.innerHTML = '';
  
  // 特定日選択用スロットオプションのセットアップ
  specificSlotSelect.innerHTML = '';
  
  // 各スロットをセットアップ
  shiftSlots.forEach(slot => {
    // デフォルト必要人数テーブルに行を追加
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${slot.name} (${slot.startTime}～${slot.endTime})</td>
      <td>
        <input type="number" class="form-control form-control-sm default-requirement" 
               data-slot-id="${slot.id}" min="0" value="1">
      </td>
    `;
    defaultRequirementBody.appendChild(row);
    
    // 特定日選択用スロットオプションを追加
    const option = document.createElement('option');
    option.value = slot.id;
    option.textContent = `${slot.name} (${slot.startTime}～${slot.endTime})`;
    specificSlotSelect.appendChild(option);
  });
}

// デフォルト必要人数設定の初期化
function initDefaultRequirements() {
  // 必要人数の設定を保持するオブジェクト（拡張版：デフォルト設定と特定日設定）
  if (!window.requiredStaff) {
    window.requiredStaff = {
      default: {}, // スロットIDをキーとしたデフォルト設定
      specific: {}  // 「日付_スロットID」をキーとした特定日設定
    };
  }
  
  // 各スロットごとにデフォルトの必要人数を設定（初期値は1）
  app.getShiftSlots().forEach(slot => {
    requiredStaff.default[slot.id] = 1;
  });
  
  // 入力フィールドに反映
  document.querySelectorAll('.default-requirement').forEach(input => {
    input.value = requiredStaff.default[input.dataset.slotId] || 1;
  });
}

// 特定日の必要人数設定テーブルを更新
function updateSpecificRequirementTable() {
  const tableBody = document.getElementById('specific-requirement-body');
  if (!tableBody) return; // テーブルが存在しない場合は処理をスキップ
  
  const shiftSlots = app.getShiftSlots();
  
  // テーブルをクリア
  tableBody.innerHTML = '';
  
  // 各特定日設定を表示
  Object.entries(requiredStaff.specific).forEach(([dateSlotKey, count]) => {
    const [date, slotId] = dateSlotKey.split('_');
    const slot = shiftSlots.find(s => s.id === slotId);
    if (!slot) return;
    
    // 日付の表示形式を整形
    const [year, month, day] = date.split('-');
    const formattedDate = `${month}/${day}`;
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${slot.name} (${slot.startTime}～${slot.endTime})</td>
      <td>${count}</td>
      <td>
        <button class="btn btn-sm btn-outline-danger remove-specific-btn" data-key="${dateSlotKey}">
          削除
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// イベントリスナーの設定
function setupFinalShiftEventListeners() {
  // デフォルト必要人数の変更を監視
  document.querySelectorAll('.default-requirement').forEach(input => {
    input.addEventListener('change', function() {
      const slotId = this.dataset.slotId;
      const count = parseInt(this.value, 10);
      
      if (isNaN(count) || count < 0) {
        alert('0以上の数値を入力してください');
        this.value = requiredStaff.default[slotId] || 1;
        return;
      }
      
      // 設定を更新
      requiredStaff.default[slotId] = count;
    });
  });
  
  // 特定日設定/デフォルト設定の切り替え
  document.getElementById('toggle-requirement-view').addEventListener('click', function() {
    const defaultContainer = document.getElementById('default-requirement-container');
    const specificContainer = document.getElementById('specific-requirement-container');
    const settingType = document.getElementById('requirement-setting-type');
    
    if (settingType.value === 'default') {
      settingType.value = 'specific';
      defaultContainer.classList.add('d-none');
      specificContainer.classList.remove('d-none');
    } else {
      settingType.value = 'default';
      defaultContainer.classList.remove('d-none');
      specificContainer.classList.add('d-none');
    }
  });
  
  // 特定日の必要人数設定を追加
  document.getElementById('add-specific-requirement-btn').addEventListener('click', function() {
    const dateInput = document.getElementById('specific-date');
    const slotSelect = document.getElementById('specific-slot');
    const countInput = document.getElementById('specific-count');
    
    const date = dateInput.value;
    const slotId = slotSelect.value;
    const count = parseInt(countInput.value, 10);
    
    if (!date) {
      alert('日付を選択してください');
      return;
    }
    
    if (!slotId) {
      alert('時間帯を選択してください');
      return;
    }
    
    if (isNaN(count) || count < 0) {
      alert('0以上の数値を入力してください');
      return;
    }
    
    // 設定キーを生成
    const key = `${date}_${slotId}`;
    
    // 設定を保存
    requiredStaff.specific[key] = count;
    
    // テーブルを更新
    updateSpecificRequirementTable();
  });
  
  // 特定日設定の削除
  const specificRequirementBody = document.getElementById('specific-requirement-body');
  if (specificRequirementBody) {
    specificRequirementBody.addEventListener('click', function(e) {
      if (e.target.classList.contains('remove-specific-btn')) {
        const key = e.target.dataset.key;
        
        // 設定を削除
        delete requiredStaff.specific[key];
        
        // テーブルを更新
        updateSpecificRequirementTable();
      }
    });
  }
  
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

// 必要人数の設定を保持するオブジェクト（拡張版：デフォルト設定と特定日設定）
let requiredStaff = {
  default: {}, // スロットIDをキーとしたデフォルト設定
  specific: {}  // 「日付_スロットID」をキーとした特定日設定
};

// 生成されたシフトを保持する変数
let generatedShifts = null;

// 特定の日付・スロットに必要な人数を取得
function getRequiredStaffCount(date, slotId) {
  // 特定日設定があればそれを優先
  const specificKey = `${date}_${slotId}`;
  if (specificKey in requiredStaff.specific) {
    return requiredStaff.specific[specificKey];
  }
  
  // なければデフォルト設定を使用
  return requiredStaff.default[slotId] || 1;
}

// シフトを自動生成する
async function generateShifts() {
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const yearMonth = adminShiftMonth.value;
  
  if (!yearMonth) {
    alert('月を選択してください');
    return;
  }
  
  // 必要人数設定が有効かチェック
  const hasValidSettings = Object.values(requiredStaff.default).some(count => count > 0) || 
                           Object.values(requiredStaff.specific).some(count => count > 0);
  
  if (!hasValidSettings) {
    alert('少なくとも1つの時間帯の必要人数を設定してください');
    return;
  }
  
  try {
    // 生成中の表示
    const generatedShiftContainer = document.getElementById('generated-shift-container');
    generatedShiftContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border"></div><p class="mt-3">シフトを生成中...</p></div>';
    
    // 制約条件を取得
    const constraints = {
      maxConsecutiveDays: parseInt(document.getElementById('max-consecutive-days').value, 10),
      maxShiftsPerDay: parseInt(document.getElementById('max-shifts-per-day').value, 10),
      restBetweenShifts: parseInt(document.getElementById('rest-between-shifts').value, 10)
    };
    
    // 全員の希望と従業員データを読み込む
    const [preferences, employees] = await Promise.all([
      loadAllPreferences(yearMonth),
      loadAllEmployees()
    ]);
    
    // シフト自動生成アルゴリズムを実行
    // 日付ごとの必要人数を反映するために、適応版アルゴリズムを使用
    generatedShifts = await runShiftAlgorithm(
      preferences,
      employees,
      requiredStaff,
      constraints,
      yearMonth
    );
    
    // 生成結果を表示
    displayGeneratedShifts(generatedShifts, yearMonth, employees);
    
    // 保存ボタンを有効化
    document.getElementById('save-final-shifts-btn').disabled = false;
    
  } catch (error) {
    console.error('シフト生成エラー:', error);
    alert('シフトの生成に失敗しました');
  }
}

// シフト自動生成アルゴリズム実行（日付×時間帯ごとの必要人数に対応）
async function runShiftAlgorithm(preferences, employees, requiredStaff, constraints, yearMonth) {
  // 結果を格納するオブジェクト
  const finalShifts = {};
  
  // 年月から全日程を取得
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = app.getDaysInMonth(year, month);
  
  // シフトスロットを取得
  const shiftSlots = app.getShiftSlots();
  
  // 全日程×全スロットの組み合わせを生成
  const combinations = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = app.formatDate(year, month, day);
    
    shiftSlots.forEach(slot => {
      combinations.push({
        date,
        slotId: slot.id
      });
    });
  }
  
  // 各日付・スロットごとに割り当てを行う
  for (const { date, slotId } of combinations) {
    const shiftKey = `${date}_${slotId}`;
    
    // この日付・スロットの必要人数を取得
    const requiredCount = getRequiredStaffCount(date, slotId);
    
    // 必要人数が0の場合はスキップ
    if (requiredCount <= 0) {
      finalShifts[shiftKey] = [];
      continue;
    }
    
    // 勤務可能な従業員を取得
    const availableEmployees = getAvailableEmployees(preferences, employees, date, slotId);
    
    // 制約条件を適用
    const eligibleEmployees = filterEligibleEmployees(
      availableEmployees,
      constraints,
      finalShifts,
      date,
      slotId
    );
    
    // シフト回数に基づいてソート
    const sortedEmployees = [...eligibleEmployees].sort((a, b) => {
      // 過去のシフト回数をカウント
      const aShiftCount = countPreviousShifts(a.employeeId, finalShifts);
      const bShiftCount = countPreviousShifts(b.employeeId, finalShifts);
      
      // シフト回数で比較
      if (aShiftCount !== bShiftCount) {
        return aShiftCount - bShiftCount; // 少ない方を優先
      }
      
      // フルタイム・パートタイムの考慮
      const aIsFulltime = a.employmentType === 'fulltime' ? 1 : 0;
      const bIsFulltime = b.employmentType === 'fulltime' ? 1 : 0;
      
      return bIsFulltime - aIsFulltime; // フルタイムを優先
    });
    
    // 必要人数分だけ割り当て
    finalShifts[shiftKey] = sortedEmployees
      .slice(0, Math.min(requiredCount, sortedEmployees.length))
      .map(emp => emp.employeeId);
  }
  
  return finalShifts;
}

// 特定の日付・スロットで勤務可能な従業員を取得
function getAvailableEmployees(preferences, employees, date, slotId) {
  const available = [];
  
  employees.forEach(emp => {
    const empId = emp.id || emp.employeeId;
    const empPrefs = preferences[empId]?.preferences || {};
    const key = `${date}_${slotId}`;
    
    let isAvailable = false;
    
    // 従業員の希望を確認
    if (empPrefs[key] && empPrefs[key].available) {
      isAvailable = true;
    }
    // 希望が未設定の場合はフルタイム従業員なら勤務可能とみなす
    else if (!empPrefs[key] && emp.employmentType === 'fulltime') {
      isAvailable = true;
    }
    
    if (isAvailable) {
      available.push({
        ...emp,
        id: empId,
        employeeId: empId
      });
    }
  });
  
  return available;
}

// 制約条件を適用して候補をフィルタリング
function filterEligibleEmployees(employees, constraints, finalShifts, date, slotId) {
  if (Object.keys(constraints).length === 0) {
    return employees;
  }
  
  return employees.filter(emp => {
    // 最大連続勤務日数チェック
    if (constraints.maxConsecutiveDays && 
        isExceedingConsecutiveDays(emp.employeeId, date, finalShifts, constraints.maxConsecutiveDays)) {
      return false;
    }
    
    // 1日の最大シフト数チェック
    if (constraints.maxShiftsPerDay && 
        isExceedingDailyShifts(emp.employeeId, date, finalShifts, constraints.maxShiftsPerDay)) {
      return false;
    }
    
    // 休憩時間チェック（例：夜勤後は早番に入れない）
    if (constraints.restBetweenShifts && 
        !hasEnoughRest(emp.employeeId, date, slotId, finalShifts, constraints.restBetweenShifts)) {
      return false;
    }
    
    return true;
  });
}

// 特定の従業員の過去のシフト回数をカウント
function countPreviousShifts(employeeId, finalShifts) {
  let count = 0;
  
  Object.values(finalShifts).forEach(assignedIds => {
    if (assignedIds.includes(employeeId)) {
      count++;
    }
  });
  
  return count;
}

// 連続勤務日数チェック
function isExceedingConsecutiveDays(employeeId, date, finalShifts, maxDays) {
  // 日付操作のためのヘルパー関数
  const parseDate = dateStr => new Date(dateStr);
  const formatDate = dateObj => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 現在の日付
  const currentDate = parseDate(date);
  
  // 連続勤務カウント
  let consecutiveDays = 0; // 現在の日付はまだカウントしない
  
  // 過去の日付をチェック
  for (let i = 1; i <= maxDays; i++) {
    // i日前の日付
    const prevDate = new Date(currentDate);
    prevDate.setDate(currentDate.getDate() - i);
    const prevDateStr = formatDate(prevDate);
    
    // この日に勤務していたかチェック
    let workedThisDay = false;
    
    Object.entries(finalShifts).forEach(([key, assignedIds]) => {
      if (key.startsWith(prevDateStr) && assignedIds.includes(employeeId)) {
        workedThisDay = true;
      }
    });
    
    if (workedThisDay) {
      consecutiveDays++;
    } else {
      break; // 連続が途切れた
    }
  }
  
  // 現在の日付を追加すると連続勤務日数が上限を超えるか
  return consecutiveDays >= maxDays;
}

// 1日の最大シフト数チェック
function isExceedingDailyShifts(employeeId, date, finalShifts, maxShifts) {
  let dailyShiftCount = 0;
  
  // 同じ日付のシフトをカウント
  Object.keys(finalShifts).forEach(key => {
    if (key.startsWith(date) && finalShifts[key].includes(employeeId)) {
      dailyShiftCount++;
    }
  });
  
  return dailyShiftCount >= maxShifts;
}

// 休憩時間チェック
function hasEnoughRest(employeeId, date, slotId, finalShifts, restHours) {
  // 日付操作のためのヘルパー関数
  const parseDate = dateStr => new Date(dateStr);
  const getYesterday = date => {
    const d = parseDate(date);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  
  // シフトスロットとその時間帯情報（実際のアプリケーションではグローバル参照またはAPIで取得）
  const slotTimes = {
    'early': { start: 6, end: 14 },
    'middle': { start: 10, end: 18 },
    'late': { start: 14, end: 22 },
    'night': { start: 22, end: 6 }
  };
  
  // 今回のシフトの開始時間
  const currentSlot = slotTimes[slotId];
  if (!currentSlot) return true; // スロット情報が不明な場合は制約なしとする
  
  // 前日の夜勤をチェック
  const yesterday = getYesterday(date);
  const nightShiftKey = `${yesterday}_night`;
  
  // 前日の夜勤があった場合
  if (finalShifts[nightShiftKey] && finalShifts[nightShiftKey].includes(employeeId)) {
    // 夜勤終了（翌朝6時）から今回のシフト開始までの時間
    let hoursAfterNightShift = currentSlot.start - 6;
    if (hoursAfterNightShift < 0) {
      hoursAfterNightShift += 24; // 翌日になる場合
    }
    
    // 休憩時間が足りない場合
    if (hoursAfterNightShift < restHours) {
      return false;
    }
  }
  
  return true;
}

// 生成されたシフトを表示する（縦列に名前、横列に日付のレイアウト）
function displayGeneratedShifts(shifts, yearMonth, employees) {
  const generatedShiftContainer = document.getElementById('generated-shift-container');
  const [year, month] = yearMonth.split('-').map(num => parseInt(num, 10));
  const daysInMonth = app.getDaysInMonth(year, month);
  const shiftSlots = app.getShiftSlots();
  
  // テーブルを生成（縦列に名前、横列に日付）
  let html = `
    <h4>生成されたシフト (${yearMonth})</h4>
    <div class="table-responsive">
      <table id="generated-shift-table" class="table table-bordered table-sm">
        <thead>
          <tr>
            <th rowspan="2">従業員名</th>
  `;
  
  // 日付ヘッダー
  for (let day = 1; day <= daysInMonth; day++) {
    const weekdayIndex = app.getWeekdayIndex(year, month, day);
    const weekdayClass = app.getWeekdayClass(weekdayIndex);
    const weekendClass = app.isWeekend(weekdayIndex) ? 'class="weekend"' : '';
    
    html += `<th colspan="${shiftSlots.length}" ${weekendClass}>${month}/${day}</th>`;
  }
  
  html += `
          </tr>
          <tr>
  `;
  
  // 各日の下にスロット名
  for (let day = 1; day <= daysInMonth; day++) {
    shiftSlots.forEach(slot => {
      html += `<th class="${slot.className}">${slot.name}</th>`;
    });
  }
  
  html += `
          </tr>
        </thead>
        <tbody>
  `;
  
  // 従業員ごとの行
  employees.forEach(emp => {
    html += `
      <tr>
        <td>${emp.name}</td>
    `;
    
    // 各日付・スロットの割り当て状況
    for (let day = 1; day <= daysInMonth; day++) {
      const date = app.formatDate(year, month, day);
      
      // 各スロットの割り当て
      shiftSlots.forEach(slot => {
        const shiftKey = `${date}_${slot.id}`;
        const isAssigned = shifts[shiftKey] && shifts[shiftKey].includes(emp.id || emp.employeeId);
        
        const cellClass = isAssigned ? 'table-success' : '';
        const statusText = isAssigned ? '◯' : '×';
        
        html += `
          <td class="${cellClass} ${slot.className}" data-date="${date}" data-slot-id="${slot.id}" data-employee-id="${emp.id || emp.employeeId}">
            ${statusText}
          </td>
        `;
      });
    }
    
    html += '</tr>';
  });
  
  html += `
        </tbody>
      </table>
    </div>
    <div class="alert alert-warning mt-3">
      手動調整が必要な場合は、シフトセルをクリックして編集できます
    </div>
  `;
  
  generatedShiftContainer.innerHTML = html;
  
  // シフトセルのクリックイベントを設定
  setupShiftCellClickEvent();
}

// シフトセルのクリックイベントを設定
function setupShiftCellClickEvent() {
  const shiftCells = document.querySelectorAll('#generated-shift-table td[data-date]');
  
  shiftCells.forEach(cell => {
    cell.addEventListener('click', function() {
      // セルのデータ属性から情報を取得
      const date = this.dataset.date;
      const slotId = this.dataset.slotId;
      const employeeId = this.dataset.employeeId;
      const shiftKey = `${date}_${slotId}`;
      
      // 現在の割り当て状態を確認
      const isCurrentlyAssigned = this.classList.contains('table-success');
      
      // 割り当て状態を反転
      if (isCurrentlyAssigned) {
        // 割り当てを解除
        this.classList.remove('table-success');
        this.textContent = '×';
        
        // generatedShiftsから従業員を削除
        if (generatedShifts[shiftKey]) {
          generatedShifts[shiftKey] = generatedShifts[shiftKey].filter(id => id !== employeeId);
        }
      } else {
        // 割り当てを追加
        this.classList.add('table-success');
        this.textContent = '◯';
        
        // generatedShiftsに従業員を追加
        if (!generatedShifts[shiftKey]) {
          generatedShifts[shiftKey] = [];
        }
        if (!generatedShifts[shiftKey].includes(employeeId)) {
          generatedShifts[shiftKey].push(employeeId);
        }
      }
    });
  });
}

// 確定シフトを保存する
async function saveFinalShifts() {
  if (!generatedShifts) {
    alert('先にシフトを生成してください');
    return;
  }
  
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const yearMonth = adminShiftMonth.value;
  
  if (!yearMonth) {
    alert('月を選択してください');
    return;
  }
  
  try {
    // 保存中の表示
    document.getElementById('save-final-shifts-btn').disabled = true;
    document.getElementById('save-final-shifts-btn').innerHTML = '<span class="spinner-border spinner-border-sm"></span> 保存中...';
    
    // 保存するデータを準備
    const data = {
      month: yearMonth,
      shifts: generatedShifts,
      requiredStaff,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: app.getCurrentUser()
    };
    
    // Firestore に保存
    await db.collection('finalShifts').doc(yearMonth).set(data);
    
    alert('確定シフトを保存しました');
    
    // ボタンを元に戻す
    document.getElementById('save-final-shifts-btn').disabled = false;
    document.getElementById('save-final-shifts-btn').textContent = '確定シフトを保存';
    
  } catch (error) {
    console.error('確定シフトの保存エラー:', error);
    alert('確定シフトの保存に失敗しました');
    
    // ボタンを元に戻す
    document.getElementById('save-final-shifts-btn').disabled = false;
    document.getElementById('save-final-shifts-btn').textContent = '確定シフトを保存';
  }
}

// 従業員用の確定シフト表示機能の初期化
function initEmployeeFinalShifts() {
  // 従業員用のシフト確認セクションを追加
  const employeeContainer = document.getElementById('employee-container');
  
  const finalShiftSection = document.createElement('div');
  finalShiftSection.className = 'card mb-4';
  finalShiftSection.innerHTML = `
    <div class="card-body">
      <h2 class="card-title">確定シフト</h2>
      <div id="employee-final-shift-container">
        <div class="alert alert-info">
          確定シフトが公開されるとここに表示されます
        </div>
      </div>
    </div>
  `;
  
  employeeContainer.appendChild(finalShiftSection);
  
  // 月が変更されたときに確定シフトを読み込む
  const shiftMonth = document.getElementById('shift-month');
  shiftMonth.addEventListener('change', loadEmployeeFinalShift);
  
  // 初期ロード
  loadEmployeeFinalShift();
}

// 従業員の確定シフトを読み込む
async function loadEmployeeFinalShift() {
  const shiftMonth = document.getElementById('shift-month');
  const yearMonth = shiftMonth.value;
  const employeeId = app.getCurrentUser();
  
  if (!yearMonth || !employeeId) return;
  
  const container = document.getElementById('employee-final-shift-container');
  
  try {
    // 読み込み中表示
    container.innerHTML = '<div class="text-center p-3"><div class="spinner-border"></div><p class="mt-2">読み込み中...</p></div>';
    
    // 確定シフトを取得
    const docRef = db.collection('finalShifts').doc(yearMonth);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      container.innerHTML = '<div class="alert alert-info">この月の確定シフトはまだ公開されていません</div>';
      return;
    }
    
    const finalShiftData = doc.data();
    const shifts = finalShiftData.shifts || {};
    
    // この従業員に割り当てられたシフトを抽出
    const myShifts = {};
    Object.entries(shifts).forEach(([key, assignedIds]) => {
      if (assignedIds.includes(employeeId)) {
        myShifts[key] = true;
      }
    });
    
    // 従業員のシフト表示（横列に日付、縦列に時間帯）
    displayEmployeeFinalShift(myShifts, yearMonth);
    
  } catch (error) {
    console.error('確定シフトの読み込みエラー:', error);
    container.innerHTML = '<div class="alert alert-danger">確定シフトの読み込みに失敗しました</div>';
  }
}

// 従業員の確定シフトを表示（横列に日付、縦列に時間帯）
function displayEmployeeFinalShift(myShifts, yearMonth) {
  const container = document.getElementById('employee-final-shift-container');
  const [year, month] = yearMonth.split('-').map(num => parseInt(num, 10));
  const daysInMonth = app.getDaysInMonth(year, month);
  const shiftSlots = app.getShiftSlots();
  
  // テーブルを生成
  let html = `
    <div class="table-responsive">
      <table class="table table-bordered table-sm">
        <thead>
          <tr>
            <th>時間帯</th>
  `;
  
  // 日付ヘッダー
  for (let day = 1; day <= daysInMonth; day++) {
    const weekdayIndex = app.getWeekdayIndex(year, month, day);
    const weekdayClass = app.getWeekdayClass(weekdayIndex);
    const weekendClass = app.isWeekend(weekdayIndex) ? 'class="weekend"' : '';
    
    html += `<th ${weekendClass}>${month}/${day}</th>`;
  }
  
  html += `
          </tr>
        </thead>
        <tbody>
  `;
  
  // スロットごとの行
  shiftSlots.forEach(slot => {
    html += `
      <tr>
        <td class="${slot.className}">${slot.name}<br>(${slot.startTime}～${slot.endTime})</td>
    `;
    
    // 各日付の割り当て
    for (let day = 1; day <= daysInMonth; day++) {
      const date = app.formatDate(year, month, day);
      const shiftKey = `${date}_${slot.id}`;
      const isAssigned = myShifts[shiftKey] || false;
      
      const cellClass = isAssigned ? 'table-success' : '';
      const statusText = isAssigned ? '出勤' : '休み';
      
      html += `
        <td class="${cellClass}">
          ${statusText}
        </td>
      `;
    }
    
    html += '</tr>';
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  container.innerHTML = html;
}

// スプレッドシート風インターフェースを追加
function addSpreadsheetInterface(container) {
  // タブコンテナが存在しない場合は作成
  let tabsContainer = container.querySelector('#requirement-tabs');
  if (!tabsContainer) {
    tabsContainer = document.createElement('ul');
    tabsContainer.id = 'requirement-tabs';
    tabsContainer.className = 'nav nav-tabs mb-3';
    
    // デフォルトタブを追加
    const defaultTab = document.createElement('li');
    defaultTab.className = 'nav-item';
    defaultTab.innerHTML = `
      <a class="nav-link active" href="#" data-setting-type="default">通常設定</a>
    `;
    tabsContainer.appendChild(defaultTab);
    
    // カレンダータブを追加
    const calendarTab = document.createElement('li');
    calendarTab.className = 'nav-item';
    calendarTab.innerHTML = `
      <a class="nav-link" href="#" data-setting-type="calendar">カレンダー表示</a>
    `;
    tabsContainer.appendChild(calendarTab);
    
    // コンテナの追加位置を探す
    const h5Element = container.querySelector('h5');
    if (h5Element) {
      h5Element.parentNode.insertBefore(tabsContainer, h5Element.nextSibling);
    } else {
      // h5が見つからない場合は、card-bodyの最初に追加
      const cardBody = container.querySelector('.card-body');
      if (cardBody) {
        cardBody.insertBefore(tabsContainer, cardBody.firstChild);
      }
    }
    
    // カレンダーコンテナも作成
    const calendarContainer = document.createElement('div');
    calendarContainer.id = 'calendar-requirement-container';
    calendarContainer.className = 'd-none';
    calendarContainer.innerHTML = '<div class="alert alert-info">カレンダー表示は準備中です</div>';
    
    // コンテナの追加位置
    const defaultContainer = container.querySelector('#default-requirement-container');
    if (defaultContainer) {
      defaultContainer.parentNode.insertBefore(calendarContainer, defaultContainer.nextSibling);
    }
    
    // タブ切り替えの処理を追加
    defaultTab.querySelector('a').addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('#requirement-tabs .nav-link').forEach(link => link.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('default-requirement-container').classList.remove('d-none');
      document.getElementById('specific-requirement-container').classList.remove('d-none');
      document.getElementById('calendar-requirement-container').classList.add('d-none');
      document.getElementById('spreadsheet-requirement-container').classList.add('d-none');
    });
    
    calendarTab.querySelector('a').addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('#requirement-tabs .nav-link').forEach(link => link.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('default-requirement-container').classList.add('d-none');
      document.getElementById('specific-requirement-container').classList.add('d-none');
      document.getElementById('calendar-requirement-container').classList.remove('d-none');
      document.getElementById('spreadsheet-requirement-container').classList.add('d-none');
    });
  }
  
  // スプレッドシート表示タブを追加
  const spreadsheetTab = document.createElement('li');
  spreadsheetTab.className = 'nav-item';
  spreadsheetTab.innerHTML = `
    <a class="nav-link" href="#" data-setting-type="spreadsheet">シート表示</a>
  `;
  tabsContainer.appendChild(spreadsheetTab);
  
  // スプレッドシート風インターフェースのコンテナを追加
  const spreadsheetContainer = document.createElement('div');
  spreadsheetContainer.id = 'spreadsheet-requirement-container';
  spreadsheetContainer.className = 'd-none';
  spreadsheetContainer.innerHTML = `
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6>全日程×全時間帯を一覧で設定</h6>
        <div>
          <button id="copy-previous-week-btn" class="btn btn-sm btn-outline-secondary me-2">前週のパターンをコピー</button>
          <button id="apply-pattern-btn" class="btn btn-sm btn-outline-secondary">繰り返しパターンを適用</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-bordered requirement-spreadsheet" id="spreadsheet-table">
          <thead>
            <tr>
              <th style="min-width: 80px;">日付</th>
              <th style="min-width: 40px;">曜日</th>
            </tr>
          </thead>
          <tbody id="spreadsheet-body">
            <!-- 動的に生成 -->
          </tbody>
        </table>
      </div>
      <div class="mt-2 d-flex justify-content-between">
        <div>
          <small class="text-muted">表内の数値を直接編集できます。Tabキーで次のセルに移動できます。</small>
        </div>
        <button id="save-spreadsheet-btn" class="btn btn-sm btn-primary">一括保存</button>
      </div>
    </div>
  `;
  
  // 既存のコンテナの後に追加
  const calendarContainer = container.querySelector('#calendar-requirement-container');
  if (calendarContainer) {
    calendarContainer.parentNode.insertBefore(spreadsheetContainer, calendarContainer.nextSibling);
  } else {
    const defaultContainer = container.querySelector('#default-requirement-container');
    if (defaultContainer) {
      defaultContainer.parentNode.insertBefore(spreadsheetContainer, defaultContainer.nextSibling);
    }
  }
  
  // タブ切り替えのイベントハンドラを追加
  spreadsheetTab.querySelector('a').addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('#requirement-tabs .nav-link').forEach(link => link.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('default-requirement-container').classList.add('d-none');
    document.getElementById('specific-requirement-container').classList.add('d-none');
    document.getElementById('calendar-requirement-container').classList.add('d-none');
    document.getElementById('spreadsheet-requirement-container').classList.remove('d-none');
  });
  
  // スプレッドシート表示を初期化
  initSpreadsheetView();
  
  // 繰り返しパターン選択ダイアログを追加
  addPatternDialog();
}

// パターン適用ダイアログを追加
function addPatternDialog() {
  // 既存のダイアログを確認
  if (document.getElementById('pattern-dialog')) {
    return; // 既に存在する場合は何もしない
  }
  
  const dialog = document.createElement('div');
  dialog.id = 'pattern-dialog';
  dialog.className = 'modal fade';
  dialog.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">繰り返しパターンを適用</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">パターンタイプ</label>
            <select id="pattern-type" class="form-select">
              <option value="weekly">週間パターン</option>
              <option value="weekday-weekend">平日/休日パターン</option>
              <option value="custom">カスタムパターン</option>
            </select>
          </div>
          
          <div id="weekly-pattern-options">
            <div class="mb-3">
              <label class="form-label">パターン開始日</label>
              <input type="date" id="pattern-start-date" class="form-control">
            </div>
            <div class="mb-3">
              <label class="form-label">繰り返し回数</label>
              <input type="number" id="pattern-repeat-count" class="form-control" min="1" value="4">
            </div>
          </div>
          
          <div id="weekday-weekend-options" class="d-none">
            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label">平日人数</label>
                <div id="weekday-slot-settings">
                  <!-- 動的に生成 -->
                </div>
              </div>
              <div class="col-md-6">
                <label class="form-label">休日人数</label>
                <div id="weekend-slot-settings">
                  <!-- 動的に生成 -->
                </div>
              </div>
            </div>
          </div>
          
          <div id="custom-pattern-options" class="d-none">
            <div class="mb-3">
              <label class="form-label">カスタムパターン (CSV形式)</label>
              <textarea id="custom-pattern-csv" class="form-control" rows="5" placeholder="早番,中番,遅番,夜勤&#10;2,1,2,1&#10;3,2,2,1"></textarea>
              <small class="text-muted">1行目に時間帯ID、2行目以降に各日の必要人数をCSV形式で入力</small>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
          <button type="button" id="apply-pattern-confirm-btn" class="btn btn-primary">適用</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // パターンタイプの切り替え処理
  document.getElementById('pattern-type').addEventListener('change', function() {
    const patternType = this.value;
    document.getElementById('weekly-pattern-options').classList.add('d-none');
    document.getElementById('weekday-weekend-options').classList.add('d-none');
    document.getElementById('custom-pattern-options').classList.add('d-none');
    
    document.getElementById(`${patternType}-pattern-options`).classList.remove('d-none');
  });
  
  // 平日/休日設定のスロット選択肢を生成
  initWeekdayWeekendOptions();
}

// 平日/休日設定のスロット選択肢を生成
function initWeekdayWeekendOptions() {
  const weekdaySlotSettings = document.getElementById('weekday-slot-settings');
  const weekendSlotSettings = document.getElementById('weekend-slot-settings');
  
  // コンテナが見つからない場合は処理をスキップ
  if (!weekdaySlotSettings || !weekendSlotSettings) return;
  
  const shiftSlots = app.getShiftSlots();
  
  // 平日設定をクリア
  weekdaySlotSettings.innerHTML = '';
  
  // 休日設定をクリア
  weekendSlotSettings.innerHTML = '';
  
  // 各スロットの設定欄を生成
  shiftSlots.forEach(slot => {
    // 平日設定
    const weekdayInput = document.createElement('div');
    weekdayInput.className = 'input-group input-group-sm mb-2';
    weekdayInput.innerHTML = `
      <span class="input-group-text">${slot.name}</span>
      <input type="number" class="form-control weekday-slot-input" data-slot-id="${slot.id}" min="0" value="1">
    `;
    weekdaySlotSettings.appendChild(weekdayInput);
    
    // 休日設定
    const weekendInput = document.createElement('div');
    weekendInput.className = 'input-group input-group-sm mb-2';
    weekendInput.innerHTML = `
      <span class="input-group-text">${slot.name}</span>
      <input type="number" class="form-control weekend-slot-input" data-slot-id="${slot.id}" min="0" value="2">
    `;
    weekendSlotSettings.appendChild(weekendInput);
  });
}

// スプレッドシート表示の初期化
function initSpreadsheetView() {
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const [year, month] = adminShiftMonth.value.split('-').map(Number);
  const daysInMonth = app.getDaysInMonth(year, month);
  const shiftSlots = app.getShiftSlots();
  const spreadsheetHeader = document.querySelector('#spreadsheet-table thead tr');
  const spreadsheetBody = document.getElementById('spreadsheet-body');
  
  // ヘッダーを初期化
  // 日付と曜日の後に各スロットの列を追加
  while (spreadsheetHeader.children.length > 2) {
    spreadsheetHeader.removeChild(spreadsheetHeader.lastChild);
  }
  
  shiftSlots.forEach(slot => {
    const th = document.createElement('th');
    th.className = slot.className;
    th.textContent = slot.name;
    th.title = `${slot.startTime}～${slot.endTime}`;
    spreadsheetHeader.appendChild(th);
  });
  
  // 本体を初期化
  spreadsheetBody.innerHTML = '';
  
  // 各日の行を生成
  for (let day = 1; day <= daysInMonth; day++) {
    const date = app.formatDate(year, month, day);
    const weekdayIndex = app.getWeekdayIndex(year, month, day);
    const weekdayName = ['日', '月', '火', '水', '木', '金', '土'][weekdayIndex];
    const weekdayClass = app.getWeekdayClass(weekdayIndex);
    const weekendClass = app.isWeekend(weekdayIndex) ? 'table-danger' : '';
    
    const tr = document.createElement('tr');
    tr.className = weekendClass;
    
    // 日付セル
    const dateCell = document.createElement('td');
    dateCell.className = weekdayClass;
    dateCell.textContent = `${month}/${day}`;
    tr.appendChild(dateCell);
    
    // 曜日セル
    const weekdayCell = document.createElement('td');
    weekdayCell.className = weekdayClass;
    weekdayCell.textContent = weekdayName;
    tr.appendChild(weekdayCell);
    
    // 各スロットのセル
    shiftSlots.forEach(slot => {
      const td = document.createElement('td');
      td.className = slot.className;
      
      // この日付・スロットの必要人数を取得
      const specificKey = `${date}_${slot.id}`;
      const requiredCount = requiredStaff.specific[specificKey] !== undefined
                           ? requiredStaff.specific[specificKey]
                           : requiredStaff.default[slot.id] || 1;
      
      // 編集可能な入力欄
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'form-control form-control-sm spreadsheet-requirement';
      input.dataset.date = date;
      input.dataset.slotId = slot.id;
      input.min = 0;
      input.value = requiredCount;
      input.style.width = '100%';
      input.style.minWidth = '40px';
      input.style.padding = '2px 5px';
      input.style.textAlign = 'center';
      
      td.appendChild(input);
      tr.appendChild(td);
    });
    
    spreadsheetBody.appendChild(tr);
  }
  
  // タブ移動の設定
  setupTabNavigation();
  
  // 変更の保存ボタン
  document.getElementById('save-spreadsheet-btn').addEventListener('click', saveSpreadsheetChanges);
  
  // 前週パターンのコピーボタン
  document.getElementById('copy-previous-week-btn').addEventListener('click', copyPreviousWeekPattern);
  
  // パターン適用ボタン
  document.getElementById('apply-pattern-btn').addEventListener('click', showPatternDialog);
}

// Tab キーでのセル間移動設定
function setupTabNavigation() {
  const inputs = document.querySelectorAll('.spreadsheet-requirement');
  
  inputs.forEach((input, index) => {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        // Shift + Tab の場合は前のセルに移動
        if (e.shiftKey) {
          if (index > 0) {
            e.preventDefault();
            inputs[index - 1].focus();
          }
        } 
        // Tab の場合は次のセルに移動
        else if (index < inputs.length - 1) {
          e.preventDefault();
          inputs[index + 1].focus();
        }
      }
      
      // 矢印キーでのナビゲーション
      const numColumns = document.querySelector('#spreadsheet-table thead tr').children.length - 2;
      
      if (e.key === 'ArrowUp' && index >= numColumns) {
        e.preventDefault();
        inputs[index - numColumns].focus();
      } else if (e.key === 'ArrowDown' && index < inputs.length - numColumns) {
        e.preventDefault();
        inputs[index + numColumns].focus();
      } else if (e.key === 'ArrowLeft' && index % numColumns !== 0) {
        e.preventDefault();
        inputs[index - 1].focus();
      } else if (e.key === 'ArrowRight' && (index + 1) % numColumns !== 0 && index < inputs.length - 1) {
        e.preventDefault();
        inputs[index + 1].focus();
      }
    });
  });
}

// スプレッドシートの変更を保存
function saveSpreadsheetChanges() {
  const changes = [];
  
  // 全ての入力欄を処理
  document.querySelectorAll('.spreadsheet-requirement').forEach(input => {
    const date = input.dataset.date;
    const slotId = input.dataset.slotId;
    const count = parseInt(input.value, 10);
    
    if (isNaN(count) || count < 0) {
      input.value = getRequiredStaffCount(date, slotId);
      return;
    }
    
    // 設定キーを生成
    const key = `${date}_${slotId}`;
    
    // デフォルト値と比較
    if (count === requiredStaff.default[slotId]) {
      // 特定日設定が存在し、デフォルト値と同じなら削除
      if (key in requiredStaff.specific) {
        delete requiredStaff.specific[key];
        changes.push(`${date} ${slotId}：デフォルト値に戻しました`);
      }
    } else {
      // デフォルト値と異なる場合は特定日設定を保存/更新
      if (requiredStaff.specific[key] !== count) {
        requiredStaff.specific[key] = count;
        changes.push(`${date} ${slotId}：${count}人に設定しました`);
      }
    }
  });
  
  // 特定日設定テーブルを更新
  updateSpecificRequirementTable();
  
  // 変更内容を表示
  if (changes.length > 0) {
    alert(`${changes.length}件の変更を保存しました`);
  } else {
    alert('変更はありませんでした');
  }
}

// 前週のパターンをコピー
function copyPreviousWeekPattern() {
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const [year, month] = adminShiftMonth.value.split('-').map(Number);
  const daysInMonth = app.getDaysInMonth(year, month);
  const shiftSlots = app.getShiftSlots();
  
  // 現在の週を特定（例: 第3週）
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentWeek = Math.ceil(currentDay / 7);
  
  if (currentWeek <= 1) {
    alert('現在は第1週のため、前週のパターンをコピーできません');
    return;
  }
  
  // 前週の曜日ごとの日付を取得
  const previousWeekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = (currentWeek - 2) * 7 + i + 1;
    if (day > 0 && day <= daysInMonth) {
      previousWeekDays.push(day);
    }
  }
  
  if (previousWeekDays.length === 0) {
    alert('前週のデータが見つかりません');
    return;
  }
  
  // 現在の週の日付を取得
  const currentWeekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = (currentWeek - 1) * 7 + i + 1;
    if (day > 0 && day <= daysInMonth) {
      currentWeekDays.push(day);
    }
  }
  
  // 前週から現在の週にパターンをコピー
  let changeCount = 0;
  
  previousWeekDays.forEach((prevDay, index) => {
    if (index < currentWeekDays.length) {
      const currentDay = currentWeekDays[index];
      
      // 各スロットについて前週の設定をコピー
      shiftSlots.forEach(slot => {
        const prevDate = app.formatDate(year, month, prevDay);
        const currentDate = app.formatDate(year, month, currentDay);
        
        const prevKey = `${prevDate}_${slot.id}`;
        const currentKey = `${currentDate}_${slot.id}`;
        
        // 前週の必要人数を取得
        let prevCount;
        if (prevKey in requiredStaff.specific) {
          prevCount = requiredStaff.specific[prevKey];
        } else {
          prevCount = requiredStaff.default[slot.id] || 1;
        }
        
        // 現在の週に適用
        if (prevCount === requiredStaff.default[slot.id]) {
          // デフォルト値と同じなら特定日設定を削除
          if (currentKey in requiredStaff.specific) {
            delete requiredStaff.specific[currentKey];
            changeCount++;
          }
        } else {
          // デフォルト値と異なる場合は特定日設定を保存
          requiredStaff.specific[currentKey] = prevCount;
          changeCount++;
        }
        
        // 入力欄を更新
        const input = document.querySelector(`.spreadsheet-requirement[data-date="${currentDate}"][data-slot-id="${slot.id}"]`);
        if (input) {
          input.value = prevCount;
        }
      });
    }
  });
  
  // 特定日設定テーブルを更新
  updateSpecificRequirementTable();
  
  alert(`前週のパターンをコピーしました (${changeCount}件の変更)`);
}

// パターン適用ダイアログを表示
function showPatternDialog() {
  // Bootstrap のモーダルを初期化
  const patternDialog = new bootstrap.Modal(document.getElementById('pattern-dialog'));
  
  // 日付入力に現在の月を設定
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const [year, month] = adminShiftMonth.value.split('-');
  document.getElementById('pattern-start-date').min = `${year}-${month}-01`;
  document.getElementById('pattern-start-date').max = `${year}-${month}-${app.getDaysInMonth(parseInt(year), parseInt(month))}`;
  document.getElementById('pattern-start-date').value = `${year}-${month}-01`;
  
  // 適用ボタンのイベントハンドラ
  document.getElementById('apply-pattern-confirm-btn').addEventListener('click', function() {
    const patternType = document.getElementById('pattern-type').value;
    
    if (patternType === 'weekly') {
      applyWeeklyPattern();
    } else if (patternType === 'weekday-weekend') {
      applyWeekdayWeekendPattern();
    } else if (patternType === 'custom') {
      applyCustomPattern();
    }
    
    patternDialog.hide();
  });
  
  patternDialog.show();
}

// 週間パターンを適用
function applyWeeklyPattern() {
  const startDate = new Date(document.getElementById('pattern-start-date').value);
  const repeatCount = parseInt(document.getElementById('pattern-repeat-count').value, 10);
  
  if (isNaN(repeatCount) || repeatCount < 1) {
    alert('有効な繰り返し回数を入力してください');
    return;
  }
  
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const [year, month] = adminShiftMonth.value.split('-').map(Number);
  const daysInMonth = app.getDaysInMonth(year, month);
  const shiftSlots = app.getShiftSlots();
  
  // 開始日の曜日を取得
  const startDayOfWeek = startDate.getDay();
  
  // パターンの初週のデータを収集
  const patternData = [];
  for (let i = 0; i < 7; i++) {
    const patternDay = new Date(startDate);
    patternDay.setDate(startDate.getDate() + i);
    
    // 月が一致しない場合はスキップ
    if (patternDay.getMonth() + 1 !== month) continue;
    
    const dayData = {
      day: patternDay.getDate(),
      slots: {}
    };
    
    // 各スロットの必要人数を取得
    shiftSlots.forEach(slot => {
      const dateStr = app.formatDate(patternDay.getFullYear(), patternDay.getMonth() + 1, patternDay.getDate());
      const key = `${dateStr}_${slot.id}`;
      
      if (key in requiredStaff.specific) {
        dayData.slots[slot.id] = requiredStaff.specific[key];
      } else {
        dayData.slots[slot.id] = requiredStaff.default[slot.id] || 1;
      }
    });
    
    patternData.push(dayData);
  }
  
  if (patternData.length === 0) {
    alert('パターンデータが取得できませんでした');
    return;
  }
  
  // パターンを繰り返し適用
  let changeCount = 0;
  
  for (let week = 1; week < repeatCount; week++) {
    patternData.forEach(dayData => {
      const targetDay = dayData.day + (week * 7);
      
      // 月の範囲外ならスキップ
      if (targetDay > daysInMonth) return;
      
      const targetDate = app.formatDate(year, month, targetDay);
      
      // 各スロットにパターンを適用
      Object.entries(dayData.slots).forEach(([slotId, count]) => {
        const targetKey = `${targetDate}_${slotId}`;
        
        // デフォルト値と比較
        if (count === requiredStaff.default[slotId]) {
          // 特定日設定を削除
          if (targetKey in requiredStaff.specific) {
            delete requiredStaff.specific[targetKey];
            changeCount++;
          }
        } else {
          // 特定日設定を保存
          requiredStaff.specific[targetKey] = count;
          changeCount++;
        }
        
        // 入力欄を更新
        const input = document.querySelector(`.spreadsheet-requirement[data-date="${targetDate}"][data-slot-id="${slotId}"]`);
        if (input) {
          input.value = count;
        }
      });
    });
  }
  
  // 特定日設定テーブルを更新
  updateSpecificRequirementTable();
  
  alert(`週間パターンを ${repeatCount - 1}回 適用しました (${changeCount}件の変更)`);
}

// 平日/休日パターンを適用
function applyWeekdayWeekendPattern() {
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const [year, month] = adminShiftMonth.value.split('-').map(Number);
  const daysInMonth = app.getDaysInMonth(year, month);
  const shiftSlots = app.getShiftSlots();
  
  // 平日・休日の設定を取得
  const weekdaySettings = {};
  const weekendSettings = {};
  
  document.querySelectorAll('.weekday-slot-input').forEach(input => {
    const slotId = input.dataset.slotId;
    const count = parseInt(input.value, 10);
    if (!isNaN(count) && count >= 0) {
      weekdaySettings[slotId] = count;
    }
  });
  
  document.querySelectorAll('.weekend-slot-input').forEach(input => {
    const slotId = input.dataset.slotId;
    const count = parseInt(input.value, 10);
    if (!isNaN(count) && count >= 0) {
      weekendSettings[slotId] = count;
    }
  });
  
  // 各日付に適用
  let changeCount = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = app.formatDate(year, month, day);
    const weekdayIndex = app.getWeekdayIndex(year, month, day);
    const isWeekend = app.isWeekend(weekdayIndex);
    
    // 各スロットに適用
    shiftSlots.forEach(slot => {
      const key = `${date}_${slot.id}`;
      const settings = isWeekend ? weekendSettings : weekdaySettings;
      const count = settings[slot.id];
      
      if (count === undefined) return; // 設定がない場合はスキップ
      
      // デフォルト値と比較
      if (count === requiredStaff.default[slot.id]) {
        // 特定日設定を削除
        if (key in requiredStaff.specific) {
          delete requiredStaff.specific[key];
          changeCount++;
        }
      } else {
        // 特定日設定を保存
        requiredStaff.specific[key] = count;
        changeCount++;
      }
      
      // 入力欄を更新
      const input = document.querySelector(`.spreadsheet-requirement[data-date="${date}"][data-slot-id="${slot.id}"]`);
      if (input) {
        input.value = count;
      }
    });
  }
  
  // 特定日設定テーブルを更新
  updateSpecificRequirementTable();
  
  alert(`平日/休日パターンを適用しました (${changeCount}件の変更)`);
}

// カスタムパターンを適用
function applyCustomPattern() {
  const csvText = document.getElementById('custom-pattern-csv').value.trim();
  if (!csvText) {
    alert('パターンデータを入力してください');
    return;
  }
  
  // CSVパース
  const lines = csvText.split('\n');
  if (lines.length < 2) {
    alert('少なくとも2行のデータが必要です (ヘッダー行と値の行)');
    return;
  }
  
  // ヘッダー行からスロットIDを取得
  const slotIds = lines[0].split(',').map(s => s.trim());
  
  // 値の行から必要人数を取得
  const patterns = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(s => parseInt(s.trim(), 10));
    
    if (values.length !== slotIds.length) {
      alert(`${i + 1}行目: 列数がヘッダーと一致しません`);
      return;
    }
    
    const pattern = {};
    slotIds.forEach((slotId, index) => {
      if (isNaN(values[index])) {
        alert(`${i + 1}行目, ${slotId}: 有効な数値ではありません`);
        return;
      }
      pattern[slotId] = values[index];
    });
    
    patterns.push(pattern);
  }
  
  // パターンの適用先を設定
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const [year, month] = adminShiftMonth.value.split('-').map(Number);
  const daysInMonth = app.getDaysInMonth(year, month);
  
  // パターンを適用
  let changeCount = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    // パターンのインデックス (日数を超えたら繰り返し)
    const patternIndex = (day - 1) % patterns.length;
    const pattern = patterns[patternIndex];
    
    const date = app.formatDate(year, month, day);
    
    // 各スロットにパターンを適用
    Object.entries(pattern).forEach(([slotId, count]) => {
      const key = `${date}_${slotId}`;
      
      // デフォルト値と比較
      if (count === requiredStaff.default[slotId]) {
        // 特定日設定を削除
        if (key in requiredStaff.specific) {
          delete requiredStaff.specific[key];
          changeCount++;
        }
      } else {
        // 特定日設定を保存
        requiredStaff.specific[key] = count;
        changeCount++;
      }
      
      // 入力欄を更新
      const input = document.querySelector(`.spreadsheet-requirement[data-date="${date}"][data-slot-id="${slotId}"]`);
      if (input) {
        input.value = count;
      }
    });
  }
  
  // 特定日設定テーブルを更新
  updateSpecificRequirementTable();
  
  alert(`カスタムパターンを適用しました (${changeCount}件の変更)`);
}
        
