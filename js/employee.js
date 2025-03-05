// 従業員用機能
function initEmployee() {
  // DOM要素の参照を取得
  const shiftMonth = document.getElementById('shift-month');
  const shiftStatus = document.getElementById('shift-status');
  const shiftGridContainer = document.getElementById('shift-grid-container');
  const savePreferencesBtn = document.getElementById('save-preferences-btn');
  
  // 現在の月を設定
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  shiftMonth.value = currentYearMonth;
  
  // シフト希望データ
  let shiftPreferences = {};
  
  // 月が変更されたときのイベントハンドラ
  shiftMonth.addEventListener('change', loadShiftPreferences);
  
  // 初期ロード
  loadShiftPreferences();
  
  // シフト希望の読み込み
  async function loadShiftPreferences() {
    const yearMonth = shiftMonth.value;
    if (!yearMonth) return;
    
    const [year, month] = yearMonth.split('-').map(num => parseInt(num, 10));
    const employeeId = app.getCurrentUser();
    const employeeData = app.getEmployeeData();
    
    try {
      shiftStatus.textContent = '読み込み中...';
      shiftStatus.className = 'alert alert-info';
      
      // Firestore からシフト希望を取得
      const docId = `${employeeId}_${yearMonth}`;
      const docRef = db.collection('monthlyShiftPreferences').doc(docId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const data = doc.data();
        shiftPreferences = data.preferences || {};
        shiftStatus.textContent = `前回の希望を読み込みました (最終更新: ${new Date(data.updatedAt.toDate()).toLocaleString()})`;
      } else {
        // 新規作成
        shiftPreferences = {};
        shiftStatus.textContent = '新規作成: このシフト希望はまだ保存されていません';
      }
      
      // シフトグリッドを生成
      generateShiftGrid(year, month, employeeData.employmentType);
      
    } catch (error) {
      console.error('シフト希望の読み込みエラー:', error);
      shiftStatus.textContent = 'エラー: シフト希望の読み込みに失敗しました';
      shiftStatus.className = 'alert alert-danger';
    }
  }
  
  // シフトグリッドの生成
  function generateShiftGrid(year, month, employmentType) {
    const daysInMonth = app.getDaysInMonth(year, month);
    const shiftSlots = app.getShiftSlots();
    
    // テーブルの作成
    let html = `
    <div class="shift-grid">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>日付</th>
    `;
    
    // スロットヘッダー
    shiftSlots.forEach(slot => {
      html += `<th class="${slot.className}">${slot.name}<br>${slot.startTime}～${slot.endTime}</th>`;
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
      
      // スロットごとのチェックボックス
      shiftSlots.forEach(slot => {
        const slotKey = `${date}_${slot.id}`;
        const preference = shiftPreferences[slotKey] || { available: employmentType === 'parttime' ? false : true };
        
        // フルタイムの場合は「休み希望」形式、パートタイムの場合は「勤務可能」形式
        const checkboxLabel = employmentType === 'parttime' ? '出勤可' : '休み';
        const isChecked = employmentType === 'parttime' ? 
                          preference.available : 
                          !preference.available;
        
        html += `
          <td class="${slot.className}">
            <div class="form-check">
              <input type="checkbox" class="form-check-input shift-checkbox" 
                    id="${slotKey}" data-slot-key="${slotKey}" 
                    ${isChecked ? 'checked' : ''}>
              <label class="form-check-label" for="${slotKey}">${checkboxLabel}</label>
            </div>
            <div class="mt-1">
              <input type="text" class="form-control form-control-sm shift-note" 
                    placeholder="備考" value="${preference.note || ''}" 
                    data-slot-key="${slotKey}">
            </div>
          </td>
        `;
      });
      
      html += '</tr>';
    }
    
    html += `
        </tbody>
      </table>
    </div>
    `;
    
    // HTMLを挿入
    shiftGridContainer.innerHTML = html;
    
    // チェックボックスとノート入力のイベントリスナーを設定
    document.querySelectorAll('.shift-checkbox, .shift-note').forEach(elem => {
      elem.addEventListener('change', updatePreference);
    });
  }
  
  // シフト希望の更新
  function updatePreference(e) {
    const element = e.target;
    const slotKey = element.dataset.slotKey;
    const employmentType = app.getEmployeeData().employmentType;
    
    if (!shiftPreferences[slotKey]) {
      shiftPreferences[slotKey] = {
        available: employmentType === 'parttime' ? false : true,
        note: ''
      };
    }
    
    if (element.classList.contains('shift-checkbox')) {
      // チェックボックスの場合は available を更新
      // フルタイムとパートタイムで挙動が異なることに注意
      if (employmentType === 'parttime') {
        shiftPreferences[slotKey].available = element.checked;
      } else {
        shiftPreferences[slotKey].available = !element.checked;
      }
    } else if (element.classList.contains('shift-note')) {
      // ノート入力の場合は note を更新
      shiftPreferences[slotKey].note = element.value;
    }
    
    // 保存前に状態を更新
    shiftStatus.textContent = '変更が未保存です';
    shiftStatus.className = 'alert alert-warning';
  }
  
  // シフト希望の保存
  savePreferencesBtn.addEventListener('click', async function() {
    const yearMonth = shiftMonth.value;
    if (!yearMonth) {
      alert('月を選択してください');
      return;
    }
    
    try {
      const employeeId = app.getCurrentUser();
      const docId = `${employeeId}_${yearMonth}`;
      
      // 保存するデータを準備
      const data = {
        employeeId,
        month: yearMonth,
        preferences: shiftPreferences,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Firestore に保存
      await db.collection('monthlyShiftPreferences').doc(docId).set(data);
      
      shiftStatus.textContent = `シフト希望を保存しました (${new Date().toLocaleString()})`;
      shiftStatus.className = 'alert alert-success';
      
    } catch (error) {
      console.error('シフト希望の保存エラー:', error);
      shiftStatus.textContent = 'エラー: シフト希望の保存に失敗しました';
      shiftStatus.className = 'alert alert-danger';
    }
  });
}
