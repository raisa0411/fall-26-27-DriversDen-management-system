/* =====================================================================
   common.js  -  Helper functions shared by EVERY page
   ---------------------------------------------------------------------
   Loaded after data.js and before each page's own script:
     <script src="js/data.js"></script>
     <script src="js/common.js"></script>
     <script src="js/customer.js"></script>   (or driver.js, agency.js ...)
   An external .js file contains only JavaScript, no <script> tags.
   ONE copy of every helper lives here; role scripts never redefine them.

   Sections in this file:
     1. Show one section at a time        6. Current account and role check
     2. Showing and clearing errors       7. Direct hiring rules (customer
     3. Message boxes                        and driver pages)
     4. Display and date helpers          8. Agency rules (agency, driver
     5. Saved demo data (store) and          and customer pages)
        getToday()                        9. Shared data check (merge helper)
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. SHOW ONE SECTION AT A TIME
   Each dashboard page declares an array called "sections" with the ids
   of its sections. Clicking a menu button calls showSection("id").
   --------------------------------------------------------------------- */
function showSection(sectionId) {
  for (let i = 0; i < sections.length; i++) {
    let section = document.getElementById(sections[i]);
    let navButton = document.getElementById("nav-" + sections[i]);

    if (sections[i] === sectionId) {
      section.style.display = "block";
      if (navButton != null) { navButton.className = "active"; }
    } else {
      section.style.display = "none";
      if (navButton != null) { navButton.className = ""; }
    }
  }
}


/* ---------------------------------------------------------------------
   2. SHOWING AND CLEARING ERRORS
   Every field has a <span class="error" id="fieldIdError"></span>
   next to it. The message goes in the span; the field gets a red border.
   --------------------------------------------------------------------- */
function showError(fieldId, message) {
  document.getElementById(fieldId + "Error").innerHTML = message;
  let field = document.getElementById(fieldId);
  if (field != null) {
    field.style.border = "2px solid #C62828";
  }
}

function clearError(fieldId) {
  let errorSpan = document.getElementById(fieldId + "Error");
  if (errorSpan != null) { errorSpan.innerHTML = ""; }
  let field = document.getElementById(fieldId);
  if (field != null) { field.style.border = ""; }
}

function clearErrors(fieldIds) {
  for (let i = 0; i < fieldIds.length; i++) {
    clearError(fieldIds[i]);
  }
}

// true when the user typed nothing (or only spaces)
function isEmpty(value) {
  return value.trim() === "";
}


/* ---------------------------------------------------------------------
   3. MESSAGE BOXES
   type is "success", "error" or "info" (these are CSS classes).
   Errors use role="alert" and the box gets focus, so keyboard and
   screen-reader users notice the result.
   --------------------------------------------------------------------- */
function showMessage(boxId, text, type) {
  let box = document.getElementById(boxId);
  box.innerHTML = text;
  box.className = "message " + type;
  box.setAttribute("role", type === "error" ? "alert" : "status");
  box.tabIndex = -1;
  box.style.display = "block";
  box.focus();
}

function hideMessage(boxId) {
  document.getElementById(boxId).style.display = "none";
}


/* ---------------------------------------------------------------------
   4. DISPLAY AND DATE HELPERS
   --------------------------------------------------------------------- */

// SAFE RENDERING: anything a user typed (names, reasons) goes through this
// before it is put into innerHTML, so it shows as plain text and can never
// become HTML. & < > " ' are replaced by their HTML codes.
function escapeText(value) {
  return String(value)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split("\"").join("&quot;")
    .split("'").join("&#39;");
}

// "partially_filled" -> "Partially filled", "active" -> "Active"
function statusLabel(status) {
  if (status === undefined || status === null) { return "-"; }
  if (status === "partially_filled") { return "Partially filled"; }
  if (status === "in_review") { return "In review"; }
  if (status === "agency_manager") { return "Agency Manager"; }
  let text = String(status);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// A coloured badge that always contains readable TEXT (colour is only extra).
// switch picks the colour class for each status.
function badgeHtml(status) {
  let colour;
  switch (status) {
    case "approved": case "active": case "confirmed": case "filled":
    case "accepted": case "resolved": case "public": case "available":
      colour = "green";
      break;
    case "pending": case "invited": case "proposed": case "partially_filled":
    case "open": case "in_review":
      colour = "orange";
      break;
    case "rejected": case "declined": case "suspended": case "cancelled":
    case "removed": case "hidden": case "unavailable":
      colour = "red";
      break;
    default:
      colour = "grey";      // replaced, completed, unknown
  }
  return "<span class='badge " + colour + "'>" + statusLabel(status) + "</span>";
}

function formatBDT(amount) {
  return "BDT " + Number(amount).toLocaleString("en-US") + "/month";
}

function dateRange(start, end) {
  return start + " to " + end;
}

// Name of a user from the saved data (text already made safe)
function userName(s, id) {
  for (const user of s.users) {
    if (user.id === id) {
      return escapeText(user.name);
    }
  }
  return "Unknown user";
}

// One table row that says the table is empty
function emptyRow(columns, text) {
  return "<tr><td colspan='" + columns + "' class='empty-row'>" + text + "</td></tr>";
}

// true when every character is a digit 0-9 (Akash)
function isDigitsOnly(text) {
  if (text.length === 0) {
    return false;
  }
  let digits = "0123456789";
  for (let i = 0; i < text.length; i++) {
    if (digits.indexOf(text[i]) === -1) {
      return false;
    }
  }
  return true;
}

// true when text contains keyword, ignoring capitals (Hameem)
function containsText(text, keyword) {
  return String(text).toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
}

// "2026-12-05" -> "05 December 2026" (Akash)
function formatDate(dateText) {
  if (!dateText) {
    return "-";
  }
  let months = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];
  let year = dateText.slice(0, 4);
  let month = Number(dateText.slice(5, 7));
  let day = dateText.slice(8, 10);
  return day + " " + months[month - 1] + " " + year;
}

// 24000 -> "24,000 BDT"
function formatMoney(amount) {
  return Number(amount).toLocaleString("en-US") + " BDT";
}

// Service code -> readable label (labels are in data.js) (Hameem)
function formatJobType(jobType) {
  return jobTypeLabels[jobType] || "Service details unavailable";
}

// Experience in MONTHS -> "4 Years 2mos" (Hameem)
function formatExperience(totalMonths) {
  let years = Math.floor(totalMonths / 12);
  let months = totalMonths % 12;
  if (years === 0) {
    return months + (months === 1 ? " Month" : " Months");
  }
  let result = years + (years === 1 ? " Year" : " Years");
  if (months > 0) {
    result += " " + months + (months === 1 ? "mo" : "mos");
  }
  return result;
}

// Date arithmetic on "YYYY-MM-DD" text. Date.UTC avoids time-zone shifts.
function dateToText(date) {
  let month = date.getUTCMonth() + 1;
  let day = date.getUTCDate();
  if (month < 10) { month = "0" + month; }
  if (day < 10) { day = "0" + day; }
  return date.getUTCFullYear() + "-" + month + "-" + day;
}

function addDaysToDate(dateText, days) {
  let date = new Date(Date.UTC(Number(dateText.slice(0, 4)), Number(dateText.slice(5, 7)) - 1,
                               Number(dateText.slice(8, 10))));
  date.setUTCDate(date.getUTCDate() + days);
  return dateToText(date);
}

function addMonthsToDate(dateText, months) {
  let date = new Date(Date.UTC(Number(dateText.slice(0, 4)), Number(dateText.slice(5, 7)) - 1 + months,
                               Number(dateText.slice(8, 10))));
  return dateToText(date);
}


/* ---------------------------------------------------------------------
   5. SAVED DEMO DATA (the "store")
   ---------------------------------------------------------------------
   ONE key in the browser's localStorage holds the WHOLE demo:
       driverden.demo.v1
   Every page reads it when it opens and writes it after every action.
   That is how a change made as "Driver" appears when you switch to
   "Customer": both pages read the same saved object.
   --------------------------------------------------------------------- */
const STORAGE_KEY = "driverden.demo.v1";
const SCHEMA_VERSION = 1;

function freshFromSeed() {
  let state = getSeedData();
  saveState(state);
  return state;
}

// Always returns usable data. Missing, broken or outdated data falls
// back to the seed instead of crashing the page.
function getState() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return freshFromSeed();
    }
    let state = JSON.parse(raw);
    if (!state || state.schemaVersion !== SCHEMA_VERSION) {
      console.warn("[DriverDen] Saved demo data is outdated; restoring seed.");
      return freshFromSeed();
    }
    return state;
  } catch (error) {
    console.warn("[DriverDen] Saved demo data is unreadable; restoring seed.", error);
    return freshFromSeed();
  }
}

function saveState(nextState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (error) {
    console.warn("[DriverDen] Could not save demo data.", error);
  }
}

/* updateState(callback)
   1. loads the latest data
   2. lets the callback change it
   3. saves it ONLY if the callback did not return { ok: false }
   So a rule that fails validation never leaves half-changed records. */
function updateState(callback) {
  let state = getState();
  let result = callback(state);
  if (result && result.ok === false) {
    return result;
  }
  saveState(state);
  return result || { ok: true };
}

function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  return freshFromSeed();
}

// Makes a new unique id such as "as-mwp3ep7d1tyn"
let idCounter = 0;
function createId(prefix) {
  idCounter++;
  return prefix + "-" + Date.now().toString(36) + idCounter.toString(36) +
         Math.random().toString(36).slice(2, 5);
}


/* ---------------------------------------------------------------------
   5b. TODAY'S DATE FOR THE WHOLE PROJECT
   Use getToday() everywhere (hire form, availability, agency rules)
   instead of new Date(), so every page agrees on the same day.
   --------------------------------------------------------------------- */
function getToday() {
  if (USE_FIXED_TODAY) {
    return DEMO_TODAY;
  }
  let now = new Date();
  let month = now.getMonth() + 1;
  let day = now.getDate();
  if (month < 10) { month = "0" + month; }
  if (day < 10) { day = "0" + day; }
  return now.getFullYear() + "-" + month + "-" + day;
}


/* ---------------------------------------------------------------------
   6. CURRENT ACCOUNT AND ROLE CHECK
   (Demo convenience only - this is NOT security.)
   --------------------------------------------------------------------- */
function currentUser() {
  let s = getState();
  for (const user of s.users) {
    if (user.id === s.session.currentUserId) {
      return user;
    }
  }
  return null;
}

// The login page calls this after it has found the account, so every
// other page knows who is using it. (Hameem's real login should call it
// right before redirecting.)
function setCurrentUser(userId) {
  updateState(function (s) {
    s.session.currentUserId = userId;
    return { ok: true };
  });
}

// Each role page calls this first. Right account -> returns the user and
// writes "Welcome, name" in the header. Wrong account -> the page content
// is replaced by a readable message and null is returned.
function requireRole(role) {
  let user = currentUser();
  if (user !== null && user.role === role) {
    let welcome = document.getElementById("welcomeName");
    if (welcome != null) { welcome.innerHTML = "Welcome, " + escapeText(user.name); }
    return user;
  }
  let nav = document.querySelector(".topnav");
  if (nav != null) { nav.style.display = "none"; }
  document.getElementById("main").innerHTML =
    "<div class='card'><h2 class='page-title'>Switch account to view this page</h2>" +
    "<p>This page is for the " + statusLabel(role) + " role.</p>" +
    "<a href='login.html' class='btn'>Go to login</a></div>";
  return null;
}


/* =====================================================================
   7. DIRECT HIRING RULES  (customer page and driver page)
   ---------------------------------------------------------------------
   Plan flow:  customer sends (pending) -> driver accepts (accepted) or
   declines -> customer CONFIRMS (confirmed) -> ONE contract is created.
   An accepted request is NOT a contract yet. Only pending requests can
   be cancelled. Same contract as the agency rules: return ruleFail()
   without changing anything, or change s and return ruleOk().
   ===================================================================== */

// A contract or date range with no end date counts as running forever,
// so a missing date can never let a double booking through.
const OPEN_ENDED = "9999-12-31";

// Approved, active drivers only - what customers may search and hire
function isHireableDriver(s, driverId) {
  let user = findUserRecord(s, driverId);
  let profile = getDriverProfile(s, driverId);
  return user !== null && user.role === "driver" && user.status === "active" &&
         profile !== null && profile.verificationStatus === "approved";
}

// The work a driver has already agreed to: active contracts + accepted requests
function driverCommitments(s, driverId, ignoreRequestId) {
  let list = [];
  for (const c of s.contracts) {
    if (c.driverId === driverId && c.status === "active") {
      list.push({ title: "contract " + c.id, startDate: c.startDate, endDate: c.endDate || OPEN_ENDED });
    }
  }
  for (const r of s.hiringRequests) {
    if (r.driverId === driverId && r.status === "accepted" && r.id !== ignoreRequestId) {
      list.push({ title: r.duties, startDate: r.startDate, endDate: r.endDate || OPEN_ENDED });
    }
  }
  return list;
}

// Akash's eligibility check, now on the shared data. "" = OK, otherwise the reason.
function hiringBlockReason(s, request) {
  let profile = getDriverProfile(s, request.driverId);
  let user = findUserRecord(s, request.driverId);
  if (!user || !profile) { return "Driver record not found."; }
  if (user.status !== "active") { return "This driver account is suspended."; }
  if (profile.verificationStatus !== "approved") {
    return "The driver profile is " + profile.verificationStatus + ". Only verified drivers can accept work.";
  }
  for (const slot of s.availability) {
    if (slot.driverId === request.driverId && String(slot.type).toLowerCase() === "unavailable" &&
        datesOverlap(request.startDate, request.endDate, slot.startDate, slot.endDate || OPEN_ENDED)) {
      return "The driver is marked Unavailable from " + formatDate(slot.startDate) + " to " +
             formatDate(slot.endDate) + ", which overlaps this request.";
    }
  }
  for (const job of driverCommitments(s, request.driverId, request.id)) {
    if (datesOverlap(request.startDate, request.endDate, job.startDate, job.endDate)) {
      return "The driver already has \"" + job.title + "\" from " + formatDate(job.startDate) +
             " to " + formatDate(job.endDate) + ".";
    }
  }
  return "";
}

// Called by: customer.js (Hire a Driver)
function createHiringRequest(s, details) {
  if (!isHireableDriver(s, details.driverId)) { return ruleFail("Please select a verified, active driver."); }
  if (!details.startDate || !details.endDate || details.endDate < details.startDate) {
    return ruleFail("The booking dates are not valid.");
  }
  if (details.startDate < getToday()) { return ruleFail("Please choose today or a future start date."); }
  for (const r of s.hiringRequests) {
    if (r.customerId === details.customerId && r.driverId === details.driverId &&
        r.startDate === details.startDate && (r.status === "pending" || r.status === "accepted")) {
      return ruleFail("You already have an open request for this driver on this date.");
    }
  }
  let request = {
    id: createId("hr"), customerId: details.customerId, driverId: details.driverId,
    startDate: details.startDate, endDate: details.endDate, duties: details.duties,
    offeredSalary: details.offeredSalary, status: "pending",
    jobType: details.jobType, rate: details.rate, unit: details.unit,
    quantity: details.quantity, scope: details.scope
  };
  s.hiringRequests.push(request);
  addLog(s, "hiringRequest", request.id, "created");
  return ruleOk({ request: request });
}

// Called by: driver.js (My Offers) - accept or decline a pending request
function respondToHiringRequest(s, requestId, accept) {
  let request = findRecord(s.hiringRequests, requestId);
  if (!request) { return ruleFail("Request not found."); }
  if (request.status !== "pending") {
    return ruleFail("This request was already " + request.status + ". It cannot be changed again.");
  }
  if (accept) {
    let why = hiringBlockReason(s, request);
    if (why !== "") { return ruleFail("Cannot accept: " + why); }
  }
  request.status = accept ? "accepted" : "declined";
  addLog(s, "hiringRequest", request.id, accept ? "driver_accepted" : "driver_declined");
  return ruleOk({ request: request });
}

// Called by: customer.js (My Requests) - turns an accepted request into ONE contract
function confirmHiringRequest(s, requestId) {
  let request = findRecord(s.hiringRequests, requestId);
  if (!request) { return ruleFail("Request not found."); }
  if (request.status !== "accepted") { return ruleFail("Only requests the driver has accepted can be confirmed."); }
  for (const c of s.contracts) {
    if (c.sourceType === "direct" && c.sourceId === request.id) {
      return ruleFail("A contract already exists for this request.");
    }
  }
  let why = hiringBlockReason(s, request);       // re-check at confirmation time
  if (why !== "") { return ruleFail("Cannot confirm: " + why); }
  let contract = {
    id: createId("con"), customerId: request.customerId, driverId: request.driverId,
    sourceType: "direct", sourceId: request.id,
    startDate: request.startDate, endDate: request.endDate, salary: request.offeredSalary, status: "active"
  };
  s.contracts.push(contract);
  request.status = "confirmed";
  addLog(s, "hiringRequest", request.id, "customer_confirmed");
  return ruleOk({ request: request, contract: contract });
}

// Called by: customer.js - only pending requests can be cancelled
function cancelHiringRequest(s, requestId) {
  let request = findRecord(s.hiringRequests, requestId);
  if (!request) { return ruleFail("Hiring request not found."); }
  if (request.status !== "pending") { return ruleFail("Only pending requests can be cancelled."); }
  request.status = "cancelled";
  addLog(s, "hiringRequest", request.id, "cancelled");
  return ruleOk({ request: request });
}


/* =====================================================================
   8. AGENCY RULES  (written by Zinia)
   ---------------------------------------------------------------------
   WHY THESE LIVE IN common.js
   The "yes" clicks for the agency features happen on OTHER pages:
     - Driver accepts invitations / jobs / replacements  -> driver.html (Akash)
     - Customer approves drivers / replacements          -> customer.html (Hameem)
   If each page wrote its own version, one could forget the headcount
   limit or the date re-check. So every page calls these SAME functions.

   CONTRACT FOR EVERY RULE FUNCTION
   - First argument "s" is the saved data (given by updateState).
   - Failure: return ruleFail("message") and change NOTHING.
   - Success: change s, add an activityLog entry, return ruleOk({ ... }).
   Used like this from any page:
     let result = updateState(function (s) { return inviteDriver(s, agencyId, driverId); });
     if (result.ok === false) { showMessage("box", result.error, "error"); }
   ===================================================================== */

/* ---------- tiny helpers ---------- */
function ruleFail(error) {
  return { ok: false, error: error };
}

function ruleOk(extra) {
  let result = { ok: true };
  if (extra) {
    for (const key in extra) {
      result[key] = extra[key];
    }
  }
  return result;
}

function findRecord(list, id) {
  for (const item of list) {
    if (item.id === id) {
      return item;
    }
  }
  return null;
}

// Dates are "YYYY-MM-DD" text, so comparing the text compares the dates.
// End dates are inclusive: 1-5 Dec and 5-9 Dec DO overlap.
function datesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart <= bEnd && bStart <= aEnd;
}

function addLog(s, entityType, entityId, action, reason) {
  s.activityLog.push({
    id: createId("log"),
    actorId: s.session.currentUserId,
    entityType: entityType,
    entityId: entityId,
    action: action,
    reason: reason || "",
    createdAt: getToday()
  });
}

/* ---------- lookups ---------- */
function findUserRecord(s, id) {
  return findRecord(s.users, id);
}

function getDriverProfile(s, driverId) {
  for (const profile of s.driverProfiles) {
    if (profile.driverId === driverId) {
      return profile;
    }
  }
  return null;
}

function agencyOfManager(s, managerId) {
  for (const agency of s.agencies) {
    if (agency.managerId === managerId) {
      return agency;
    }
  }
  return null;
}

function activeMembershipOf(s, driverId) {
  for (const m of s.memberships) {
    if (m.driverId === driverId && m.status === "active") {
      return m;
    }
  }
  return null;
}

// Which agency does a contract belong to?
// contract -> assignment -> bulk request -> agency.
// A replacement contract points to a replacement, which points to the original contract.
function agencyIdForContract(s, contract) {
  if (!contract) {
    return null;
  }
  if (contract.sourceType === "assignment") {
    let assignment = findRecord(s.assignments, contract.sourceId);
    let request = assignment ? findRecord(s.bulkRequests, assignment.bulkRequestId) : null;
    return request ? request.agencyId : null;
  }
  if (contract.sourceType === "replacement") {
    let rep = findRecord(s.replacements, contract.sourceId);
    return rep ? agencyIdForContract(s, findRecord(s.contracts, rep.originalContractId)) : null;
  }
  return null;   // direct contracts have no agency
}

/* ---------- eligibility: returns null when OK, otherwise a reason ---------- */

// SAFETY: a contract saved without an end date is treated as running
// forever (OPEN_ENDED, section 7), so it still blocks the driver. The
// availability type is compared in lowercase, so "Unavailable" counts too.

function conflictReason(s, driverId, start, end, ignoreContractId) {
  for (const c of s.contracts) {
    let contractEnd = c.endDate || OPEN_ENDED;
    if (c.driverId === driverId && c.status === "active" && c.id !== ignoreContractId &&
        datesOverlap(start, end, c.startDate, contractEnd)) {
      return c.endDate ? "Already booked " + c.startDate + " to " + c.endDate
                       : "Already booked from " + c.startDate + " (no end date)";
    }
  }
  for (const a of s.availability) {
    if (a.driverId === driverId && String(a.type).toLowerCase() === "unavailable" &&
        datesOverlap(start, end, a.startDate, a.endDate || OPEN_ENDED)) {
      return "Marked unavailable " + a.startDate + " to " + a.endDate;
    }
  }
  return null;
}

// Can this driver be staffed by this agency for these dates?
function staffingBlockReason(s, agencyId, driverId, start, end, ignoreContractId) {
  let user = findUserRecord(s, driverId);
  let profile = getDriverProfile(s, driverId);
  if (!user || user.role !== "driver" || !profile) { return "Driver record not found"; }
  if (user.status !== "active") { return "Account suspended"; }
  if (profile.verificationStatus !== "approved") { return "Verification " + profile.verificationStatus; }
  let membership = activeMembershipOf(s, driverId);
  if (!membership || membership.agencyId !== agencyId) { return "Not an active member of this agency"; }
  return conflictReason(s, driverId, start, end, ignoreContractId || null);
}

function inviteBlockReason(s, agencyId, driverId) {
  let user = findUserRecord(s, driverId);
  if (!user || user.role !== "driver") { return "Driver record not found"; }
  if (user.status !== "active") { return "Account suspended"; }
  for (const m of s.memberships) {
    if (m.agencyId === agencyId && m.driverId === driverId && m.status === "invited") {
      return "Already invited";
    }
  }
  let active = activeMembershipOf(s, driverId);
  if (active) {
    return active.agencyId === agencyId ? "Already an active member" : "Active in another agency";
  }
  return null;
}


/* =====================================================================
   G1  ROSTER / MEMBERSHIP
   invited -> active | declined ;  active -> removed
   ===================================================================== */

// Called by: agency.js (Roster section)
function inviteDriver(s, agencyId, driverId) {
  let agency = findRecord(s.agencies, agencyId);
  if (!agency) { return ruleFail("Agency not found."); }
  if (agency.verificationStatus !== "approved") { return ruleFail("Your agency must be verified before inviting drivers."); }
  let why = inviteBlockReason(s, agencyId, driverId);
  if (why) { return ruleFail("Cannot invite: " + why + "."); }
  let membership = { id: createId("m"), agencyId: agencyId, driverId: driverId, status: "invited" };
  s.memberships.push(membership);
  addLog(s, "membership", membership.id, "invited");
  return ruleOk({ membership: membership });
}

// Called by: driver.js (Agency invitations)
function respondToInvitation(s, membershipId, accept) {
  let m = findRecord(s.memberships, membershipId);
  if (!m || m.status !== "invited") { return ruleFail("This invitation is no longer open."); }
  if (accept && activeMembershipOf(s, m.driverId)) { return ruleFail("You are already active in an agency."); }
  m.status = accept ? "active" : "declined";
  addLog(s, "membership", m.id, accept ? "accepted" : "declined");
  return ruleOk({ membership: m });
}

// Called by: agency.js (Roster section)
function removeMember(s, membershipId, reason) {
  let m = findRecord(s.memberships, membershipId);
  if (!m || m.status !== "active") { return ruleFail("Only active members can be removed."); }
  if (!reason || !reason.trim()) { return ruleFail("Enter a reason for removal."); }
  for (const c of s.contracts) {
    if (c.driverId === m.driverId && c.status === "active" && agencyIdForContract(s, c) === m.agencyId) {
      return ruleFail("This driver has an active agency contract. Propose a replacement first.");
    }
  }
  m.status = "removed";
  addLog(s, "membership", m.id, "removed", reason.trim());
  return ruleOk({ membership: m });
}
// Called by: agency.js (Roster section)
function addDriverToRoster(s, agencyId, driverData) {
  let agency = findRecord(s.agencies, agencyId);
  if (!agency) { return ruleFail("Agency not found."); }
  if (agency.verificationStatus !== "approved") {
    return ruleFail("Your agency must be verified before adding drivers to the roster.");
  }

  let name = (driverData && driverData.name ? driverData.name : "").trim();
  let phone = (driverData && driverData.phone ? driverData.phone : "").trim();
  let licenseNo = (driverData && driverData.licenseNo ? driverData.licenseNo : "").trim();
  let area = (driverData && driverData.area ? driverData.area : "").trim();
  let experienceYears = Number(driverData ? driverData.experienceYears : NaN);
  let expectedSalary = Number(driverData ? driverData.expectedSalary : NaN);
  let vehicles = (driverData && Array.isArray(driverData.vehicleCategories) && driverData.vehicleCategories.length > 0)
    ? driverData.vehicleCategories
    : ["car"];

  if (!name) { return ruleFail("Full name is required."); }
  if (!isDigitsOnly(phone) || phone.length !== 11) {
    return ruleFail("Phone number must be 11 digits.");
  }
  if (!licenseNo) { return ruleFail("License number is required."); }
  if (!area) { return ruleFail("Operating area is required."); }
  if (Number.isNaN(experienceYears) || experienceYears < 0 || experienceYears > 40) {
    return ruleFail("Experience must be between 0 and 40 years.");
  }
  if (Number.isNaN(expectedSalary) || expectedSalary < 1000) {
    return ruleFail("Monthly salary must be at least 1000 BDT.");
  }

  for (const p of s.driverProfiles) {
    if (p.phone === phone) {
      return ruleFail("A driver with this phone number already exists.");
    }
    if (p.licenseNo && p.licenseNo.toLowerCase() === licenseNo.toLowerCase()) {
      return ruleFail("A driver with this license number already exists.");
    }
  }

  let newDriverId = createId("u-drv");
  let slug = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "driver";

  let user = {
    id: newDriverId,
    name: name,
    role: "driver",
    status: "active",
    email: slug + "." + newDriverId.replace(/[^a-z0-9]/g, "") + "@driverden.com",
    password: "driver123"
  };

  let profile = {
    driverId: newDriverId,
    area: area,
    experienceYears: experienceYears,
    expectedSalary: expectedSalary,
    vehicleCategories: vehicles,
    verificationStatus: "approved",
    phone: phone,
    licenseNo: licenseNo,
    summary: "",
    documentName: "",
    services: []
  };

  let membership = {
    id: createId("m"),
    agencyId: agencyId,
    driverId: newDriverId,
    status: "active"
  };

  s.users.push(user);
  s.driverProfiles.push(profile);
  s.memberships.push(membership);
  addLog(s, "membership", membership.id, "added_to_roster");

  return ruleOk({ user: user, profile: profile, membership: membership });
}

/* =====================================================================
   G2  BULK STAFFING
   assignment: proposed -> accepted -> confirmed ; proposed -> declined
   The bulk request status is WORKED OUT from the confirmed assignments.
   ===================================================================== */

function confirmedCount(s, bulkRequestId) {
  let count = 0;
  for (const a of s.assignments) {
    if (a.bulkRequestId === bulkRequestId && a.status === "confirmed") {
      count++;
    }
  }
  return count;
}

function refreshBulkStatus(s, request) {
  if (request.status === "cancelled") { return; }
  let n = confirmedCount(s, request.id);
  if (n === 0) {
    request.status = "open";
  } else if (n < request.headcount) {
    request.status = "partially_filled";
  } else {
    request.status = "filled";
  }
}

// Called by: agency.js (Staffing requests section)
// NOTE: proposing does NOT use up headcount. You may propose 3 for a 2-person request.
function proposeAssignment(s, bulkRequestId, driverId) {
  let request = findRecord(s.bulkRequests, bulkRequestId);
  if (!request) { return ruleFail("Request not found."); }
  if (request.status === "cancelled" || request.status === "filled") { return ruleFail("This request is no longer accepting staff."); }
  for (const a of s.assignments) {
    if (a.bulkRequestId === request.id && a.driverId === driverId && a.status !== "declined") {
      return ruleFail("This driver is already proposed for this request.");
    }
  }
  let why = staffingBlockReason(s, request.agencyId, driverId, request.startDate, request.endDate);
  if (why) { return ruleFail("Cannot propose: " + why + "."); }
  let assignment = {
    id: createId("as"), bulkRequestId: request.id, driverId: driverId,
    status: "proposed", driverAccepted: false, customerApproved: false
  };
  s.assignments.push(assignment);
  addLog(s, "assignment", assignment.id, "proposed");
  return ruleOk({ assignment: assignment });
}

// Called by: driver.js (Agency job proposals)
function respondToAssignment(s, assignmentId, accept) {
  let a = findRecord(s.assignments, assignmentId);
  if (!a || a.status !== "proposed") { return ruleFail("This proposal is no longer open."); }
  if (accept) {
    a.status = "accepted";
    a.driverAccepted = true;
  } else {
    a.status = "declined";
  }
  addLog(s, "assignment", a.id, accept ? "driver_accepted" : "driver_declined");
  return ruleOk({ assignment: a });
}

// Called by: customer.js. THE HEADCOUNT RULE LIVES HERE.
function confirmAssignment(s, assignmentId) {
  let a = findRecord(s.assignments, assignmentId);
  if (!a) { return ruleFail("Assignment not found."); }
  if (a.status !== "accepted" || !a.driverAccepted) { return ruleFail("The driver has not accepted this assignment yet."); }
  let request = findRecord(s.bulkRequests, a.bulkRequestId);
  if (!request || request.status === "cancelled") { return ruleFail("This request was cancelled."); }
  let filled = confirmedCount(s, request.id);
  if (filled >= request.headcount) {
    return ruleFail("Headcount already reached (" + filled + "/" + request.headcount + "). No more drivers can be confirmed.");
  }
  // Re-check at confirmation time, not only when the list was drawn
  let why = staffingBlockReason(s, request.agencyId, a.driverId, request.startDate, request.endDate);
  if (why) { return ruleFail("Cannot confirm: " + why + "."); }

  let contract = {
    id: createId("con"), customerId: request.customerId, driverId: a.driverId,
    sourceType: "assignment", sourceId: a.id,
    startDate: request.startDate, endDate: request.endDate, salary: request.offeredSalary, status: "active"
  };
  s.contracts.push(contract);
  a.status = "confirmed";
  a.customerApproved = true;
  refreshBulkStatus(s, request);
  addLog(s, "assignment", a.id, "customer_confirmed");
  return ruleOk({ assignment: a, contract: contract, request: request });
}

// Called by: customer.js - the customer refuses an accepted driver
function declineAssignmentAsCustomer(s, assignmentId) {
  let a = findRecord(s.assignments, assignmentId);
  if (!a || a.status !== "accepted") { return ruleFail("Only accepted assignments can be declined."); }
  a.status = "declined";
  addLog(s, "assignment", a.id, "customer_declined");
  return ruleOk({ assignment: a });
}


/* =====================================================================
   G3  REPLACEMENTS
   pending -> approved (needs BOTH yeses) | rejected | cancelled
   The original contract stays ACTIVE until approval.
   ===================================================================== */

// Remaining dates of a contract = from the later of (start, today) to end.
// Returns null when nothing is left (or the contract has no end date).
function remainingRange(contract) {
  let today = getToday();
  if (!contract.endDate) {
    return null;    // a contract without an end date cannot be split
  }
  let start = contract.startDate > today ? contract.startDate : today;
  if (start <= contract.endDate) {
    return { start: start, end: contract.endDate };
  }
  return null;
}

// Called by: agency.js (Replacements section)
function proposeReplacement(s, contractId, replacementDriverId, reason) {
  let c = findRecord(s.contracts, contractId);
  if (!c || c.status !== "active") { return ruleFail("Choose an active contract."); }
  let agencyId = agencyIdForContract(s, c);
  if (!agencyId) { return ruleFail("Only agency contracts can be replaced here."); }
  if (!reason || !reason.trim()) { return ruleFail("Enter a reason for the replacement."); }
  if (c.driverId === replacementDriverId) { return ruleFail("Choose a different driver from the current one."); }
  for (const r of s.replacements) {
    if (r.originalContractId === c.id && r.status === "pending") {
      return ruleFail("This contract already has a pending replacement.");
    }
  }
  let range = remainingRange(c);
  if (!range) { return ruleFail("This contract has no remaining dates."); }
  let why = staffingBlockReason(s, agencyId, replacementDriverId, range.start, range.end);
  if (why) { return ruleFail("Cannot propose this driver: " + why + "."); }

  let rep = {
    id: createId("rep"), originalContractId: c.id, replacementDriverId: replacementDriverId,
    reason: reason.trim(), driverAccepted: false, customerApproved: false,
    status: "pending", newContractId: null
  };
  s.replacements.push(rep);
  addLog(s, "replacement", rep.id, "proposed", rep.reason);
  return ruleOk({ replacement: rep });
}

// Runs after each yes. It only acts when BOTH flags are true.
function finaliseReplacement(s, rep) {
  if (!(rep.driverAccepted && rep.customerApproved)) {
    return ruleOk({ replacement: rep, finalised: false });
  }
  let original = findRecord(s.contracts, rep.originalContractId);
  if (!original || original.status !== "active") { return ruleFail("The original contract is no longer active."); }
  let range = remainingRange(original);
  if (!range) { return ruleFail("The original contract has no remaining dates."); }
  let why = staffingBlockReason(s, agencyIdForContract(s, original), rep.replacementDriverId,
                                range.start, range.end, original.id);
  if (why) { return ruleFail("Cannot approve: replacement driver - " + why + "."); }

  let newContract = {
    id: createId("con"), customerId: original.customerId, driverId: rep.replacementDriverId,
    sourceType: "replacement", sourceId: rep.id,
    startDate: range.start, endDate: range.end, salary: original.salary, status: "active"
  };
  s.contracts.push(newContract);
  original.status = "replaced";          // history kept, never deleted
  rep.status = "approved";
  rep.newContractId = newContract.id;    // the link between old and new
  addLog(s, "replacement", rep.id, "approved");
  return ruleOk({ replacement: rep, finalised: true, contract: newContract });
}

// Called by: driver.js (the replacement driver)
function respondToReplacement(s, replacementId, accept) {
  let rep = findRecord(s.replacements, replacementId);
  if (!rep || rep.status !== "pending") { return ruleFail("This replacement is no longer pending."); }
  if (!accept) {
    rep.status = "rejected";               // original contract untouched
    addLog(s, "replacement", rep.id, "driver_declined");
    return ruleOk({ replacement: rep });
  }
  rep.driverAccepted = true;
  addLog(s, "replacement", rep.id, "driver_accepted");
  return finaliseReplacement(s, rep);
}

// Called by: customer.js
function decideReplacement(s, replacementId, approve) {
  let rep = findRecord(s.replacements, replacementId);
  if (!rep || rep.status !== "pending") { return ruleFail("This replacement is no longer pending."); }
  if (!approve) {
    rep.status = "rejected";
    addLog(s, "replacement", rep.id, "customer_rejected");
    return ruleOk({ replacement: rep });
  }
  rep.customerApproved = true;
  addLog(s, "replacement", rep.id, "customer_approved");
  return finaliseReplacement(s, rep);
}

// Called by: agency.js
function cancelReplacement(s, replacementId) {
  let rep = findRecord(s.replacements, replacementId);
  if (!rep || rep.status !== "pending") { return ruleFail("Only pending replacements can be cancelled."); }
  rep.status = "cancelled";
  addLog(s, "replacement", rep.id, "cancelled");
  return ruleOk({ replacement: rep });
}


/* =====================================================================
   9. SHARED DATA CHECK  (merge helper)
   ---------------------------------------------------------------------
   The agency rules only work if everyone saves the SAME words. This
   function lists records whose status (or type) is not one of the agreed
   words, or contracts without dates. Pages call it once at start-up and
   print each problem with console.warn, so a mismatch after merging shows
   up in the Console instead of silently breaking a rule.
   ===================================================================== */
const ALLOWED_VALUES = {
  users:                   { field: "status", values: ["active", "suspended"] },
  driverProfiles:          { field: "verificationStatus", values: ["pending", "approved", "rejected"] },
  agencies:                { field: "verificationStatus", values: ["pending", "approved", "rejected"] },
  availability:            { field: "type", values: ["available", "unavailable"] },
  hiringRequests:          { field: "status", values: ["pending", "accepted", "declined", "cancelled", "confirmed"] },
  bulkRequests:            { field: "status", values: ["open", "partially_filled", "filled", "cancelled"] },
  memberships:             { field: "status", values: ["invited", "active", "declined", "removed"] },
  assignments:             { field: "status", values: ["proposed", "accepted", "confirmed", "declined"] },
  contracts:               { field: "status", values: ["active", "completed", "replaced", "cancelled"] },
  replacements:            { field: "status", values: ["pending", "approved", "rejected", "cancelled"] },
  verificationSubmissions: { field: "status", values: ["pending", "approved", "rejected"] },
  reviews:                 { field: "visibility", values: ["public", "hidden"] },
  complaints:              { field: "status", values: ["open", "in_review", "resolved"] }
};

function checkSharedData(s) {
  let problems = [];
  for (const listName in ALLOWED_VALUES) {
    let rule = ALLOWED_VALUES[listName];
    let list = s[listName];
    if (!Array.isArray(list)) {
      problems.push(listName + " is missing from the saved data.");
      continue;
    }
    for (const record of list) {
      let value = record[rule.field];
      if (rule.values.indexOf(value) === -1) {
        problems.push(listName + " " + (record.id || record.driverId) + ": " + rule.field +
                      " is \"" + value + "\" (expected one of: " + rule.values.join(", ") + ")");
      }
    }
  }
  for (const c of s.contracts || []) {
    if (!c.startDate || !c.endDate) {
      problems.push("contracts " + c.id + " has no start or end date.");
    }
  }
  for (const r of s.hiringRequests || []) {
    if (!r.startDate || !r.endDate || !r.driverId || !r.customerId) {
      problems.push("hiringRequests " + r.id + " is missing a date, driverId or customerId.");
    }
  }
  return problems;
}

// Prints the problems (if any) as Console warnings
function warnAboutSharedData() {
  let problems = checkSharedData(getState());
  for (const problem of problems) {
    console.warn("[DriverDen data check] " + problem);
  }
  return problems.length;
}
