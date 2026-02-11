// -----------------------------
// Data storage (local)
// -----------------------------
const DB_KEY = "we_field_db";

const defaultDB = {
  customers: [],
  jobs: [],
  inventory: [],
  equipment: [],
  locations: ["Van AB", "Van JS", "Van JW", "Service Van", "Shop"],
  technicians: [
    { id: "tech_ab", name: "Van AB", status: "Free" },
    { id: "tech_js", name: "Van JS", status: "Free" },
    { id: "tech_jw", name: "Van JW", status: "Free" },
    { id: "tech_sv", name: "Service Van", status: "Free" }
  ]
};

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  return raw ? JSON.parse(raw) : defaultDB;
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// -----------------------------
// Utilities
// -----------------------------
function uuid() {
  return Math.random().toString(36).substr(2, 9);
}

function todayDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// -----------------------------
// App UI
// -----------------------------
const main = document.getElementById("main");

function renderHome() {
  main.innerHTML = `
    <button class="big-btn" id="dispatchBtn">📅 Dispatch (Today)</button>
    <button class="big-btn" id="customersBtn">👥 Customers</button>
    <button class="big-btn" id="inventoryBtn">🧰 Inventory</button>
    <button class="big-btn" id="techBtn">👨‍🔧 Technicians</button>
    <button class="big-btn" id="searchBtn">🔍 Equipment Search</button>
    <button class="big-btn" id="exportBtn">⬆️ Export Data</button>
    <button class="big-btn" id="importBtn">⬇️ Import Data</button>
  `;

  document.getElementById("dispatchBtn").onclick = renderDispatch;
  document.getElementById("customersBtn").onclick = renderCustomers;
  document.getElementById("inventoryBtn").onclick = renderInventory;
  document.getElementById("techBtn").onclick = renderTechnicians;
  document.getElementById("searchBtn").onclick = renderEquipmentSearch;
  document.getElementById("exportBtn").onclick = exportData;
  document.getElementById("importBtn").onclick = importData;
}

// -----------------------------
// Dispatch
// -----------------------------
function renderDispatch() {
  const db = loadDB();
  const today = todayDate();
  const jobs = db.jobs.filter(j => j.date === today);

  main.innerHTML = `
    <div class="card">
      <h3>Dispatch - ${today}</h3>
      <div class="row">
        <div>
          <label>Date</label>
          <input type="date" id="dateInput" value="${today}">
        </div>
        <div>
          <label>&nbsp;</label>
          <button class="small-btn" id="newJobBtn">+ New Job</button>
        </div>
      </div>
      <div id="jobList"></div>
      <button class="small-btn" onclick="renderHome()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("dateInput").onchange = renderDispatch;
  document.getElementById("newJobBtn").onclick = () => renderJobForm(today);

  const list = document.getElementById("jobList");
  list.innerHTML = "";

  jobs.forEach(job => {
    const customer = db.customers.find(c => c.id === job.customerId) || {};
    const tech = db.technicians.find(t => t.id === job.assignedTech) || { name: "Unassigned" };
    const urgencyColor = job.urgency === "red" ? "#d9534f" :
                        job.urgency === "yellow" ? "#f0ad4e" : "#5cb85c";

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${customer.name || "Unknown Customer"} (${tech.name})</h3>
      <p>${customer.address || "No address"}</p>
      <div class="color-bar" style="background:${urgencyColor}"></div>
      <div class="status">Status: ${job.status}</div>
      <button class="small-btn" data-jobid="${job.id}">Open</button>
    `;
    list.appendChild(card);
  });

  // ADD EVENT LISTENERS AFTER THE JOB LIST IS CREATED
  document.querySelectorAll("#jobList button[data-jobid]").forEach(btn => {
    btn.addEventListener("click", () => {
      renderJob(btn.getAttribute("data-jobid"));
    });
  });
}


function renderJob(id) {
  const db = loadDB();
  const job = db.jobs.find(j => j.id === id);
  if (!job) return renderDispatch();

  const customer = db.customers.find(c => c.id === job.customerId) || {};
  const urgencyColor = job.urgency === "red" ? "#d9534f" :
                      job.urgency === "yellow" ? "#f0ad4e" : "#5cb85c";

  main.innerHTML = `
    <div class="card">
      <h3>Call Details</h3>

      <div class="color-bar" style="background:${urgencyColor}"></div>

      <h4>Customer</h4>
      <p><strong>${customer.name || "Unknown Customer"}</strong></p>
      <p>${customer.address || "No address"}</p>
      <p>${customer.notes || ""}</p>

      <h4>Job Info</h4>
      <p><strong>Date:</strong> ${job.date}</p>

      <label>Assigned Technician</label>
      <select id="techSelect">
        <option value="">Unassigned</option>
        ${db.technicians.map(t => `<option value="${t.id}" ${job.assignedTech === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
      </select>

      <label>Customer Home?</label>
      <select id="homeStatus">
        <option value="unknown" ${job.homeStatus === "unknown" ? "selected" : ""}>Unknown</option>
        <option value="home" ${job.homeStatus === "home" ? "selected" : ""}>Home</option>
        <option value="not_home" ${job.homeStatus === "not_home" ? "selected" : ""}>Not Home</option>
      </select>

      <label>Status</label>
      <select id="statusSelect">
        <option ${job.status === "Scheduled" ? "selected" : ""}>Scheduled</option>
        <option ${job.status === "En Route" ? "selected" : ""}>En Route</option>
        <option ${job.status === "Working" ? "selected" : ""}>Working</option>
        <option ${job.status === "Completed" ? "selected" : ""}>Completed</option>
      </select>

      <label>Notes</label>
      <textarea id="jobNotes">${job.notes || ""}</textarea>

      <h4>Parts Used</h4>
      <div id="partsUsed"></div>
      <button class="small-btn" id="addPartBtn">+ Add Part Used</button>

      <h4>Photos</h4>
      <input type="file" id="photoInput" accept="image/*" multiple />
      <div id="photoList"></div>

      <button class="small-btn" id="saveJobBtn">Save</button>
      <button class="small-btn" id="completeJobBtn">✅ Complete Call</button>
      <button class="small-btn" onclick="renderDispatch()">⬅️ Back</button>
    </div>
  `;

  // Save button
  document.getElementById("saveJobBtn").onclick = () => {
    const prevStatus = job.status;

    job.assignedTech = document.getElementById("techSelect").value;
    job.homeStatus = document.getElementById("homeStatus").value;
    job.status = document.getElementById("statusSelect").value;
    job.notes = document.getElementById("jobNotes").value;

    // Update tech status
    db.technicians.forEach(t => {
      if (t.id === job.assignedTech) {
        t.status = job.status === "Completed" ? "Free" : "On a call";
      }
    });

    // Deduct parts if completed
    if (job.status === "Completed" && prevStatus !== "Completed") {
      job.partsUsed.forEach(pu => {
        const part = db.inventory.find(p => p.id === pu.partId);
        if (part) part.quantity -= pu.quantity;
        if (part && part.quantity < 0) part.quantity = 0;
      });
    }

    saveDB(db);
    alert("Saved!");
    renderJob(id);
  };

  // Complete call button
  document.getElementById("completeJobBtn").onclick = () => {
    job.status = "Completed";

    // Deduct parts
    job.partsUsed.forEach(pu => {
      const part = db.inventory.find(p => p.id === pu.partId);
      if (part) part.quantity -= pu.quantity;
      if (part && part.quantity < 0) part.quantity = 0;
    });

    // Set tech free
    db.technicians.forEach(t => {
      if (t.id === job.assignedTech) t.status = "Free";
    });

    saveDB(db);
    alert("Call completed!");
    renderDispatch();
  };

  // Photo upload
  document.getElementById("photoInput").onchange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = function() {
        if (!job.photos) job.photos = [];
        job.photos.push(reader.result);
        saveDB(db);
        renderJob(id);
      };
      reader.readAsDataURL(file);
    });
  };

  // Render parts used list
  document.getElementById("addPartBtn").onclick = () => renderAddPartUsed(job.id);
  renderPartsUsed(job);

  // Render photos
  const photoList = document.getElementById("photoList");
  photoList.innerHTML = "";
  (job.photos || []).forEach(p => {
    const img = document.createElement("img");
    img.src = p;
    img.style.width = "100%";
    img.style.marginTop = "10px";
    photoList.appendChild(img);
  });
}

function renderPartsUsed(job) {
  const db = loadDB();
  const partsDiv = document.getElementById("partsUsed");
  partsDiv.innerHTML = "";

  (job.partsUsed || []).forEach(pu => {
    const part = db.inventory.find(p => p.id === pu.partId);
    const desc = part ? `${part.partNumber} - ${part.description}` : "Unknown part";
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <p>${desc} | Qty used: ${pu.quantity}</p>
      <button class="small-btn red" onclick="removePartUsed('${job.id}','${pu.partId}')">Remove</button>
    `;
    partsDiv.appendChild(card);
  });
}

function removePartUsed(jobId, partId) {
  const db = loadDB();
  const job = db.jobs.find(j => j.id === jobId);
  if (!job) return;
  job.partsUsed = (job.partsUsed || []).filter(p => p.partId !== partId);
  saveDB(db);
  renderJob(jobId);
}

function renderAddPartUsed(jobId) {
  const db = loadDB();
  const job = db.jobs.find(j => j.id === jobId);
  if (!job) return;

  main.innerHTML = `
    <div class="card">
      <h3>Add Part Used</h3>

      <label>Part</label>
      <select id="partSelect">
        ${db.inventory.map(p => `<option value="${p.id}">${p.location} | ${p.partNumber} - ${p.description} | Qty: ${p.quantity}</option>`).join("")}
      </select>

      <label>Quantity Used</label>
      <input id="qtyUsed" type="number" value="1" />

      <button class="small-btn" id="addUsedBtn">Add</button>
      <button class="small-btn" onclick="renderJob('${jobId}')">⬅️ Back</button>
    </div>
  `;

  document.getElementById("addUsedBtn").onclick = () => {
    const partId = document.getElementById("partSelect").value;
    const qty = parseInt(document.getElementById("qtyUsed").value || 0);

    if (!job.partsUsed) job.partsUsed = [];
    job.partsUsed.push({ partId, quantity: qty });
    saveDB(db);
    renderJob(jobId);
  };
}

function renderJobForm(date) {
  const db = loadDB();
  main.innerHTML = `
    <div class="card">
      <h3>New Job</h3>

      <label>Date</label>
      <input type="date" id="jobDate" value="${date}">

      <label>Customer</label>
      <select id="customerSelect">
        ${db.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
      </select>

      <label>Assigned Technician</label>
      <select id="techSelect">
        <option value="">Unassigned</option>
        ${db.technicians.map(t => `<option value="${t.id}">${t.name}</option>`).join("")}
      </select>

      <label>Customer Home?</label>
      <select id="homeStatus">
        <option value="unknown">Unknown</option>
        <option value="home">Home</option>
        <option value="not_home">Not Home</option>
      </select>

      <label>Urgency</label>
      <select id="urgencySelect">
        <option value="green">Green</option>
        <option value="yellow">Yellow</option>
        <option value="red">Red</option>
      </select>

      <label>Notes</label>
      <textarea id="jobNotes"></textarea>

      <button class="small-btn" id="createJobBtn">Create Job</button>
      <button class="small-btn" onclick="renderDispatch()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("createJobBtn").onclick = () => {
    const newJob = {
      id: uuid(),
      date: document.getElementById("jobDate").value,
      customerId: document.getElementById("customerSelect").value,
      assignedTech: document.getElementById("techSelect").value,
      homeStatus: document.getElementById("homeStatus").value,
      urgency: document.getElementById("urgencySelect").value,
      status: "Scheduled",
      notes: document.getElementById("jobNotes").value,
      photos: [],
      partsUsed: []
    };

    // set tech status
    const techId = newJob.assignedTech;
    db.technicians.forEach(t => {
      if (t.id === techId) t.status = "On a call";
    });

    db.jobs.push(newJob);
    saveDB(db);
    renderDispatch();
  };
}

// -----------------------------
// Customers
// -----------------------------
function renderCustomers() {
  const db = loadDB();
  main.innerHTML = `
    <div class="card">
      <h3>Customers</h3>
      <button class="small-btn" id="newCustomerBtn">+ New Customer</button>
      <div id="customerList"></div>
      <button class="small-btn" onclick="renderHome()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("newCustomerBtn").onclick = renderCustomerForm;

  const list = document.getElementById("customerList");
  list.innerHTML = "";
  db.customers.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${c.name}</h3>
      <p>${c.address}</p>
      <button class="small-btn" onclick="renderCustomer('${c.id}')">Open</button>
    `;
    list.appendChild(card);
  });
}

function renderCustomerForm() {
  main.innerHTML = `
    <div class="card">
      <h3>New Customer</h3>

      <label>Name</label>
      <input id="custName" />

      <label>Address</label>
      <input id="custAddress" />

      <label>Special Notes</label>
      <textarea id="custNotes"></textarea>

      <button class="small-btn" id="createCustBtn">Create Customer</button>
      <button class="small-btn" onclick="renderCustomers()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("createCustBtn").onclick = () => {
    const db = loadDB();
    const newCustomer = {
      id: uuid(),
      name: document.getElementById("custName").value,
      address: document.getElementById("custAddress").value,
      notes: document.getElementById("custNotes").value
    };
    db.customers.push(newCustomer);
    saveDB(db);
    renderCustomers();
  };
}

function renderCustomer(id) {
  const db = loadDB();
  const cust = db.customers.find(c => c.id === id);
  if (!cust) return renderCustomers();

  main.innerHTML = `
    <div class="card">
      <h3>${cust.name}</h3>
      <p>${cust.address}</p>

      <label>Special Notes</label>
      <textarea id="custNotes">${cust.notes || ""}</textarea>

      <button class="small-btn" id="saveCustBtn">Save</button>
      <button class="small-btn" onclick="renderCustomers()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("saveCustBtn").onclick = () => {
    cust.notes = document.getElementById("custNotes").value;
    saveDB(db);
    alert("Saved!");
    renderCustomers();
  };
}

// -----------------------------
// Inventory
// -----------------------------
function renderInventory() {
  const db = loadDB();
  main.innerHTML = `
    <div class="card">
      <h3>Inventory</h3>

      <label>Location</label>
      <select id="locSelect">
        ${db.locations.map(l => `<option value="${l}">${l}</option>`).join("")}
      </select>

      <button class="small-btn" id="newPartBtn">+ New Part</button>
      <div id="invList"></div>
      <button class="small-btn" onclick="renderHome()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("locSelect").onchange = renderInventoryList;
  document.getElementById("newPartBtn").onclick = renderNewPartForm;

  renderInventoryList();
}

function renderInventoryList() {
  const db = loadDB();
  const loc = document.getElementById("locSelect").value;
  const list = document.getElementById("invList");
  list.innerHTML = "";

  const parts = db.inventory.filter(p => p.location === loc);
  parts.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${p.partNumber} - ${p.description}</h3>
      <p>Cost: ${p.cost} | Sell: ${p.sell} | Qty: ${p.quantity}</p>
      <button class="small-btn" onclick="adjustQty('${p.id}', 1)">+1</button>
      <button class="small-btn" onclick="adjustQty('${p.id}', -1)">-1</button>
    `;
    list.appendChild(card);
  });
}

function renderNewPartForm() {
  const db = loadDB();
  const loc = document.getElementById("locSelect").value;

  main.innerHTML = `
    <div class="card">
      <h3>New Part - ${loc}</h3>

      <label>Part Number</label>
      <input id="partNumber" />

      <label>Description</label>
      <input id="partDesc" />

      <label>Cost</label>
      <input id="partCost" type="number" />

      <label>Sell Price</label>
      <input id="partSell" type="number" />

      <label>Quantity</label>
      <input id="partQty" type="number" />

      <button class="small-btn" id="createPartBtn">Create Part</button>
      <button class="small-btn" onclick="renderInventory()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("createPartBtn").onclick = () => {
    const db = loadDB();
    const newPart = {
      id: uuid(),
      location: loc,
      partNumber: document.getElementById("partNumber").value,
      description: document.getElementById("partDesc").value,
      cost: parseFloat(document.getElementById("partCost").value || 0),
      sell: parseFloat(document.getElementById("partSell").value || 0),
      quantity: parseInt(document.getElementById("partQty").value || 0)
    };
    db.inventory.push(newPart);
    saveDB(db);
    renderInventory();
  };
}

function adjustQty(id, amount) {
  const db = loadDB();
  const part = db.inventory.find(p => p.id === id);
  if (!part) return;
  part.quantity += amount;
  if (part.quantity < 0) part.quantity = 0;
  saveDB(db);
  renderInventoryList();
}

// -----------------------------
// Technicians
// -----------------------------
function renderTechnicians() {
  const db = loadDB();
  main.innerHTML = `
    <div class="card">
      <h3>Technicians</h3>
      <div id="techList"></div>
      <button class="small-btn" onclick="renderHome()">⬅️ Back</button>
    </div>
  `;

  const list = document.getElementById("techList");
  list.innerHTML = "";

  db.technicians.forEach(t => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${t.name}</h3>
      <p>Status: ${t.status}</p>
    `;
    list.appendChild(card);
  });
}

// -----------------------------
// Equipment Search
// -----------------------------
function renderEquipmentSearch() {
  const db = loadDB();
  main.innerHTML = `
    <div class="card">
      <h3>Equipment Search</h3>

      <label>Search by Model or Serial</label>
      <input id="searchInput" />

      <div id="searchResults"></div>
      <button class="small-btn" onclick="renderHome()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("searchInput").oninput = () => {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const results = db.equipment.filter(e =>
      (e.model || "").toLowerCase().includes(query) ||
      (e.serial || "").toLowerCase().includes(query)
    );

    const resDiv = document.getElementById("searchResults");
    resDiv.innerHTML = "";

    results.forEach(e => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${e.model} - ${e.serial}</h3>
        <p>${e.location || "No location"} | ${e.type || "Unknown"}</p>
        <button class="small-btn" onclick="renderEquipment('${e.id}')">Open</button>
      `;
      resDiv.appendChild(card);
    });
  };
}

function renderEquipment(id) {
  const db = loadDB();
  const eq = db.equipment.find(e => e.id === id);
  if (!eq) return renderEquipmentSearch();

  main.innerHTML = `
    <div class="card">
      <h3>${eq.model} - ${eq.serial}</h3>
      <p>${eq.type || "Unknown"} | ${eq.location || "No location"}</p>

      <label>Notes</label>
      <textarea id="eqNotes">${eq.notes || ""}</textarea>

      <label>Photos</label>
      <input type="file" id="eqPhotoInput" accept="image/*" multiple />
      <div id="eqPhotoList"></div>

      <button class="small-btn" id="saveEqBtn">Save</button>
      <button class="small-btn" onclick="renderEquipmentSearch()">⬅️ Back</button>
    </div>
  `;

  document.getElementById("saveEqBtn").onclick = () => {
    eq.notes = document.getElementById("eqNotes").value;
    saveDB(db);
    alert("Saved!");
    renderEquipmentSearch();
  };

  document.getElementById("eqPhotoInput").onchange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = function() {
        if (!eq.photos) eq.photos = [];
        eq.photos.push(reader.result);
        saveDB(db);
        renderEquipment(id);
      };
      reader.readAsDataURL(file);
    });
  };

  const photoList = document.getElementById("eqPhotoList");
  photoList.innerHTML = "";
  (eq.photos || []).forEach(p => {
    const img = document.createElement("img");
    img.src = p;
    img.style.width = "100%";
    img.style.marginTop = "10px";
    photoList.appendChild(img);
  });
}

// -----------------------------
// Export / Import
// -----------------------------
function exportData() {
  const db = loadDB();
  const dataStr = JSON.stringify(db);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "we_field_export.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const db = JSON.parse(reader.result);
      saveDB(db);
      alert("Import complete!");
      renderHome();
    };
    reader.readAsText(file);
  };
  input.click();
}

// -----------------------------
// Start
// -----------------------------
renderHome();
