// メインアプリケーションロジック
document.addEventListener('DOMContentLoaded', function() {
  // DOM要素の参照を取得
  const loginContainer = document.getElementById('login-container');
  const employeeContainer = document.getElementById('employee-container');
  const adminContainer = document.getElementById('admin-container');
  const loginForm = document.getElementById('login-form');
  const employeeName = document.getElementById('employee-name');
  const adminName = document.getElementById('admin-name');
  const logoutBtn = document.getElementById('logout-btn');
  const adminLogoutBtn = document.getElementById('admin-logout-btn');

  // ログイン状態とユーザー情報
  let currentUser = null;
  let employeeData = null;

  // 簡易認証機能
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('employee-id').value;
    const password = document.getElementById('password').value;
    
    try {
      // 本番環境では Firebase Authentication を使用する予定
      // 簡易認証のため、Firestore から直接ユーザー情報を取得する
      const employeeRef = db.collection('employees').doc(employeeId);
      const employeeDoc = await employeeRef.get();
      
      if (!employeeDoc.exists) {
        throw new Error('社員が見つかりません');
      }
      
      const employee = employeeDoc.data();
      
      // 簡易的なパスワード検証（本番では Firebase Authentication を使用）
      if (employee.password !== password) {
        throw new Error('パスワードが一致しません');
      }
      
      // ログイン成功
      currentUser = employeeId;
      employeeData = employee;
      
      // ユーザー名を表示
      employeeName.textContent = `${employee.name} (${employee.employeeId})`;
      adminName.textContent = `${employee.name} (${employee.employeeId})`;
      
      // 適切な画面を表示
      loginContainer.classList.add('d-none');
      
      if (employee.role === 'admin') {
        adminContainer.classList.remove('d-none');
        initAdmin();
      } else {
        employeeContainer.classList.remove('d-none');
        initEmployee();
      }
      
    } catch (error) {
      alert('ログインエラー: ' + error.message);
      console.error('ログインエラー:', error);
    }
  });

  // ログアウト処理
  function handleLogout() {
    // ユーザー状態をリセット
    currentUser = null;
    employeeData = null;
    
    // フォームをリセット
    loginForm.reset();
    
    // 画面表示を切り替え
    adminContainer.classList.add('d-none');
    employeeContainer.classList.add('d-none');
    loginContainer.classList.remove('d-none');
  }
  
  logoutBtn.addEventListener('click', handleLogout);
  adminLogoutBtn.addEventListener('click', handleLogout);

  // 日付操作ユーティリティ関数
  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }
  
  function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  function getWeekdayIndex(year, month, day) {
    return new Date(year, month - 1, day).getDay();
  }
  
  function isWeekend(weekdayIndex) {
    return weekdayIndex === 0 || weekdayIndex === 6;
  }
  
  function getWeekdayClass(weekdayIndex) {
    if (weekdayIndex === 0) return 'sunday';
    if (weekdayIndex === 6) return 'saturday';
    return '';
  }
  
  // CSVエクスポート機能
  function exportTableToCSV(tableId, filename = 'export.csv') {
    const table = document.getElementById(tableId);
    let csv = [];
    
    // ヘッダー行を取得
    const headerRow = table.querySelector('thead tr');
    let header = [];
    headerRow.querySelectorAll('th').forEach(cell => {
      header.push('"' + cell.innerText.replace(/"/g, '""') + '"');
    });
    csv.push(header.join(','));
    
    // データ行を取得
    table.querySelectorAll('tbody tr').forEach(row => {
      let rowData = [];
      row.querySelectorAll('td').forEach(cell => {
        rowData.push('"' + cell.innerText.replace(/"/g, '""') + '"');
      });
      csv.push(rowData.join(','));
    });
    
    // CSVデータをBlobに変換
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // グローバルスコープに関数をエクスポート
  window.app = {
    getCurrentUser: () => currentUser,
    getEmployeeData: () => employeeData,
    getShiftSlots: () => SHIFT_SLOTS,
    getDepartments: () => DEPARTMENTS,
    formatDate,
    getDaysInMonth,
    getWeekdayIndex,
    isWeekend,
    getWeekdayClass,
    exportTableToCSV
  };
});
