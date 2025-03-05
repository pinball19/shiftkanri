// 管理者用機能
function initAdmin() {
  // DOM要素の参照を取得
  const adminShiftMonth = document.getElementById('admin-shift-month');
  const departmentFilter = document.getElementById('department-filter');
  const shiftTabs = document.getElementById('shift-tabs');
  const adminShiftGridContainer = document.getElementById('admin-shift-grid-container');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  
  // 現在の月を設定
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  adminShiftMonth.value = currentYearMonth;
  
  // 選択中のスロットとデータキャッシュ
  let selectedSlot = '';
  let cachedEmployees = [];
  let cachedPreferences = [];

  // 部署フィルターを初期化
  initDepartmentFilter();
  
  // 月または部署が変更されたときのイベントハンドラ
  adminShiftMonth.addEventListener('change', loadAdminData);
  departmentFilter.addEventListener('change', filterAndRenderGrid);
  
  // CSVエクスポートボタン
  exportCsvBtn.addEventListener('click', function() {
    const yearMonth = adminShiftMonth.value;
    const department = departmentFilter.value;
    const slotId = selectedSlot;
    const filename = `シフト集計_${yearMonth}_${department !== 'all' ? department : '全部署'}_${slotId || '全時間帯'}.csv`;
    app.exportTableToCSV('admin-shift-table', filename);
  });
  
  // 初期ロード
  loadAdminData();

  // 部署フィルターの初期化
  function initDepartmentFilter() {
    // 既存のオプションをクリア
    departmentFilter.innerHTML = '<option value="all">全部署</option>';
    
    // 部署オプションを追加
    app.getDepartments().forEach(dept => {
      const option = document.createElement('option');
      option.value = dept.id;
      option.textContent = dept.name;
      departmentFilter.appendChild(option);
    });
  }
  
  // スロットタブの初期化
  function initShiftTabs() {
    // 既存のタブをクリア
    shiftTabs.innerHTML = '';
    
    // すべてのスロットを表示するタブ
    const allTab = document.createElement('li');
    allTab.className = 'nav-item';
    allTab.innerHTML = `
      <a class="nav-link active" href="#" data-slot-id="">すべての時間帯</a>
    `;
    shiftTabs.appendChild(allTab);
    
    // 各スロットのタブを追加
    app.getShiftSlots().forEach(slot => {
      const tab = document.createElement('li');
      tab.className = 'nav-item';
      tab.innerHTML = `
        <a class="nav-link" href="#" data-slot-id="${slot.id}">${slot.name} (${slot.startTime}～${slot.endTime})</a>
      `;
      shiftTabs.appendChild(tab);
    });
    
    // タブのクリックイベントを設定
    document.querySelectorAll('#shift-tabs .nav-link').forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        
        // タブの状態を更新
        document.querySelectorAll('#shift-tabs .nav-link').forEach(t => {
          t.classList.remove('active');
        });
        this.classList.add('active');
        
        // 選択したスロットを更新
        selectedSlot = this.dataset.slotId;
        
        // グリッドを再描画
        filterAndRenderGrid();
      });
    });
    
    // デフォルトではすべてのスロットを表示
    selectedSlot = '';
  }
  
  // 管理者データを読み込む
  async function loadAdminData() {
    const yearMonth = adminShiftMonth.value;
    if (!yearMonth) return;
    
    try {
      // UIを一時的に無効化
      adminShiftGridContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border"></div><p class="mt-3">データを読み込んでいます...</p></div>';
      
      // 従業員データを取得
      const employeesSnapshot = await db.collection('employees').get();
      cachedEmployees = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // シフト希望データを取得
      const prefSnapshot = await db.collection('monthlyShiftPreferences')
        .where('month', '==', yearMonth)
        .get();
      
      cachedPreferences = prefSnapshot.docs.map(doc => doc.data());
      
      // スロットタブを初期化
      initShiftTabs();
      
      // グリッドを描画
      filterAndRenderGrid();
      
    } catch (error) {
      console.error('管理者データの読み込みエラー:', error);
      adminShiftGridContainer.innerHTML = '<div class="alert alert-danger">データの読み込みに失敗しました</div>';
    }
  }
  
  // フィルターを適用してグリッドを描画
  function filterAndRenderGrid() {
    const yearMonth = adminShiftMonth.value;
    if (!yearMonth) return;
    
    const [year, month] = yearMonth.split('-').map(num => parseInt(num, 10));
    const departmentId = departmentFilter.value;
    
    // 従業員をフィルタリング
    let filteredEmployees = cachedEmployees;
    if (departmentId !== 'all') {
      filteredEmployees = cachedEmployees.filter(emp => emp.department === departmentId);
    }
    
    // シフトグリッドを生成
    generateAdminShiftGrid(year, month, filteredEmployees, cachedPreferences);
  }
  
  // 管理者用シフトグリッドの生成
  function generateAdminShiftGrid(year, month, employees, preferences) {
    const daysInMonth = app.getDaysInMonth(year, month);
    const shiftSlots = app.getShiftSlots();
    
    // フィルタリングされたスロット
    let filteredSlots = shiftSlots;
    if (selectedSlot) {
      filteredSlots = shiftSlots.filter(slot => slot.id === selectedSlot);
    }
    
    // テーブルの作成
    let html = `
    <div class="admin-grid">
      <table id="admin-shift-table" class="table table-bordered table-sm">
        <thead>
          <tr>
            <th rowspan="2">日付</th>
    `;
    
    // 従業員のヘッダー
    employees.forEach(emp => {
      html += `<th colspan="${filteredSlots.length}">${emp.name}</th>`;
    });
    
    html += `
          </tr>
          <tr>
    `;
    
    // スロットのサブヘッダー
    employees.forEach(emp => {
      filteredSlots.forEach(slot => {
        html += `<th class="${slot.className}">${slot.name}</th>`;
      });
    });
    
    html += `
          </tr>
        </thead>
        <tbody>
    `;
    
    // 日付ごとの行
    for (let day = 1; day <= daysInMonth; day++) {
      const date = app.formatDate(year, month, day);
      const weekdayIndex = app.getWeekdayIndex(year, month, day);
      const weekdayClass = app.getWeekdayClass(weekdayIndex);
      const weekendClass = app.isWeekend(weekdayIndex) ? 'weekend' : '';
      
      html += `
        <tr class="${weekendClass}">
          <td class="date-header ${weekdayClass}">${month}/${day}</td>
      `;
      
      // 各従業員の各スロットの状態を表示
      employees.forEach(emp => {
        // この従業員の希望データを検索
        const empPref = preferences.find(p => p.employeeId === emp.id);
        
        filteredSlots.forEach(slot => {
          const slotKey = `${date}_${slot.id}`;
          let available = false;
          let note = '';
          
          if (empPref && empPref.preferences && empPref.preferences[slotKey]) {
            available = empPref.preferences[slotKey].available;
            note = empPref.preferences[slotKey].note || '';
          } else {
            // デフォルト状態
            available = emp.employmentType === 'fulltime';
          }
          
          const availableClass = available ? 'available-yes' : 'available-no';
          const tooltipHtml = note ? `<div class="note-tooltip">📝<span class="tooltip-text">${note}</span></div>` : '';
          
          html += `
            <td class="${slot.className} ${availableClass}">
              ${available ? '○' : '×'}
              ${tooltipHtml}
            </td>
          `;
        });
      });
      
      html += '</tr>';
    }
    
    // 集計行を追加
    html += `
        <tr class="table-secondary">
          <td><strong>合計可能数</strong></td>
    `;
    
    // 各従業員と各スロットの合計可能数を計算
    employees.forEach(emp => {
      filteredSlots.forEach(slot => {
        let availableCount = 0;
        
        // この従業員の希望データを検索
        const empPref = preferences.find(p => p.employeeId === emp.id);
        
        if (empPref && empPref.preferences) {
          // 月内の各日について
          for (let day = 1; day <= daysInMonth; day++) {
            const date = app.formatDate(year, month, day);
            const slotKey = `${date}_${slot.id}`;
            
            if (empPref.preferences[slotKey] && empPref.preferences[slotKey].available) {
              availableCount++;
            } else if (!empPref.preferences[slotKey] && emp.employmentType === 'fulltime') {
              // フルタイムの場合、明示的に設定されていなければデフォルトで可能
              availableCount++;
            }
          }
        } else if (emp.employmentType === 'fulltime') {
          // フルタイムでまだ希望が出ていない場合、すべて可能
          availableCount = daysInMonth;
        }
        
        html += `
          <td class="${slot.className}">
            <span class="available-count">${availableCount}</span>
          </td>
        `;
      });
    });
    
    html += `
        </tr>
        </tbody>
      </table>
    </div>
    `;
    
    // HTMLを挿入
    adminShiftGridContainer.innerHTML = html;
  }
}
