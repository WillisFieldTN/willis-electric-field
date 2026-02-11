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
  `;

  document.getElementById("dispatchBtn").onclick = renderDispatch;
  document.getElementById("customersBtn").onclick = renderCustomers;
  document.getElementById("inventoryBtn").onclick = renderInventory;
  document.getElementById("techBtn").onclick = renderTechnicians;
  document.getElementById("searchBtn").onclick = renderEquipmentSearch;
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
      <button class="small-b
