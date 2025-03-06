// シフト自動編成アルゴリズム
// このファイルはシフトの自動割り当てロジックを実装します

// メインの自動編成関数
function generateAutomaticShifts(preferences, employees, requiredStaff, constraints = {}) {
  console.log('=== シフト自動生成開始 ===');
  console.log('従業員数:', employees.length);
  console.log('従業員:', employees.map(e => e.name));
  console.log('希望データ数:', Object.keys(preferences).length);
  console.log('必要人数設定:', requiredStaff);
  console.log('制約条件:', constraints);
  
  // 結果を格納するオブジェクト
  const finalShifts = {};
  
  // 日付とシフトスロットの組み合わせを取得
  const dateSlotCombinations = getAllDateSlotCombinations(preferences);
  console.log('処理対象の日付×スロット組み合わせ数:', dateSlotCombinations.length);
  
  // 各日付・スロットごとに割り当てを行う
  dateSlotCombinations.forEach(({ date, slotId }, index) => {
    console.log(`\n[${index + 1}/${dateSlotCombinations.length}] 処理中: ${date} ${slotId}`);
    
    // この日付・スロットのシフトキー
    const shiftKey = `${date}_${slotId}`;
    
    // 各従業員の勤務可能状況を取得
    const availableEmployees = getAvailableEmployees(preferences, employees, date, slotId);
    console.log('勤務可能な従業員:', availableEmployees.map(e => e.name));
    
    // 割り当てる従業員を決定
    const assignedEmployees = assignEmployeesToShift(
      availableEmployees,
      requiredStaff[slotId] || 1, // デフォルトは1人必要と仮定
      constraints,
      finalShifts, // これまでの割り当て結果
      date,
      slotId
    );
    
    console.log('割り当て結果:', assignedEmployees);
    
    // 結果を保存
    finalShifts[shiftKey] = assignedEmployees;
  });
  
  console.log('\n=== 最終結果 ===');
  // 日付ごとの割り当て集計
  const summary = {};
  Object.entries(finalShifts).forEach(([key, assignedIds]) => {
    const [date, slotId] = key.split('_');
    if (!summary[date]) {
      summary[date] = {};
    }
    summary[date][slotId] = assignedIds;
  });
  
  console.log('日付ごとの割り当て:', summary);
  
  // 従業員ごとの割り当て回数
  const employeeCounts = {};
  employees.forEach(emp => {
    const empId = emp.id || emp.employeeId;
    employeeCounts[empId] = {
      name: emp.name,
      count: 0,
      slots: {
        early: 0,
        middle: 0,
        late: 0,
        night: 0
      }
    };
  });
  
  Object.entries(finalShifts).forEach(([key, assignedIds]) => {
    const [_, slotId] = key.split('_');
    assignedIds.forEach(empId => {
      if (employeeCounts[empId]) {
        employeeCounts[empId].count++;
        if (employeeCounts[empId].slots[slotId] !== undefined) {
          employeeCounts[empId].slots[slotId]++;
        }
      }
    });
  });
  
  console.log('従業員ごとの割り当て回数:', employeeCounts);
  
  return finalShifts;
}

// 日付とスロットの全組み合わせを取得
function getAllDateSlotCombinations(preferences) {
  console.log('日付×スロットの組み合わせを生成中...');
  
  const combinations = [];
  const dateSet = new Set();
  const slotSet = new Set();
  
  // すべての希望データから日付とスロットの組み合わせを抽出
  Object.keys(preferences).forEach(employeeId => {
    const empPrefs = preferences[employeeId].preferences || {};
    Object.keys(empPrefs).forEach(key => {
      const [date, slotId] = key.split('_');
      dateSet.add(date);
      slotSet.add(slotId);
    });
  });
  
  // 日付とスロットの全組み合わせを生成
  const dates = Array.from(dateSet).sort();
  const slots = Array.from(slotSet).sort();
  
  console.log('抽出された日付:', dates);
  console.log('抽出されたスロット:', slots);
  
  dates.forEach(date => {
    slots.forEach(slotId => {
      combinations.push({ date, slotId });
    });
  });
  
  console.log(`生成された組み合わせ数: ${combinations.length} (${dates.length}日 × ${slots.length}スロット)`);
  
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
  console.log(`勤務可能従業員を取得中: ${date} ${slotId}...`);
  
  const available = [];
  
  employees.forEach(emp => {
    const empId = emp.id || emp.employeeId;
    const empPrefs = preferences[empId]?.preferences || {};
    const key = `${date}_${slotId}`;
    
    let isAvailable = false;
    let reason = '';
    
    // 従業員の希望を確認
    if (empPrefs[key] && empPrefs[key].available) {
      isAvailable = true;
      reason = '明示的に希望あり';
    }
    // 希望が未設定の場合はフルタイム従業員なら勤務可能とみなす
    else if (!empPrefs[key] && emp.employmentType === 'fulltime') {
      isAvailable = true;
      reason = 'フルタイム・希望未設定';
    }
    // 希望が明示的に不可の場合
    else if (empPrefs[key] && !empPrefs[key].available) {
      reason = '明示的に不可';
    }
    // パートタイムで希望未設定の場合
    else if (!empPrefs[key] && emp.employmentType === 'parttime') {
      reason = 'パートタイム・希望未設定';
    }
    
    console.log(`- ${emp.name}: ${isAvailable ? '可能' : '不可'} (${reason})`);
    
    if (isAvailable) {
      available.push({
        ...emp,
        id: empId,
        employeeId: empId
      });
    }
  });
  
  console.log(`勤務可能従業員数: ${available.length}/${employees.length}`);
  
  return available;
}

// シフトに従業員を割り当てる
function assignEmployeesToShift(availableEmployees, requiredCount, constraints, finalShifts, date, slotId) {
  console.log(`シフト割り当て処理: ${date} ${slotId} (必要人数: ${requiredCount})`);
  
  // 制約条件を適用して候補をフィルタリング
  const eligibleEmployees = filterEligibleEmployees(
    availableEmployees, 
    constraints, 
    finalShifts, 
    date, 
    slotId
  );
  
  console.log(`制約適用後の候補者数: ${eligibleEmployees.length}/${availableEmployees.length}`);
  
  // 割り当てロジック
  // 1. 過去のシフト回数が少ない従業員を優先
  // 2. スキルマッチング（該当スロットに必要なスキルを持つ従業員を優先）
  // 3. 希望マッチング（明示的に希望を出している従業員を優先）
  
  // シフト回数に基づいてソート
  const sortedEmployees = [...eligibleEmployees].sort((a, b) => {
    // 過去のシフト回数をカウント
    const aShiftCount = countPreviousShifts(a.employeeId, finalShifts);
    const bShiftCount = countPreviousShifts(b.employeeId, finalShifts);
    
    console.log(`- ${a.name}: ${aShiftCount}回, ${b.name}: ${bShiftCount}回`);
    
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
  
  console.log('ソート後の候補者順:', sortedEmployees.map(e => e.name));
  
  // 必要人数分だけ割り当て
  const assignedEmployees = sortedEmployees
    .slice(0, Math.min(requiredCount, sortedEmployees.length))
    .map(emp => emp.employeeId);
  
  console.log(`割り当て結果: ${assignedEmployees.length}人 (${requiredCount}人中)`);
  
  return assignedEmployees;
}

// 制約条件を適用して候補をフィルタリング
function filterEligibleEmployees(employees, constraints, finalShifts, date, slotId) {
  console.log('制約条件によるフィルタリング開始...');
  
  if (Object.keys(constraints).length === 0) {
    console.log('制約条件が設定されていません。フィルタリングなし。');
    return employees;
  }
  
  return employees.filter(emp => {
    console.log(`\n従業員 ${emp.name} の制約チェック:`);
    let isEligible = true;
    let reason = '';
    
    // 最大連続勤務日数チェック
    if (constraints.maxConsecutiveDays) {
      const exceeding = isExceedingConsecutiveDays(
        emp.employeeId, 
        date, 
        finalShifts, 
        constraints.maxConsecutiveDays
      );
      
      if (exceeding) {
        isEligible = false;
        reason = `最大連続勤務日数(${constraints.maxConsecutiveDays}日)超過`;
      }
    }
    
    // 1日の最大シフト数チェック
    if (isEligible && constraints.maxShiftsPerDay) {
      const exceeding = isExceedingDailyShifts(
        emp.employeeId, 
        date, 
        finalShifts, 
        constraints.maxShiftsPerDay
      );
      
      if (exceeding) {
        isEligible = false;
        reason = `1日の最大シフト数(${constraints.maxShiftsPerDay})超過`;
      }
    }
    
    // 休憩時間チェック（例：夜勤後は早番に入れない）
    if (isEligible && constraints.restBetweenShifts) {
      const hasEnough = hasEnoughRest(
        emp.employeeId, 
        date, 
        slotId, 
        finalShifts, 
        constraints.restBetweenShifts
      );
      
      if (!hasEnough) {
        isEligible = false;
        reason = `休憩時間(${constraints.restBetweenShifts}時間)不足`;
      }
    }
    
    console.log(`- 結果: ${isEligible ? '適格' : '不適格'} ${reason ? `(${reason})` : ''}`);
    
    return isEligible;
  });
}

// 特定の従業員の過去のシフト回数をカウント
function countPreviousShifts(employeeId, finalShifts) {
  let count = 0;
  
  Object.entries(finalShifts).forEach(([key, assignedIds]) => {
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
  console.log(`連続勤務日数チェック(${employeeId}, ${date}, 上限:${maxDays}日)...`);
  
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
    
    console.log(`  ${prevDateStr}: ${workedThisDay ? '勤務あり' : '勤務なし'}`);
    
    if (workedThisDay) {
      consecutiveDays++;
    } else {
      break; // 連続が途切れた
    }
  }
  
  // 現在の日付を追加すると連続勤務日数が上限を超えるか
  const wouldExceed = consecutiveDays >= maxDays;
  console.log(`  現在の連続勤務日数: ${consecutiveDays}日 (上限超過: ${wouldExceed})`);
  
  return wouldExceed;
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
  
  console.log(`1日のシフト数チェック(${employeeId}, ${date}): 現在${dailyShiftCount}回 (上限:${maxShifts}回)`);
  
  return dailyShiftCount >= maxShifts;
}

// 休憩時間チェック
function hasEnoughRest(employeeId, date, slotId, finalShifts, restHours) {
  console.log(`休憩時間チェック(${employeeId}, ${date}_${slotId}, 必要休憩:${restHours}時間)...`);
  
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
  if (!currentSlot) {
    console.log('  スロット情報が不明。制約なし。');
    return true; // スロット情報が不明な場合は制約なしとする
  }
  
  // 前日の夜勤をチェック
  const yesterday = getYesterday(date);
  const nightShiftKey = `${yesterday}_night`;
  
  // 前日の夜勤があった場合
  if (finalShifts[nightShiftKey] && finalShifts[nightShiftKey].includes(employeeId)) {
    console.log(`  前日の夜勤あり: ${yesterday}_night`);
    
    // 夜勤終了（翌朝6時）から今回のシフト開始までの時間
    let hoursAfterNightShift = currentSlot.start - 6;
    if (hoursAfterNightShift < 0) {
      hoursAfterNightShift += 24; // 翌日になる場合
    }
    
    console.log(`  夜勤後の休憩時間: ${hoursAfterNightShift}時間 (必要:${restHours}時間)`);
    
    // 休憩時間が足りない場合
    if (hoursAfterNightShift < restHours) {
      return false;
    }
  } else {
    console.log('  前日の夜勤なし');
  }
  
  // 今日の他のシフトとの間隔もチェック（省略）
  console.log('  休憩時間条件を満たしています');
  
  return true;
}

// 公開する関数
window.shiftAlgorithm = {
  generateAutomaticShifts
};
