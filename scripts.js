
// Register Service Worker (if used)
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").then(
        (registration) => {
          console.log("ServiceWorker registration successful:", registration);
        },
        (error) => {
          console.log("ServiceWorker registration failed:", error);
        }
      );
    });
  }
  
  // (Optional) Check for authentication here too
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    }
  });
  
  // Quick Go state object
  let quickGoState = {
    date: null,
    startOdometer: null,
    endOdometer: null,
  };
  
  // Set today’s date as default in the manual form
  function setDefaultDate() {
    const dateField = document.getElementById('date');
    if (dateField) {
      const today = new Date();
      dateField.value = today.toISOString().split('T')[0];
    }
  }
  
  // Set default start miles by fetching the latest log from Firestore
  function setDefaultStartMiles() {
    const startMilesField = document.getElementById('start-odometer');
    const user = firebase.auth().currentUser;
    if (user) {
      db.collection("users").doc(user.uid).collection("logs")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get()
        .then(querySnapshot => {
          if (!querySnapshot.empty) {
            const lastEntry = querySnapshot.docs[0].data();
            startMilesField.value = lastEntry.endOdometer;
          } else {
            startMilesField.value = '';
          }
        })
        .catch(error => {
          console.error("Error getting last log entry:", error);
          startMilesField.value = '';
        });
    }
  }
  
  // Initialize Quick Go functionality
  function initializeQuickGo() {
    const goButton = document.getElementById('go-button');
    const endButton = document.getElementById('end-button');
    const updateInput = document.getElementById('update-start-odometer');
    const updateLabel = document.querySelector('#quick-go-update label');
  
    // Listen for auth state changes.
    firebase.auth().onAuthStateChanged(async user => {
      console.log("initializeQuickGo: onAuthStateChanged triggered, user:", user);
      // Always set today's date.
      quickGoState.date = new Date().toISOString().split('T')[0];
      if (user) {
        try {
          // Query the latest log entry for the signed-in user.
          const querySnapshot = await db
            .collection("users")
            .doc(user.uid)
            .collection("logs")
            .orderBy("timestamp", "desc")
            .limit(1)
            .get();
          let yesterdayEndKM = 0;
          if (!querySnapshot.empty) {
            const lastEntry = querySnapshot.docs[0].data();
            yesterdayEndKM = lastEntry.endOdometer;
            console.log("Latest log entry found:", lastEntry);
          } else {
            console.log("No previous log entry found.");
          }
          quickGoState.startOdometer = yesterdayEndKM;
          // Update the go button's text.
          if (yesterdayEndKM) {
            goButton.innerHTML = `Resume From<br>Last Reading: ${yesterdayEndKM.toLocaleString()} km`;
            updateInput.value = yesterdayEndKM;
          } else {
            goButton.textContent = 'Enter Start KM';
          }
        } catch (error) {
          console.error("Error getting last log entry:", error);
          goButton.textContent = 'Enter Start KM';
        }
      } else {
        quickGoState.startOdometer = 0;
        goButton.textContent = 'Enter Start KM';
      }
    });
  
    // When the user clicks the go button.
    goButton.addEventListener('click', () => {
      quickGoState.startOdometer = parseFloat(updateInput.value);
      alert(`Starting KM set to ${quickGoState.startOdometer}`);
      // Hide the go button and show the end day button.
      goButton.style.display = 'none';
      endButton.style.display = 'inline-block';
      updateLabel.textContent = 'End KM:';
      updateInput.placeholder = 'Enter End KM';
      updateInput.value = ''; // Clear the field for end KM input.
    });
  
    // When the user clicks the end day button.
    endButton.addEventListener('click', () => {
      quickGoState.endOdometer = parseFloat(updateInput.value);
      if (isNaN(quickGoState.endOdometer) || quickGoState.endOdometer <= quickGoState.startOdometer) {
        alert('Please enter a valid end KM greater than the start KM.');
        return;
      }
      const purpose = prompt("Enter purpose of today's travel:");
      const kilometersDriven = quickGoState.endOdometer - quickGoState.startOdometer;
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("You must be logged in to save an entry.");
        return;
      }
      db.collection("users")
        .doc(user.uid)
        .collection("logs")
        .add({
          date: quickGoState.date,
          startOdometer: quickGoState.startOdometer,
          endOdometer: quickGoState.endOdometer,
          kilometersDriven,
          purpose,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          alert("Log entry saved!");
          location.reload(); // Reset the interface.
        })
        .catch(error => {
          alert("Error saving log: " + error.message);
        });
    });
  }
  
  
  
  // Initialize when page loads
  window.onload = function () {
    initializeQuickGo();
    setDefaultDate();
    setDefaultStartMiles();
  };
  
  
