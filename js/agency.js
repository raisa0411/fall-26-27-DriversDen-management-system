/* Everything the Agency Manager can do
   Feature G1   : Driver Roster (invite, filter, remove)
   Feature G2   : Bulk Staffing (propose drivers for customer requests)
   Feature G3   : Replacement Proposals */

const sections = ["dashboardSection", "rosterSection", "requestsSection", "replacementsSection"];

const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;     // 2 MB in bytes

let me = null;            // the logged-in agency manager
let myAgencyId = null;    // the id of the manager's agency


/* SHARED HELPERS FOR THIS PAGE */
function loadAgency() {
  let s = getState();
  return { s: s, agency: findRecord(s.agencies, myAgencyId) };
}

function runRule(ruleCall, messageBoxId, successText) {
  let result = updateState(ruleCall);
  if (result.ok === false) {
    showMessage(messageBoxId, escapeText(result.error), "error");
    return false;
  }
  showMessage(messageBoxId, successText, "success");
  return true;
}

// Disables a button while an action runs (no double submissions)
function runWithButton(button, action) {
  if (button != null) { button.disabled = true; }
  try {
    action();
  } finally {
    if (button != null) { button.disabled = false; }
  }
}

// Builds <option> tags. Each item: { value, text, disabled }
function optionsHtml(firstText, items, selectedValue) {
  let html = "<option value=''>" + firstText + "</option>";
  for (const item of items) {
    html += "<option value='" + item.value + "'" +
            (item.disabled ? " disabled" : "") +
            (item.value === selectedValue ? " selected" : "") + ">" +
            item.text + "</option>";
  }
  return html;
}

// Redraws everything on the page
function refreshAll() {
  renderDashboard();
  renderRoster();
  renderRequests();
  renderReplacements();
}


/* DASHBOARD */
function renderDashboard() {
  let data = loadAgency();
  let s = data.s;
  let agency = data.agency;

  // Counts worked out with loops over the saved data
  let rosterSize = 0;
  for (const m of s.memberships) {
    if (m.agencyId === agency.id && m.status === "active") { rosterSize++; }
  }
  let openRequests = 0;
  for (const r of s.bulkRequests) {
    if (r.agencyId === agency.id && (r.status === "open" || r.status === "partially_filled")) { openRequests++; }
  }
  let pendingReplacements = 0;
  for (const rep of s.replacements) {
    let original = findRecord(s.contracts, rep.originalContractId);
    if (rep.status === "pending" && agencyIdForContract(s, original) === agency.id) { pendingReplacements++; }
  }

  document.getElementById("statRoster").innerHTML = rosterSize;
  document.getElementById("statRequests").innerHTML = openRequests;
  document.getElementById("statReplacements").innerHTML = pendingReplacements;

  // Verification: approved -> note only; pending -> note only;
  // no submission or rejected -> show the form
  let latest = null;
  for (const v of s.verificationSubmissions) {
    if (v.subjectType === "agency" && v.subjectId === agency.id) { latest = v; }   // the last one wins
  }

  document.getElementById("profileAgencyId").innerHTML = escapeText(agency.id);
  document.getElementById("profileAgencyName").innerHTML = escapeText(agency.name);
  document.getElementById("profileAgencyArea").innerHTML = escapeText(agency.area);
  document.getElementById("profileManager").innerHTML = escapeText(me.name) + " (" + escapeText(me.email) + ")";
  document.getElementById("profileStatus").innerHTML = badgeHtml(agency.verificationStatus);
  document.getElementById("profileDocument").innerHTML =
    latest !== null ? escapeText(latest.filename) + " (" + statusLabel(latest.status) + ")" : "Verified";

  let note = document.getElementById("verifyNote");
  let form = document.getElementById("verifyForm");
  form.style.display = "none";

  if (agency.verificationStatus === "approved") {
    note.innerHTML = "Your agency is verified. You can invite drivers and accept staffing requests.";
  } else if (latest !== null && latest.status === "pending") {
    note.innerHTML = "Submission \"" + escapeText(latest.filename) + "\" is waiting for Admin review.";
  } else {
    if (latest !== null && latest.status === "rejected") {
      note.innerHTML = "Previous submission was rejected: " + escapeText(latest.reason) + " You can submit again.";
    } else {
      note.innerHTML = "Submit your agency details for verification.";
    }
    form.style.display = "block";
    document.getElementById("agencyNameInput").value = agency.name;
    document.getElementById("agencyAreaInput").value = agency.area;
  }
}

function toggleEditProfile() {
  let form = document.getElementById("editProfileForm");
  clearErrors(["editAgencyName", "editAgencyArea"]);
  hideMessage("profileEditMessage");

  if (form.style.display === "none") {
    let data = loadAgency();
    document.getElementById("editAgencyName").value = data.agency.name;
    document.getElementById("editAgencyArea").value = data.agency.area;
    form.style.display = "block";
  } else {
    form.style.display = "none";
  }
}

function saveAgencyProfile() {
  let name = document.getElementById("editAgencyName").value.trim();
  let area = document.getElementById("editAgencyArea").value.trim();

  let isValid = true;
  clearErrors(["editAgencyName", "editAgencyArea"]);
  hideMessage("profileEditMessage");

  if (isEmpty(name)) {
    showError("editAgencyName", "Agency name is required.");
    isValid = false;
  }
  if (isEmpty(area)) {
    showError("editAgencyArea", "Operating area is required.");
    isValid = false;
  }
  if (isValid === false) {
    return false;
  }

  let saved = runRule(function (s) {
    let agency = findRecord(s.agencies, myAgencyId);
    agency.name = name;
    agency.area = area;
    return { ok: true };
  }, "profileEditMessage", "Agency profile updated.");

  if (saved) {
    document.getElementById("editProfileForm").style.display = "none";
    refreshAll();
  }
  return false;
}

// Fictional document: we only read its name, type and size. Nothing is uploaded.
function showFilePreview() {
  let file = document.getElementById("agencyDocument").files[0];
  let preview = document.getElementById("filePreview");
  if (file) {
    preview.innerHTML = "Selected: " + escapeText(file.name) + " &middot; " + (file.type || "unknown type") +
                        " &middot; " + Math.round(file.size / 1024) + " KB (metadata only - not uploaded)";
  } else {
    preview.innerHTML = "";
  }
}

function submitVerification() {
  let name = document.getElementById("agencyNameInput").value.trim();
  let area = document.getElementById("agencyAreaInput").value.trim();
  let file = document.getElementById("agencyDocument").files[0];

  // Validation 
  let isValid = true;
  clearErrors(["agencyNameInput", "agencyAreaInput", "agencyDocument"]);
  hideMessage("verifyMessage");

  if (isEmpty(name)) {
    showError("agencyNameInput", "Agency name is required.");
    isValid = false;
  }
  if (isEmpty(area)) {
    showError("agencyAreaInput", "Area is required.");
    isValid = false;
  }
  if (!file) {
    showError("agencyDocument", "Choose a fictional sample document.");
    isValid = false;
  } else if (ALLOWED_FILE_TYPES.indexOf(file.type) === -1) {
    showError("agencyDocument", "Only PDF, JPG or PNG files are accepted.");
    isValid = false;
  } else if (file.size > MAX_FILE_SIZE) {
    showError("agencyDocument", "File must be 2 MB or smaller.");
    isValid = false;
  }
  if (isValid === false) {
    return false;     // the form is not sent; typed values stay
  }

  // Save 
  let saved = runRule(function (s) {
    let agency = findRecord(s.agencies, myAgencyId);
    for (const v of s.verificationSubmissions) {
      if (v.subjectType === "agency" && v.subjectId === agency.id && v.status === "pending") {
        return ruleFail("A submission is already pending.");
      }
    }
    agency.name = name;
    agency.area = area;
    agency.verificationStatus = "pending";
    s.verificationSubmissions.push({
      id: createId("vs"), subjectType: "agency", subjectId: agency.id,
      filename: file.name, fileType: file.type, fileSize: file.size,
      status: "pending", reason: "", reviewedAt: ""
    });
    return { ok: true };
  }, "verifyMessage", "Submitted. An Admin will review it on the Verifications page.");

  if (saved) {
    document.getElementById("verifyForm").reset();
    document.getElementById("filePreview").innerHTML = "";
    refreshAll();
  }
  return false;       // always stay on this page
}

/* G1: DRIVER ROSTER */
function renderRoster() {
  let data = loadAgency();
  let s = data.s;
  let agency = data.agency;
  let wanted = document.getElementById("rosterFilter").value;
  let searchEl = document.getElementById("rosterSearch");
  let query = searchEl ? searchEl.value.trim().toLowerCase() : "";

  let rows = "";
  let shown = 0;

  for (const m of s.memberships) {
    if (m.agencyId !== agency.id) { continue; }
    if (wanted !== "all" && m.status !== wanted) { continue; }

    let profile = getDriverProfile(s, m.driverId) || {};
    let nameText = userName(s, m.driverId);
    let areaText = profile.area || "-";
    let phoneText = profile.phone || "-";
    let licenseText = profile.licenseNo || "-";

    if (query !== "") {
      let haystack = (m.driverId + " " + nameText + " " + areaText + " " + phoneText + " " + licenseText).toLowerCase();
      if (haystack.indexOf(query) === -1) { continue; }
    }

    let salaryText = (profile.expectedSalary !== undefined) ? formatBDT(profile.expectedSalary) : "-";

    let action;
    if (m.status === "active") {
      action = "<button type='button' class='btn btn-small btn-danger' onclick=\"removeMemberClick('" + m.id + "', this)\">Remove</button>";
    } else if (m.status === "invited") {
      action = "<span class='hint'>Waiting for driver</span>";
    } else {
      action = "-";
    }

    rows += "<tr>" +
              "<td>" + nameText + "</td>" +
              "<td>" + escapeText(areaText) + "</td>" +
              "<td>" + (profile.experienceYears !== undefined ? profile.experienceYears : "-") + " yrs</td>" +
              "<td>" + salaryText + "<br><span class='hint'>" + escapeText(phoneText) + "</span></td>" +
              "<td>" + badgeHtml(profile.verificationStatus || "unknown") + "</td>" +
              "<td>" + badgeHtml(m.status) + "</td>" +
              "<td>" + action + "</td>" +
            "</tr>";
    shown++;
  }

  if (shown === 0) {
    rows = emptyRow(7, "No drivers match this filter.");
  }
  document.getElementById("rosterBody").innerHTML = rows;
  document.getElementById("rosterCount").innerHTML = shown + " driver(s) shown";

  // Invite list: every driver, with the reason shown if they cannot be invited.
  // The options stay selectable so the rule's error message can be demonstrated.
  let select = document.getElementById("inviteDriver");
  if (select) {
    let keep = select.value;
    let items = [];
    for (const user of s.users) {
      if (user.role !== "driver") { continue; }
      let why = inviteBlockReason(s, agency.id, user.id);
      items.push({ value: user.id, text: escapeText(user.name) + (why ? " - " + why : ""), disabled: false });
    }
    select.innerHTML = optionsHtml("-- Choose a driver --", items, keep);
  }
}

function submitInvite() {
  let driverId = document.getElementById("inviteDriver").value;

  clearError("inviteDriver");
  if (driverId === "") {
    showError("inviteDriver", "Choose a driver to invite.");
    return false;
  }

  runWithButton(document.getElementById("inviteButton"), function () {
    let saved = runRule(function (s) { return inviteDriver(s, myAgencyId, driverId); },
                        "rosterMessage", "Invitation sent. The driver accepts or declines from their Offers page.");
    if (saved) {
      document.getElementById("inviteForm").reset();
      refreshAll();
    }
  });
  return false;
}

function removeMemberClick(membershipId, button) {
  // confirm() shows OK / Cancel and returns true or false
  if (!confirm("Remove this driver from your roster? Their past records are kept.")) {
    return;
  }
  runWithButton(button, function () {
    let saved = runRule(function (s) { return removeMember(s, membershipId, "Removed by agency manager"); },
                        "rosterMessage", "Driver removed from roster.");
    if (saved) { refreshAll(); }
  });
}
/* G2: BULK STAFFING */
function renderRequests() {
  let data = loadAgency();
  let s = data.s;
  let agency = data.agency;
  let html = "";

  for (const request of s.bulkRequests) {
    if (request.agencyId !== agency.id) { continue; }
    html += requestCardHtml(s, request);
  }

  if (html === "") {
    html = "<p class='empty-row'>No staffing requests have been sent to your agency yet.</p>";
  }
  document.getElementById("requestList").innerHTML = html;
}

// One card for one bulk request
function requestCardHtml(s, request) {
  let confirmed = confirmedCount(s, request.id);
  let closed = (request.status === "filled" || request.status === "cancelled");

  // ----- Proposed drivers table -----
  let assignmentRows = "";
  for (const a of s.assignments) {
    if (a.bulkRequestId !== request.id) { continue; }
    assignmentRows += "<tr>" +
                        "<td>" + userName(s, a.driverId) + "</td>" +
                        "<td>" + badgeHtml(a.status) + "</td>" +
                        "<td>" + (a.driverAccepted ? "Accepted" : "Waiting") + "</td>" +
                        "<td>" + (a.customerApproved ? "Approved" : "Waiting") + "</td>" +
                      "</tr>";
  }
  if (assignmentRows === "") {
    assignmentRows = emptyRow(4, "No drivers proposed yet.");
  }

  // Every active member, checked for THIS request's dates 
  let items = [];
  let blockedList = "";
  let blockedCount = 0;
  for (const m of s.memberships) {
    if (m.agencyId !== request.agencyId || m.status !== "active") { continue; }

    let alreadyProposed = false;
    for (const a of s.assignments) {
      if (a.bulkRequestId === request.id && a.driverId === m.driverId && a.status !== "declined") {
        alreadyProposed = true;
      }
    }
    let why = alreadyProposed ? "Already proposed"
                              : staffingBlockReason(s, request.agencyId, m.driverId, request.startDate, request.endDate);
    let name = userName(s, m.driverId);

    items.push({ value: m.driverId, text: name + (why ? " - " + why : ""), disabled: why !== null });
    if (why) {
      blockedList += "<li>" + name + ": " + why + "</li>";
      blockedCount++;
    }
  }

  // The card 
  let selectId = "propose-" + request.id;
  let html = "<div class='card request-card'>" +
    "<h3>" + escapeText(request.duties) + " " + badgeHtml(request.status) + "</h3>" +
    "<table class='facts-table'>" +
      "<tr><td>Customer</td><td>" + userName(s, request.customerId) + "</td></tr>" +
      "<tr><td>Dates</td><td>" + dateRange(request.startDate, request.endDate) + "</td></tr>" +
      "<tr><td>Offered salary</td><td>" + formatBDT(request.offeredSalary) + "</td></tr>" +
      "<tr><td>Staffed</td><td>" +
        "<div class='progress-track'><div class='progress-fill' style='width: " +
          Math.round((confirmed / request.headcount) * 100) + "%'></div></div> " +
        confirmed + " / " + request.headcount + " confirmed</td></tr>" +
    "</table>" +
    "<div class='table-wrapper'><table class='data-table'>" +
      "<thead><tr><th>Proposed driver</th><th>Status</th><th>Driver consent</th><th>Customer approval</th></tr></thead>" +
      "<tbody>" + assignmentRows + "</tbody>" +
    "</table></div>";

  if (closed) {
    html += "<p class='hint'>" + (request.status === "filled" ? "This request is fully staffed." : "This request was cancelled.") + "</p>";
  } else {
    html += "<form class='inline-form' onsubmit=\"return submitProposal('" + request.id + "')\">" +
              "<label for='" + selectId + "'>Propose driver:</label> " +
              "<select id='" + selectId + "'>" + optionsHtml("-- Choose an eligible driver --", items, "") + "</select> " +
              "<input type='submit' class='btn' value='Propose'>" +
              "<span class='error' id='" + selectId + "Error'></span>" +
            "</form>";
    if (blockedCount > 0) {
      html += "<details class='why-list'><summary>Why some drivers can't be selected (" + blockedCount + ")</summary>" +
                "<ul>" + blockedList + "</ul></details>";
    }
  }
  return html + "</div>";
}

function submitProposal(requestId) {
  let selectId = "propose-" + requestId;
  let driverId = document.getElementById(selectId).value;

  clearError(selectId);
  if (driverId === "") {
    showError(selectId, "Choose a driver to propose.");
    return false;
  }

  let saved = runRule(function (s) { return proposeAssignment(s, requestId, driverId); },
                      "requestsMessage", "Driver proposed. Next: the driver accepts, then the customer approves.");
  if (saved) { refreshAll(); }
  return false;
}


/* G3: REPLACEMENT PROPOSALS */

// Active contracts that belong to this agency
function agencyContracts(s) {
  let list = [];
  for (const c of s.contracts) {
    if (c.status === "active" && agencyIdForContract(s, c) === myAgencyId) {
      list.push(c);
    }
  }
  return list;
}

// Rebuilds the replacement-driver list for the chosen contract
function fillReplacementDrivers() {
  let s = getState();
  let contractId = document.getElementById("replaceContract").value;
  let driverSelect = document.getElementById("replaceDriver");
  let hint = document.getElementById("remainingDates");
  let contract = findRecord(s.contracts, contractId);

  if (contract === null) {
    driverSelect.innerHTML = "<option value=''>-- Choose a contract first --</option>";
    driverSelect.disabled = true;
    hint.innerHTML = "";
    return;
  }

  let range = remainingRange(contract);
  hint.innerHTML = range ? "The new contract would cover " + dateRange(range.start, range.end) + "."
                         : "This contract has no remaining dates.";

  let items = [];
  for (const m of s.memberships) {
    if (m.agencyId !== myAgencyId || m.status !== "active" || m.driverId === contract.driverId) { continue; }
    let why = range ? staffingBlockReason(s, myAgencyId, m.driverId, range.start, range.end) : "No remaining dates";
    items.push({ value: m.driverId, text: userName(s, m.driverId) + (why ? " - " + why : ""), disabled: why !== null });
  }
  driverSelect.innerHTML = optionsHtml("-- Choose a replacement driver --", items, "");
  driverSelect.disabled = false;
}

function renderReplacements() {
  let s = getState();

  // Contract drop-down (keeps the current choice if it still exists) 
  let contractSelect = document.getElementById("replaceContract");
  let keep = contractSelect.value;
  let contracts = agencyContracts(s);
  let items = [];
  let keepStillThere = false;
  for (const c of contracts) {
    items.push({ value: c.id, disabled: false,
                 text: userName(s, c.driverId) + " for " + userName(s, c.customerId) + " &middot; " + dateRange(c.startDate, c.endDate) });
    if (c.id === keep) { keepStillThere = true; }
  }
  contractSelect.innerHTML = optionsHtml(contracts.length > 0 ? "-- Choose an active contract --" : "No active agency contracts",
                                         items, keepStillThere ? keep : "");
  fillReplacementDrivers();

  // ----- Proposals table -----
  let rows = "";
 for (const rep of s.replacements) {
    let original = findRecord(s.contracts, rep.originalContractId);
    if (!original || agencyIdForContract(s, original) !== myAgencyId) { continue; }
    let action;
    if (rep.status === "pending") {
      action = "<button type='button' class='btn btn-small btn-secondary' onclick=\"cancelReplacementClick('" + rep.id + "', this)\">Cancel</button>";
    } else if (rep.newContractId) {
      action = "<span class='hint'>New contract " + rep.newContractId + "</span>";
    } else {
      action = "-";
    }

    rows += "<tr>" +
              "<td>" + userName(s, original.driverId) + " " + badgeHtml(original.status) + "</td>" +
              "<td>" + userName(s, rep.replacementDriverId) + "</td>" +
              "<td>" + escapeText(rep.reason) + "</td>" +
              "<td>" + (rep.driverAccepted ? "Accepted" : "Waiting") + "</td>" +
              "<td>" + (rep.customerApproved ? "Approved" : "Waiting") + "</td>" +
              "<td>" + badgeHtml(rep.status) + "</td>" +
              "<td>" + action + "</td>" +
            "</tr>";
  }
  if (rows === "") {
    rows = emptyRow(7, "No replacement proposals yet.");
  }
  document.getElementById("replaceBody").innerHTML = rows;
}

function submitReplacement() {
  let contractId = document.getElementById("replaceContract").value;
  let driverId = document.getElementById("replaceDriver").value;
  let reason = document.getElementById("replaceReason").value;

  // Validation
  let isValid = true;
  clearErrors(["replaceContract", "replaceDriver", "replaceReason"]);

  if (contractId === "") {
    showError("replaceContract", "Choose an active contract.");
    isValid = false;
  }
  if (driverId === "") {
    showError("replaceDriver", "Choose a replacement driver.");
    isValid = false;
  }
  if (isEmpty(reason)) {
    showError("replaceReason", "Enter a reason for the replacement.");
    isValid = false;
  }
  if (isValid === false) {
    return false;
  }

  // Save 
  runWithButton(document.getElementById("replaceButton"), function () {
    let saved = runRule(function (s) { return proposeReplacement(s, contractId, driverId, reason); },
                        "replaceMessage",
                        "Replacement proposed. The original contract stays active until the driver accepts AND the customer approves.");
    if (saved) {
      document.getElementById("replaceForm").reset();
      refreshAll();
    }
  });
  return false;
}

function cancelReplacementClick(replacementId, button) {
  if (!confirm("Cancel this replacement proposal? The original contract is unchanged.")) {
    return;
  }
  runWithButton(button, function () {
    let saved = runRule(function (s) { return cancelReplacement(s, replacementId); },
                        "replaceMessage", "Replacement proposal cancelled.");
    if (saved) { refreshAll(); }
  });
}


/* START: runs once when the page has loaded */
function startAgencyPage() {
  me = requireRole("agency_manager");      // wrong account -> message shown, stop here
  if (me === null) {
    return;
  }

  let agency = agencyOfManager(getState(), me.id);
  if (agency === null) {
    document.getElementById("main").innerHTML =
      "<div class='card'><h2 class='page-title'>No agency found</h2>" +
      "<p>This manager account is not linked to an agency in the demo data. Try Reset on the account selector.</p></div>";
    return;
  }
  myAgencyId = agency.id;

  warnAboutSharedData();      // merge helper: lists any record using non-agreed words
  refreshAll();
  showSection("dashboardSection");
}

startAgencyPage();