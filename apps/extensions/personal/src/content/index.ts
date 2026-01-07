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
  ],
  phone: [
    /phone/i,
    /mobile/i,
    /contact[\s_-]?number/i,
    /telephone/i,
    /tel/i,
    /phone[\s_-]?number/i,
    /mobile[\s_-]?number/i,
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

function findAndFillFields(personalInfo: PersonalInfo) {
  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );

  let filledCount = 0;
  const filledFields = new Set<string>();

  inputs.forEach((input) => {
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
    const label = input.labels?.[0]?.textContent?.toLowerCase() || "";
    const ariaLabel = input.getAttribute("aria-label")?.toLowerCase() || "";
    const fieldIdentifier = `${name} ${id} ${placeholder} ${label} ${ariaLabel}`;

    // Try to match each field type
    for (const [key, patterns] of Object.entries(FIELD_PATTERNS)) {
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
          fillField(input, value);
          filledCount++;
          filledFields.add(key);
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
          fillField(input, firstPrevious.company);
          filledCount++;
        } else if (previousTitlePatterns && matchField(identifier, previousTitlePatterns)) {
          fillField(input, firstPrevious.title);
          filledCount++;
        } else if (previousStartDatePatterns && matchField(identifier, previousStartDatePatterns)) {
          fillField(input, firstPrevious.startDate);
          filledCount++;
        } else if (previousEndDatePatterns && matchField(identifier, previousEndDatePatterns)) {
          fillField(input, firstPrevious.endDate);
          filledCount++;
        } else if (previousDescriptionPatterns && matchField(identifier, previousDescriptionPatterns)) {
          fillField(input, firstPrevious.description);
          filledCount++;
        }
      });
    }
  }

  return filledCount;
}

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
