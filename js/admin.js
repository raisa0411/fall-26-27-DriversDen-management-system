/* Everything the Admin can do
   Feature A1   : System Dashboard & Financial Breakdown
   Feature A2   : Manage Users (create, edit, approve, delete)
   Feature A3   : Verification Review (drivers & agencies)
   Feature A4   : Complaints Resolution
   Feature A5   : Account & Review Moderation + Activity Log */

const sections = [
  "dashboardSection",
  "usersSection",
  "verificationSection",
  "complaintsSection",
  "moderationSection"
];

let state = getState();
let users = state.users;
let driverProfiles = state.driverProfiles;
let agencies = state.agencies;
let verificationSubmissions = state.verificationSubmissions;
let memberships = state.memberships;
let contracts = state.contracts;
let reviews = state.reviews;
let complaints = state.complaints;
let activityLog = state.activityLog;

let editUserIndex = -1;       // -1 means adding a new user; >= 0 means editing that index
let editVerifIndex = -1;      // index of the verification currently open in the review form
let editCompIndex = -1;       // index of the complaint currently open in the form
let editAccountIndex = -1;    // index of the user account being moderated
let editReviewIndex = -1;     // index of the review being moderated


// Appends an admin action entry to activityLog and saves state
function writeAdminLog(type, message) {
  activityLog.push({
    id: createId("log"),
    time: getToday(),
    user: "admin",
    type: type,
    message: message
  });
  saveState(state);
}

// Ensures unreviewed records default to pending on first load
function ensureInitialPendingStatuses() {
  for (let i = 0; i < users.length; i++) {
    if (users[i].role !== "admin" && users[i].reviewed !== true) {
      users[i].status = "pending";
    }
  }
  for (let i = 0; i < verificationSubmissions.length; i++) {
    if (verificationSubmissions[i].reviewed !== true &&
        verificationSubmissions[i].status !== "approved" &&
        verificationSubmissions[i].status !== "rejected") {
      verificationSubmissions[i].status = "pending";
    }
  }
  for (let i = 0; i < complaints.length; i++) {
    if (complaints[i].status === "open" ||
        (complaints[i].reviewed !== true &&
         complaints[i].status !== "in_review" &&
         complaints[i].status !== "resolved")) {
      complaints[i].status = "pending";
    }
  }
  for (let i = 0; i < reviews.length; i++) {
    if (reviews[i].moderated !== true) {
      reviews[i].visibility = "pending";
    }
  }
  saveState(state);
}


/* DASHBOARD */
function renderDashboard() {
  // Counts worked out with loops over the saved data
  let pendingVerif = 0;
  for (const sub of verificationSubmissions) {
    if (sub.status === "pending") {
      pendingVerif++;
    }
  }

  let customerCount = 0;
  let custRows = "";
  for (let i = 0; i < users.length; i++) {
    let u = users[i];
    if (u.role === "customer") {
      customerCount++;

      let tripCount = 0;
      let spent = 0;
      for (const con of contracts) {
        if (con.customerId === u.id) {
          tripCount++;
          spent += con.salary;
        }
      }

      custRows += "<tr>" +
                    "<td>" + customerCount + "</td>" +
                    "<td><strong>" + escapeText(u.name) + "</strong></td>" +
                    "<td>" + escapeText(u.email) + "</td>" +
                    "<td>" + u.id + "</td>" +
                    "<td>" + tripCount + "</td>" +
                    "<td>BDT " + spent + "</td>" +
                    "<td>" + badgeHtml(u.status) + "</td>" +
                  "</tr>";
    }
  }

  if (customerCount === 0) {
    custRows = emptyRow(7, "No customers found.");
  }

  // Contracts & earnings split (75% driver, 10% platform, 15% agency if affiliated)
  let activeContracts = 0;
  let servRows = "";
  for (let i = 0; i < contracts.length; i++) {
    let con = contracts[i];
    if (con.status === "active") {
      activeContracts++;
    }

    let custName = userName(state, con.customerId);
    let drvName = userName(state, con.driverId);

    let agencyName = "Independent";
    for (const m of memberships) {
      if (m.driverId === con.driverId && m.status === "active") {
        let ag = findRecord(agencies, m.agencyId);
        if (ag !== null) {
          agencyName = escapeText(ag.name);
        }
      }
    }

    let driverEarn = Math.round(con.salary * 0.75);
    let platformComm = Math.round(con.salary * 0.10);
    let agencyEarn = 0;
    if (agencyName !== "Independent") {
      agencyEarn = Math.round(con.salary * 0.15);
    }

    servRows += "<tr>" +
                  "<td>" + con.id + "</td>" +
                  "<td>" + custName + "</td>" +
                  "<td><strong>" + drvName + "</strong></td>" +
                  "<td>" + agencyName + "</td>" +
                  "<td>" + con.startDate + "</td>" +
                  "<td>" + con.endDate + "</td>" +
                  "<td>BDT " + con.salary + "</td>" +
                  "<td>BDT " + driverEarn + "</td>" +
                  "<td>BDT " + platformComm + "</td>" +
                  "<td>BDT " + agencyEarn + "</td>" +
                  "<td>" + badgeHtml(con.status) + "</td>" +
                "</tr>";
  }

  if (contracts.length === 0) {
    servRows = emptyRow(11, "No contracts found.");
  }

  let openComplaints = 0;
  for (const c of complaints) {
    if (c.status !== "resolved") {
      openComplaints++;
    }
  }

  // Driver earnings table (from driverProfiles, plus fallback for unprofiled drivers)
  let drvRows = "";
  let drvCount = 0;
  for (let i = 0; i < driverProfiles.length; i++) {
    let prof = driverProfiles[i];
    let drvName = userName(state, prof.driverId);

    drvCount++;
    let comm = Math.round(prof.expectedSalary * 0.10);
    drvRows += "<tr>" +
                 "<td>" + drvCount + "</td>" +
                 "<td><strong>" + drvName + "</strong></td>" +
                 "<td>" + prof.experienceYears + " yrs</td>" +
                 "<td>BDT " + prof.expectedSalary + "</td>" +
                 "<td>BDT " + comm + "</td>" +
               "</tr>";
  }

  for (let i = 0; i < users.length; i++) {
    let u = users[i];
    if (u.role === "driver") {
      let prof = getDriverProfile(state, u.id);
      if (prof === null) {
        drvCount++;
        let defaultSalary = 20000;
        let comm = Math.round(defaultSalary * 0.10);
        drvRows += "<tr>" +
                     "<td>" + drvCount + "</td>" +
                     "<td><strong>" + escapeText(u.name) + "</strong></td>" +
                     "<td>1 yrs</td>" +
                     "<td>BDT " + defaultSalary + "</td>" +
                     "<td>BDT " + comm + "</td>" +
                   "</tr>";
      }
    }
  }

  if (drvCount === 0) {
    drvRows = emptyRow(5, "No drivers found.");
  }

  // Agency overview table
  let agRows = "";
  let agCount = 0;
  for (let i = 0; i < agencies.length; i++) {
    let ag = agencies[i];
    let mgrName = userName(state, ag.managerId);
    let activeDrivers = 0;
    for (const m of memberships) {
      if (m.agencyId === ag.id && m.status === "active") {
        activeDrivers++;
      }
    }
    agCount++;
    agRows += "<tr>" +
                "<td>" + agCount + "</td>" +
                "<td><strong>" + escapeText(ag.name) + "</strong></td>" +
                "<td>" + mgrName + "</td>" +
                "<td>" + activeDrivers + "</td>" +
                "<td>" + escapeText(ag.area) + "</td>" +
              "</tr>";
  }

  if (agCount === 0) {
    agRows = emptyRow(5, "No agencies found.");
  }

  document.getElementById("statPendingVerif").innerHTML = pendingVerif;
  document.getElementById("statCustomers").innerHTML = customerCount;
  document.getElementById("statDrivers").innerHTML = drvCount;
  document.getElementById("statAgencies").innerHTML = agCount;
  document.getElementById("statRunningServices").innerHTML = activeContracts;
  document.getElementById("statOpenComplaints").innerHTML = openComplaints;
  document.getElementById("reportTime").innerHTML = "Generated on " + getToday();

  document.getElementById("dashCustomersBody").innerHTML = custRows;
  document.getElementById("dashServicesBody").innerHTML = servRows;
  document.getElementById("dashDriverEarningsBody").innerHTML = drvRows;
  document.getElementById("dashAgencyEarningsBody").innerHTML = agRows;
}


/* MANAGE USERS */

// Converts display label (e.g. "Agency Manager") to internal role code
function normalizeRole(roleText) {
  if (roleText === "Agency Manager") {
    return "agency_manager";
  }
  return roleText.toLowerCase();
}

// Returns explicit username, or falls back to the prefix before '@' in email
function getHandle(user) {
  if (user.username) {
    return user.username;
  }
  let atPos = user.email.indexOf("@");
  if (atPos !== -1) {
    return user.email.slice(0, atPos);
  }
  return user.email;
}

function renderUsers() {
  let keyword = document.getElementById("userSearch").value;
  let roleFilter = document.getElementById("userRoleFilter").value;
  let statusFilter = document.getElementById("userStatusFilter").value;

  let rows = "";
  let shown = 0;

  for (let i = 0; i < users.length; i++) {
    let user = users[i];
    let handle = getHandle(user);

    let matchesKeyword = containsText(user.name, keyword) ||
                         containsText(handle, keyword) ||
                         containsText(user.email, keyword) ||
                         containsText(user.id, keyword);
    let matchesRole = (roleFilter === "All" || user.role === normalizeRole(roleFilter));

    let filterStatusCode = statusFilter.toLowerCase();
    if (filterStatusCode === "blocked") {
      filterStatusCode = "suspended";
    }
    let matchesStatus = (statusFilter === "All" || user.status === filterStatusCode);

    if (matchesKeyword && matchesRole && matchesStatus) {
      let approveButton = "";
      if (user.status === "pending") {
        approveButton = "<button type='button' class='btn btn-small btn-success' onclick='approveUser(" + i + ")'>Approve</button> ";
      }

      let badgeClass = user.role;
      if (user.role === "agency_manager") {
        badgeClass = "manager";
      }

      rows += "<tr>" +
                "<td>" + user.id + "</td>" +
                "<td><strong>" + escapeText(user.name) + "</strong><br><span class='hint'>" + escapeText(user.email) + "</span></td>" +
                "<td>" + escapeText(handle) + "</td>" +
                "<td><span class='badge " + badgeClass + "'>" + statusLabel(user.role) + "</span></td>" +
                "<td>" + badgeHtml(user.status) + "</td>" +
                "<td>" +
                  approveButton +
                  "<button type='button' class='btn btn-small' onclick='editUser(" + i + ")'>Edit</button> " +
                  "<button type='button' class='btn btn-small btn-danger' onclick='deleteUser(" + i + ")'>Delete</button>" +
                "</td>" +
              "</tr>";
      shown++;
    }
  }

  if (shown === 0) {
    rows = emptyRow(6, "No users match your search.");
  }

  document.getElementById("userTableBody").innerHTML = rows;
  document.getElementById("userCount").innerHTML = "Showing " + shown + " of " + users.length + " users";
}

function saveUser() {
  let name = document.getElementById("userName").value.trim();
  let username = document.getElementById("userUsername").value.trim();
  let email = document.getElementById("userEmail").value.trim();
  let password = document.getElementById("userPassword").value;
  let roleInput = document.getElementById("userRole").value;

  let statusInput = "Pending";
  let statusRadios = document.getElementsByName("userStatus");
  for (let i = 0; i < statusRadios.length; i++) {
    if (statusRadios[i].checked) {
      statusInput = statusRadios[i].value;
      break;
    }
  }

  let formMode = "Update";
  let logStatus = statusInput;
  if (editUserIndex === -1) {
    formMode = "Create";
    logStatus = "Pending";
  }

  console.log("Input [Manage Users Form]:", {
    mode: formMode,
    name: name,
    username: username,
    email: email,
    password: password,
    role: roleInput,
    status: logStatus
  });

  // Validation
  let isValid = true;
  clearErrors(["userName", "userUsername", "userEmail", "userPassword", "userRole"]);

  if (name.length < 3) {
    showError("userName", "Name must be at least 3 characters.");
    console.error("Validation Error [userName]: Name must be at least 3 characters.");
    isValid = false;
  }

  if (username.length < 4) {
    showError("userUsername", "Username must be at least 4 characters.");
    console.error("Validation Error [userUsername]: Username must be at least 4 characters.");
    isValid = false;
  } else if (usernameUsedByOther(username)) {
    showError("userUsername", "Another user already has this username.");
    console.error("Validation Error [userUsername]: Another user already has this username.");
    isValid = false;
  }

  let atPos = email.indexOf("@");
  let dotPos = email.indexOf(".");
  if (atPos < 1 || dotPos === -1 || email.indexOf(".", atPos) === -1) {
    showError("userEmail", "Please enter a valid email address.");
    console.error("Validation Error [userEmail]: Please enter a valid email address.");
    isValid = false;
  } else if (emailUsedByOther(email)) {
    showError("userEmail", "Another user already has this email.");
    console.error("Validation Error [userEmail]: Another user already has this email.");
    isValid = false;
  }

  if (password.length < 8) {
    showError("userPassword", "Password must be at least 8 characters.");
    console.error("Validation Error [userPassword]: Password must be at least 8 characters.");
    isValid = false;
  }

  if (roleInput === "") {
    showError("userRole", "Please choose a role.");
    console.error("Validation Error [userRole]: Please choose a role.");
    isValid = false;
  }

  if (isValid === false) {
    return false;     // the form is not sent; typed values stay
  }

  // Save
  let roleCode = normalizeRole(roleInput);
  let statusCode = "pending";
  if (editUserIndex !== -1) {
    if (statusInput === "Active") {
      statusCode = "active";
    } else if (statusInput === "Blocked") {
      statusCode = "suspended";
    }
  }

  if (editUserIndex === -1) {
    let newId = createId("u");
    let newUser = {
      id: newId,
      name: name,
      username: username,
      email: email,
      password: password,
      role: roleCode,
      status: "pending",
      reviewed: false
    };
    users.push(newUser);

    // Create matching role profile record if driver or agency manager
    if (roleCode === "driver") {
      driverProfiles.push({
        driverId: newId,
        phone: "01700000000",
        area: "Dhaka",
        experienceYears: 1,
        expectedSalary: 20000,
        vehicleCategories: ["car"],
        verificationStatus: "pending",
        summary: "",
        documentName: "",
        services: []
      });
    } else if (roleCode === "agency_manager") {
      agencies.push({
        id: createId("ag"),
        managerId: newId,
        name: name + " Transport Agency",
        area: "Dhaka",
        verificationStatus: "pending"
      });
    }

    writeAdminLog("User", "Created " + roleCode + " account for " + name + " (pending)");
    showMessage("userMessage", "User <strong>" + escapeText(name) + "</strong> was added with id " + newUser.id + " as <strong>pending</strong>.", "success");
    console.log("Output [User Created]:", newUser);
  } else {
    let user = users[editUserIndex];
    if (user.status !== statusCode) {
      writeAdminLog("Security", statusCode + " account of " + name);
    }
    user.name = name;
    user.username = username;
    user.email = email;
    user.password = password;
    user.role = roleCode;
    user.status = statusCode;
    user.reviewed = (statusCode !== "pending");

    if (roleCode === "driver" && getDriverProfile(state, user.id) === null) {
      driverProfiles.push({
        driverId: user.id,
        phone: "01700000000",
        area: "Dhaka",
        experienceYears: 1,
        expectedSalary: 20000,
        vehicleCategories: ["car"],
        verificationStatus: "pending",
        summary: "",
        documentName: "",
        services: []
      });
    } else if (roleCode === "agency_manager") {
      let hasAgency = false;
      for (let i = 0; i < agencies.length; i++) {
        if (agencies[i].managerId === user.id) {
          hasAgency = true;
          break;
        }
      }
      if (hasAgency === false) {
        agencies.push({
          id: createId("ag"),
          managerId: user.id,
          name: name + " Transport Agency",
          area: "Dhaka",
          verificationStatus: "pending"
        });
      }
    }

    writeAdminLog("User", "Updated account " + user.id + " (" + name + ")");
    showMessage("userMessage", "User <strong>" + escapeText(name) + "</strong> was updated.", "success");
    console.log("Output [User Updated]:", user);
  }

  saveState(state);
  resetUserForm();
  renderUsers();
  renderDashboard();
  renderModAccounts();
  return false;       // always stay on this page
}

function usernameUsedByOther(username) {
  for (let i = 0; i < users.length; i++) {
    let existingUsername = getHandle(users[i]);
    if (i !== editUserIndex && existingUsername.toLowerCase() === username.toLowerCase()) {
      return true;
    }
  }
  return false;
}

function emailUsedByOther(email) {
  for (let i = 0; i < users.length; i++) {
    if (i !== editUserIndex && users[i].email.toLowerCase() === email.toLowerCase()) {
      return true;
    }
  }
  return false;
}

// Populates the form with the selected user's data for editing
function editUser(index) {
  let user = users[index];
  editUserIndex = index;

  console.log("Input [Edit User Selected]:", user);

  document.getElementById("userName").value = user.name;
  document.getElementById("userUsername").value = getHandle(user);
  document.getElementById("userEmail").value = user.email;
  document.getElementById("userPassword").value = user.password;
  document.getElementById("userRole").value = statusLabel(user.role);

  let targetStatus = "Pending";
  if (user.status === "active") {
    targetStatus = "Active";
  } else if (user.status === "suspended") {
    targetStatus = "Blocked";
  }

  let statusRadios = document.getElementsByName("userStatus");
  for (let i = 0; i < statusRadios.length; i++) {
    statusRadios[i].checked = (statusRadios[i].value === targetStatus);
  }

  document.getElementById("userFormTitle").innerHTML = "Edit User " + user.id;
  document.getElementById("userSaveButton").value = "Update User";
  hideMessage("userMessage");
}

// Returns a new array excluding the element at removeIdx
function removeArrayIndex(list, removeIdx) {
  let updated = [];
  for (let i = 0; i < list.length; i++) {
    if (i !== removeIdx) {
      updated.push(list[i]);
    }
  }
  return updated;
}

// Deletes a user and cascades removal across all related records
function deleteUser(index) {
  let user = users[index];

  console.log("Input [Delete User]:", { id: user.id, name: user.name, role: user.role });

  if (user.id === "u-admin") {
    showMessage("userMessage", "You cannot delete your own admin account.", "error");
    console.error("Validation Error [Delete User]: Cannot delete admin account u-admin.");
    return;
  }

  let deletedId = user.id;
  users = removeArrayIndex(users, index);
  state.users = users;

  for (let i = driverProfiles.length - 1; i >= 0; i--) {
    if (driverProfiles[i].driverId === deletedId) {
      driverProfiles = removeArrayIndex(driverProfiles, i);
    }
  }
  state.driverProfiles = driverProfiles;

  for (let i = memberships.length - 1; i >= 0; i--) {
    if (memberships[i].driverId === deletedId) {
      memberships = removeArrayIndex(memberships, i);
    }
  }
  state.memberships = memberships;

  for (let i = agencies.length - 1; i >= 0; i--) {
    if (agencies[i].managerId === deletedId) {
      agencies = removeArrayIndex(agencies, i);
    }
  }
  state.agencies = agencies;

  for (let i = contracts.length - 1; i >= 0; i--) {
    if (contracts[i].customerId === deletedId || contracts[i].driverId === deletedId) {
      contracts = removeArrayIndex(contracts, i);
    }
  }
  state.contracts = contracts;

  for (let i = verificationSubmissions.length - 1; i >= 0; i--) {
    if (verificationSubmissions[i].subjectId === deletedId) {
      verificationSubmissions = removeArrayIndex(verificationSubmissions, i);
    }
  }
  state.verificationSubmissions = verificationSubmissions;

  for (let i = reviews.length - 1; i >= 0; i--) {
    if (reviews[i].customerId === deletedId || reviews[i].driverId === deletedId) {
      reviews = removeArrayIndex(reviews, i);
    }
  }
  state.reviews = reviews;

  for (let i = complaints.length - 1; i >= 0; i--) {
    if (complaints[i].reporterId === deletedId) {
      complaints = removeArrayIndex(complaints, i);
    }
  }
  state.complaints = complaints;

  writeAdminLog("User", "Deleted account " + deletedId + " (" + user.name + ")");
  showMessage("userMessage", "User <strong>" + escapeText(user.name) + "</strong> was deleted.", "info");
  console.log("Output [User Deleted]: Removed " + deletedId + " and all related records.");

  resetUserForm();
  renderUsers();
  renderDashboard();
  renderVerifications();
  renderComplaints();
  renderModAccounts();
  renderModReviews();
}

function approveUser(index) {
  let user = users[index];
  console.log("Input [Approve User]:", { id: user.id, name: user.name });
  user.status = "active";
  user.reviewed = true;
  writeAdminLog("Security", "Approved " + user.role + " account of " + user.name);
  showMessage("userMessage", "<strong>" + escapeText(user.name) + "</strong> was approved and can now log in.", "success");
  console.log("Output [User Approved]:", user);
  renderUsers();
  renderDashboard();
  renderModAccounts();
}

function resetUserForm() {
  editUserIndex = -1;
  document.getElementById("userForm").reset();
  let statusPendingRadio = document.getElementById("statusPending");
  if (statusPendingRadio !== null) {
    statusPendingRadio.checked = true;
  }
  clearErrors(["userName", "userUsername", "userEmail", "userPassword", "userRole"]);
  document.getElementById("userFormTitle").innerHTML = "Add New User";
  document.getElementById("userSaveButton").value = "Add User";
}


/* VERIFICATION REVIEW */

// Resolves driver or agency metadata for a verification submission
function getSubmissionDetails(sub) {
  if (sub.subjectType === "driver") {
    let drvUser = findUserRecord(state, sub.subjectId);
    let drvName = sub.subjectId;
    let drvEmail = "";
    if (drvUser !== null) {
      drvName = drvUser.name;
      drvEmail = drvUser.email;
    }
    let prof = getDriverProfile(state, sub.subjectId);
    return { name: drvName, type: "Driver", email: drvEmail, profile: prof };
  } else {
    let ag = findRecord(agencies, sub.subjectId);
    let agName = sub.subjectId;
    let agArea = "";
    let mgrName = "";
    let mgrEmail = "";
    if (ag !== null) {
      agName = ag.name;
      agArea = ag.area;
      let mgrUser = findUserRecord(state, ag.managerId);
      if (mgrUser !== null) {
        mgrName = mgrUser.name;
        mgrEmail = mgrUser.email;
      }
    }
    return { name: agName, type: "Agency Manager", email: mgrEmail, managerName: mgrName, area: agArea };
  }
}

function renderVerifications() {
  let typeFilter = document.getElementById("verifTypeFilter").value;
  let statusFilter = document.getElementById("verifStatusFilter").value;
  let keyword = document.getElementById("verifSearch").value;

  let rows = "";
  let shown = 0;

  for (let i = 0; i < verificationSubmissions.length; i++) {
    let sub = verificationSubmissions[i];
    let info = getSubmissionDetails(sub);

    let matchesType = (typeFilter === "All" || info.type === typeFilter);
    let matchesStatus = (statusFilter === "All" || sub.status === statusFilter.toLowerCase());
    let matchesKeyword = containsText(info.name, keyword) || containsText(info.email, keyword) || containsText(sub.id, keyword);

    if (matchesType && matchesStatus && matchesKeyword) {
      // Pick the matching sample image based on subject type or filename
      let previewFile = "assets/admin-images/driver_license.jpg";
      if (sub.subjectType === "agency") {
        previewFile = "assets/admin-images/trade_license.jpg";
      }
      if (sub.filename.indexOf("nid") !== -1) {
        previewFile = "assets/admin-images/nid.jpg";
      }

      let submittedDate = sub.reviewedAt || getToday();
      let reasonHtml = "";
      if (sub.reason) {
        reasonHtml = "<br><span class='hint'>Reason: " + escapeText(sub.reason) + "</span>";
      }

      shown++;
      rows += "<tr>" +
                "<td>" + shown + "</td>" +
                "<td><strong>" + escapeText(info.name) + "</strong></td>" +
                "<td>" + info.type + "</td>" +
                "<td>" + escapeText(info.email) + "</td>" +
                "<td><a href='" + previewFile + "' target='_blank'>" + escapeText(sub.filename) + "</a></td>" +
                "<td>" + submittedDate + "</td>" +
                "<td>" + badgeHtml(sub.status) + reasonHtml + "</td>" +
                "<td>" +
                  "<input type='radio' name='verif_" + i + "' value='approved' onchange='openVerifForm(" + i + ", \"Approved\")'> Accept " +
                  "<input type='radio' name='verif_" + i + "' value='rejected' onchange='openVerifForm(" + i + ", \"Rejected\")'> Reject" +
                "</td>" +
              "</tr>";
    }
  }

  if (shown === 0) {
    rows = emptyRow(8, "No verification submissions match your filter.");
  }

  document.getElementById("verifTableBody").innerHTML = rows;
  document.getElementById("verifCount").innerHTML = "Showing " + shown + " of " + verificationSubmissions.length + " submissions";
}

// Opens the side review panel with read-only applicant details
function openVerifForm(index, decisionLabel) {
  let sub = verificationSubmissions[index];
  let info = getSubmissionDetails(sub);
  editVerifIndex = index;

  document.getElementById("verifDecisionSelect").value = decisionLabel;
  document.getElementById("verifRejectionReason").value = sub.reason;
  clearErrors(["verifRejectionReason"]);

  let fields = "";
  if (sub.subjectType === "driver") {
    let p = info.profile;
    let phone = "";
    let area = "";
    let expYears = 0;
    let salary = 0;
    if (p !== null) {
      phone = p.phone;
      area = p.area;
      expYears = p.experienceYears;
      salary = p.expectedSalary;
    }

    document.getElementById("verifLegend").innerHTML = "Driver Information (" + sub.id + ")";
    fields =
      "<tr><td>Full Name:</td><td><input type='text' value='" + escapeText(info.name) + "' readonly></td></tr>" +
      "<tr><td>Email:</td><td><input type='email' value='" + escapeText(info.email) + "' readonly></td></tr>" +
      "<tr><td>Phone Number:</td><td><input type='tel' value='" + escapeText(phone) + "' readonly></td></tr>" +
      "<tr><td>Area:</td><td><input type='text' value='" + escapeText(area) + "' readonly></td></tr>" +
      "<tr><td>Experience (Years):</td><td><input type='number' value='" + expYears + "' readonly></td></tr>" +
      "<tr><td>Expected Salary:</td><td><input type='text' value='BDT " + salary + "' readonly></td></tr>" +
      "<tr><td>Document File:</td><td><input type='text' value='" + escapeText(sub.filename) + "' readonly> <a href='assets/admin-images/driver_license.jpg' target='_blank'>View File</a></td></tr>";
  } else {
    document.getElementById("verifLegend").innerHTML = "Agency Information (" + sub.id + ")";
    fields =
      "<tr><td>Agency Name:</td><td><input type='text' value='" + escapeText(info.name) + "' readonly></td></tr>" +
      "<tr><td>Manager Name:</td><td><input type='text' value='" + escapeText(info.managerName) + "' readonly></td></tr>" +
      "<tr><td>Email:</td><td><input type='email' value='" + escapeText(info.email) + "' readonly></td></tr>" +
      "<tr><td>Location:</td><td><input type='text' value='" + escapeText(info.area) + "' readonly></td></tr>" +
      "<tr><td>Trade License:</td><td><a href='assets/admin-images/trade_license.jpg' target='_blank'>View File</a></td></tr>" +
      "<tr><td>Business Certificate:</td><td><a href='assets/admin-images/business_certificate.jpg' target='_blank'>View File</a></td></tr>";
  }

  document.getElementById("verifFormFields").innerHTML = fields;
  document.getElementById("verifFormCol").style.display = "block";
}

function submitVerification() {
  if (editVerifIndex === -1) {
    return false;
  }

  let decision = document.getElementById("verifDecisionSelect").value;
  let reason = document.getElementById("verifRejectionReason").value.trim();
  clearErrors(["verifRejectionReason"]);

  console.log("Input [Verification Form]:", { decision: decision, reason: reason });

  // Validation
  if (decision === "Rejected" && reason.length < 4) {
    showError("verifRejectionReason", "Please enter a rejection reason (at least 4 characters).");
    console.error("Validation Error [verifRejectionReason]: Please enter a rejection reason (at least 4 characters).");
    return false;
  }

  // Save & sync verificationStatus onto the driver profile or agency record
  let sub = verificationSubmissions[editVerifIndex];
  let newStatus = "rejected";
  if (decision === "Approved") {
    newStatus = "approved";
  }
  sub.status = newStatus;
  sub.reason = "";
  if (newStatus === "rejected") {
    sub.reason = reason;
  }
  sub.reviewedAt = getToday();
  sub.reviewed = true;

  if (sub.subjectType === "driver") {
    let prof = getDriverProfile(state, sub.subjectId);
    if (prof !== null) {
      prof.verificationStatus = newStatus;
    }
  } else {
    let ag = findRecord(agencies, sub.subjectId);
    if (ag !== null) {
      ag.verificationStatus = newStatus;
    }
  }

  let info = getSubmissionDetails(sub);
  writeAdminLog("Verify", newStatus + " verification " + sub.id + " for " + info.name);
  showMessage("verifMessage", "Verification <strong>" + sub.id + "</strong> marked as <strong>" + newStatus + "</strong>.", "success");
  console.log("Output [Verification Updated]:", sub);

  closeVerifForm();
  renderVerifications();
  renderDashboard();
  return false;
}

function closeVerifForm() {
  editVerifIndex = -1;
  document.getElementById("verifFormCol").style.display = "none";
}


/* COMPLAINTS RESOLUTION */
function renderComplaints() {
  let statusFilter = document.getElementById("compStatusFilter").value;
  let keyword = document.getElementById("compSearch").value;

  let rows = "";
  let shown = 0;

  for (let i = 0; i < complaints.length; i++) {
    let c = complaints[i];
    let reporterName = userName(state, c.reporterId);

    let filterCode = statusFilter.toLowerCase();
    if (filterCode === "in progress") {
      filterCode = "in_review";
    }

    let matchesStatus = (filterCode === "all" || c.status === filterCode);
    let matchesKeyword = containsText(reporterName, keyword) || containsText(c.id, keyword) || containsText(c.contractId, keyword);

    if (matchesStatus && matchesKeyword) {
      let resolutionHtml = "";
      if (c.resolution) {
        resolutionHtml = "<br><span class='hint'>Resolution: " + escapeText(c.resolution) + "</span>";
      }

      shown++;
      rows += "<tr>" +
                "<td>" + shown + "</td>" +
                "<td><strong>" + reporterName + "</strong></td>" +
                "<td>Contract " + c.contractId + "</td>" +
                "<td>" + escapeText(c.description) + resolutionHtml + "</td>" +
                "<td>" + getToday() + "</td>" +
                "<td>" + badgeHtml(c.status) + "</td>" +
                "<td>" +
                  "<input type='radio' name='comp_" + i + "' value='in_review' onchange='openCompForm(" + i + ", \"In Progress\")'> In Progress " +
                  "<input type='radio' name='comp_" + i + "' value='resolved' onchange='openCompForm(" + i + ", \"Resolved\")'> Resolved" +
                "</td>" +
              "</tr>";
    }
  }

  if (shown === 0) {
    rows = emptyRow(7, "No complaints match your filter.");
  }

  document.getElementById("compTableBody").innerHTML = rows;
  document.getElementById("compCount").innerHTML = "Showing " + shown + " of " + complaints.length + " complaints";
}

function openCompForm(index, targetLabel) {
  let c = complaints[index];
  editCompIndex = index;

  let reporter = findUserRecord(state, c.reporterId);
  let reporterName = c.reporterId;
  let reporterEmail = "";
  if (reporter !== null) {
    reporterName = reporter.name;
    reporterEmail = reporter.email;
  }

  document.getElementById("compFormTitle").innerHTML = "Complaint " + c.id;
  document.getElementById("compUserName").value = reporterName;
  document.getElementById("compUserEmail").value = reporterEmail;
  document.getElementById("compSubject").value = "Contract " + c.contractId;
  document.getElementById("compCategory").value = "Contract Dispute";
  document.getElementById("compDescription").value = c.description;
  document.getElementById("compSubmittedOn").value = getToday();
  document.getElementById("compStatusSelect").value = targetLabel;
  document.getElementById("compResponse").value = c.resolution;
  clearErrors(["compResponse"]);

  document.getElementById("compFormCol").style.display = "block";
}

function submitComplaint() {
  if (editCompIndex === -1) {
    return false;
  }

  let statusLabelInput = document.getElementById("compStatusSelect").value;
  let resolution = document.getElementById("compResponse").value.trim();
  clearErrors(["compResponse"]);

  console.log("Input [Complaint Form]:", { status: statusLabelInput, response: resolution });

  // Validation (resolution note required when closing as Resolved)
  if (statusLabelInput === "Resolved" && resolution.length < 4) {
    showError("compResponse", "Please enter a resolution note (at least 4 characters).");
    console.error("Validation Error [compResponse]: Please enter a resolution note (at least 4 characters).");
    return false;
  }

  // Save
  let c = complaints[editCompIndex];
  if (statusLabelInput === "Resolved") {
    c.status = "resolved";
  } else {
    c.status = "in_review";
  }
  c.resolution = resolution;
  c.reviewed = true;

  writeAdminLog("Complaint", "Updated complaint " + c.id + " to " + c.status);
  showMessage("compMessage", "Complaint <strong>" + c.id + "</strong> updated to <strong>" + c.status + "</strong>.", "success");
  console.log("Output [Complaint Updated]:", c);

  closeCompForm();
  renderComplaints();
  renderDashboard();
  return false;
}

function closeCompForm() {
  editCompIndex = -1;
  document.getElementById("compFormCol").style.display = "none";
}


/* MODERATION & ACTIVITY LOG */
function renderModAccounts() {
  let rows = "";
  let count = 0;

  for (let i = 0; i < users.length; i++) {
    let u = users[i];
    if (u.role !== "admin") {
      count++;
      rows += "<tr>" +
                "<td>" + count + "</td>" +
                "<td><strong>" + escapeText(u.name) + "</strong></td>" +
                "<td>" + escapeText(u.email) + "</td>" +
                "<td>" + statusLabel(u.role) + "</td>" +
                "<td>" + badgeHtml(u.status) + "</td>" +
                "<td>" +
                  "<input type='radio' name='acc_" + i + "' value='suspended' onchange='openAccountForm(" + i + ", \"Blocked\")'> Suspended " +
                  "<input type='radio' name='acc_" + i + "' value='active' onchange='openAccountForm(" + i + ", \"Active\")'> Restore" +
                "</td>" +
              "</tr>";
    }
  }

  if (count === 0) {
    rows = emptyRow(6, "No user accounts found.");
  }

  document.getElementById("modAccountBody").innerHTML = rows;
}

function openAccountForm(index, actionValue) {
  let u = users[index];
  if (u.role === "admin") {
    return;
  }

  editAccountIndex = index;
  document.getElementById("modAccName").value = u.name;
  document.getElementById("modAccEmail").value = u.email;
  document.getElementById("modAccRole").value = statusLabel(u.role);
  document.getElementById("modAccAction").value = actionValue;
  document.getElementById("accountReason").value = "";
  clearErrors(["accountReason"]);

  document.getElementById("accountFormCol").style.display = "block";
}

function submitAccountMod() {
  if (editAccountIndex === -1) {
    return false;
  }

  let actionVal = document.getElementById("modAccAction").value;
  let reason = document.getElementById("accountReason").value.trim();
  clearErrors(["accountReason"]);

  console.log("Input [Account Moderation Form]:", { action: actionVal, reason: reason });

  // Validation
  if (reason.length < 4) {
    showError("accountReason", "Please enter a reason (at least 4 characters).");
    console.error("Validation Error [accountReason]: Please enter a reason (at least 4 characters).");
    return false;
  }

  // Save
  let u = users[editAccountIndex];
  if (actionVal === "Blocked") {
    u.status = "suspended";
  } else {
    u.status = "active";
  }
  u.reviewed = true;

  writeAdminLog("Security", u.status + " account " + u.id + " (" + u.name + "): " + reason);
  showMessage("modMessage", "Account <strong>" + escapeText(u.name) + "</strong> is now <strong>" + u.status + "</strong>.", "success");
  console.log("Output [Account Moderation Updated]:", u);

  closeAccountForm();
  renderModAccounts();
  renderUsers();
  renderDashboard();
  renderActionHistory();
  return false;
}

function closeAccountForm() {
  editAccountIndex = -1;
  document.getElementById("accountFormCol").style.display = "none";
}

function renderModReviews() {
  let rows = "";

  for (let i = 0; i < reviews.length; i++) {
    let rev = reviews[i];
    let custName = userName(state, rev.customerId);

    rows += "<tr>" +
              "<td>" + (i + 1) + "</td>" +
              "<td><strong>" + custName + "</strong></td>" +
              "<td>" + escapeText(rev.comment) + "</td>" +
              "<td>" + rev.rating + " Stars</td>" +
              "<td>" + badgeHtml(rev.visibility) + "</td>" +
              "<td>" +
                "<input type='radio' name='rev_" + i + "' value='Hidden' onchange='openReviewForm(" + i + ", \"Hidden\")'> Hide " +
                "<input type='radio' name='rev_" + i + "' value='Visible' onchange='openReviewForm(" + i + ", \"Visible\")'> Restore" +
              "</td>" +
            "</tr>";
  }

  if (reviews.length === 0) {
    rows = emptyRow(6, "No reviews found.");
  }

  document.getElementById("modReviewBody").innerHTML = rows;
}

function openReviewForm(index, actionValue) {
  let rev = reviews[index];
  editReviewIndex = index;

  let custUser = findUserRecord(state, rev.customerId);
  let custName = rev.customerId;
  if (custUser !== null) {
    custName = custUser.name;
  }

  document.getElementById("modRevName").value = custName;
  document.getElementById("modRevRating").value = rev.rating + " Stars";
  document.getElementById("modRevText").value = rev.comment;
  document.getElementById("modRevDate").value = rev.contractId;
  document.getElementById("modRevAction").value = actionValue;
  document.getElementById("reviewReason").value = "";
  clearErrors(["reviewReason"]);

  document.getElementById("reviewFormCol").style.display = "block";
}

function submitReviewMod() {
  if (editReviewIndex === -1) {
    return false;
  }

  let actionVal = document.getElementById("modRevAction").value;
  let reason = document.getElementById("reviewReason").value.trim();
  clearErrors(["reviewReason"]);

  console.log("Input [Review Moderation Form]:", { action: actionVal, reason: reason });

  // Validation
  if (reason.length < 4) {
    showError("reviewReason", "Please enter a reason (at least 4 characters).");
    console.error("Validation Error [reviewReason]: Please enter a reason (at least 4 characters).");
    return false;
  }

  // Save
  let rev = reviews[editReviewIndex];
  if (actionVal === "Hidden") {
    rev.visibility = "hidden";
  } else {
    rev.visibility = "public";
  }
  rev.moderated = true;

  writeAdminLog("Security", "Set review " + rev.id + " visibility to " + rev.visibility + ": " + reason);
  showMessage("modMessage", "Review <strong>" + rev.id + "</strong> is now <strong>" + rev.visibility + "</strong>.", "success");
  console.log("Output [Review Moderation Updated]:", rev);

  closeReviewForm();
  renderModReviews();
  renderActionHistory();
  return false;
}

function closeReviewForm() {
  editReviewIndex = -1;
  document.getElementById("reviewFormCol").style.display = "none";
}

// Renders the audit trail in reverse chronological order (newest first)
function renderActionHistory() {
  let rows = "";
  for (let i = activityLog.length - 1; i >= 0; i--) {
    let entry = activityLog[i];
    let entryTime = entry.time || entry.createdAt || getToday();
    let entryType = entry.type || entry.entityType || "Admin";
    let entryMsg = entry.message || (entry.action + " " + entry.entityId);
    let entryUser = entry.user || entry.actorId || "admin";

    rows += "<tr>" +
              "<td>" + entryTime + "</td>" +
              "<td><span class='badge grey'>" + escapeText(entryType) + "</span></td>" +
              "<td>" + escapeText(entryMsg) + "</td>" +
              "<td>" + escapeText(entryUser) + "</td>" +
            "</tr>";
  }
  if (rows === "") {
    rows = emptyRow(4, "No activity to show.");
  }
  document.getElementById("actionHistoryBody").innerHTML = rows;
}


/* START: runs once when the page has loaded */
ensureInitialPendingStatuses();
renderDashboard();
renderUsers();
renderVerifications();
renderComplaints();
renderModAccounts();
renderModReviews();
renderActionHistory();
showSection("dashboardSection");

document.getElementById("nav-dashboardSection").addEventListener("click", renderDashboard);
document.getElementById("nav-usersSection").addEventListener("click", renderUsers);
document.getElementById("nav-moderationSection").addEventListener("click", function () {
  renderModAccounts();
  renderModReviews();
  renderActionHistory();
});