// シフト自動編成アルゴリズム
// このファイルはシフトの自動割り当てロジックを実装します

// メインの自動編成関数
function generateAutomaticShifts(preferences, employees, requiredStaff, constraints = {}) {
  // 結果を格納するオブジェクト
  const finalShifts = {};
  
  // 日付とシフトスロットの組み合わせを取得
  const dateSlotCombinations = getAllDateSlotCombinations(preferences);
  
  // 各日付・スロットごとに割り当てを行う
  dateSlotCombinations.forEach(({ date, slotId }) => {
    // この日付・スロットのシフトキー
    const shiftKey = `${date}_${slotId}`;
    
    // 各従業員の勤務可能状況を取得
    const availableEmployees = getAvailableEmployees(preferences, employees, date, slotId);
    
    // 割り当てる従業員を決定
    const assignedEmployees = assignEmployeesToShift(
      availableEmployees,
      requiredStaff[slotId] || 1, // デフォルトは1人必要と仮定
      constraints,
      finalShifts, // これまでの割り当て結果
      date,
      slotId
    );
    
    // 結果を保存
    finalShifts[shiftKey] = assignedEmployees;
  });
  
  return finalShifts;
}

// 日付とスロットの全組み合わせを取得
function getAllDateSlotCombinations(preferences) {
  const combinations = [];
  
  // すべての希望データから日付とスロットの組み合わせを抽出
  Object.keys(preferences).forEach(employeeId => {
    const empPrefs = preferences[employeeId].preferences || {};
    Object.keys(empPrefs).forEach(key => {
      const [date, slotId] = key.split('_');
      
      // 既に登録済みの組み合わせでないことを確認
      const exists = combinations.some(c => c.date === date && c.slotId === slotId);
      if (!exists) {
        combinations.push({ date, slotId });
      }
    });
  });
  
  // 日付でソート
  combinations.sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
  });
  
  return combinations;
}

// 特定の日付・スロットで勤務可能な従業員を取得
function getAvailableEmployees(preferences, employees, date, slotId) {
  const available = [];
  
  employees.forEach(emp => {
    const empId = emp.id || emp.employeeId;
    const empPrefs = preferences[empId]?.preferences || {};
    const key = `${date}_${slotId}`;
    
    // 従業員の希望を確認
    if (empPrefs[key] && empPrefs[key].available) {
      available.push({
        ...emp,
        id: empId,
        employeeId: empId
      });
    }
    // 希望が未設定の場合はフルタイム従業員なら勤務可能とみなす
    else if (!empPrefs[key] && emp.employmentType === 'fulltime') {
      available.push({
        ...emp,
        id: empId,
        employeeId: empId
      });
    }
  });
  
  return available;
}

// シフトに従業員を割り当てる
function assignEmployeesToShift(availableEmployees, requiredCount, constraints, finalShifts, date, slotId) {
  // 制約条件を適用して候補をフィルタリング
  const eligibleEmployees = filterEligibleEmployees(
    availableEmployees, 
    constraints, 
    finalShifts, 
    date, 
    slotId
  );
  
  // 割り当てロジック
  // 1. 過去のシフト回数が少ない従業員を優先
  // 2. スキルマッチング（該当スロットに必要なスキルを持つ従業員を優先）
  // 3. 希望マッチング（明示的に希望を出している従業員を優先）
  
  // シフト回数に基づいてソート
  const sortedEmployees = [...eligibleEmployees].sort((a, b) => {
    // 過去のシフト回数をカウント
    const aShiftCount = countPreviousShifts(a.employeeId, finalShifts);
    const bShiftCount = countPreviousShifts(b.employeeId, finalShifts);
    
    // シフト回数で比較
    if (aShiftCount !== bShiftCount) {
      return aShiftCount - bShiftCount; // 少ない方を優先
    }
    
    // スキルマッチングによる比較（実装例）
    const aSkillMatch = hasRequiredSkills(a, slotId) ? 1 : 0;
    const bSkillMatch = hasRequiredSkills(b, slotId) ? 1 : 0;
    
    if (aSkillMatch !== bSkillMatch) {
      return bSkillMatch - aSkillMatch; // スキルマッチする方を優先
    }
    
    // フルタイム・パートタイムの考慮
    const aIsFulltime = a.employmentType === 'fulltime' ? 1 : 0;
    const bIsFulltime = b.employmentType === 'fulltime' ? 1 : 0;
    
    return bIsFulltime - aIsFulltime; // フルタイムを優先
  });
  
  // 必要人数分だけ割り当て
  return sortedEmployees.slice(0, Math.min(requiredCount, sortedEmployees.length))
    .map(emp => emp.employeeId);
}

// 制約条件を適用して候補をフィルタリング
function filterEligibleEmployees(employees, constraints, finalShifts, date, slotId) {
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

// スキルマッチングチェック（仮実装）
function hasRequiredSkills(employee, slotId) {
  if (!employee.skills) return false;
  
  // 簡易的なスキルマッチング
  // 実際には、各スロットに必要なスキルのマスタデータが必要
  const skillMap = {
    'early': ['reception', 'morning'],
    'middle': ['reception', 'reservation'],
    'late': ['reservation', 'evening'],
    'night': ['reception', 'night']
  };
  
  const requiredSkills = skillMap[slotId] || [];
  
  // 従業員のスキルが必要スキルと1つでも一致するか
  return employee.skills.some(skill => requiredSkills.includes(skill));
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
  let consecutiveDays = 1; // 今日も含める
  
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
  
  return consecutiveDays > maxDays;
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
    const hoursAfterNightShift = currentSlot.start - 6;
    if (hoursAfterNightShift < 0) {
      hoursAfterNightShift += 24; // 翌日になる場合
    }
    
    // 休憩時間が足りない場合
    if (hoursAfterNightShift < restHours) {
      return false;
    }
  }
  
  // 今日の他のシフトとの間隔もチェック（省略）
  
  return true;
}

// 公開する関数
window.shiftAlgorithm = {
  generateAutomaticShifts
};
