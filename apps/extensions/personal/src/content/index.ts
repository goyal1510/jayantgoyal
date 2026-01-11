import { PersonalInfo } from "../types";

// Comprehensive field matching patterns for job portals
const FIELD_PATTERNS: Record<string, RegExp[]> = {
  // Basic Info
  firstName: [
    /first[\s_-]?name/i,
    /fname/i,
    /given[\s_-]?name/i,
    /forename/i,
    /first[\s_-]?name[\s_-]?\(as[\s_-]?per[\s_-]?id\)/i,
  ],
  lastName: [
    /last[\s_-]?name/i,
    /lname/i,
    /surname/i,
    /family[\s_-]?name/i,
  ],
  email: [
    /email/i,
    /e[\s_-]?mail/i,
    /email[\s_-]?address/i,
    /email[\s_-]?id/i,
    /^email$/i, // autocomplete="email"
    /^username$/i, // often used for email
  ],
  phone: [
    /phone/i,
    /mobile/i,
    /contact[\s_-]?number/i,
    /telephone/i,
    /tel/i,
    /phone[\s_-]?number/i,
    /mobile[\s_-]?number/i,
    /^tel$/i, // autocomplete="tel"
    /^tel-national$/i,
    /^tel-country-code$/i,
  ],
  dateOfBirth: [
    /date[\s_-]?of[\s_-]?birth/i,
    /dob/i,
    /birth[\s_-]?date/i,
    /birthday/i,
  ],
  gender: [
    /gender/i,
    /sex/i,
  ],
  
  // Address
  addressLine1: [
    /address[\s_-]?line[\s_-]?1/i,
    /address[\s_-]?1/i,
    /street[\s_-]?address/i,
    /address/i,
    /permanent[\s_-]?address/i,
  ],
  addressLine2: [
    /address[\s_-]?line[\s_-]?2/i,
    /address[\s_-]?2/i,
    /apartment/i,
    /unit/i,
    /flat/i,
  ],
  city: [
    /city/i,
    /current[\s_-]?city/i,
  ],
  state: [
    /state/i,
    /province/i,
  ],
  pinCode: [
    /pin[\s_-]?code/i,
    /postal[\s_-]?code/i,
    /zip[\s_-]?code/i,
    /zip/i,
    /pincode/i,
  ],
  country: [
    /country/i,
  ],
  currentLocation: [
    /current[\s_-]?location/i,
    /location/i,
    /city[\s_-]?of[\s_-]?residence/i,
  ],
  
  // Current Employment
  currentCompany: [
    /current[\s_-]?company/i,
    /present[\s_-]?company/i,
    /employer/i,
    /company[\s_-]?name/i,
    /organization/i,
  ],
  currentTitle: [
    /current[\s_-]?designation/i,
    /current[\s_-]?title/i,
    /current[\s_-]?role/i,
    /designation/i,
    /job[\s_-]?title/i,
    /position/i,
  ],
  currentDescription: [
    /current[\s_-]?job[\s_-]?description/i,
    /current[\s_-]?role[\s_-]?description/i,
    /current[\s_-]?responsibilities/i,
    /job[\s_-]?description/i,
    /role[\s_-]?description/i,
  ],
  currentStartDate: [
    /current[\s_-]?start[\s_-]?date/i,
    /joining[\s_-]?date/i,
    /start[\s_-]?date/i,
  ],
  currentCTC: [
    /current[\s_-]?ctc/i,
    /current[\s_-]?salary/i,
    /present[\s_-]?ctc/i,
    /present[\s_-]?salary/i,
    /ctc/i,
    /current[\s_-]?package/i,
  ],
  expectedCTC: [
    /expected[\s_-]?ctc/i,
    /expected[\s_-]?salary/i,
    /expected[\s_-]?package/i,
    /salary[\s_-]?expectation/i,
  ],
  noticePeriod: [
    /notice[\s_-]?period/i,
    /notice/i,
    /availability/i,
  ],
  totalExperience: [
    /total[\s_-]?experience/i,
    /years[\s_-]?of[\s_-]?experience/i,
    /experience/i,
    /work[\s_-]?experience/i,
  ],
  relevantExperience: [
    /relevant[\s_-]?experience/i,
  ],
  
  // Previous Companies (will be handled separately)
  previousCompany: [
    /previous[\s_-]?company/i,
    /past[\s_-]?company/i,
    /former[\s_-]?employer/i,
    /previous[\s_-]?employer/i,
  ],
  previousTitle: [
    /previous[\s_-]?designation/i,
    /previous[\s_-]?title/i,
    /previous[\s_-]?role/i,
  ],
  previousStartDate: [
    /previous[\s_-]?start[\s_-]?date/i,
    /start[\s_-]?date/i,
  ],
  previousEndDate: [
    /previous[\s_-]?end[\s_-]?date/i,
    /end[\s_-]?date/i,
    /leaving[\s_-]?date/i,
  ],
  previousDescription: [
    /job[\s_-]?description/i,
    /responsibilities/i,
    /roles[\s_-]?and[\s_-]?responsibilities/i,
    /description/i,
  ],
  
  // Education
  degree: [
    /degree/i,
    /qualification/i,
    /education/i,
  ],
  university: [
    /university/i,
    /college/i,
    /institution/i,
    /school/i,
  ],
  fieldOfStudy: [
    /field[\s_-]?of[\s_-]?study/i,
    /stream/i,
    /specialization/i,
    /major/i,
  ],
  startYear: [
    /start[\s_-]?year/i,
    /from[\s_-]?year/i,
  ],
  endYear: [
    /end[\s_-]?year/i,
    /to[\s_-]?year/i,
    /graduation[\s_-]?year/i,
  ],
  percentage: [
    /percentage/i,
    /percent/i,
    /%/i,
  ],
  cgpa: [
    /cgpa/i,
    /gpa/i,
  ],
  
  // Skills
  skills: [
    /skills/i,
    /technical[\s_-]?skills/i,
    /key[\s_-]?skills/i,
  ],
  
  // Links
  resumeLink: [
    /resume/i,
    /cv/i,
    /resume[\s_-]?link/i,
    /cv[\s_-]?link/i,
    /resume[\s_-]?url/i,
  ],
  githubLink: [
    /github/i,
    /git[\s_-]?hub/i,
    /github[\s_-]?profile/i,
  ],
  portfolioLink: [
    /portfolio/i,
    /website/i,
    /personal[\s_-]?website/i,
    /portfolio[\s_-]?link/i,
  ],
  linkedinLink: [
    /linkedin/i,
    /linked[\s_-]?in/i,
    /linkedin[\s_-]?profile/i,
  ],
  
  // Additional
  summary: [
    /summary/i,
    /objective/i,
    /professional[\s_-]?summary/i,
    /about[\s_-]?yourself/i,
  ],
  linkedinHeadline: [
    /linkedin[\s_-]?headline/i,
    /headline/i,
    /profile[\s_-]?headline/i,
  ],
  coverLetter: [
    /cover[\s_-]?letter/i,
    /cover[\s_-]?letter[\s_-]?text/i,
    /letter/i,
  ],
  preferredWorkType: [
    /preferred[\s_-]?work[\s_-]?type/i,
    /work[\s_-]?type/i,
    /work[\s_-]?mode/i,
    /remote/i,
    /hybrid/i,
  ],
  workAuthorization: [
    /work[\s_-]?authorization/i,
    /authorization/i,
    /visa[\s_-]?status/i,
    /work[\s_-]?permit/i,
  ],
  availabilityDate: [
    /availability[\s_-]?date/i,
    /available[\s_-]?from/i,
    /start[\s_-]?date/i,
    /when[\s_-]?can[\s_-]?you[\s_-]?start/i,
  ],
};

function matchField(fieldName: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(fieldName));
}

function fillField(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  if (element instanceof HTMLSelectElement) {
    // Try to find matching option
    const options = Array.from(element.options);
    const matchingOption = options.find(
      (opt) => opt.value.toLowerCase() === value.toLowerCase() || opt.text.toLowerCase() === value.toLowerCase()
    );
    if (matchingOption) {
      element.value = matchingOption.value;
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }
}

// Prefill field - same as fillField but for auto-prefill on page load
function prefillField(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  // Use the same logic as fillField to ensure values persist
  if (element instanceof HTMLSelectElement) {
    // Try to find matching option
    const options = Array.from(element.options);
    const matchingOption = options.find(
      (opt) => opt.value.toLowerCase() === value.toLowerCase() || opt.text.toLowerCase() === value.toLowerCase()
    );
    if (matchingOption) {
      element.value = matchingOption.value;
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    // Don't trigger blur for auto-prefill to avoid unwanted side effects
  }
  
  // Store in map for persistent watching
  filledFieldsMap.set(element, value);
  const fieldName = element.name || element.id || ((element instanceof HTMLSelectElement) ? "" : (element as HTMLInputElement | HTMLTextAreaElement).placeholder) || "unnamed";
  console.log("✓ Added field to watch map:", fieldName, "value:", value.substring(0, 30));
  
  // Immediately start watching this specific field
  if (!valueWatchers.has(element)) {
    watchSingleField(element, value);
  }
}

// Helper function to find nearby label text (even if not properly associated)
function findNearbyLabelText(input: HTMLElement): string {
  // Check for properly associated label (only available on form elements)
  if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement) {
    if (input.labels && input.labels.length > 0) {
      const firstLabel = input.labels[0];
      if (firstLabel) {
        return firstLabel.textContent?.toLowerCase() || "";
      }
    }
  }
  
  // Check for aria-labelledby
  const labelledBy = input.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) {
      return labelEl.textContent?.toLowerCase() || "";
    }
  }
  
  // Look for previous sibling that might be a label
  let prevSibling = input.previousElementSibling;
  while (prevSibling) {
    if (prevSibling.tagName === "LABEL" || prevSibling.textContent) {
      return prevSibling.textContent?.toLowerCase() || "";
    }
    prevSibling = prevSibling.previousElementSibling;
  }
  
  // Look for parent label
  let parent = input.parentElement;
  while (parent && parent.tagName !== "BODY") {
    if (parent.tagName === "LABEL") {
      return parent.textContent?.toLowerCase() || "";
    }
    parent = parent.parentElement;
  }
  
  // Look for nearby text in the same container
  const container = input.closest("div, form, fieldset, section");
  if (container) {
    const textNodes = Array.from(container.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
      .map(node => node.textContent?.toLowerCase() || "");
    if (textNodes.length > 0) {
      return textNodes.join(" ");
    }
  }
  
  return "";
}

function findAndPrefillFields(personalInfo: PersonalInfo, isPrefill: boolean = false) {
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );

  let filledCount = 0;
  const filledFields = new Set<string>();

  console.log(`Found ${inputs.length} form fields to check`);

  inputs.forEach((input, index) => {
    if (input.type === "hidden" || input.type === "submit" || input.type === "button" || input.type === "file") {
      return;
    }

    // Skip if already filled
    if (input.value && input.value.trim() !== "") {
      return;
    }

    const name = (input.name || "").toLowerCase();
    const id = (input.id || "").toLowerCase();
    const placeholder = input instanceof HTMLSelectElement ? "" : (input as HTMLInputElement | HTMLTextAreaElement).placeholder?.toLowerCase() || "";
    const label = findNearbyLabelText(input);
    const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";
    const autocomplete = input.getAttribute("autocomplete")?.toLowerCase() || "";
    const type = input.type?.toLowerCase() || "";
    const className = input.className?.toLowerCase() || "";
    
    // Build comprehensive field identifier
    const fieldIdentifier = `${name} ${id} ${placeholder} ${label} ${ariaLabel} ${autocomplete} ${type} ${className}`;
    
    // Debug logging for first few fields
    if (index < 5) {
      console.log(`Field ${index}:`, {
        name,
        id,
        placeholder,
        label: label.substring(0, 50),
        type,
        autocomplete
      });
    }

    // Check input type first for common types
    if (type === "email" && !filledFields.has("email")) {
      const value = personalInfo.email;
      if (value && value.trim() !== "") {
        if (isPrefill) {
          prefillField(input, value);
        } else {
          fillField(input, value);
        }
        filledCount++;
        filledFields.add("email");
        console.log("Matched email by input type");
        return; // Continue to next input
      }
    }
    
    if ((type === "tel" || type === "phone") && !filledFields.has("phone")) {
      const value = personalInfo.phone;
      if (value && value.trim() !== "") {
        if (isPrefill) {
          prefillField(input, value);
        } else {
          fillField(input, value);
        }
        filledCount++;
        filledFields.add("phone");
        console.log("Matched phone by input type");
        return; // Continue to next input
      }
    }
    
    // Check autocomplete attribute
    if (autocomplete) {
      if (autocomplete.includes("email") && !filledFields.has("email")) {
        const value = personalInfo.email;
        if (value && value.trim() !== "") {
          if (isPrefill) {
            prefillField(input, value);
          } else {
            fillField(input, value);
          }
          filledCount++;
          filledFields.add("email");
          console.log("Matched email by autocomplete");
          return;
        }
      }
      if ((autocomplete.includes("tel") || autocomplete.includes("phone")) && !filledFields.has("phone")) {
        const value = personalInfo.phone;
        if (value && value.trim() !== "") {
          if (isPrefill) {
            prefillField(input, value);
          } else {
            fillField(input, value);
          }
          filledCount++;
          filledFields.add("phone");
          console.log("Matched phone by autocomplete");
          return;
        }
      }
      if (autocomplete.includes("given-name") && !filledFields.has("firstName")) {
        const value = personalInfo.firstName;
        if (value && value.trim() !== "") {
          if (isPrefill) {
            prefillField(input, value);
          } else {
            fillField(input, value);
          }
          filledCount++;
          filledFields.add("firstName");
          console.log("Matched firstName by autocomplete");
          return;
        }
      }
      if (autocomplete.includes("family-name") && !filledFields.has("lastName")) {
        const value = personalInfo.lastName;
        if (value && value.trim() !== "") {
          if (isPrefill) {
            prefillField(input, value);
          } else {
            fillField(input, value);
          }
          filledCount++;
          filledFields.add("lastName");
          console.log("Matched lastName by autocomplete");
          return;
        }
      }
    }

    // Try to match each field type using patterns
    for (const [key, patterns] of Object.entries(FIELD_PATTERNS)) {
      if (filledFields.has(key)) continue; // Skip if already filled
      
      if (matchField(fieldIdentifier, patterns)) {
        let value = "";

        switch (key) {
          case "firstName":
            value = personalInfo.firstName;
            break;
          case "lastName":
            value = personalInfo.lastName;
            break;
          case "email":
            value = personalInfo.email;
            break;
          case "phone":
            value = personalInfo.phone;
            break;
          case "dateOfBirth":
            value = personalInfo.dateOfBirth || "";
            break;
          case "gender":
            value = personalInfo.gender || "";
            break;
          case "addressLine1":
            value = personalInfo.addressLine1;
            break;
          case "addressLine2":
            value = personalInfo.addressLine2;
            break;
          case "city":
            value = personalInfo.city;
            break;
          case "state":
            value = personalInfo.state;
            break;
          case "pinCode":
            value = personalInfo.pinCode;
            break;
          case "country":
            value = personalInfo.country;
            break;
          case "currentLocation":
            value = personalInfo.currentLocation;
            break;
          case "currentCompany":
            value = personalInfo.currentCompany;
            break;
          case "currentTitle":
            value = personalInfo.currentTitle;
            break;
          case "currentDescription":
            value = personalInfo.currentDescription;
            break;
          case "currentStartDate":
            value = personalInfo.currentStartDate;
            break;
          case "currentCTC":
            value = personalInfo.currentCTC;
            break;
          case "expectedCTC":
            value = personalInfo.expectedCTC;
            break;
          case "noticePeriod":
            value = personalInfo.noticePeriod;
            break;
          case "totalExperience":
            value = personalInfo.totalExperience;
            break;
          case "relevantExperience":
            value = personalInfo.relevantExperience || "";
            break;
          case "resumeLink":
            value = personalInfo.resumeLink;
            break;
          case "githubLink":
            value = personalInfo.githubLink;
            break;
          case "portfolioLink":
            value = personalInfo.portfolioLink;
            break;
          case "linkedinLink":
            value = personalInfo.linkedinLink;
            break;
          case "summary":
            value = personalInfo.summary || "";
            break;
          case "skills":
            value = personalInfo.skills.join(", ");
            break;
          case "linkedinHeadline":
            value = personalInfo.linkedinHeadline || "";
            break;
          case "coverLetter":
            value = personalInfo.coverLetter || "";
            break;
          case "preferredWorkType":
            value = (personalInfo.preferredWorkType || []).join(", ");
            break;
          case "workAuthorization":
            value = personalInfo.workAuthorization || "";
            break;
          case "availabilityDate":
            value = personalInfo.availabilityDate || "";
            break;
        }

        if (value && value.trim() !== "") {
        if (isPrefill) {
          prefillField(input, value);
        } else {
          fillField(input, value);
        }
          filledCount++;
          filledFields.add(key);
          console.log(`Matched ${key} field`);
        }
        break;
      }
    }
  });

  // Handle previous companies and education (these might be in separate sections)
  // For now, we'll fill the first occurrence of previous company fields
  if (personalInfo.previousCompanies.length > 0) {
    const firstPrevious = personalInfo.previousCompanies[0];
    if (firstPrevious) {
      const allInputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea"
      );

      allInputs.forEach((input) => {
        if (input.value && input.value.trim() !== "") return;

        const identifier = `${input.name || ""} ${input.id || ""} ${input.placeholder || ""}`.toLowerCase();
        
        const previousCompanyPatterns = FIELD_PATTERNS.previousCompany;
        const previousTitlePatterns = FIELD_PATTERNS.previousTitle;
        const previousStartDatePatterns = FIELD_PATTERNS.previousStartDate;
        const previousEndDatePatterns = FIELD_PATTERNS.previousEndDate;
        const previousDescriptionPatterns = FIELD_PATTERNS.previousDescription;
        
        if (previousCompanyPatterns && matchField(identifier, previousCompanyPatterns)) {
          if (isPrefill) {
            prefillField(input, firstPrevious.company);
          } else {
            fillField(input, firstPrevious.company);
          }
          filledCount++;
        } else if (previousTitlePatterns && matchField(identifier, previousTitlePatterns)) {
          if (isPrefill) {
            prefillField(input, firstPrevious.title);
          } else {
            fillField(input, firstPrevious.title);
          }
          filledCount++;
        } else if (previousStartDatePatterns && matchField(identifier, previousStartDatePatterns)) {
          if (isPrefill) {
            prefillField(input, firstPrevious.startDate);
          } else {
            fillField(input, firstPrevious.startDate);
          }
          filledCount++;
        } else if (previousEndDatePatterns && matchField(identifier, previousEndDatePatterns)) {
          if (isPrefill) {
            prefillField(input, firstPrevious.endDate);
          } else {
            fillField(input, firstPrevious.endDate);
          }
          filledCount++;
        } else if (previousDescriptionPatterns && matchField(identifier, previousDescriptionPatterns)) {
          if (isPrefill) {
            prefillField(input, firstPrevious.description);
          } else {
            fillField(input, firstPrevious.description);
          }
          filledCount++;
        }
      });
    }
  }

  console.log(`Auto-prefill summary: Found ${inputs.length} fields, filled ${filledCount} fields`);
  return filledCount;
}

// Wrapper function for backward compatibility
function findAndFillFields(personalInfo: PersonalInfo) {
  return findAndPrefillFields(personalInfo, false);
}

console.log("Personal extension content script loaded");
console.log("Current URL:", window.location.href);

// Immediately check storage to verify script is working
chrome.storage.local.get(["personalInfo", "autoPrefill"], (result) => {
  console.log("=== IMMEDIATE STORAGE CHECK ===");
  console.log("autoPrefill setting:", result.autoPrefill);
  console.log("hasPersonalInfo:", !!result.personalInfo);
  if (result.personalInfo) {
    console.log("PersonalInfo keys:", Object.keys(result.personalInfo));
    console.log("Sample data:", {
      firstName: result.personalInfo.firstName,
      email: result.personalInfo.email,
      phone: result.personalInfo.phone
    });
  }
  console.log("==============================");
});

// Track if we've already prefilled to avoid duplicate fills
let hasPrefilled = false;
let personalInfoCache: PersonalInfo | null = null;
let retryCount = 0;
// Map to track which fields we've filled and their values
const filledFieldsMap = new Map<HTMLElement, string>();

// Add a visible indicator that the script is loaded (for debugging)
function showIndicator() {
  if (document.body) {
    const indicator = document.createElement("div");
    indicator.textContent = "Personal Extension Loaded";
    indicator.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: #4CAF50;
      color: white;
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 11px;
      z-index: 999999;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 3000);
  } else {
    setTimeout(showIndicator, 100);
  }
}
showIndicator();

// Auto-prefill fields on page load if enabled
function autoPrefillOnLoad(forceRetry = false) {
  console.log("autoPrefillOnLoad called, hasPrefilled:", hasPrefilled, "forceRetry:", forceRetry);
  
  // Allow retries even if already prefilled (in case fields got cleared)
  if (hasPrefilled && !forceRetry) {
    console.log("Already prefilled, skipping (use forceRetry=true to retry)");
    return;
  }
  
  try {
    chrome.storage.local.get(["personalInfo", "autoPrefill"], (result) => {
      try {
        console.log("Auto-prefill check:", { 
          autoPrefill: result.autoPrefill, 
          hasPersonalInfo: !!result.personalInfo,
          personalInfoKeys: result.personalInfo ? Object.keys(result.personalInfo) : []
        });
      
        if (result.autoPrefill && result.personalInfo) {
          // Cache personal info for retries
          personalInfoCache = result.personalInfo;
          
          // Wait longer for the page to fully load - especially for forms that load dynamically
          const delay = 3000; // 3 seconds to ensure form is ready
          
          setTimeout(() => {
            const filledCount = findAndPrefillFields(result.personalInfo, true);
            console.log("Prefilled fields count:", filledCount);
            
            if (filledCount > 0) {
              hasPrefilled = true;
              
              // Show a subtle notification
              const notification = document.createElement("div");
              notification.textContent = `✓ Prefilled ${filledCount} fields`;
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2196F3;
                color: white;
                padding: 12px 18px;
                border-radius: 5px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 13px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                animation: slideIn 0.3s ease-out;
              `;
              
              const style = document.createElement("style");
              style.textContent = `
                @keyframes slideIn {
                  from {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                  to {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }
              `;
              document.head.appendChild(style);
              document.body.appendChild(notification);
              
              setTimeout(() => {
                notification.style.opacity = "0";
                notification.style.transition = "opacity 0.3s";
                setTimeout(() => {
                  notification.remove();
                  style.remove();
                }, 300);
              }, 3000);
              
              // Start persistent field watcher to keep fields filled (after a short delay to ensure map is populated)
              setTimeout(() => {
                console.log("Setting up field watcher, filledFieldsMap size:", filledFieldsMap.size);
                if (filledFieldsMap.size > 0) {
                  setupFieldWatcher();
                } else {
                  console.warn("filledFieldsMap is empty! Fields may not have been tracked properly.");
                }
              }, 200);
              
              // Schedule multiple retries to check if fields got cleared and re-fill them
              [2000, 5000, 10000].forEach((delay) => {
                setTimeout(() => {
                  console.log(`Checking if fields are still filled (${delay}ms), re-filling if needed`);
                  const recheckCount = findAndPrefillFields(result.personalInfo, true);
                  if (recheckCount > 0) {
                    console.log("Re-filled", recheckCount, "fields");
                  }
                  // Re-setup watcher after re-fill to track new fields
                  setTimeout(() => {
                    setupFieldWatcher();
                  }, 100);
                }, delay);
              });
            } else {
              console.log("No fields were prefilled");
            }
          }, delay);
        } else {
          console.log("Auto-prefill disabled or no personal info:", {
            autoPrefill: result.autoPrefill,
            hasPersonalInfo: !!result.personalInfo
          });
        }
      } catch (error) {
        console.error("Error in autoPrefillOnLoad callback:", error);
      }
    });
  } catch (error) {
    console.error("Error in autoPrefillOnLoad:", error);
  }
}

// Debounce function to prevent too many calls
let prefillTimeout: NodeJS.Timeout | null = null;
function debouncedAutoPrefill() {
  if (prefillTimeout) clearTimeout(prefillTimeout);
  prefillTimeout = setTimeout(() => {
    if (!hasPrefilled) {
      autoPrefillOnLoad();
    }
  }, 500);
}

// Run auto-prefill when page loads
console.log("Document readyState:", document.readyState);
if (document.readyState === "loading") {
  console.log("Waiting for DOMContentLoaded");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded fired");
    setTimeout(() => {
      console.log("Calling autoPrefillOnLoad after DOMContentLoaded");
      autoPrefillOnLoad();
    }, 2000); // Increased delay
  });
} else {
  console.log("Document already loaded, calling autoPrefillOnLoad");
  // Page already loaded, wait longer for dynamic content and form initialization
  setTimeout(() => {
    console.log("Calling autoPrefillOnLoad (already loaded)");
    autoPrefillOnLoad();
  }, 2000); // Increased delay
}

// Watch for fields that get cleared and re-fill them immediately
let fieldWatcher: MutationObserver | null = null;
let valueWatchers: Map<HTMLElement, () => void> = new Map();

// Function to watch a specific field and re-fill if cleared
function watchSingleField(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, expectedValue: string) {
  if (valueWatchers.has(element)) {
    return; // Already watching this field
  }
  
  const fieldName = element.name || element.id || ((element instanceof HTMLSelectElement) ? "" : (element as HTMLInputElement | HTMLTextAreaElement).placeholder) || "unnamed";
  console.log("🔍 Watching field:", fieldName, "expected:", expectedValue.substring(0, 30));
  
  // Use setInterval to check value periodically - faster check
  const checkInterval = setInterval(() => {
    const currentValue = element.value;
    
    // If the field was cleared (should have value but is empty)
    if (expectedValue && expectedValue.trim() !== "" && (!currentValue || currentValue.trim() === "")) {
      console.log("⚠️ Field cleared, re-filling immediately:", fieldName, "expected:", expectedValue.substring(0, 30));
      // Re-fill immediately
      if (element instanceof HTMLSelectElement) {
        element.value = expectedValue;
        element.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        element.value = expectedValue;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }, 100); // Check every 100ms - much faster
  
  // Store cleanup function
  valueWatchers.set(element, () => clearInterval(checkInterval));
}

function setupFieldWatcher() {
  console.log("🔧 Setting up persistent field watcher, tracking", filledFieldsMap.size, "fields");
  
  // Watch all filled fields
  filledFieldsMap.forEach((value, element) => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      watchSingleField(element, value);
    }
  });
  
  // Also use MutationObserver for DOM changes
  if (!fieldWatcher) {
    fieldWatcher = new MutationObserver(() => {
      // Re-check all watched fields
      filledFieldsMap.forEach((value, element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
          if (value && value.trim() !== "" && (!element.value || element.value.trim() === "")) {
            console.log("MutationObserver: Field value cleared, re-filling:", element.name || element.id);
            if (element instanceof HTMLSelectElement) {
              element.value = value;
              element.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
              element.value = value;
              element.dispatchEvent(new Event("input", { bubbles: true }));
              element.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }
      });
    });
    
    if (document.body) {
      fieldWatcher.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["value"]
      });
    }
  }
}

// Also run on dynamic content (for SPAs) - with debouncing
let observer: MutationObserver | null = null;
function setupObserver() {
  if (observer) {
    console.log("Observer already set up");
    return;
  }
  
  console.log("Setting up mutation observer");
  observer = new MutationObserver((mutations) => {
    // Check if any form elements exist on the page
    const hasFormElements = document.querySelectorAll("input, textarea, select").length > 0;
    
    if (hasFormElements && !hasPrefilled) {
      console.log("Form elements detected, checking autoPrefill setting");
      chrome.storage.local.get(["autoPrefill"], (result) => {
        if (result.autoPrefill) {
          console.log("AutoPrefill enabled, calling debouncedAutoPrefill");
          debouncedAutoPrefill();
        }
      });
    }
  });
  
  if (document.body) {
    console.log("Observing document.body for changes");
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

if (document.body) {
  console.log("Document body exists, setting up observer");
  setupObserver();
  setupFieldWatcher();
} else {
  console.log("Waiting for DOMContentLoaded to set up observer");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded: setting up observer");
    setupObserver();
    setupFieldWatcher();
  });
}

// Also try after window load (for pages that load forms dynamically)
window.addEventListener("load", () => {
  console.log("Window load event fired");
  setTimeout(() => {
    console.log("Window loaded, calling autoPrefillOnLoad");
    autoPrefillOnLoad();
  }, 3000); // Increased delay to ensure form is ready
});

// Reset prefilled state on navigation (for SPAs)
let lastUrl = window.location.href;
const checkUrlChange = () => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    hasPrefilled = false;
    // Try to prefill again after navigation
    setTimeout(() => {
      autoPrefillOnLoad();
    }, 500);
  }
};
setInterval(checkUrlChange, 1000);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTOFILL") {
    const personalInfo = message.data as PersonalInfo;
    const filledCount = findAndFillFields(personalInfo);
    
    // Show notification
    const notification = document.createElement("div");
    notification.textContent = `✓ Autofilled ${filledCount} fields`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 3000);

    sendResponse({ success: true, filledCount });
  } else if (message.type === "TRIGGER_PREFILL") {
    // Reset prefilled state and trigger prefill
    hasPrefilled = false;
    autoPrefillOnLoad();
    sendResponse({ success: true });
  }
  return true;
});

// Keyboard shortcut listener (Ctrl+Shift+A / Cmd+Shift+A)
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
    e.preventDefault();
    chrome.storage.local.get(["personalInfo"], (result) => {
      if (result.personalInfo) {
        findAndFillFields(result.personalInfo);
      }
    });
  }
});
