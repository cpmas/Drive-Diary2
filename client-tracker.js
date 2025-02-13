// client-tracker.js

// Global variable to store the current user ID once authenticated
let currentUserId = null;
// Array to hold the user's custom stages.
let customStages = [];

/* -----------------------------
   Global Toggle for Stage Controls
   This button toggles the visibility of the up/down (order) and edit/delete controls in each stage.
----------------------------- */
function toggleStageControls() {
  const controls = document.querySelectorAll('.order-controls, .edit-controls');
  controls.forEach(control => {
    const currentDisplay = window.getComputedStyle(control).display;
    if (currentDisplay === 'none') {
      control.style.display = 'block';
    } else {
      control.style.display = 'none';
    }
  });
}

// Create and append the toggle button (positioned relative to the body)
const toggleBtn = document.createElement('button');
toggleBtn.id = 'toggle-stage-controls-btn';
toggleBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
toggleBtn.addEventListener('click', toggleStageControls);
document.body.appendChild(toggleBtn);

/* -----------------------------
   Initialization: wait for the auth state to be ready.
   Once the user is logged in, set currentUserId and start all listeners.
----------------------------- */
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUserId = user.uid;
    fetchStages();
    listenActiveClients();
    listenDeletedClients();
    listenCompletedClients();
  } else {
    window.location.href = "login.html";
  }
});

/* -----------------------------
   Fetch user stages from Firestore
   Stages are stored as a subcollection of the user document:
   users/{uid}/stages
----------------------------- */
function fetchStages() {
  db.collection("users")
    .doc(currentUserId)
    .collection("stages")
    .orderBy("order")
    .onSnapshot(snapshot => {
      customStages = [];
      snapshot.forEach(doc => {
        let stage = doc.data();
        stage.id = doc.id;
        customStages.push(stage);
      });
      renderStageContainers();
    });
}

/* -----------------------------
   Render Stage Containers for Active Clients and stage management controls.
----------------------------- */
function renderStageContainers() {
  const stagesContainer = document.getElementById("stages-container");
  stagesContainer.innerHTML = "";

  if (customStages.length === 0) {
    const noStagesMsg = document.createElement("p");
    noStagesMsg.textContent = "No stages defined. Please add a stage.";
    stagesContainer.appendChild(noStagesMsg);
  }

  customStages.forEach(stage => {
    const stageDiv = document.createElement("div");
    stageDiv.classList.add("stage-container");
    stageDiv.setAttribute("data-stage-id", stage.id);

    const headerContainer = document.createElement("div");

    // Order controls container: up/down buttons at top-left.
    const orderControls = document.createElement("div");
    orderControls.classList.add("order-controls");
    const upBtn = document.createElement("button");
    upBtn.classList.add("icon-btn");
    upBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    upBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      moveStageUp(stage.id);
    });
    orderControls.appendChild(upBtn);
    const downBtn = document.createElement("button");
    downBtn.classList.add("icon-btn");
    downBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
    downBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      moveStageDown(stage.id);
    });
    orderControls.appendChild(downBtn);
    headerContainer.appendChild(orderControls);

    const stageHeader = document.createElement("h2");
    stageHeader.textContent = stage.name;
    headerContainer.appendChild(stageHeader);

    // Edit controls container: edit and delete buttons at top-right.
    const editControls = document.createElement("div");
    editControls.classList.add("edit-controls");
    const editBtn = document.createElement("button");
    editBtn.classList.add("icon-btn");
    editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    editBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      editStage(stage.id, stage.name);
    });
    editControls.appendChild(editBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("icon-btn");
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this stage? Make sure to move all clients out of this stage before deleting or they will be lost.")) {
        deleteStage(stage.id);
      }
    });
    editControls.appendChild(deleteBtn);
    headerContainer.appendChild(editControls);

    stageDiv.appendChild(headerContainer);

    const stageContent = document.createElement("div");
    stageContent.classList.add("stage-content");
    stageDiv.appendChild(stageContent);

    stagesContainer.appendChild(stageDiv);
  });

  const addStageBtn = document.createElement("button");
  addStageBtn.id = "add-stage-btn";
  addStageBtn.textContent = "Add Stage";
  addStageBtn.addEventListener("click", addStage);
  stagesContainer.appendChild(addStageBtn);
}

/* -----------------------------
   Stage management functions (Add, Edit, Delete)
----------------------------- */
function addStage() {
  const stageName = prompt("Enter new stage name:");
  if (stageName && stageName.trim() !== "") {
    let newOrder = customStages.length;
    db.collection("users")
      .doc(currentUserId)
      .collection("stages")
      .add({
        name: stageName.trim(),
        order: newOrder
      });
  }
}

function editStage(stageId, currentName) {
  const newName = prompt("Edit stage name:", currentName);
  if (newName && newName.trim() !== "") {
    db.collection("users")
      .doc(currentUserId)
      .collection("stages")
      .doc(stageId)
      .update({
        name: newName.trim()
      });
  }
}

function deleteStage(stageId) {
  db.collection("users")
    .doc(currentUserId)
    .collection("clients")
    .where("stageId", "==", stageId)
    .get()
    .then(querySnapshot => {
      if (!querySnapshot.empty) {
        alert("This stage has clients assigned. Please move them out before deleting.");
      } else {
        db.collection("users")
          .doc(currentUserId)
          .collection("stages")
          .doc(stageId)
          .delete();
      }
    });
}

/* -----------------------------
   Reordering functions: moveStageUp and moveStageDown
----------------------------- */
function moveStageUp(stageId) {
  const index = customStages.findIndex(stage => stage.id === stageId);
  console.log("moveStageUp called for stageId:", stageId, "index:", index);
  if (index > 0) {
    const currentStage = customStages[index];
    const previousStage = customStages[index - 1];
    let currentOrder = currentStage.order;
    let previousOrder = previousStage.order;
    if (currentOrder === previousOrder) {
      currentOrder = index;
      previousOrder = index - 1;
      console.log("Detected duplicate order; reassigning:", currentOrder, previousOrder);
    }
    const stageRef = db.collection("users").doc(currentUserId).collection("stages");
    stageRef.doc(currentStage.id).update({ order: previousOrder })
      .then(() => console.log("Updated current stage order to", previousOrder))
      .catch(err => console.error("Error updating current stage:", err));
    stageRef.doc(previousStage.id).update({ order: currentOrder })
      .then(() => console.log("Updated previous stage order to", currentOrder))
      .catch(err => console.error("Error updating previous stage:", err));
  } else {
    console.log("Stage is already at the top, cannot move up.");
  }
}

function moveStageDown(stageId) {
  const index = customStages.findIndex(stage => stage.id === stageId);
  console.log("moveStageDown called for stageId:", stageId, "index:", index);
  if (index < customStages.length - 1) {
    const currentStage = customStages[index];
    const nextStage = customStages[index + 1];
    let currentOrder = currentStage.order;
    let nextOrder = nextStage.order;
    if (currentOrder === nextOrder) {
      currentOrder = index;
      nextOrder = index + 1;
      console.log("Detected duplicate order; reassigning:", currentOrder, nextOrder);
    }
    const stageRef = db.collection("users").doc(currentUserId).collection("stages");
    stageRef.doc(currentStage.id).update({ order: nextOrder })
      .then(() => console.log("Updated current stage order to", nextOrder))
      .catch(err => console.error("Error updating current stage:", err));
    stageRef.doc(nextStage.id).update({ order: currentOrder })
      .then(() => console.log("Updated next stage order to", currentOrder))
      .catch(err => console.error("Error updating next stage:", err));
  } else {
    console.log("Stage is already at the bottom, cannot move down.");
  }
}

/* -----------------------------
   Listen for Active Clients
----------------------------- */
function listenActiveClients() {
  db.collection("users")
    .doc(currentUserId)
    .collection("clients")
    .where("status", "==", "active")
    .orderBy("createdAt")
    .onSnapshot(snapshot => {
      renderStageContainers();
      snapshot.forEach(doc => {
        renderClient(doc.data(), doc.id);
      });
    });
}

/* -----------------------------
   Listen for Deleted Clients
----------------------------- */
function listenDeletedClients() {
  db.collection("users")
    .doc(currentUserId)
    .collection("clients")
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
        
        const permDeleteBtn = document.createElement("button");
        permDeleteBtn.textContent = "Permanently Delete";
        permDeleteBtn.addEventListener("click", function() {
          if (confirm("Are you sure you want to permanently delete this client? This action cannot be undone.")) {
            db.collection("users")
              .doc(currentUserId)
              .collection("clients")
              .doc(doc.id)
              .delete()
              .then(() => { card.remove(); })
              .catch(error => { console.error("Error deleting document: ", error); });
          }
        });
        card.appendChild(permDeleteBtn);
        
        container.appendChild(card);
      });
    });
}

/* -----------------------------
   Listen for Completed Clients
----------------------------- */
function listenCompletedClients() {
  db.collection("users")
    .doc(currentUserId)
    .collection("clients")
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

/* -----------------------------
   Render a Single Active Client Card (with collapsible details)
----------------------------- */
function renderClient(clientData, docId) {
  const card = document.createElement("div");
  card.classList.add("client-card");
  card.setAttribute("data-id", docId);
  card.style.position = "relative";
  
  const header = document.createElement("div");
  header.classList.add("card-header");
  
  const nameEl = document.createElement("p");
  nameEl.classList.add("client-name");
  nameEl.textContent = clientData.name;
  header.appendChild(nameEl);
  
  const toggleIcon = document.createElement("i");
  toggleIcon.classList.add("fas", "fa-chevron-down", "toggle-icon");
  header.appendChild(toggleIcon);
  
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
  
  const currentIndex = customStages.findIndex(stage => stage.id === clientData.stageId);
  if (currentIndex !== -1) {
    if (currentIndex < customStages.length - 1) {
      const progressBtn = document.createElement("button");
      progressBtn.textContent = "Progress to Next Stage";
      progressBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        const nextStage = customStages[currentIndex + 1];
        db.collection("users")
          .doc(currentUserId)
          .collection("clients")
          .doc(docId)
          .update({ stageId: nextStage.id });
      });
      details.appendChild(progressBtn);
    } else {
      const completeBtn = document.createElement("button");
      completeBtn.textContent = "Complete";
      completeBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        db.collection("users")
          .doc(currentUserId)
          .collection("clients")
          .doc(docId)
          .update({ status: "completed" });
      });
      details.appendChild(completeBtn);
    }
  }
  
  const actionIcons = document.createElement("div");
  actionIcons.classList.add("card-actions");
  
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
    db.collection("users")
      .doc(currentUserId)
      .collection("clients")
      .doc(docId)
      .update(updateObj);
  });
  actionIcons.appendChild(editBtn);
  
  const removeBtn = document.createElement("button");
  removeBtn.classList.add("icon-btn", "remove-btn");
  removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
  removeBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    db.collection("users")
      .doc(currentUserId)
      .collection("clients")
      .doc(docId)
      .update({ status: "deleted" });
  });
  actionIcons.appendChild(removeBtn);
  
  details.appendChild(actionIcons);
  
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
  
  const container = document.querySelector(`.stage-container[data-stage-id="${clientData.stageId}"] .stage-content`);
  if (container) {
    container.appendChild(card);
  }
}

/* -----------------------------
   Toggle for New Client Form
----------------------------- */
document.getElementById("toggle-new-client-btn").addEventListener("click", function() {
  const form = document.getElementById("new-client-form");
  form.style.display = "block";
  this.style.display = "none";
});

/* -----------------------------
   New Client Form Submission
----------------------------- */
document.getElementById("new-client-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const clientName = document.getElementById("client-name").value;
  const clientPhone = document.getElementById("client-phone").value;
  const clientEmail = document.getElementById("client-email").value;
  const clientNotes = document.getElementById("client-notes").value;
  
  if (customStages.length === 0) {
    alert("Please add at least one stage before adding a client.");
    return;
  }
  
  db.collection("users")
    .doc(currentUserId)
    .collection("clients")
    .add({
      name: clientName,
      phone: clientPhone,
      email: clientEmail,
      notes: clientNotes,
      stageId: customStages[0].id,
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      document.getElementById("new-client-form").reset();
      document.getElementById("new-client-form").style.display = "none";
      document.getElementById("toggle-new-client-btn").style.display = "inline-block";
    });
});

/* -----------------------------
   Toggle Deleted and Completed Clients Sections
----------------------------- */
document.getElementById("toggle-deleted-btn").addEventListener("click", function() {
  const container = document.getElementById("deleted-container");
  if (!container.style.display || container.style.display === "none") {
    container.style.display = "block";
    this.textContent = "Hide Deleted Clients";
  } else {
    container.style.display = "none";
    this.textContent = "Show Deleted Clients";
  }
});

document.getElementById("toggle-completed-btn").addEventListener("click", function() {
  const container = document.getElementById("completed-container");
  if (!container.style.display || container.style.display === "none") {
    container.style.display = "block";
    this.textContent = "Hide Completed Clients";
  } else {
    container.style.display = "none";
    this.textContent = "Show Completed Clients";
  }
});
