const signupFields = ["role", "fullName", "email", "phone", "password"];

/* The values in the "Register As" select -> the role saved in data.js */
const signupRoleValues = {
    customer: "customer",
    driver: "driver",
    agency: "agency_manager"
};


/* ---------------------------------------------------------------------
   VALIDATION
   --------------------------------------------------------------------- */
function validateSignup() {
    let roleSelect = document.getElementById("role");
    let roleValue = roleSelect.value;
    clearAllSignupErrors();

    if (isEmpty(roleValue) || !signupRoleValues[roleValue]) {
        showError("role", "Please choose the type of account.");
        showMessage("signupMessage", "Please fix the fields marked in red.", "error");
        return false;
    }

    // Run all field checks
    let commonOk = validateCommon();

    if (!commonOk) {
        showMessage("signupMessage", "Please fix the fields marked in red.", "error");
        return false;
    }

    // ----- Everything is valid: build and save the new user object -----
    let s = getState();
    let roleCode = signupRoleValues[roleValue];
    let newId = createId("u");
    let fullName = document.getElementById("fullName").value.trim();
    let email = document.getElementById("email").value.trim();
    let cleanPhone = normalizePhone(document.getElementById("phone").value.trim());
    let password = document.getElementById("password").value;

    let newUser = {
        id: newId,
        name: fullName,
        email: email,
        password: password,
        role: roleCode,
        status: "active"
    };

    s.users.push(newUser);

    if (roleCode === "driver") {
        s.driverProfiles.push({
            driverId: newId,
            phone: cleanPhone,
            area: "Dhaka",
            experienceYears: 1,
            expectedSalary: 20000,
            vehicleCategories: ["car"],
            verificationStatus: "unverified",
            summary: "",
            documentName: "",
            services: []
        });
    } else if (roleCode === "agency_manager") {
        s.agencies.push({
            id: createId("ag"),
            managerId: newId,
            name: fullName + " Transport Agency",
            area: "Dhaka",
            verificationStatus: "unverified"
        });
    }

    saveState(s);
    console.log("New user:", newUser);

    let roleLabel = roleSelect.options[roleSelect.selectedIndex].text;
    let text = "Welcome, <strong>" + escapeText(newUser.name) + "</strong>! Your " +
        escapeText(roleLabel.toLowerCase()) + " account was created (user id " + newUser.id + "). " +
        "<a href='login.html'>Log in now</a>.";

    showMessage("signupMessage", text, "success");

    // Empty the form
    document.getElementById("signupForm").reset();
    return false;   // stay on this page so the message can be read
}


// Checks all fields and marks every invalid field in red together
function validateCommon() {
    let isValid = true;

    let fullName = document.getElementById("fullName").value.trim();
    let email = document.getElementById("email").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let password = document.getElementById("password").value;

    if (fullName.length < 3) {
        showError("fullName", "Full name must be at least 3 characters.");
        isValid = false;
    }

    if (isEmpty(email)) {
        showError("email", "Email is required.");
        isValid = false;
    } else if (isValidEmail(email) === false) {
        showError("email", "Please enter a valid email address.");
        isValid = false;
    } else if (isEmailTaken(email)) {
        showError("email", "An account with this email already exists.");
        isValid = false;
    }

    let cleanPhone = normalizePhone(phone);
    if (isDigitsOnly(cleanPhone) === false || cleanPhone.length !== 11 || cleanPhone.slice(0, 2) !== "01") {
        showError("phone", "Phone must be 11 digits and start with 01.");
        isValid = false;
    }

    if (password.length < 6) {
        showError("password", "Password must be at least 6 characters.");
        isValid = false;
    }

    return isValid;
}


// true if any user in saved state already has this email
function isEmailTaken(email) {
    let s = getState();
    for (const user of s.users) {
        if (user.email !== undefined && user.email.toLowerCase() === email.toLowerCase()) {
            return true;
        }
    }
    return false;
}

function isValidEmail(text) {
    let atPos = text.indexOf("@");
    let dotPos = text.indexOf(".", atPos);
    return atPos > 0 && dotPos > atPos + 1 && dotPos < text.length - 1 && text.indexOf(" ") === -1;
}

// Strips spaces, dashes, and leading +880 / 880 so "+880 1700-000000" -> "01700000000"
function normalizePhone(text) {
    let cleaned = "";
    for (let i = 0; i < text.length; i++) {
        let ch = text[i];
        if (ch !== " " && ch !== "-" && ch !== "+") {
            cleaned += ch;
        }
    }
    if (cleaned.slice(0, 3) === "880" && cleaned.length === 13) {
        cleaned = "0" + cleaned.slice(3);
    }
    return cleaned;
}

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

function clearAllSignupErrors() {
    clearErrors(signupFields);
    hideMessage("signupMessage");
}