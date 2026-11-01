/**
 * @file inlineValidators.ts — State 9: Actionable Inline Form Validation with Specific Fixes.
 * Never returns generic "Invalid input". Always tells the user what is wrong and how to fix it.
 */

export interface ValidationFeedback {
    valid: boolean;
    issue?: string;
    specificFix?: string;
    /** Optional 1-click auto-correction value (e.g., fixing 'aman@gmial.com' -> 'aman@gmail.com') */
    suggestedValue?: string;
}

const COMMON_EMAIL_DOMAIN_TYPOS: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gmail.con": "gmail.com",
    "gmail.co": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahooo.com": "yahoo.com",
    "yahoo.con": "yahoo.com",
    "outlok.com": "outlook.com",
    "hotmial.com": "hotmail.com",
    "icoud.com": "icloud.com",
};

export function validateCustomerEmail(raw: string, required = false): ValidationFeedback {
    const value = raw.trim();
    if (!value) {
        if (!required) return { valid: true };
        return {
            valid: false,
            issue: "Email address is required for your PDF booking voucher.",
            specificFix: "Enter your email address (e.g., name@gmail.com).",
        };
    }

    if (value.includes(" ")) {
        return {
            valid: false,
            issue: "Email address contains spaces.",
            specificFix: "Remove any spaces from your email address.",
            suggestedValue: value.replace(/\s+/g, ""),
        };
    }

    if (!value.includes("@")) {
        return {
            valid: false,
            issue: "Missing '@' symbol in email address.",
            specificFix: `Add '@gmail.com' or your domain after '${value}'.`,
            suggestedValue: `${value}@gmail.com`,
        };
    }

    const [localPart, ...domainParts] = value.split("@");
    const domain = domainParts.join("@").toLowerCase();

    if (!localPart) {
        return {
            valid: false,
            issue: "Missing username before '@'.",
            specificFix: "Enter your email username before the '@' symbol.",
        };
    }

    if (!domain) {
        return {
            valid: false,
            issue: "Missing email domain after '@'.",
            specificFix: "Add a domain after '@' — for example, 'gmail.com' or 'outlook.com'.",
            suggestedValue: `${localPart}@gmail.com`,
        };
    }

    if (COMMON_EMAIL_DOMAIN_TYPOS[domain]) {
        const correctedDomain = COMMON_EMAIL_DOMAIN_TYPOS[domain];
        return {
            valid: false,
            issue: `Possible typo in '@${domain}'.`,
            specificFix: `Did you mean '${localPart}@${correctedDomain}'?`,
            suggestedValue: `${localPart}@${correctedDomain}`,
        };
    }

    if (!domain.includes(".") || domain.endsWith(".")) {
        return {
            valid: false,
            issue: `Incomplete domain '${domain}'.`,
            specificFix: "Add a top-level domain like '.com' or '.in' at the end.",
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(value)) {
        return {
            valid: false,
            issue: "Email format is incomplete.",
            specificFix: "Check for special characters and use the format name@domain.com.",
        };
    }

    return { valid: true };
}

export function validateIndianPhone(raw: string): ValidationFeedback {
    const stripped = raw.replace(/[\s\-+()]/g, "").replace(/^91/, "");

    if (!stripped) {
        return {
            valid: false,
            issue: "WhatsApp / Mobile number is required for chauffeur coordination.",
            specificFix: "Enter your 10-digit Indian mobile number.",
        };
    }

    if (!/^\d+$/.test(stripped)) {
        return {
            valid: false,
            issue: "Phone number contains letters or invalid symbols.",
            specificFix: "Enter digits only (0–9).",
            suggestedValue: stripped.replace(/\D/g, ""),
        };
    }

    if (!/^[6-9]/.test(stripped)) {
        return {
            valid: false,
            issue: "Invalid starting digit for an Indian mobile number.",
            specificFix: "Indian mobile numbers must start with 6, 7, 8, or 9.",
        };
    }

    if (stripped.length < 10) {
        const remaining = 10 - stripped.length;
        return {
            valid: false,
            issue: `Mobile number is ${stripped.length} digits long.`,
            specificFix: `Enter ${remaining} more digit${remaining === 1 ? "" : "s"} to complete your 10-digit number.`,
        };
    }

    if (stripped.length > 10) {
        const extra = stripped.length - 10;
        return {
            valid: false,
            issue: `Mobile number has ${extra} extra digit${extra === 1 ? "" : "s"}.`,
            specificFix: "Remove extra digits so the number is exactly 10 digits.",
            suggestedValue: stripped.slice(0, 10),
        };
    }

    return { valid: true };
}

export function validatePickupDateTimeIst(
    pickupIsoOrLocal: string,
    minLeadMinutes = 120,
    nowMs: number = Date.now()
): ValidationFeedback {
    if (!pickupIsoOrLocal) {
        return {
            valid: false,
            issue: "Pickup date and time are required.",
            specificFix: "Select your travel date and pickup time.",
        };
    }

    const pickupDate = new Date(pickupIsoOrLocal);
    if (Number.isNaN(pickupDate.getTime())) {
        return {
            valid: false,
            issue: "Pickup date or time format is invalid.",
            specificFix: "Pick a valid date and time from the calendar.",
        };
    }

    const earliestAllowedMs = nowMs + minLeadMinutes * 60_000;
    if (pickupDate.getTime() < earliestAllowedMs) {
        const earliestFormatted = new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        }).format(new Date(earliestAllowedMs));

        return {
            valid: false,
            issue: "Pickup time is too soon or in the past.",
            specificFix: `Select a pickup time at least ${Math.round(minLeadMinutes / 60)} hours from now (earliest available: ${earliestFormatted} IST).`,
        };
    }

    return { valid: true };
}

export function validateReturnDateTime(
    pickupIsoOrLocal: string,
    returnIsoOrLocal?: string
): ValidationFeedback {
    if (!returnIsoOrLocal) {
        return {
            valid: false,
            issue: "Return date is required for round-trip bookings.",
            specificFix: "Select the date and time for your return journey.",
        };
    }

    const pickupMs = new Date(pickupIsoOrLocal).getTime();
    const returnMs = new Date(returnIsoOrLocal).getTime();

    if (Number.isNaN(returnMs) || returnMs <= pickupMs) {
        return {
            valid: false,
            issue: "Return date/time is earlier than or equal to pickup time.",
            specificFix: "Choose a return date and time after your scheduled pickup.",
        };
    }

    return { valid: true };
}

export function validatePickupAddress(raw: string, originCity = "Agra"): ValidationFeedback {
    const clean = raw.trim();
    if (!clean) {
        return {
            valid: false,
            issue: "Pickup address is empty.",
            specificFix: `Enter your hotel name, railway station, or landmark in ${originCity}.`,
        };
    }
    if (clean.length < 5) {
        return {
            valid: false,
            issue: "Pickup address is too short for our chauffeur to locate you.",
            specificFix: `Add a specific hotel name, gate, or street landmark in ${originCity} (at least 5 characters).`,
        };
    }
    return { valid: true };
}