/* ==========================================================
   DriverDen - Login and Registration (login.html, register.html)
   Owner: Hameem
   ----------------------------------------------------------
   Loaded after data.js and common.js.
   The demo accounts are the users in data.js (fictional email
   and password on each user). A successful login saves who logged
   in with setCurrentUser(), so every other page knows the account.
   ========================================================== */


/* Which page each role opens after login */
const roleDashboards = {
    customer: "customer.html",
    driver: "driver.html",
    agency_manager: "agency.html",
    admin: "admin.html"
};

/* The values in the "Select Role" list -> the role saved in data.js */
const roleSelectValues = {
    customer: "customer",
    driver: "driver",
    agency: "agency_manager",
    admin: "admin"
};


/* ==========================================================
   Shared Helpers
   ========================================================== */

function showAuthMessage(elementId, text, type) {
    let message = document.getElementById(elementId);

    if (message === null) {
        alert(text);
        return;
    }

    message.textContent = text;
    message.className = "message " + type;
}

function hideAuthMessage(elementId) {
    let message = document.getElementById(elementId);

    if (message !== null) {
        message.textContent = "";
        message.className = "message";
    }
}

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

/* Builds the demo accounts table from the users in data.js */
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

/* "Show password": switch the input type between password and text */
function togglePassword() {
    let passwordInput = document.getElementById("password");

    if (document.getElementById("showPassword").checked) {
        passwordInput.type = "text";
    } else {
        passwordInput.type = "password";
    }
}

/* The "Use" buttons in the demo accounts table fill in the form */
function fillDemo(roleValue, email, password) {
    document.getElementById("role").value = roleValue;
    document.getElementById("email").value = email;
    document.getElementById("password").value = password;

    hideAuthMessage("loginMessage");
}

function validateLogin() {
    let roleSelect = document.getElementById("role");
    let emailInput = document.getElementById("email");
    let passwordInput = document.getElementById("password");

    let role = roleSelect.value;
    let email = emailInput.value.trim();
    let password = passwordInput.value;

    hideAuthMessage("loginMessage");

    /* 1. Check the fields */

    if (role === "") {
        showAuthMessage("loginMessage", "Please choose your role.", "error");
        return false;
    }

    if (email === "" || !emailInput.checkValidity()) {
        showAuthMessage("loginMessage", "Please enter a valid email address.", "error");
        return false;
    }

    if (password === "") {
        showAuthMessage("loginMessage", "Please enter your password.", "error");
        return false;
    }

    /* 2. Find the account */

    let account = findAccountByEmail(email);

    if (account === null || account.password !== password) {
        showAuthMessage("loginMessage", "Wrong email or password. Please try again.", "error");
        return false;
    }

    /* 3. Suspended accounts may not log in */

    if (account.status === "suspended") {
        showAuthMessage(
            "loginMessage",
            "Hello " + account.name + ", your account has been suspended by an admin. " +
            "Please contact support.",
            "info"
        );
        return false;
    }

    /* 4. The selected role must match the account */

    if (roleSelectValues[role] !== account.role) {
        showAuthMessage(
            "loginMessage",
            "This account is registered as a " + statusLabel(account.role) +
            ". Please choose the correct role and try again.",
            "error"
        );
        return false;
    }

    /* 5. Remember who logged in, then open the dashboard that matches the role */

    setCurrentUser(account.id);

    let form = document.getElementById("loginForm");
    form.action = roleDashboards[account.role];

    return true;
}

/* Demo convenience: puts all sample data back to the start */
function resetDemoClick() {
    if (!confirm("Reset all demo data to the original sample data?")) {
        return;
    }
    resetDemo();
    showAuthMessage("loginMessage", "Demo data reset to the original sample data.", "info");
    renderDemoAccounts();
}


/* ==========================================================
   Registration Page
   ========================================================== */

function validateSignup() {
    let roleSelect = document.getElementById("role");
    let fullNameInput = document.getElementById("fullName");
    let emailInput = document.getElementById("email");
    let phoneInput = document.getElementById("phone");
    let passwordInput = document.getElementById("password");

    let fullName = fullNameInput.value.trim();
    let email = emailInput.value.trim();
    let phone = phoneInput.value.trim();
    let password = passwordInput.value;

    hideAuthMessage("signupMessage");

    /* 1. Check the fields */

    if (fullName === "") {
        showAuthMessage("signupMessage", "Please enter your full name.", "error");
        return false;
    }

    if (email === "" || !emailInput.checkValidity()) {
        showAuthMessage("signupMessage", "Please enter a valid email address.", "error");
        return false;
    }

    if (phone === "" || !phoneInput.checkValidity()) {
        showAuthMessage("signupMessage", "Please enter a valid phone number.", "error");
        return false;
    }

    if (password.length < 6) {
        showAuthMessage("signupMessage", "Password must be at least 6 characters.", "error");
        return false;
    }

    /* 2. Existing accounts cannot register again */

    if (findAccountByEmail(email) !== null) {
        showAuthMessage(
            "signupMessage",
            "An account with this email already exists. Please sign in instead.",
            "error"
        );
        return false;
    }

    /* 3. Confirm and open the login page */

    let roleLabel = roleSelect.options[roleSelect.selectedIndex].text;

    alert(
        "Thank you, " + fullName + "! Your " + roleLabel +
        " registration was recorded in this demo. " +
        "Opening the login page."
    );

    return true;
}


/* ---------- START ---------- */
renderDemoAccounts();
