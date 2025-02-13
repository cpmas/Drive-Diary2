// client-tracker.js



// Define the stages for client progress.
const stages = [
  "initial contact",
  "quote appointment booked",
  "seen the job and working on quote",
  "quote submitted",
  "quote accepted",
  "deposit paid and date booked",
  "job in progress"
];

// Wrap everything inside the authentication state listener
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  
  // Use the authenticated user's UID to create a reference for their clients subcollection.
  const uid = user.uid;
  const clientsRef = db.collection("users").doc(uid).collection("clients");
  
  // -----------------------------
  // Real-Time Listener for Active Clients
  // -----------------------------
  function listenActiveClients() {
    clientsRef
      .where("status", "==", "active")
      .orderBy("createdAt")
      .onSnapshot(snapshot => {
        renderStageContainers();
        snapshot.forEach(doc => {
          renderClient(doc.data(), doc.id);
        });
      });
  }
  
  // -----------------------------
  // Real-Time Listener for Deleted Clients (with Permanent Delete)
  // -----------------------------
  function listenDeletedClients() {
    clientsRef
      .where("status", "==", "deleted")
      .orderBy("createdAt")
      .onSnapshot(snapshot => {
        const container = document.getElementById("deleted-clients");
        container.innerHTML = "";
        snapshot.forEach(doc => {
          const client = doc.data();
          const card = document.createElement("div");
          card.classList.add("client-card");
          card.setAttribute("data-id", doc.id);
          
          const nameEl = document.createElement("p");
          nameEl.classList.add("client-name");
          nameEl.textContent = client.name;
          card.appendChild(nameEl);
          
          const phoneEl = document.createElement("p");
          phoneEl.innerHTML = "<strong>Phone:</strong> " + client.phone;
          card.appendChild(phoneEl);
          
          const emailEl = document.createElement("p");
          emailEl.innerHTML = "<strong>Email:</strong> " + client.email;
          card.appendChild(emailEl);
          
          const notesEl = document.createElement("p");
          notesEl.innerHTML = "<strong>Notes:</strong> " + client.notes;
          card.appendChild(notesEl);
          
          const statusEl = document.createElement("p");
          statusEl.textContent = "Deleted";
          card.appendChild(statusEl);
          
          // Permanent Delete Button
          const permDeleteBtn = document.createElement("button");
          permDeleteBtn.textContent = "Permanently Delete";
          permDeleteBtn.addEventListener("click", function() {
            if (confirm("Are you sure you want to permanently delete this client? This action cannot be undone.")) {
              clientsRef.doc(doc.id).delete()
                .then(() => {
                  card.remove();
                })
                .catch(error => {
                  console.error("Error deleting document: ", error);
                });
            }
          });
          card.appendChild(permDeleteBtn);
          
          container.appendChild(card);
        });
      });
  }
  
  // -----------------------------
  // Real-Time Listener for Completed Clients
  // -----------------------------
  function listenCompletedClients() {
    clientsRef
      .where("status", "==", "completed")
      .orderBy("createdAt")
      .onSnapshot(snapshot => {
        const container = document.getElementById("completed-clients");
        container.innerHTML = "";
        snapshot.forEach(doc => {
          const client = doc.data();
          const card = document.createElement("div");
          card.classList.add("client-card");
          card.setAttribute("data-id", doc.id);
          
          const nameEl = document.createElement("p");
          nameEl.classList.add("client-name");
          nameEl.textContent = client.name;
          card.appendChild(nameEl);
          
          const phoneEl = document.createElement("p");
          phoneEl.innerHTML = "<strong>Phone:</strong> " + client.phone;
          card.appendChild(phoneEl);
          
          const emailEl = document.createElement("p");
          emailEl.innerHTML = "<strong>Email:</strong> " + client.email;
          card.appendChild(emailEl);
          
          const notesEl = document.createElement("p");
          notesEl.innerHTML = "<strong>Notes:</strong> " + client.notes;
          card.appendChild(notesEl);
          
          const statusEl = document.createElement("p");
          statusEl.textContent = "Completed";
          card.appendChild(statusEl);
          
          container.appendChild(card);
        });
      });
  }
  
  // -----------------------------
  // Render Stage Containers for Active Clients
  // -----------------------------
  function renderStageContainers() {
    const stagesContainer = document.getElementById("stages-container");
    stagesContainer.innerHTML = "";
    stages.forEach(stage => {
      const stageDiv = document.createElement("div");
      stageDiv.classList.add("stage-container");
      stageDiv.setAttribute("data-stage", stage);
      
      const stageHeader = document.createElement("h2");
      stageHeader.textContent = stage.charAt(0).toUpperCase() + stage.slice(1);
      stageDiv.appendChild(stageHeader);
      
      const stageContent = document.createElement("div");
      stageContent.classList.add("stage-content");
      stageDiv.appendChild(stageContent);
      
      stagesContainer.appendChild(stageDiv);
    });
  }
  
  // -----------------------------
  // Render a Single Active Client Card (with collapsible details)
  // -----------------------------
  function renderClient(clientData, docId) {
    const card = document.createElement("div");
    card.classList.add("client-card");
    card.setAttribute("data-id", docId);
    card.style.position = "relative"; // For icon positioning
    
    // Create header that shows client name and toggle icon
    const header = document.createElement("div");
    header.classList.add("card-header");
    
    const nameEl = document.createElement("p");
    nameEl.classList.add("client-name");
    nameEl.textContent = clientData.name;
    header.appendChild(nameEl);
    
    const toggleIcon = document.createElement("i");
    toggleIcon.classList.add("fas", "fa-chevron-down", "toggle-icon");
    header.appendChild(toggleIcon);
    
    // Create details container (collapsible), hidden by default
    const details = document.createElement("div");
    details.classList.add("card-details");
    details.style.display = "none";
    
    const phoneEl = document.createElement("p");
    phoneEl.innerHTML = "<strong>Phone:</strong> " + clientData.phone;
    details.appendChild(phoneEl);
    
    const emailEl = document.createElement("p");
    emailEl.innerHTML = "<strong>Email:</strong> " + clientData.email;
    details.appendChild(emailEl);
    
    const notesEl = document.createElement("p");
    notesEl.innerHTML = "<strong>Notes:</strong> " + clientData.notes;
    details.appendChild(notesEl);
    
    const stageEl = document.createElement("p");
    stageEl.textContent = "Stage: " + clientData.stage;
    details.appendChild(stageEl);
    
    // Progress to Next Stage Button (if not at final stage)
    if (clientData.stage !== stages[stages.length - 1]) {
      const progressBtn = document.createElement("button");
      progressBtn.textContent = "Progress to Next Stage";
      progressBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        const currentIndex = stages.indexOf(clientData.stage);
        const newStage = stages[currentIndex + 1];
        clientsRef.doc(docId).update({
          stage: newStage
        });
      });
      details.appendChild(progressBtn);
    }
    
    // For clients in "job in progress", add a Complete button
    if (clientData.stage === "job in progress") {
      const completeBtn = document.createElement("button");
      completeBtn.textContent = "Complete";
      completeBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        clientsRef.doc(docId).update({
          status: "completed"
        });
      });
      details.appendChild(completeBtn);
    }
    
    // Card actions: edit and delete icons
    const actionIcons = document.createElement("div");
    actionIcons.classList.add("card-actions");
    
    // Edit Icon Button
    const editBtn = document.createElement("button");
    editBtn.classList.add("icon-btn", "edit-btn");
    editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    editBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      const newName = prompt("Edit Name:", clientData.name);
      const newPhone = prompt("Edit Phone:", clientData.phone);
      const newEmail = prompt("Edit Email:", clientData.email);
      const newNotes = prompt("Edit Notes:", clientData.notes);
      const updateObj = {};
      if (newName && newName.trim() !== "") updateObj.name = newName.trim();
      if (newPhone && newPhone.trim() !== "") updateObj.phone = newPhone.trim();
      if (newEmail && newEmail.trim() !== "") updateObj.email = newEmail.trim();
      if (newNotes !== null) updateObj.notes = newNotes;
      clientsRef.doc(docId).update(updateObj);
    });
    actionIcons.appendChild(editBtn);
    
    // Delete Icon Button (updates status to "deleted")
    const removeBtn = document.createElement("button");
    removeBtn.classList.add("icon-btn", "remove-btn");
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      clientsRef.doc(docId).update({
        status: "deleted"
      });
    });
    actionIcons.appendChild(removeBtn);
    
    details.appendChild(actionIcons);
    
    // Toggle details when header is clicked
    header.addEventListener("click", function() {
      if (details.style.display === "none") {
        details.style.display = "block";
        toggleIcon.classList.remove("fa-chevron-down");
        toggleIcon.classList.add("fa-chevron-up");
      } else {
        details.style.display = "none";
        toggleIcon.classList.remove("fa-chevron-up");
        toggleIcon.classList.add("fa-chevron-down");
      }
    });
    
    card.appendChild(header);
    card.appendChild(details);
    
    // Append card to the appropriate stage container based on clientData.stage
    const container = document.querySelector(`.stage-container[data-stage="${clientData.stage}"] .stage-content`);
    if (container) {
      container.appendChild(card);
    }
  }
  
  // -----------------------------
  // Toggle for New Client Form
  // -----------------------------
  document.getElementById("toggle-new-client-btn").addEventListener("click", function() {
    const form = document.getElementById("new-client-form");
    form.style.display = "block";
    this.style.display = "none";
  });
  
  // -----------------------------
  // New Client Form Submission
  // -----------------------------
  document.getElementById("new-client-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const clientName = document.getElementById("client-name").value;
    const clientPhone = document.getElementById("client-phone").value;
    const clientEmail = document.getElementById("client-email").value;
    const clientNotes = document.getElementById("client-notes").value;
    
    clientsRef.add({
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
      notes: clientNotes,
      stage: stages[0],
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      document.getElementById("new-client-form").reset();
      document.getElementById("new-client-form").style.display = "none";
      document.getElementById("toggle-new-client-btn").style.display = "inline-block";
    });
  });
  
  // -----------------------------
  // Toggle Deleted Clients Section
  // -----------------------------
  document.getElementById("toggle-deleted-btn").addEventListener("click", function() {
    const container = document.getElementById("deleted-container");
    if (container.style.display === "none") {
      container.style.display = "block";
      this.textContent = "Hide Deleted Clients";
    } else {
      container.style.display = "none";
      this.textContent = "Show Deleted Clients";
    }
  });
  
  // -----------------------------
  // Toggle Completed Clients Section
  // -----------------------------
  document.getElementById("toggle-completed-btn").addEventListener("click", function() {
    const container = document.getElementById("completed-container");
    if (container.style.display === "none") {
      container.style.display = "block";
      this.textContent = "Hide Completed Clients";
    } else {
      container.style.display = "none";
      this.textContent = "Show Completed Clients";
    }
  });
  
  // -----------------------------
  // Initialize Real-Time Listeners
  // -----------------------------
  listenActiveClients();
  listenDeletedClients();
  listenCompletedClients();
});
