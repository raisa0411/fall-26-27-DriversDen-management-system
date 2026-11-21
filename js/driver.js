const sections = ["dashboardSection", "profileSection", "offersSection", "availabilitySection"];


const currentDriverId = "u-drv1";

let users = seedData.users;
let driverProfiles = seedData.driverProfiles;
let verificationSubmissions = seedData.verificationSubmissions;
let hiringRequests = seedData.hiringRequests;
let agencies = seedData.agencies;
let memberships = seedData.memberships;
let bulkRequests = seedData.bulkRequests;
let assignments = seedData.assignments;
let replacements = seedData.replacements;
let contracts = seedData.contracts;
let availabilitySlots = seedData.availability;

let editSlotIndex = -1;

const profileFields = ["name", "phone", "location", "experience", "salary", "vehicle", "summary", "document"];
const slotFields = ["availability", "startDate", "endDate", "reason"];
const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];



function removeAt(list, index) {
    return list.slice(0, index).concat(list.slice(index + 1));
}


function nextId(prefix, list) {
    let biggest = 0;
    for (let i = 0; i < list.length; i++) {
        let numberText = list[i].id.slice(prefix.length + 1);   // "av-5" -> "5"
        if (isDigitsOnly(numberText) && Number(numberText) > biggest) {
            biggest = Number(numberText);
        }
    }
    return prefix + "-" + (biggest + 1);
}


function getUserName(userId) {
    let user = findRecord(users, userId);
    if (user === null) {
        return "Unknown user";
    }
    return escapeText(user.name);
}


function getMyProfile() {
    for (const profile of driverProfiles) {
        if (profile.driverId === currentDriverId) {
            return profile;
        }
    }
    return null;
}


function customerStatusText(request) {
    switch (request.status) {
        case "pending":
            return "Waiting for driver response";
        case "accepted":
            return "Driver accepted - awaiting customer confirmation";
        case "confirmed":
            return "Assignment confirmed";
        case "declined":
            return "Driver declined";
        case "cancelled":
            return "Cancelled by customer";
        default:
            return statusLabel(request.status);
    }
}


function offerBlockReason(request) {
    let user = findRecord(users, currentDriverId);
    let profile = getMyProfile();

    if (user.status !== "active") {
        return "Your account is suspended.";
    }
    if (profile.verificationStatus !== "approved") {
        return "Your profile is " + profile.verificationStatus + ". Only verified drivers can accept work.";
    }


    for (const slot of availabilitySlots) {
        if (slot.driverId === currentDriverId && slot.type === "unavailable" &&
            datesOverlap(request.startDate, request.endDate, slot.startDate, slot.endDate)) {
            return "You are marked Unavailable from " + formatDate(slot.startDate) + " to " + formatDate(slot.endDate) + ".";
        }
    }


    for (const contract of contracts) {
        if (contract.driverId === currentDriverId && contract.status === "active" &&
            datesOverlap(request.startDate, request.endDate, contract.startDate, contract.endDate)) {
            return "You already have contract " + contract.id + " from " + formatDate(contract.startDate) +
                " to " + formatDate(contract.endDate) + ".";
        }
    }


    for (const other of hiringRequests) {
        if (other.driverId === currentDriverId && other.status === "accepted" && other.id !== request.id &&
            datesOverlap(request.startDate, request.endDate, other.startDate, other.endDate)) {
            return "You already accepted \"" + other.duties + "\" from " + formatDate(other.startDate) +
                " to " + formatDate(other.endDate) + ".";
        }
    }
    return "";
}

function refreshAll() {
    renderDashboard();
    renderProfileStatus();
    renderProfileCard();
    renderOffers();
    renderInvitations();
    renderProposals();
    renderReplacementRequests();
    renderAvailability();
}

function renderDashboard() {
    let profile = getMyProfile();

    let pendingOffers = 0;
    for (const request of hiringRequests) {
        if (request.driverId === currentDriverId && request.status === "pending") {
            pendingOffers++;
        }
    }

    let agencyItems = 0;
    for (const membership of memberships) {
        if (membership.driverId === currentDriverId && membership.status === "invited") {
            agencyItems++;
        }
    }
    for (const assignment of assignments) {
        if (assignment.driverId === currentDriverId && assignment.status === "proposed") {
            agencyItems++;
        }
    }
    for (const rep of replacements) {
        if (rep.replacementDriverId === currentDriverId && rep.status === "pending" && rep.driverAccepted === false) {
            agencyItems++;
        }
    }

    let activeJobs = 0;
    for (const contract of contracts) {
        if (contract.driverId === currentDriverId && contract.status === "active") {
            activeJobs++;
        }
    }

    let unavailable = 0;
    for (const slot of availabilitySlots) {
        if (slot.driverId === currentDriverId && slot.type === "unavailable") {
            unavailable++;
        }
    }

    document.getElementById("statPendingOffers").innerHTML = pendingOffers;
    document.getElementById("statAgencyItems").innerHTML = agencyItems;
    document.getElementById("statActiveJobs").innerHTML = activeJobs;
    document.getElementById("statUnavailable").innerHTML = unavailable;

    let note = "Verification status: " + badgeHtml(profile.verificationStatus);
    if (profile.verificationStatus !== "approved") {
        note += " &nbsp; Customers cannot find or hire you until an admin approves your profile.";
    }
    document.getElementById("dashboardStatus").innerHTML = note;
}



function fillProfileForm() {
    let profile = getMyProfile();
    let user = findRecord(users, currentDriverId);

    document.getElementById("name").value = user.name;
    document.getElementById("phone").value = profile.phone;
    document.getElementById("location").value = profile.area;
    document.getElementById("experience").value = profile.experienceYears;
    document.getElementById("salary").value = profile.expectedSalary;
    document.getElementById("vehicle").value = profile.vehicleCategories[0];
    document.getElementById("summary").value = profile.summary;
    document.getElementById("document").value = "";
    clearErrors(profileFields);
}

function renderProfileStatus() {
    let profile = getMyProfile();
    let documentText = "none selected";
    if (profile.documentName !== "") {
        documentText = escapeText(profile.documentName);
    }
    document.getElementById("profileStatus").innerHTML =
        "Verification status: " + badgeHtml(profile.verificationStatus) + " &nbsp; Document: " + documentText;
}


function renderProfileCard() {
    let profile = getMyProfile();
    let user = findRecord(users, currentDriverId);

    let years = profile.experienceYears === 1 ? " year" : " years";
    let summaryText = "No summary written yet.";
    if (profile.summary !== "") {
        summaryText = escapeText(profile.summary);
    }

    document.getElementById("profileCard").innerHTML =
        "<h3>" + escapeText(user.name) + " " + badgeHtml(profile.verificationStatus) + "</h3>" +
        "<table class='facts-table'>" +
        "<tr><td>Phone</td><td>" + escapeText(profile.phone) + "</td></tr>" +
        "<tr><td>Location</td><td>" + escapeText(profile.area) + "</td></tr>" +
        "<tr><td>Experience</td><td>" + profile.experienceYears + years + "</td></tr>" +
        "<tr><td>Expected salary</td><td>" + formatMoney(profile.expectedSalary) + " per month</td></tr>" +
        "<tr><td>Vehicle</td><td>" + statusLabel(profile.vehicleCategories[0]) + "</td></tr>" +
        "</table>" +
        "<p>" + summaryText + "</p>";
}

function resetProfileForm() {
    fillProfileForm();
    hideMessage("profileMessage");
}


function saveProfile() {
    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let place = document.getElementById("location").value.trim();
    let experience = document.getElementById("experience").value.trim();
    let salary = document.getElementById("salary").value.trim();
    let vehicle = document.getElementById("vehicle").value;
    let summary = document.getElementById("summary").value.trim();
    let documentPath = document.getElementById("document").value;   // e.g. C:\fakepath\licence.jpg
    let isValid = true;

    clearErrors(profileFields);
    hideMessage("profileMessage");

    if (name.length < 3) {
        showError("name", "Enter your full name (at least 3 characters).");
        isValid = false;
    }

    if (!isDigitsOnly(phone) || phone.length !== 11 || phone.indexOf("01") !== 0) {
        showError("phone", "Phone must be 11 digits and start with 01 (example: 01711223344).");
        isValid = false;
    }

    if (isEmpty(place)) {
        showError("location", "Enter your current location.");
        isValid = false;
    }

    if (!isDigitsOnly(experience) || Number(experience) > 60) {
        showError("experience", "Experience must be a whole number of years from 0 to 60.");
        isValid = false;
    }

    if (!isDigitsOnly(salary) || Number(salary) < 5000 || Number(salary) > 200000) {
        showError("salary", "Salary must be a number between 5000 and 200000.");
        isValid = false;
    }

    if (vehicle === "") {
        showError("vehicle", "Choose a vehicle category.");
        isValid = false;
    }

    if (summary.length > 200) {
        showError("summary", "Summary is too long (" + summary.length + "/200 characters).");
        isValid = false;
    }


    let fileName = documentPath.slice(documentPath.lastIndexOf("\\") + 1);
    let extension = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();

    if (documentPath === "") {
        showError("document", "Choose a verification document.");
        isValid = false;
    } else if (allowedExtensions.indexOf(extension) === -1) {
        showError("document", "Only PDF, JPG or PNG files are accepted.");
        isValid = false;
    }

    if (isValid === false) {
        showMessage("profileMessage", "Please fix the errors above and try again.", "error");
        return false;
    }


    let profile = getMyProfile();
    let user = findRecord(users, currentDriverId);

    user.name = name;
    profile.phone = phone;
    profile.area = place;
    profile.experienceYears = Number(experience);
    profile.expectedSalary = Number(salary);
    profile.vehicleCategories = [vehicle];
    profile.summary = summary;
    profile.documentName = fileName;
    profile.verificationStatus = "pending";


    let fileType = "image/jpeg";
    if (extension === "pdf") {
        fileType = "application/pdf";
    } else if (extension === "png") {
        fileType = "image/png";
    }


    let submission = null;
    for (const item of verificationSubmissions) {
        if (item.subjectType === "driver" && item.subjectId === currentDriverId && item.status === "pending") {
            submission = item;
        }
    }
    if (submission === null) {
        submission = {
            id: nextId("vs", verificationSubmissions), subjectType: "driver", subjectId: currentDriverId,
            status: "pending", reason: "", reviewedAt: ""
        };
        verificationSubmissions.push(submission);
    }
    submission.filename = fileName;
    submission.fileType = fileType;
    submission.fileSize = 0;

    document.getElementById("document").value = "";
    refreshAll();
    showMessage("profileMessage",
        "Profile saved and sent for verification. Status is now Pending until an admin reviews it. " +
        "Customers cannot hire you while it is pending.", "success");
    return false;
}



function renderOffers() {
    let keyword = document.getElementById("offerSearch").value;
    let statusFilter = document.getElementById("offerFilter").value;

    let rows = "";
    let shown = 0;
    let total = 0;
    let counts = { pending: 0, accepted: 0, confirmed: 0, declined: 0, cancelled: 0 };

    for (let i = 0; i < hiringRequests.length; i++) {
        let request = hiringRequests[i];

        if (request.driverId === currentDriverId) {
            total++;
            if (counts[request.status] !== undefined) {
                counts[request.status]++;
            }

            let matchesKeyword = containsText(request.duties, keyword) || containsText(getUserName(request.customerId), keyword) ||
                containsText(request.id, keyword);
            let matchesStatus = (statusFilter === "all" || request.status === statusFilter);

            if (matchesKeyword && matchesStatus) {
                let actions = "-";
                let eligibility = "-";

                if (request.status === "pending") {
                    // The same check the Accept button uses, shown BEFORE the driver clicks
                    let reason = offerBlockReason(request);
                    if (reason === "") {
                        eligibility = "<span class='badge green'>Yes, you can accept</span>";
                    } else {
                        eligibility = "<span class='badge red'>No</span> " + escapeText(reason);
                    }
                    actions = "<button type='button' class='btn btn-small btn-success' onclick='acceptOffer(" + i + ")'>Accept</button> " +
                        "<button type='button' class='btn btn-small btn-secondary' onclick='declineOffer(" + i + ")'>Decline</button>";
                }

                rows += "<tr>" +
                    "<td>" + escapeText(request.duties) + "</td>" +
                    "<td>" + getUserName(request.customerId) + "</td>" +
                    "<td>" + formatDate(request.startDate) + " to " + formatDate(request.endDate) + "</td>" +
                    "<td>" + formatMoney(request.offeredSalary) + "</td>" +
                    "<td>" + badgeHtml(request.status) + "</td>" +
                    "<td>" + customerStatusText(request) + "</td>" +
                    "<td>" + eligibility + "</td>" +
                    "<td>" + actions + "</td>" +
                    "</tr>";
                shown++;
            }
        }
    }

    if (shown === 0) {
        rows = emptyRow(8, "No offers match your search.");
    }

    document.getElementById("offerBody").innerHTML = rows;
    document.getElementById("offerCount").innerHTML =
        shown + " of " + total + " offers shown. Pending: " + counts.pending +
        ", Accepted: " + counts.accepted + ", Confirmed: " + counts.confirmed +
        ", Declined: " + counts.declined + ", Cancelled: " + counts.cancelled + ".";
}

function acceptOffer(index) {
    let request = hiringRequests[index];

    if (request.status !== "pending") {
        showMessage("offerMessage", "This request was already " + request.status + ". It cannot be changed again.", "error");
        return;
    }

    let reason = offerBlockReason(request);
    if (reason !== "") {
        showMessage("offerMessage", "Cannot accept: " + escapeText(reason), "error");
        return;
    }

    request.status = "accepted";
    refreshAll();
    showMessage("offerMessage", "You accepted \"" + escapeText(request.duties) +
        "\". The customer now confirms it to make it a contract.", "success");
}

function declineOffer(index) {
    let request = hiringRequests[index];

    if (request.status !== "pending") {
        showMessage("offerMessage", "This request was already " + request.status + ". It cannot be changed again.", "error");
        return;
    }

    request.status = "declined";
    refreshAll();
    showMessage("offerMessage", "You declined \"" + escapeText(request.duties) + "\".", "info");
}


function renderInvitations() {
    let rows = "";

    for (let i = 0; i < memberships.length; i++) {
        let membership = memberships[i];
        let agency = findRecord(agencies, membership.agencyId);

        if (membership.driverId === currentDriverId && membership.status !== "removed" && agency !== null) {
            let actions = "-";
            if (membership.status === "invited") {
                actions = "<button type='button' class='btn btn-small btn-success' onclick='answerInvitation(" + i + ", true)'>Accept</button> " +
                    "<button type='button' class='btn btn-small btn-secondary' onclick='answerInvitation(" + i + ", false)'>Decline</button>";
            }
            rows += "<tr>" +
                "<td>" + escapeText(agency.name) + "</td>" +
                "<td>" + escapeText(agency.area) + "</td>" +
                "<td>" + badgeHtml(membership.status) + "</td>" +
                "<td>" + actions + "</td>" +
                "</tr>";
        }
    }

    if (rows === "") {
        rows = emptyRow(4, "No invitations.");
    }
    document.getElementById("inviteBody").innerHTML = rows;
}

function answerInvitation(index, accept) {
    let membership = memberships[index];

    if (membership.status !== "invited") {
        showMessage("inviteMessage", "This invitation is no longer open.", "error");
        return;
    }


    if (accept) {
        for (const other of memberships) {
            if (other.driverId === currentDriverId && other.status === "active") {
                showMessage("inviteMessage", "You are already active in an agency.", "error");
                return;
            }
        }
    }

    membership.status = accept ? "active" : "declined";
    refreshAll();
    showMessage("inviteMessage", accept ? "Invitation accepted." : "Invitation declined.", accept ? "success" : "info");
}



function renderProposals() {
    let rows = "";

    for (let i = 0; i < assignments.length; i++) {
        let assignment = assignments[i];
        let request = findRecord(bulkRequests, assignment.bulkRequestId);

        if (assignment.driverId === currentDriverId && request !== null) {
            let actions = "-";
            if (assignment.status === "proposed") {
                actions = "<button type='button' class='btn btn-small btn-success' onclick='answerProposal(" + i + ", true)'>Accept</button> " +
                    "<button type='button' class='btn btn-small btn-secondary' onclick='answerProposal(" + i + ", false)'>Decline</button>";
            }
            rows += "<tr>" +
                "<td>" + escapeText(request.duties) + "</td>" +
                "<td>" + getUserName(request.customerId) + "</td>" +
                "<td>" + formatDate(request.startDate) + " to " + formatDate(request.endDate) + "</td>" +
                "<td>" + formatMoney(request.offeredSalary) + "</td>" +
                "<td>" + badgeHtml(assignment.status) + "</td>" +
                "<td>" + actions + "</td>" +
                "</tr>";
        }
    }

    if (rows === "") {
        rows = emptyRow(6, "No agency job proposals.");
    }
    document.getElementById("proposalBody").innerHTML = rows;
}

function answerProposal(index, accept) {
    let assignment = assignments[index];

    if (assignment.status !== "proposed") {
        showMessage("inviteMessage", "This proposal is no longer open.", "error");
        return;
    }

    if (accept) {
        assignment.status = "accepted";
        assignment.driverAccepted = true;
    } else {
        assignment.status = "declined";
    }
    refreshAll();
    showMessage("inviteMessage", accept ? "Proposal accepted. The customer approves next." : "Proposal declined.",
        accept ? "success" : "info");
}



function renderReplacementRequests() {
    let rows = "";

    for (let i = 0; i < replacements.length; i++) {
        let rep = replacements[i];
        let contract = findRecord(contracts, rep.originalContractId);

        if (rep.replacementDriverId === currentDriverId && contract !== null) {
            let status = rep.status;
            if (rep.status === "pending" && rep.driverAccepted) {
                status = "accepted";
            }

            let actions = "-";
            if (rep.status === "pending" && rep.driverAccepted === false) {
                actions = "<button type='button' class='btn btn-small btn-success' onclick='answerReplacement(" + i + ", true)'>Accept</button> " +
                    "<button type='button' class='btn btn-small btn-secondary' onclick='answerReplacement(" + i + ", false)'>Decline</button>";
            }

            rows += "<tr>" +
                "<td>" + getUserName(contract.driverId) + "</td>" +
                "<td>" + getUserName(contract.customerId) + "</td>" +
                "<td>" + formatDate(contract.startDate) + " to " + formatDate(contract.endDate) + "</td>" +
                "<td>" + escapeText(rep.reason) + "</td>" +
                "<td>" + badgeHtml(status) + "</td>" +
                "<td>" + actions + "</td>" +
                "</tr>";
        }
    }

    if (rows === "") {
        rows = emptyRow(6, "No replacement requests.");
    }
    document.getElementById("replacementBody").innerHTML = rows;
}

function answerReplacement(index, accept) {
    let rep = replacements[index];

    if (rep.status !== "pending") {
        showMessage("inviteMessage", "This replacement is no longer pending.", "error");
        return;
    }

    if (accept) {
        rep.driverAccepted = true;
    } else {
        rep.status = "rejected";
    }
    refreshAll();
    showMessage("inviteMessage", accept ? "Replacement accepted. It is completed when the customer approves." : "Replacement declined.",
        accept ? "success" : "info");
}



function getMyActiveContracts() {
    let myContracts = [];
    for (const contract of contracts) {
        if (contract.driverId === currentDriverId && contract.status === "active") {
            myContracts.push(contract);
        }
    }
    return myContracts;
}


function renderAvailability() {
    let keyword = document.getElementById("availSearch").value;
    let typeFilter = document.getElementById("availFilter").value;

    let rows = "";
    let shown = 0;
    let mine = 0;
    let availableCount = 0;
    let unavailableCount = 0;

    for (let i = 0; i < availabilitySlots.length; i++) {
        let slot = availabilitySlots[i];

        if (slot.driverId === currentDriverId) {
            mine++;
            if (slot.type === "unavailable") {
                unavailableCount++;
            } else {
                availableCount++;
            }

            let matchesKeyword = containsText(slot.reason, keyword) || containsText(slot.startDate, keyword) ||
                containsText(slot.endDate, keyword) || containsText(slot.id, keyword);
            let matchesType = (typeFilter === "all" || slot.type === typeFilter);

            if (matchesKeyword && matchesType) {
                let reasonText = "-";
                if (slot.reason !== "") {
                    reasonText = escapeText(slot.reason);
                }
                rows += "<tr>" +
                    "<td>" + badgeHtml(slot.type) + "</td>" +
                    "<td>" + formatDate(slot.startDate) + "</td>" +
                    "<td>" + formatDate(slot.endDate) + "</td>" +
                    "<td>" + reasonText + "</td>" +
                    "<td>" +
                    "<button type='button' class='btn btn-small' onclick='editSlot(" + i + ")'>Edit</button> " +
                    "<button type='button' class='btn btn-small btn-secondary' onclick='deleteSlot(" + i + ")'>Delete</button>" +
                    "</td>" +
                    "</tr>";
                shown++;
            }
        }
    }

    if (shown === 0) {
        rows = emptyRow(5, "No availability records match your search.");
    }


    let jobRows = "";
    for (const contract of contracts) {
        if (contract.driverId === currentDriverId && (contract.status === "active" || contract.status === "completed")) {
            jobRows += "<tr>" +
                "<td>" + contract.id + "</td>" +
                "<td>" + getUserName(contract.customerId) + "</td>" +
                "<td>" + formatDate(contract.startDate) + " to " + formatDate(contract.endDate) + "</td>" +
                "<td>" + badgeHtml(contract.status) + "</td>" +
                "</tr>";
        }
    }
    if (jobRows === "") {
        jobRows = emptyRow(4, "No confirmed jobs.");
    }

    document.getElementById("slotBody").innerHTML = rows;
    document.getElementById("slotCount").innerHTML = "Showing " + shown + " of " + mine + " records";
    document.getElementById("jobBody").innerHTML = jobRows;

    document.getElementById("statAvailablePeriods").innerHTML = availableCount;
    document.getElementById("statUnavailablePeriods").innerHTML = unavailableCount;
    document.getElementById("statConfirmedJobs").innerHTML = getMyActiveContracts().length;
}



function saveSlot() {
    let type = document.getElementById("availability").value;
    let start = document.getElementById("startDate").value;
    let end = document.getElementById("endDate").value;
    let reason = document.getElementById("reason").value.trim();
    let isValid = true;

    clearErrors(slotFields);
    hideMessage("availMessage");

    if (type === "") {
        showError("availability", "Choose Available or Unavailable.");
        isValid = false;
    }
    if (start === "") {
        showError("startDate", "Choose a start date.");
        isValid = false;
    }
    if (end === "") {
        showError("endDate", "Choose an end date.");
        isValid = false;
    } else if (start !== "" && end < start) {
        showError("endDate", "End date cannot be before the start date.");
        isValid = false;
    }
    if (reason.length > 100) {
        showError("reason", "Reason is too long (" + reason.length + "/100 characters).");
        isValid = false;
    }

    if (isValid === false) {
        return false;
    }


    for (let i = 0; i < availabilitySlots.length; i++) {
        let slot = availabilitySlots[i];
        if (slot.driverId === currentDriverId && i !== editSlotIndex &&
            datesOverlap(start, end, slot.startDate, slot.endDate)) {
            showMessage("availMessage", "These dates overlap your " + slot.type + " record (" +
                formatDate(slot.startDate) + " to " + formatDate(slot.endDate) + "). Edit or delete it first, or pick other dates.", "error");
            return false;
        }
    }


    if (type === "unavailable") {
        for (const job of getMyActiveContracts()) {
            if (datesOverlap(start, end, job.startDate, job.endDate)) {
                showMessage("availMessage", "You have a confirmed job (" + job.id + ", " + formatDate(job.startDate) +
                    " to " + formatDate(job.endDate) + ") on these dates.", "error");
                return false;
            }
        }
    }

    if (editSlotIndex === -1) {

        let newSlot = {
            id: nextId("av", availabilitySlots), driverId: currentDriverId, startDate: start,
            endDate: end, type: type, reason: reason
        };
        availabilitySlots.push(newSlot);
        showMessage("availMessage", "Availability record " + newSlot.id + " was added.", "success");
    } else {

        let slot = availabilitySlots[editSlotIndex];
        slot.type = type;
        slot.startDate = start;
        slot.endDate = end;
        slot.reason = reason;
        showMessage("availMessage", "Availability record " + slot.id + " was updated.", "success");
    }

    resetSlotForm(false);
    refreshAll();
    return false;
}


function editSlot(index) {
    let slot = availabilitySlots[index];
    editSlotIndex = index;

    document.getElementById("availability").value = slot.type;
    document.getElementById("startDate").value = slot.startDate;
    document.getElementById("endDate").value = slot.endDate;
    document.getElementById("reason").value = slot.reason;
    clearErrors(slotFields);

    document.getElementById("slotFormTitle").innerHTML = "Edit Availability " + slot.id;
    document.getElementById("slotSaveButton").value = "Update Availability";
    showMessage("availMessage", "Change the details above, then press Update Availability.", "info");
}



function deleteSlot(index) {
    let slot = availabilitySlots[index];
    availabilitySlots = removeAt(availabilitySlots, index);
    resetSlotForm(false);
    refreshAll();
    showMessage("availMessage", "Availability record " + slot.id + " was deleted.", "info");
}


function resetSlotForm(hideBox) {
    editSlotIndex = -1;
    document.getElementById("availForm").reset();
    clearErrors(slotFields);
    document.getElementById("slotFormTitle").innerHTML = "Add Availability";
    document.getElementById("slotSaveButton").value = "Add Availability";
    if (hideBox !== false) {
        hideMessage("availMessage");
    }
}



document.getElementById("welcomeName").innerHTML = "Welcome, " + getUserName(currentDriverId);
fillProfileForm();
refreshAll();
showSection("dashboardSection");