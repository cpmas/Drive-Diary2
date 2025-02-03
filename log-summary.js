
document.addEventListener('DOMContentLoaded', function () {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        db.collection("users").doc(user.uid)
          .collection("logs")
          .orderBy("timestamp", "asc")
          .get()
          .then(querySnapshot => {
            const logEntries = [];
            querySnapshot.forEach(doc => {
              logEntries.push(doc.data());
            });
            processLogs(logEntries);
          })
          .catch(error => {
            console.error("Error getting logs: ", error);
          });
      } else {
        window.location.href = "login.html";
      }
    });
  });
  
  function formatDateToDMY(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  function processLogs(logEntries) {
    const tableBody = document.getElementById('log-entries');
    const MS_IN_A_DAY = 86400000;
    
    function getFinancialYearStart() {
      const today = new Date();
      const currentYear = today.getFullYear();
      return new Date(today < new Date(currentYear, 6, 1) ? currentYear - 1 : currentYear, 6, 1);
    }
  
    function getStartOfWeek() {
      const today = new Date();
      const dayOfWeek = today.getDay();
      return new Date(today - dayOfWeek * MS_IN_A_DAY);
    }
  
    let totalKm = 0, weeklyKm = 0, totalFyKm = 0;
    let weeklyCounts = new Map();
    const fyStart = getFinancialYearStart();
    const weekStart = getStartOfWeek();
  
    logEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      const entryKm = entry.kilometersDriven;
      totalKm += entryKm;
      if (entryDate >= weekStart) {
        weeklyKm += entryKm;
      }
      const weekStartDate = new Date(entryDate - entryDate.getDay() * MS_IN_A_DAY).toISOString().split('T')[0];
      weeklyCounts.set(weekStartDate, (weeklyCounts.get(weekStartDate) || 0) + entryKm);
      if (entryDate >= fyStart) {
        totalFyKm += entryKm;
      }
    });
  
    const averageWeeklyKm = totalKm / weeklyCounts.size;
    document.getElementById('this-week-total').textContent = weeklyKm.toFixed(2);
    document.getElementById('weekly-average').textContent = averageWeeklyKm.toFixed(2);
    document.getElementById('total-fy').textContent = totalFyKm.toFixed(2);
  
    logEntries.forEach(entry => {
      const newRow = tableBody.insertRow();
      newRow.innerHTML = `
        <td colspan="4">
          <strong>Date:</strong> ${formatDateToDMY(entry.date)} </br>
          <strong>Start:</strong> ${entry.startOdometer} km, 
          <strong>End:</strong> ${entry.endOdometer} km </br>
          <strong>Purpose:</strong> ${entry.purpose}
        </td>
      `;
    });
  }
  
