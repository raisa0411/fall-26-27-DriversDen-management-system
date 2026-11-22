const roleDashboards = {
    customer: "customer.html",
    driver: "driver.html",
    agency_manager: "agency.html",
    admin: "admin.html"
};

const roleSelectValues = {
    customer: "customer",
    driver: "driver",
    agency: "agency_manager",
    admin: "admin"
};


/* ==========================================================
   Shared Helpers
   ========================================================== */

/* Finds a user in the saved data by email (capitals ignored) */
function findAccountByEmail(email) {
    let s = getState();

    for (let i = 0; i < s.users.length; i++) {
        if (s.users[i].email.toLowerCase() === email.toLowerCase()) {
            return s.users[i];
        }
    }

    return null;
}

/* The role badge class used on the demo accounts table */
function roleBadgeClass(role) {
    switch (role) {
        case "customer":
            return "customer";
        case "driver":
            return "driver";
        case "agency_manager":
            return "manager";
        default:
            return "admin";
    }
}

/* The "Select Role" value that matches a saved role */
function roleSelectValueFor(role) {
    for (const value in roleSelectValues) {
        if (roleSelectValues[value] === role) {
            return value;
        }
    }
    return "";
}


/* ==========================================================
   Login Page
   ========================================================== */

function renderDemoAccounts() {
    let body = document.getElementById("demoAccountsBody");

    if (body === null) {
        return;
    }

    let s = getState();
    let rows = "";

    for (const user of s.users) {
        let badgeClass = user.status === "suspended" ? "pending" : roleBadgeClass(user.role);
        let badgeText = user.status === "suspended" ? "Suspended" : statusLabel(user.role);

        rows += "<tr>" +
            "<td><span class='badge " + badgeClass + "'>" + badgeText + "</span></td>" +
            "<td>" + escapeText(user.name) + "<br><span class='hint'>" +
            escapeText(user.email) + " / " + escapeText(user.password) + "</span></td>" +
            "<td><button type='button' class='btn btn-small' onclick=\"fillDemo('" +
            roleSelectValueFor(user.role) + "', '" + user.email + "', '" + user.password + "')\">Use</button></td>" +
            "</tr>";
    }

    body.innerHTML = rows;
}

function clearLoginErrors() {
    hideMessage("loginMessage");
}

// "Show password": switch the input type between password and text
function togglePassword() {
    let passwordInput = document.getElementById("password");
    if (document.getElementById("showPassword").checked) {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
}

// The "Use" buttons in the demo accounts table fill in the form
function fillDemo(roleValue, email, password) {
    document.getElementById("role").value = roleValue;
    document.getElementById("email").value = email;
    document.getElementById("password").value = password;
    clearLoginErrors();
}

function validateLogin() {
    // 1. Read what the user typed (.value)
    let roleSelect = document.getElementById("role");
    let emailInput = document.getElementById("email");
    let passwordInput = document.getElementById("password");

    let role = roleSelect.value;
    let email = emailInput.value.trim();
    let password = passwordInput.value;

    let isValid = true;
    let errors = [];
    clearLoginErrors();

    // 2. Check all fields together
    if (isEmpty(role)) {
        errors.push("Please choose your role.");
        isValid = false;
    }

    if (isEmpty(email) || !emailInput.checkValidity()) {
        errors.push("Please enter a valid email address.");
        isValid = false;
    }

    if (isEmpty(password)) {
        errors.push("Please enter your password.");
        isValid = false;
    }

    if (isValid === false) {
        showMessage("loginMessage", errors.join("<br>"), "error");
        return false;
    }

    // 3. Find the account
    let account = findAccountByEmail(email);

    if (account === null || account.password !== password) {
        showMessage("loginMessage", "Wrong email or password. Please try again.", "error");
        return false;
    }

    // 4. Only Active accounts may log in
    if (account.status === "suspended") {
        showMessage(
            "loginMessage",
            "Hello " + escapeText(account.name) + ", your account has been suspended by an admin. Please contact support.",
            "error"
        );
        return false;
    }

    if (account.status === "pending") {
        showMessage(
            "loginMessage",
            "Hello " + escapeText(account.name) + ", your " + statusLabel(account.role).toLowerCase() +
            " account is waiting for an admin to approve it. Please try again later.",
            "error"
        );
        return false;
    }

    // 5. The selected role must match the account
    if (roleSelectValues[role] !== account.role) {
        showMessage(
            "loginMessage",
            "This account is registered as a " + statusLabel(account.role) +
            ". Please choose the correct role and try again.",
            "error"
        );
        return false;
    }

    // 6. Remember who logged in, then open the dashboard that matches the role
    setCurrentUser(account.id);

    let form = document.getElementById("loginForm");
    form.action = roleDashboards[account.role];

    console.log("Login OK: " + account.name + " (" + account.role + ") -> " + form.action);
    return true;
}

function resetDemoClick() {
    if (!confirm("Reset all demo data to the original sample data?")) {
        return;
    }
    resetDemo();
    showMessage("loginMessage", "Demo data reset to the original sample data.", "info");
    renderDemoAccounts();
}


/* ---------- START ---------- */
renderDemoAccounts();