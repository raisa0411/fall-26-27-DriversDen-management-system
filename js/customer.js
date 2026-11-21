/* ==========================================================
   DriverDen - Customer page (customer.html)
   Owner: Hameem
   ----------------------------------------------------------
   Loaded after data.js and common.js. All records come from the
   shared saved data (getState / updateState in common.js), so the
   Driver, Agency and Admin pages see the same requests.

   Sections of customer.html:
     Dashboard        renderDashboardStats()
     C1 Find Drivers  updateRateFilter(), searchDrivers()
     C1 Compare       prepareDriverComparison(), compareTwoDrivers()
     C2 Hire          prepareHiringPage(), submitHiringRequest(),
                      submitBulkRequest()
     C2 My Requests   renderRequests(), renderAgencyRequests()
     C3 My Reviews    prepareReviewsPage(), addReview()
   ========================================================== */

const sections = ["dashboardSection", "driversSection", "compareSection",
    "hireSection", "requestsSection", "reviewsSection"
];

let me = null; // the logged-in customer


/* ==========================================================
   Driver list for customers
   Only approved, active drivers are listed (isHireableDriver in
   common.js). Each driver is turned into the same shape the
   search, compare and hire code used before:
   { id, name, location, experience (MONTHS), salary, vehicle,
     verification, services }
   ========================================================== */

function vehicleLabel(categories) {
    let words = [];

    for (const category of categories || []) {
        words.push(category.charAt(0).toUpperCase() + category.slice(1));
    }

    return words.length > 0 ? words.join(", ") : "-";
}

function getDriverList() {
    let s = getState();
    let list = [];

    for (const profile of s.driverProfiles) {
        if (!isHireableDriver(s, profile.driverId)) {
            continue;
        }

        list.push({
            id: profile.driverId,
            name: findUserRecord(s, profile.driverId).name,
            location: profile.area,
            experience: profile.experienceYears * 12,
            salary: profile.expectedSalary,
            vehicle: vehicleLabel(profile.vehicleCategories),
            verification: "Verified",
            services: profile.services || []
        });
    }

    return list;
}

function findDriverById(driverId) {
    let list = getDriverList();

    for (let i = 0; i < list.length; i++) {
        if (list[i].id === driverId) {
            return list[i];
        }
    }

    return null;
}

function findComparisonService(driver, jobType) {
    for (let i = 0; i < driver.services.length; i++) {
        if (driver.services[i].jobType === jobType) {
            return driver.services[i];
        }
    }

    return null;
}

/* Customer-friendly words for each request status */
function requestStatusText(status) {
    switch (status) {
        case "pending":
            return "Pending Driver Acceptance";
        case "accepted":
            return "Driver Accepted - Confirm to start";
        case "confirmed":
            return "Confirmed";
        case "declined":
            return "Driver Declined";
        case "cancelled":
            return "Cancelled";
        default:
            return statusLabel(status);
    }
}

/* Requests and reviews that belong to the logged-in customer */
function myRequests(s) {
    let list = [];

    for (const request of s.hiringRequests) {
        if (request.customerId === me.id) {
            list.push(request);
        }
    }

    return list;
}

function myReviews(s) {
    let list = [];

    for (const review of s.reviews) {
        if (review.customerId === me.id) {
            list.push(review);
        }
    }

    return list;
}

/* Redraws every section (after any change) */
function refreshAll() {
    renderDashboardStats();
    searchDrivers();
    prepareHiringPage();
    renderRequests();
    renderAgencyRequests();
    prepareReviewsPage();
}


/* ==========================================================
   Dashboard
   ========================================================== */

function renderDashboardStats() {
    let s = getState();
    let requests = myRequests(s);
    let pendingCount = 0;

    for (let i = 0; i < requests.length; i++) {
        if (requests[i].status === "pending") {
            pendingCount++;
        }
    }

    document.getElementById("statTotalDrivers").textContent = getDriverList().length;
    document.getElementById("statTotalRequests").textContent = requests.length;
    document.getElementById("statPendingRequests").textContent = pendingCount;
    document.getElementById("statTotalReviews").textContent = myReviews(s).length;
}


/* ==========================================================
   C1: Find Drivers
   ========================================================== */

function updateRateFilter() {
    let jobSelect = document.getElementById("filterJobType");
    let input = document.getElementById("filterMaxSalary");
    let label = document.getElementById("rateFilterLabel");

    let job = jobSelect.value;

    input.value = "";
    input.disabled = job === "";
    input.placeholder = "Enter amount";
    label.textContent = "Maximum Rate (BDT)";

    if (job === "") {
        return;
    }

    let drivers = getDriverList();
    let unit = "";

    for (let i = 0; i < drivers.length; i++) {
        let service = findComparisonService(drivers[i], job);

        if (service !== null) {
            unit = service.unit;
            break;
        }
    }

    if (unit !== "") {
        label.textContent = "Maximum Rate (BDT / " + unit + ")";
    }
}

function clearDriverFilters() {
    document.getElementById("filterLocation").value = "";
    document.getElementById("filterExperience").value = "";
    document.getElementById("filterMaxSalary").value = "";
    document.getElementById("filterJobType").value = "";

    updateRateFilter();
    searchDrivers();
}

function searchDrivers() {
    let location = document.getElementById("filterLocation").value.trim();
    let experience = document.getElementById("filterExperience").value;
    let salary = document.getElementById("filterMaxSalary").value;
    let job = document.getElementById("filterJobType").value;

    if (experience !== "" && Number(experience) < 0) {
        alert("Minimum experience cannot be negative.");
        return false;
    }

    if (job !== "" && salary !== "" && Number(salary) < 0) {
        alert("Maximum rate cannot be negative.");
        return false;
    }

    let drivers = getDriverList();
    let cards = "";
    let shown = 0;

    for (let i = 0; i < drivers.length; i++) {
        let driver = drivers[i];

        let locationMatch = containsText(driver.location, location);

        let experienceMatch = experience === "" ||
            driver.experience >= Number(experience) * 12;

        let matchingServices = [];

        for (let j = 0; j < driver.services.length; j++) {
            let service = driver.services[j];

            let jobMatch = job === "" || service.jobType === job;

            let rateMatch = job === "" ||
                salary === "" ||
                service.rate <= Number(salary);

            if (jobMatch && rateMatch) {
                matchingServices.push(service);
            }
        }

        if (locationMatch && experienceMatch && matchingServices.length > 0) {
            let servicesHtml = "";

            for (let j = 0; j < matchingServices.length; j++) {
                let service = matchingServices[j];

                servicesHtml +=
                    "<div class='service-rate-item'>" +
                    "<div class='service-rate-heading'>" +
                    "<span class='service-name'>" + formatJobType(service.jobType) + "</span>" +
                    "<span class='service-price'>" + service.rate.toLocaleString() + " BDT / " + service.unit + "</span>" +
                    "</div>" +
                    "<p class='service-scope'>" + escapeText(service.scope) + "</p>" +
                    "</div>";
            }

            cards +=
                "<div class='driver-card'>" +
                "<div class='driver-card-header'>" +
                "<div>" +
                "<h3 class='driver-name'>" + escapeText(driver.name) + "</h3>" +
                "<p class='driver-id'>Driver ID: " + driver.id + "</p>" +
                "<span class='badge badge-verified'>" + driver.verification + "</span>" +
                "</div>" +
                "</div>" +

                "<div class='driver-details'>" +
                "<div class='detail-item'>" +
                "<span class='detail-label'>Location</span>" +
                "<span class='detail-value'>" + escapeText(driver.location) + "</span>" +
                "</div>" +
                "<div class='detail-item'>" +
                "<span class='detail-label'>Experience</span>" +
                "<span class='detail-value'>" + formatExperience(driver.experience) + "</span>" +
                "</div>" +
                "<div class='detail-item'>" +
                "<span class='detail-label'>Vehicles</span>" +
                "<span class='detail-value'>" + escapeText(driver.vehicle) + "</span>" +
                "</div>" +
                "</div>" +

                "<div class='driver-services'>" +
                "<h4>Services &amp; Rates</h4>" +
                servicesHtml +
                "</div>" +

                "<div class='driver-card-footer'>" +
                "<button type='button' class='btn' onclick=\"openHireFor('" + driver.id + "')\">Hire Driver</button>" +
                "</div>" +
                "</div>";

            shown++;
        }
    }

    if (shown === 0) {
        cards = "<p>No drivers match your search criteria.</p>";
    }

    document.getElementById("driversList").innerHTML = cards;
    document.getElementById("driverCount").textContent =
        shown + (shown === 1 ? " driver found." : " drivers found.");

    return false;
}

/* "Hire Driver" buttons open the hiring form with that driver chosen */
function openHireFor(driverId) {
    document.getElementById("driver").value = driverId;
    updateHiringServices();
    showSection("hireSection");
}


/* ==========================================================
   C1: Two-Driver Service Comparison
   ========================================================== */

function prepareDriverComparison() {
    let firstSelect = document.getElementById("driver1Select");
    let secondSelect = document.getElementById("driver2Select");
    let serviceSelect = document.getElementById("compareJobType");

    let drivers = getDriverList();
    let options = "<option value=''>-- Select Driver --</option>";

    for (let i = 0; i < drivers.length; i++) {
        let driver = drivers[i];

        options += "<option value='" + driver.id + "'>" +
            escapeText(driver.id + " — " + driver.name + " (" + driver.location + ")") +
            "</option>";
    }

    firstSelect.innerHTML = options;
    secondSelect.innerHTML = options;

    let services = "<option value=''>-- Select Service --</option>";

    for (const jobType in jobTypeLabels) {
        services += "<option value='" + jobType + "'>" + formatJobType(jobType) + "</option>";
    }

    serviceSelect.innerHTML = services;
}

function buildComparisonRow(label, firstValue, secondValue) {
    return "<tr>" +
        "<th scope='row'>" + label + "</th>" +
        "<td>" + firstValue + "</td>" +
        "<td>" + secondValue + "</td>" +
        "</tr>";
}

function buildHighlightedComparisonRow(label, firstValue, secondValue,
    firstHighlight, secondHighlight, firstNote, secondNote) {
    let firstClass = firstHighlight ? "comparison-highlight" : "";
    let secondClass = secondHighlight ? "comparison-highlight" : "";

    let firstNoteHtml = "";
    let secondNoteHtml = "";

    if (firstNote !== "") {
        firstNoteHtml = "<span class='comparison-note'>" + firstNote + "</span>";
    }

    if (secondNote !== "") {
        secondNoteHtml = "<span class='comparison-note'>" + secondNote + "</span>";
    }

    return "<tr>" +
        "<th scope='row'>" + label + "</th>" +
        "<td class='" + firstClass + "'>" + firstValue + firstNoteHtml + "</td>" +
        "<td class='" + secondClass + "'>" + secondValue + secondNoteHtml + "</td>" +
        "</tr>";
}

function compareTwoDrivers() {
    let firstId = document.getElementById("driver1Select").value;
    let secondId = document.getElementById("driver2Select").value;
    let jobType = document.getElementById("compareJobType").value;

    let container = document.getElementById("comparisonContainer");
    let message = document.getElementById("compareResult");

    container.innerHTML = "";

    if (firstId === "" || secondId === "" || jobType === "") {
        message.textContent = "Please select both drivers and a service.";
        return false;
    }

    if (firstId === secondId) {
        message.textContent = "Please choose two different drivers.";
        return false;
    }

    let first = findDriverById(firstId);
    let second = findDriverById(secondId);

    if (first === null || second === null) {
        message.textContent = "A selected driver could not be found.";
        return false;
    }

    let firstService = findComparisonService(first, jobType);
    let secondService = findComparisonService(second, jobType);

    let comparable = firstService !== null && secondService !== null &&
        firstService.unit === secondService.unit;

    let firstRate = "Not offered";
    let secondRate = "Not offered";

    let firstScope = "This driver does not offer the selected service.";
    let secondScope = "This driver does not offer the selected service.";

    if (firstService !== null) {
        firstRate = firstService.rate.toLocaleString() + " BDT / " + firstService.unit;
        firstScope = escapeText(firstService.scope);
    }

    if (secondService !== null) {
        secondRate = secondService.rate.toLocaleString() + " BDT / " + secondService.unit;
        secondScope = escapeText(secondService.scope);
    }

    let firstLower = false;
    let secondLower = false;
    let firstRateNote = "";
    let secondRateNote = "";

    if (comparable) {
        firstLower = firstService.rate < secondService.rate;
        secondLower = secondService.rate < firstService.rate;

        if (firstLower) {
            firstRateNote = "Lower rate";
        } else if (secondLower) {
            secondRateNote = "Lower rate";
        } else {
            firstRateNote = "Same rate";
            secondRateNote = "Same rate";
        }
    }

    let firstMoreExperience = first.experience > second.experience;
    let secondMoreExperience = second.experience > first.experience;

    let firstExperienceNote = "";
    let secondExperienceNote = "";

    if (firstMoreExperience) {
        firstExperienceNote = "More experience";
    } else if (secondMoreExperience) {
        secondExperienceNote = "More experience";
    } else {
        firstExperienceNote = "Same experience";
        secondExperienceNote = "Same experience";
    }

    let rows = "";

    rows += buildComparisonRow("Driver ID", first.id, second.id);
    rows += buildComparisonRow("Verification", first.verification, second.verification);
    rows += buildComparisonRow("Location", escapeText(first.location), escapeText(second.location));
    rows += buildHighlightedComparisonRow("Experience",
        formatExperience(first.experience), formatExperience(second.experience),
        firstMoreExperience, secondMoreExperience, firstExperienceNote, secondExperienceNote);
    rows += buildComparisonRow("Vehicles", escapeText(first.vehicle), escapeText(second.vehicle));
    rows += buildHighlightedComparisonRow("Service Rate", firstRate, secondRate,
        firstLower, secondLower, firstRateNote, secondRateNote);
    rows += buildComparisonRow("Included Scope", firstScope, secondScope);
    rows += buildComparisonRow("Action",
        "<button type='button' class='btn btn-small' onclick=\"openHireFor('" + first.id + "')\">Hire Driver</button>",
        "<button type='button' class='btn btn-small' onclick=\"openHireFor('" + second.id + "')\">Hire Driver</button>");

    container.innerHTML =
        "<table class='comparison-table'>" +
        "<caption>" + formatJobType(jobType) + "</caption>" +
        "<thead>" +
        "<tr>" +
        "<th scope='col'>Detail</th>" +
        "<th scope='col'>" + escapeText(first.name) + "</th>" +
        "<th scope='col'>" + escapeText(second.name) + "</th>" +
        "</tr>" +
        "</thead>" +
        "<tbody>" + rows + "</tbody>" +
        "</table>";

    if (comparable) {
        message.textContent = "Compare the rate and included scope together. " +
            "Experience is shown separately from verification.";
    } else {
        message.textContent = "Rates cannot be compared: a driver does not offer " +
            "this service, or the billing units differ.";
    }

    return false;
}


/* ==========================================================
   C2: Hiring Form (was hire.js)
   ========================================================== */

function getHiringQuantityLabel(unit) {
    if (unit === "hour") {
        return "Number of Hours";
    }

    if (unit === "day") {
        return "Number of Days";
    }

    if (unit === "month") {
        return "Number of Months";
    }

    if (unit === "trip") {
        return "Number of Trips";
    }

    return "Number of Bookings";
}

function formatHiringQuantity(quantity, unit) {
    return quantity + " " + unit + (quantity === 1 ? "" : "s");
}

/* The last day of a booking, so every request has an END date.
   month: 1 month from the start minus one day
   day:   the number of days, counted from the start day
   hour / trip / booking: finished on the same day */
function calculateHiringEndDate(startDate, quantity, unit) {
    if (unit === "month") {
        return addDaysToDate(addMonthsToDate(startDate, quantity), -1);
    }

    if (unit === "day") {
        return addDaysToDate(startDate, quantity - 1);
    }

    return startDate;
}

function getSelectedHiringService() {
    let driverId = document.getElementById("driver").value;
    let serviceCode = document.getElementById("hireService").value;

    let driver = findDriverById(driverId);

    if (driver === null || serviceCode === "") {
        return null;
    }

    return findComparisonService(driver, serviceCode);
}

function prepareHiringPage() {
    let driverSelect = document.getElementById("driver");
    let dateInput = document.getElementById("hiredate");
    let keep = driverSelect.value;

    let drivers = getDriverList();
    let options = "<option value=''>-- Select Driver --</option>";

    for (let i = 0; i < drivers.length; i++) {
        let driver = drivers[i];

        options += "<option value='" + driver.id + "'" + (driver.id === keep ? " selected" : "") + ">" +
            escapeText(driver.id + " — " + driver.name + " (" + driver.location + ")") +
            "</option>";
    }

    driverSelect.innerHTML = options;
    dateInput.min = getToday();
    document.getElementById("bulkStart").min = getToday();
    document.getElementById("bulkEnd").min = getToday();

    updateHiringServices();
    renderAgencyOptions();
}

function updateHiringServices() {
    let driverId = document.getElementById("driver").value;
    let serviceSelect = document.getElementById("hireService");

    let driver = findDriverById(driverId);

    if (driver === null) {
        serviceSelect.innerHTML = "<option value=''>-- Select a Driver First --</option>";
        serviceSelect.disabled = true;
        updateHiringServiceDetails();
        return;
    }

    let options = "<option value=''>-- Select Service --</option>";

    for (let i = 0; i < driver.services.length; i++) {
        let service = driver.services[i];

        options += "<option value='" + service.jobType + "'>" + formatJobType(service.jobType) + "</option>";
    }

    serviceSelect.innerHTML = options;
    serviceSelect.disabled = false;

    updateHiringServiceDetails();
}

function updateHiringServiceDetails() {
    let service = getSelectedHiringService();

    let quantityInput = document.getElementById("hireQuantity");
    let quantityLabel = document.getElementById("hireQuantityLabel");
    let submitButton = document.getElementById("hireSubmit");

    if (service === null) {
        quantityInput.value = "";
        quantityInput.min = "1";
        quantityInput.disabled = true;

        quantityLabel.textContent = "Booking Quantity";

        document.getElementById("hireRate").textContent = "Select a service.";
        document.getElementById("hireScope").textContent = "Select a service.";
        document.getElementById("hireMinimum").textContent = "Select a service.";
        document.getElementById("hireDates").textContent = "Choose a start date.";
        document.getElementById("hireAmount").textContent = "—";

        submitButton.disabled = true;
        return;
    }

    quantityLabel.textContent = getHiringQuantityLabel(service.unit);

    quantityInput.min = service.minimumQuantity;
    quantityInput.value = service.minimumQuantity;
    quantityInput.disabled = false;

    document.getElementById("hireRate").textContent = service.rate.toLocaleString() + " BDT / " + service.unit;
    document.getElementById("hireScope").textContent = service.scope;
    document.getElementById("hireMinimum").textContent = formatHiringQuantity(service.minimumQuantity, service.unit);

    updateHiringAmount();
}

function updateHiringAmount() {
    let service = getSelectedHiringService();

    let quantityInput = document.getElementById("hireQuantity");
    let amountOutput = document.getElementById("hireAmount");
    let datesOutput = document.getElementById("hireDates");
    let startDate = document.getElementById("hiredate").value;
    let submitButton = document.getElementById("hireSubmit");

    if (service === null) {
        amountOutput.textContent = "—";
        submitButton.disabled = true;
        return;
    }

    let quantity = Number(quantityInput.value);

    if (quantityInput.value === "" || !Number.isSafeInteger(quantity) ||
        quantity < service.minimumQuantity || !quantityInput.checkValidity()) {
        amountOutput.textContent = "Enter a whole number of at least " + service.minimumQuantity + ".";
        submitButton.disabled = true;
        return;
    }

    let amount = service.rate * quantity;

    if (!Number.isSafeInteger(amount)) {
        amountOutput.textContent = "The booking quantity is too large.";
        submitButton.disabled = true;
        return;
    }

    if (startDate !== "") {
        datesOutput.textContent = formatDate(startDate) + " to " +
            formatDate(calculateHiringEndDate(startDate, quantity, service.unit));
    } else {
        datesOutput.textContent = "Choose a start date.";
    }

    amountOutput.textContent = amount.toLocaleString() + " BDT";
    submitButton.disabled = false;
}

function showHiringError(text) {
    let message = document.getElementById("hireMessage");

    message.textContent = text;
    message.style.color = "#991b1b";

    return false;
}

function submitHiringRequest() {
    let driverId = document.getElementById("driver").value;
    let serviceCode = document.getElementById("hireService").value;
    let dateInput = document.getElementById("hiredate");
    let quantityInput = document.getElementById("hireQuantity");

    let driver = findDriverById(driverId);

    if (driver === null) {
        return showHiringError("Please select a driver.");
    }

    let service = findComparisonService(driver, serviceCode);

    if (service === null) {
        return showHiringError("Please select a service offered by this driver.");
    }

    dateInput.min = getToday();

    if (dateInput.value === "" || !dateInput.checkValidity() || dateInput.value < getToday()) {
        return showHiringError("Please choose today or a future start date.");
    }

    let quantity = Number(quantityInput.value);

    if (quantityInput.value === "" || !Number.isSafeInteger(quantity) ||
        quantity < service.minimumQuantity || !quantityInput.checkValidity()) {
        return showHiringError("Enter a whole number of at least " + service.minimumQuantity +
            " for the booking quantity.");
    }

    let amount = service.rate * quantity;

    if (!Number.isSafeInteger(amount)) {
        return showHiringError("The booking quantity is too large.");
    }

    /* Save through the shared rule (common.js), which re-checks the driver */
    let result = updateState(function(s) {
        return createHiringRequest(s, {
            customerId: me.id,
            driverId: driver.id,
            startDate: dateInput.value,
            endDate: calculateHiringEndDate(dateInput.value, quantity, service.unit),
            duties: formatJobType(service.jobType) + " — " + formatHiringQuantity(quantity, service.unit),
            offeredSalary: amount,
            jobType: service.jobType,
            rate: service.rate,
            unit: service.unit,
            quantity: quantity,
            scope: service.scope
        });
    });

    if (result.ok === false) {
        return showHiringError(result.error);
    }

    document.getElementById("hiringForm").reset();
    let message = document.getElementById("hireMessage");
    message.style.color = "rgb(108, 0, 86)";
    message.textContent = result.request.id + " saved. It now waits for the driver to accept.";

    refreshAll();
    showSection("requestsSection");
    showMessage("requestMessage", "Request " + result.request.id + " sent to " +
        escapeText(driver.name) + ". It now waits for the driver to accept.", "success");
    return false;
}


/* ==========================================================
   C2: Request Drivers from an Agency (bulk request)
   ========================================================== */

function renderAgencyOptions() {
    let s = getState();
    let select = document.getElementById("bulkAgency");
    let keep = select.value;
    let options = "<option value=''>-- Select Agency --</option>";

    for (const agency of s.agencies) {
        if (agency.verificationStatus === "approved") {
            options += "<option value='" + agency.id + "'" + (agency.id === keep ? " selected" : "") + ">" +
                escapeText(agency.name + " (" + agency.area + ")") + "</option>";
        }
    }

    select.innerHTML = options;
}

function submitBulkRequest() {
    let agencyId = document.getElementById("bulkAgency").value;
    let headcountText = document.getElementById("bulkHeadcount").value.trim();
    let start = document.getElementById("bulkStart").value;
    let end = document.getElementById("bulkEnd").value;
    let duties = document.getElementById("bulkDuties").value.trim();
    let salaryText = document.getElementById("bulkSalary").value.trim();

    let fields = ["bulkAgency", "bulkHeadcount", "bulkStart", "bulkEnd", "bulkDuties", "bulkSalary"];
    let valid = true;

    clearErrors(fields);
    hideMessage("bulkMessage");

    if (agencyId === "") {
        showError("bulkAgency", "Choose an agency.");
        valid = false;
    }

    if (!isDigitsOnly(headcountText) || Number(headcountText) < 1 || Number(headcountText) > 20) {
        showError("bulkHeadcount", "Enter a whole number from 1 to 20.");
        valid = false;
    }

    if (start === "" || start < getToday()) {
        showError("bulkStart", "Choose today or a future start date.");
        valid = false;
    }

    if (end === "") {
        showError("bulkEnd", "Choose an end date.");
        valid = false;
    } else if (start !== "" && end < start) {
        showError("bulkEnd", "End date cannot be before the start date.");
        valid = false;
    }

    if (isEmpty(duties)) {
        showError("bulkDuties", "Describe the duties.");
        valid = false;
    }

    if (!isDigitsOnly(salaryText) || Number(salaryText) < 5000 || Number(salaryText) > 200000) {
        showError("bulkSalary", "Salary must be a number between 5000 and 200000.");
        valid = false;
    }

    if (valid === false) {
        return false;
    }

    let result = updateState(function(s) {
        let request = {
            id: createId("br"),
            customerId: me.id,
            agencyId: agencyId,
            headcount: Number(headcountText),
            startDate: start,
            endDate: end,
            duties: duties,
            offeredSalary: Number(salaryText),
            status: "open"
        };
        s.bulkRequests.push(request);
        addLog(s, "bulkRequest", request.id, "created");
        return ruleOk({ request: request });
    });

    document.getElementById("bulkForm").reset();
    showMessage("bulkMessage", "Request " + result.request.id + " sent. The agency will propose drivers; " +
        "you approve each one in My Requests.", "success");
    renderAgencyRequests();
    return false;
}


/* ==========================================================
   C2: My Requests (direct hiring)
   ========================================================== */

function renderRequests() {
    let s = getState();
    let requests = myRequests(s);
    let rows = "";

    for (let i = 0; i < requests.length; i++) {
        let request = requests[i];
        let action = "-";

        if (request.status === "pending") {
            action = "<button type='button' onclick=\"cancelRequest('" + request.id + "', this)\">Cancel Request</button>";
        } else if (request.status === "accepted") {
            action = "<button type='button' class='btn btn-small btn-success' onclick=\"confirmRequest('" +
                request.id + "', this)\">Confirm</button>";
        } else if (request.status === "confirmed") {
            action = "Contract active";
            for (const c of s.contracts) {
                if (c.sourceType === "direct" && c.sourceId === request.id && c.status === "completed") {
                    action = "<button type='button' class='btn btn-small' onclick=\"showSection('reviewsSection')\">Leave Review</button>";
                }
            }
        }

        rows +=
            "<tr>" +
            "<td>" + escapeText(request.id) + "</td>" +
            "<td>" + userName(s, request.driverId) + "</td>" +
            "<td>" + escapeText(request.duties) + "</td>" +
            "<td>" + formatDate(request.startDate) + " to " + formatDate(request.endDate) + "</td>" +
            "<td>" + request.offeredSalary.toLocaleString() + " BDT</td>" +
            "<td>" + badgeHtml(request.status) + "<br><span class='hint'>" + requestStatusText(request.status) + "</span></td>" +
            "<td>" + action + "</td>" +
            "</tr>";
    }

    if (requests.length === 0) {
        rows = emptyRow(7, "No hiring requests found.");
    }

    document.getElementById("requestsBody").innerHTML = rows;
}

function cancelRequest(requestId, button) {
    if (!confirm("Cancel request " + requestId + "?")) {
        return;
    }

    button.disabled = true;
    let result = updateState(function(s) { return cancelHiringRequest(s, requestId); });

    if (result.ok === false) {
        showMessage("requestMessage", escapeText(result.error), "error");
    } else {
        showMessage("requestMessage", requestId + " has been cancelled.", "success");
    }

    refreshAll();
}

/* The driver accepted -> the customer confirms -> ONE contract is created */
function confirmRequest(requestId, button) {
    button.disabled = true;
    let result = updateState(function(s) { return confirmHiringRequest(s, requestId); });

    if (result.ok === false) {
        showMessage("requestMessage", escapeText(result.error), "error");
    } else {
        showMessage("requestMessage", requestId + " confirmed. Contract " + result.contract.id + " is now active.", "success");
    }

    refreshAll();
}


/* ==========================================================
   C2: Agency requests and replacement decisions
   (shared agency rules from common.js)
   ========================================================== */

function renderAgencyRequests() {
    let s = getState();

    // ----- Bulk requests with the drivers the agency proposed -----
    let cards = "";

    for (const request of s.bulkRequests) {
        if (request.customerId !== me.id) {
            continue;
        }

        let rows = "";

        for (const a of s.assignments) {
            if (a.bulkRequestId !== request.id) {
                continue;
            }

            let buttons = "-";

            if (a.status === "accepted") {
                buttons = "<button type='button' class='btn btn-small btn-success' onclick=\"decideAssignment('" + a.id + "', true, this)\">Approve</button> " +
                    "<button type='button' class='btn btn-small btn-secondary' onclick=\"decideAssignment('" + a.id + "', false, this)\">Decline</button>";
            } else if (a.status === "proposed") {
                buttons = "Waiting for the driver to accept";
            }

            rows += "<tr><td>" + userName(s, a.driverId) + "</td><td>" + badgeHtml(a.status) + "</td><td>" + buttons + "</td></tr>";
        }

        if (rows === "") {
            rows = emptyRow(3, "The agency has not proposed anyone yet.");
        }

        let agency = findRecord(s.agencies, request.agencyId);

        cards += "<div class='card'>" +
            "<h3>" + escapeText(request.duties) + " " + badgeHtml(request.status) + "</h3>" +
            "<p>" + escapeText(agency.name) + " &middot; " + formatDate(request.startDate) + " to " +
            formatDate(request.endDate) + " &middot; " + confirmedCount(s, request.id) + " / " +
            request.headcount + " confirmed</p>" +
            "<div class='table-wrapper'><table class='data-table'>" +
            "<thead><tr><th>Driver</th><th>Status</th><th>Decision</th></tr></thead>" +
            "<tbody>" + rows + "</tbody>" +
            "</table></div>" +
            "</div>";
    }

    document.getElementById("bulkList").innerHTML = cards === "" ? "<p class='empty-row'>No agency requests yet.</p>" : cards;

    // ----- Replacement decisions -----
    let reps = "";

    for (const rep of s.replacements) {
        let contract = findRecord(s.contracts, rep.originalContractId);

        if (!contract || contract.customerId !== me.id) {
            continue;
        }

        let buttons = "";

        if (rep.status === "pending" && !rep.customerApproved) {
            buttons = "<p><button type='button' class='btn btn-small btn-success' onclick=\"decideReplacementClick('" + rep.id + "', true, this)\">Approve</button> " +
                "<button type='button' class='btn btn-small btn-secondary' onclick=\"decideReplacementClick('" + rep.id + "', false, this)\">Reject</button></p>";
        }

        reps += "<div class='card'>" +
            "<h3>" + userName(s, contract.driverId) + " &rarr; " + userName(s, rep.replacementDriverId) + " " + badgeHtml(rep.status) + "</h3>" +
            "<p>Reason: " + escapeText(rep.reason) + "</p>" +
            "<p class='hint'>Driver consent: " + (rep.driverAccepted ? "accepted" : "waiting") +
            " &middot; Current contract: " + contract.status + "</p>" +
            buttons +
            "</div>";
    }

    document.getElementById("replacementDecisionList").innerHTML = reps === "" ? "<p class='empty-row'>No replacement decisions.</p>" : reps;
}

/* Approve -> confirmAssignment (headcount rule), Decline -> declineAssignmentAsCustomer */
function decideAssignment(assignmentId, approve, button) {
    button.disabled = true;
    let result = updateState(function(s) {
        return approve ? confirmAssignment(s, assignmentId) : declineAssignmentAsCustomer(s, assignmentId);
    });

    if (result.ok === false) {
        showMessage("requestMessage", escapeText(result.error), "error");
    } else {
        showMessage("requestMessage", approve ? "Driver approved. A contract was created." : "Driver declined.", "success");
    }

    refreshAll();
}

function decideReplacementClick(replacementId, approve, button) {
    button.disabled = true;
    let result = updateState(function(s) { return decideReplacement(s, replacementId, approve); });

    if (result.ok === false) {
        showMessage("requestMessage", escapeText(result.error), "error");
    } else if (result.finalised) {
        showMessage("requestMessage", "Approved. The replacement contract is now active and the original is marked replaced.", "success");
    } else {
        showMessage("requestMessage", approve ? "Approved. Waiting for the new driver to accept." : "Replacement rejected. Your current contract is unchanged.", "success");
    }

    refreshAll();
}


/* ==========================================================
   C3: My Reviews (was reviews.js)
   One review per completed contract; saving again updates it.
   ========================================================== */

function myCompletedContracts(s) {
    let list = [];

    for (const c of s.contracts) {
        if (c.customerId === me.id && c.status === "completed") {
            list.push(c);
        }
    }

    return list;
}

function findReviewIndex(s, contractId) {
    for (let i = 0; i < s.reviews.length; i++) {
        if (s.reviews[i].contractId === contractId) {
            return i;
        }
    }

    return -1;
}

function populateReviewRequests() {
    let s = getState();
    let select = document.getElementById("driverSelect");
    let submit = document.getElementById("reviewSubmit");
    let keep = select.value;

    let options = "<option value=''>-- Select Completed Contract --</option>";
    let contracts = myCompletedContracts(s);

    for (const c of contracts) {
        options += "<option value='" + c.id + "'" + (c.id === keep ? " selected" : "") + ">" +
            userName(s, c.driverId) + " (" + c.id + " - Completed " + formatDate(c.endDate) + ")" +
            "</option>";
    }

    select.innerHTML = options;
    select.disabled = contracts.length === 0;
    submit.disabled = contracts.length === 0;

    return contracts.length;
}

function renderCustomerReviews() {
    let s = getState();
    let reviews = myReviews(s);
    let rows = "";

    for (let i = 0; i < reviews.length; i++) {
        let review = reviews[i];

        rows +=
            "<tr>" +
            "<td>" + escapeText(review.id) + "</td>" +
            "<td>" + escapeText(review.contractId) + "</td>" +
            "<td>" + userName(s, review.driverId) + "</td>" +
            "<td>" + review.rating + " / 5</td>" +
            "<td>" + escapeText(review.comment) + "</td>" +
            "<td>" + (review.visibility === "hidden" ? badgeHtml("hidden") + "<br><span class='hint'>Hidden by an admin</span>" : badgeHtml("public")) + "</td>" +
            "</tr>";
    }

    if (reviews.length === 0) {
        rows = emptyRow(6, "No reviews saved yet.");
    }

    document.getElementById("reviewsBody").innerHTML = rows;
}

function prepareReviewsPage() {
    let completedCount = populateReviewRequests();

    renderCustomerReviews();

    let message = document.getElementById("reviewMessage");

    if (completedCount === 0) {
        message.textContent = "You can leave a review after a contract is completed.";
    } else {
        message.textContent = "Select a completed contract to write or update its review.";
    }
}

function loadSelectedReview() {
    let s = getState();
    let contractId = document.getElementById("driverSelect").value;
    let rating = document.getElementById("rating");
    let comment = document.getElementById("review");
    let message = document.getElementById("reviewMessage");

    rating.value = "";
    comment.value = "";

    if (contractId === "") {
        message.textContent = "Select a completed contract to write or update its review.";
        return;
    }

    let index = findReviewIndex(s, contractId);

    if (index !== -1) {
        rating.value = String(s.reviews[index].rating);
        comment.value = s.reviews[index].comment;
        message.textContent = "This contract already has a review. Saving will update it.";
    } else {
        message.textContent = "Write your review for " + contractId + ".";
    }
}

function resetReviewMessage() {
    document.getElementById("reviewMessage").textContent =
        "Select a completed contract to write or update its review.";
}

function addReview() {
    let message = document.getElementById("reviewMessage");

    let contractId = document.getElementById("driverSelect").value;
    let rating = Number(document.getElementById("rating").value);
    let comment = document.getElementById("review").value.trim();

    if (contractId === "") {
        message.textContent = "Please select a completed contract.";
        return false;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        message.textContent = "Please select a rating from 1 to 5.";
        return false;
    }

    if (comment === "") {
        message.textContent = "Please write a review.";
        return false;
    }

    let result = updateState(function(s) {
        let contract = findRecord(s.contracts, contractId);

        if (contract === null || contract.customerId !== me.id || contract.status !== "completed") {
            return ruleFail("Only your completed contracts can be reviewed.");
        }

        let index = findReviewIndex(s, contractId);

        if (index !== -1) {
            // Update keeps the id and the admin's visibility decision
            s.reviews[index].rating = rating;
            s.reviews[index].comment = comment;
            return ruleOk({ updated: true });
        }

        s.reviews.push({
            id: createId("rv"),
            contractId: contract.id,
            customerId: me.id,
            driverId: contract.driverId,
            rating: rating,
            comment: comment,
            visibility: "public"
        });
        return ruleOk({ updated: false });
    });

    if (result.ok === false) {
        message.textContent = result.error;
        return false;
    }

    renderCustomerReviews();
    renderDashboardStats();

    message.textContent = result.updated ? "Your review has been updated." : "Your review has been saved.";

    return false;
}


/* ---------- START ---------- */
me = requireRole("customer");

if (me !== null) {
    updateRateFilter();
    prepareDriverComparison();
    refreshAll();
    showSection("dashboardSection");
}