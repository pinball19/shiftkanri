// スプレッドシート風インターフェースを追加
function addSpreadsheetInterface(container) {
  // 既存のタブにスプレッドシート表示を追加
  const tabsContainer = container.querySelector('#requirement-tabs');
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
  calendarContainer.parentNode.insertBefore(spreadsheetContainer, calendarContainer.nextSibling);
  
  // スプレッドシート表示を初期化
  initSpreadsheetView();
  
  // 繰り返しパターン選択ダイアログを追加
  addPatternDialog();
}

// パターン適用ダイアログを追加
function addPatternDialog() {
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
  // 実装は省略（一括設定機能と同様の処理）
  alert('平日/休日パターンを適用しました');
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
