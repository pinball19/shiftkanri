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
  
  // 特定日入力の日付を現在の月に設定
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const [year, month] = adminShiftMonth.value.split('-');
  document.getElementById('specific-date').min = `${year}-${month}-01`;
  document.getElementById('specific-date').max = `${year}-${month}-${app.getDaysInMonth(parseInt(year), parseInt(month))}`;
  document.getElementById('specific-date').value = `${year}-${month}-01`;
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
  document.getElementById('specific-requirement-body').addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-specific-btn')) {
      const key = e.target.dataset.key;
      
      // 設定を削除
      delete requiredStaff.specific[key];
      
      // テーブルを更新
      updateSpecificRequirementTable();
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
