import { useState, useEffect, useRef } from "react";
import { PersonalInfo, DEFAULT_PERSONAL_INFO, PreviousCompany, Education, SAMPLE_PERSONAL_INFO, Reference, Language, Certification, Project } from "../types";

type Tab = "basic" | "address" | "experience" | "education" | "skills" | "languages" | "certifications" | "projects" | "references" | "links" | "additional";

// Copy to clipboard helper function
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    const notification = document.createElement("div");
    notification.textContent = "Copied!";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1000);
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

// Helper component for nested fields (in Previous Jobs, Education sections)
const NestedFieldWithCopy = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  style = {},
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
}) => (
  <div style={{ marginBottom: "8px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
      <label style={{ fontSize: "11px", fontWeight: "500", color: "#a0a0a0" }}>{label}</label>
      {value && (
        <button
          onClick={() => copyToClipboard(value)}
          style={{
            padding: "2px 6px",
            backgroundColor: "#333333",
            border: "1px solid #404040",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "10px",
            color: "#a0a0a0",
          }}
          title="Copy"
        >
          📋
        </button>
      )}
    </div>
    {type === "textarea" ? (
      <textarea
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
        placeholder={placeholder}
        style={{ width: "100%", padding: "8px", border: "1px solid #404040", borderRadius: "4px", fontSize: "12px", fontFamily: "inherit", resize: "vertical", backgroundColor: "#2d2d2d", color: "#e0e0e0", ...style }}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
        placeholder={placeholder}
        style={{ width: "100%", padding: "8px", border: "1px solid #404040", borderRadius: "4px", fontSize: "12px", backgroundColor: "#2d2d2d", color: "#e0e0e0", ...style }}
      />
    )}
  </div>
);

// Reusable field component with label and copy button
const FieldWithCopy = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  style = {},
  options
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
  options?: { value: string; label: string }[];
}) => (
  <div style={{ marginBottom: "12px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: "500", color: "#c0c0c0" }}>{label}</label>
      {value && (
        <button
          onClick={() => copyToClipboard(value)}
          style={{
            padding: "4px 8px",
            backgroundColor: "#333333",
            border: "1px solid #404040",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
            color: "#a0a0a0",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Copy to clipboard"
        >
          📋 Copy
        </button>
      )}
    </div>
    {type === "textarea" ? (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #404040", borderRadius: "6px", fontSize: "13px", fontFamily: "inherit", resize: "vertical", backgroundColor: "#2d2d2d", color: "#e0e0e0", ...style }}
      />
    ) : type === "select" && options ? (
      <select
        value={value}
        onChange={onChange}
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #404040", borderRadius: "6px", fontSize: "13px", backgroundColor: "#2d2d2d", color: "#e0e0e0", ...style }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #404040", borderRadius: "6px", fontSize: "13px", backgroundColor: "#2d2d2d", color: "#e0e0e0", ...style }}
      />
    )}
  </div>
);

export default function App() {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(DEFAULT_PERSONAL_INFO);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [autoPrefill, setAutoPrefill] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.storage.local.get(["personalInfo", "autoPrefill"], (result) => {
      if (result.personalInfo) {
        // Merge with DEFAULT_PERSONAL_INFO to ensure all fields are initialized
        setPersonalInfo({
          ...DEFAULT_PERSONAL_INFO,
          ...result.personalInfo,
          // Ensure arrays are always arrays (not undefined)
          languages: result.personalInfo.languages || [],
          certifications: result.personalInfo.certifications || [],
          projects: result.personalInfo.projects || [],
          references: result.personalInfo.references || [],
          previousCompanies: result.personalInfo.previousCompanies || [],
          education: result.personalInfo.education || [],
          skills: result.personalInfo.skills || [],
          preferredLocation: result.personalInfo.preferredLocation || [],
          preferredWorkType: result.personalInfo.preferredWorkType || [],
        });
      }
      if (result.autoPrefill !== undefined) {
        setAutoPrefill(result.autoPrefill);
      }
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({ personalInfo }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleAutofill = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "AUTOFILL",
          data: personalInfo,
        });
      }
    });
  };

  const handleToggleAutoPrefill = () => {
    const newValue = !autoPrefill;
    setAutoPrefill(newValue);
    chrome.storage.local.set({ autoPrefill: newValue }, () => {
      // If enabling, trigger prefill on current tab
      if (newValue) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "TRIGGER_PREFILL",
            });
          }
        });
      }
    });
  };

  const addPreviousCompany = () => {
    const newCompany: PreviousCompany = {
      company: "",
      title: "",
      startDate: "",
      endDate: "Present",
      description: "",
    };
    setPersonalInfo({
      ...personalInfo,
      previousCompanies: [...personalInfo.previousCompanies, newCompany],
    });
  };

  const updatePreviousCompany = (index: number, field: keyof PreviousCompany, value: string) => {
    const updated = [...personalInfo.previousCompanies];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as PreviousCompany;
    }
    setPersonalInfo({ ...personalInfo, previousCompanies: updated });
  };

  const removePreviousCompany = (index: number) => {
    setPersonalInfo({
      ...personalInfo,
      previousCompanies: personalInfo.previousCompanies.filter((_, i) => i !== index),
    });
  };

  const addEducation = () => {
    const newEducation: Education = {
      degree: "",
      university: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
      percentage: "",
      cgpa: "",
    };
    setPersonalInfo({
      ...personalInfo,
      education: [...personalInfo.education, newEducation],
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...personalInfo.education];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as Education;
    }
    setPersonalInfo({ ...personalInfo, education: updated });
  };

  const removeEducation = (index: number) => {
    setPersonalInfo({
      ...personalInfo,
      education: personalInfo.education.filter((_, i) => i !== index),
    });
  };

  const addSkill = () => {
    const skill = prompt("Enter skill name:");
    if (skill?.trim()) {
      setPersonalInfo({
        ...personalInfo,
        skills: [...personalInfo.skills, skill.trim()],
      });
    }
  };

  const removeSkill = (index: number) => {
    setPersonalInfo({
      ...personalInfo,
      skills: personalInfo.skills.filter((_, i) => i !== index),
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(personalInfo, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "personal-info.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        // Validate and set the imported data
        if (jsonData && typeof jsonData === "object") {
          // Merge with default structure to ensure all fields exist
          const importedData: PersonalInfo = {
            ...DEFAULT_PERSONAL_INFO,
            ...jsonData,
            // Ensure arrays are always arrays (not undefined)
            previousCompanies: jsonData.previousCompanies || [],
            education: jsonData.education || [],
            skills: jsonData.skills || [],
            languages: jsonData.languages || [],
            certifications: jsonData.certifications || [],
            projects: jsonData.projects || [],
            references: jsonData.references || [],
            preferredLocation: jsonData.preferredLocation || [],
            preferredWorkType: jsonData.preferredWorkType || [],
          };
          setPersonalInfo(importedData);
          chrome.storage.local.set({ personalInfo: importedData }, () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          });
        }
      } catch (error) {
        alert("Invalid JSON file. Please check the format and try again.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyFormatExample = () => {
    const exampleJson = JSON.stringify(SAMPLE_PERSONAL_INFO, null, 2);
    copyToClipboard(exampleJson);
  };


  const addLanguage = () => {
    setPersonalInfo({
      ...personalInfo,
      languages: [...(personalInfo.languages || []), { name: "", proficiency: "" }],
    });
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const updated = [...(personalInfo.languages || [])];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as Language;
    }
    setPersonalInfo({ ...personalInfo, languages: updated });
  };

  const removeLanguage = (index: number) => {
    setPersonalInfo({
      ...personalInfo,
      languages: (personalInfo.languages || []).filter((_, i) => i !== index),
    });
  };

  const addCertification = () => {
    setPersonalInfo({
      ...personalInfo,
      certifications: [...(personalInfo.certifications || []), {
        name: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        credentialUrl: "",
      }],
    });
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...(personalInfo.certifications || [])];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as Certification;
    }
    setPersonalInfo({ ...personalInfo, certifications: updated });
  };

  const removeCertification = (index: number) => {
    setPersonalInfo({
      ...personalInfo,
      certifications: (personalInfo.certifications || []).filter((_, i) => i !== index),
    });
  };

  const addProject = () => {
    setPersonalInfo({
      ...personalInfo,
      projects: [...(personalInfo.projects || []), {
        name: "",
        description: "",
        technologies: [],
        startDate: "",
        endDate: "",
        link: "",
        githubLink: "",
      }],
    });
  };

  const updateProject = (index: number, field: keyof Project, value: string | string[]) => {
    const updated = [...(personalInfo.projects || [])];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as Project;
    }
    setPersonalInfo({ ...personalInfo, projects: updated });
  };

  const removeProject = (index: number) => {
    setPersonalInfo({
      ...personalInfo,
      projects: (personalInfo.projects || []).filter((_, i) => i !== index),
    });
  };

  const addProjectTechnology = (projectIndex: number) => {
    const tech = prompt("Enter technology:");
    if (tech?.trim()) {
      const updated = [...(personalInfo.projects || [])];
      const current = updated[projectIndex];
      if (current) {
        updated[projectIndex] = {
          ...current,
          technologies: [...current.technologies, tech.trim()],
        };
      }
      setPersonalInfo({ ...personalInfo, projects: updated });
    }
  };

  const removeProjectTechnology = (projectIndex: number, techIndex: number) => {
    const updated = [...(personalInfo.projects || [])];
    const current = updated[projectIndex];
    if (current) {
      updated[projectIndex] = {
        ...current,
        technologies: current.technologies.filter((_, i) => i !== techIndex),
      };
    }
    setPersonalInfo({ ...personalInfo, projects: updated });
  };

  const addReference = () => {
    setPersonalInfo({
      ...personalInfo,
      references: [...(personalInfo.references || []), {
        name: "",
        email: "",
        phone: "",
        company: "",
        designation: "",
        relationship: "",
      }],
    });
  };

  const updateReference = (index: number, field: keyof Reference, value: string) => {
    const updated = [...(personalInfo.references || [])];
    const current = updated[index];
    if (current) {
      updated[index] = { ...current, [field]: value } as Reference;
    }
    setPersonalInfo({ ...personalInfo, references: updated });
  };

  const removeReference = (index: number) => {
    setPersonalInfo({
      ...personalInfo,
      references: (personalInfo.references || []).filter((_, i) => i !== index),
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "basic", label: "Basic" },
    { id: "address", label: "Address" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
    { id: "languages", label: "Languages" },
    { id: "certifications", label: "Certifications" },
    { id: "projects", label: "Projects" },
    { id: "references", label: "References" },
    { id: "links", label: "Links" },
    { id: "additional", label: "Additional" },
  ];

  return (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      display: "flex", 
      flexDirection: "column",
      overflow: "hidden",
      backgroundColor: "#1a1a1a"
    }}>
      {/* Fixed Header */}
      <div style={{ 
        padding: "12px 16px", 
        borderBottom: "1px solid #404040",
        backgroundColor: "#252525",
        flexShrink: 0
      }}>
        <h1 style={{ fontSize: "18px", fontWeight: "600", color: "#e0e0e0", margin: 0 }}>
          Personal Information
        </h1>
      </div>

      {/* Import/Export/Format Buttons */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid #404040",
        backgroundColor: "#1a1a1a",
        flexShrink: 0,
        display: "flex",
        gap: "8px"
      }}>
        <button
          onClick={handleImport}
          style={{
            flex: 1,
            padding: "8px 12px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          ⬆️ Import
        </button>
        <button
          onClick={handleExport}
          style={{
            flex: 1,
            padding: "8px 12px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          ⬇️ Export
        </button>
        <button
          onClick={() => setShowFormatModal(true)}
          style={{
            flex: 1,
            padding: "8px 12px",
            backgroundColor: "#9C27B0",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          📄 Format
        </button>
      </div>

      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: "none" }}
      />

      {/* Scrollable Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "4px", 
        padding: "8px 12px",
        borderBottom: "2px solid #404040",
        backgroundColor: "#1a1a1a",
        overflowX: "auto",
        flexShrink: 0,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "6px 12px",
              backgroundColor: activeTab === tab.id ? "#2196F3" : "transparent",
              color: activeTab === tab.id ? "white" : "#a0a0a0",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: activeTab === tab.id ? "600" : "400",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Tab Content */}
      <div style={{ 
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "16px",
        backgroundColor: "#1a1a1a",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}>
        {/* Basic Info Tab */}
        {activeTab === "basic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "#e0e0e0" }}>Basic Information</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <FieldWithCopy
                  label="First Name"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                  placeholder="First Name"
                />
              </div>
              <div style={{ flex: 1 }}>
                <FieldWithCopy
                  label="Last Name"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                  placeholder="Last Name"
                />
              </div>
            </div>
            <FieldWithCopy
              label="Email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              placeholder="Email"
              type="email"
            />
            <FieldWithCopy
              label="Phone"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              placeholder="Phone"
              type="tel"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <FieldWithCopy
                  label="Date of Birth"
                  value={personalInfo.dateOfBirth || ""}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div style={{ flex: 1 }}>
                <FieldWithCopy
                  label="Gender"
                  value={personalInfo.gender || ""}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                  type="select"
                  options={[
                    { value: "", label: "Select Gender" },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                    { value: "Prefer not to say", label: "Prefer not to say" },
                  ]}
                />
              </div>
            </div>
            <FieldWithCopy
              label="Current Location"
              value={personalInfo.currentLocation}
              onChange={(e) => setPersonalInfo({ ...personalInfo, currentLocation: e.target.value })}
              placeholder="Current Location"
            />
            <FieldWithCopy
              label="Professional Summary"
              value={personalInfo.summary || ""}
              onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
              placeholder="Professional Summary (Optional)"
              type="textarea"
              style={{ minHeight: "80px" }}
            />
          </div>
        )}

        {/* Address Tab */}
        {activeTab === "address" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "#e0e0e0" }}>Address</h2>
            <FieldWithCopy
              label="Address Line 1"
              value={personalInfo.addressLine1}
              onChange={(e) => setPersonalInfo({ ...personalInfo, addressLine1: e.target.value })}
              placeholder="Address Line 1"
            />
            <FieldWithCopy
              label="Address Line 2"
              value={personalInfo.addressLine2}
              onChange={(e) => setPersonalInfo({ ...personalInfo, addressLine2: e.target.value })}
              placeholder="Address Line 2"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <FieldWithCopy
                  label="City"
                  value={personalInfo.city}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div style={{ flex: 1 }}>
                <FieldWithCopy
                  label="State"
                  value={personalInfo.state}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, state: e.target.value })}
                  placeholder="State"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ width: "150px" }}>
                <FieldWithCopy
                  label="Pin Code"
                  value={personalInfo.pinCode}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, pinCode: e.target.value })}
                  placeholder="Pin Code"
                />
              </div>
              <div style={{ flex: 1 }}>
                <FieldWithCopy
                  label="Country"
                  value={personalInfo.country}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, country: e.target.value })}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
        )}

        {/* Current Job Tab */}
        {/* Experience Tab */}
        {activeTab === "experience" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Current Employment Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "#e0e0e0" }}>Current Employment</h2>
              <FieldWithCopy
                label="Company Name"
                value={personalInfo.currentCompany}
                onChange={(e) => setPersonalInfo({ ...personalInfo, currentCompany: e.target.value })}
                placeholder="Company Name"
              />
              <FieldWithCopy
                label="Job Title / Designation"
                value={personalInfo.currentTitle}
                onChange={(e) => setPersonalInfo({ ...personalInfo, currentTitle: e.target.value })}
                placeholder="Job Title / Designation"
              />
              <FieldWithCopy
                label="Job Description / Responsibilities"
                value={personalInfo.currentDescription}
                onChange={(e) => setPersonalInfo({ ...personalInfo, currentDescription: e.target.value })}
                placeholder="Describe your current role and responsibilities"
                type="textarea"
                style={{ minHeight: "100px" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <FieldWithCopy
                    label="Start Date"
                    value={personalInfo.currentStartDate}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, currentStartDate: e.target.value })}
                    placeholder="MM/YYYY"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldWithCopy
                    label="Total Experience"
                    value={personalInfo.totalExperience}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, totalExperience: e.target.value })}
                    placeholder="e.g., 1+ Years"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <FieldWithCopy
                    label="Current CTC"
                    value={personalInfo.currentCTC}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, currentCTC: e.target.value })}
                    placeholder="e.g., 5 LPA"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldWithCopy
                    label="Expected CTC"
                    value={personalInfo.expectedCTC}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, expectedCTC: e.target.value })}
                    placeholder="e.g., 8 LPA"
                  />
                </div>
              </div>
              <FieldWithCopy
                label="Notice Period"
                value={personalInfo.noticePeriod}
                onChange={(e) => setPersonalInfo({ ...personalInfo, noticePeriod: e.target.value })}
                placeholder="e.g., 30 days"
              />
              <FieldWithCopy
                label="Relevant Experience"
                value={personalInfo.relevantExperience || ""}
                onChange={(e) => setPersonalInfo({ ...personalInfo, relevantExperience: e.target.value })}
                placeholder="Relevant Experience (Optional)"
              />
            </div>

            {/* Previous Employment Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", paddingTop: "15px", borderTop: "2px solid #404040" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#e0e0e0" }}>Previous Employment</h2>
                <button
                  onClick={addPreviousCompany}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  + Add Company
                </button>
              </div>
              {(personalInfo.previousCompanies || []).map((company, index) => (
                <div
                  key={index}
                  style={{
                    padding: "15px",
                    border: "1px solid #404040",
                    borderRadius: "4px",
                    backgroundColor: "#2d2d2d",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <strong>Company {index + 1}</strong>
                    <button
                      onClick={() => removePreviousCompany(index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ff4444",
                        fontSize: "18px",
                        padding: "0 5px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <NestedFieldWithCopy
                    label="Company Name"
                    value={company.company}
                    onChange={(e) => updatePreviousCompany(index, "company", e.target.value)}
                    placeholder="Company Name"
                  />
                  <NestedFieldWithCopy
                    label="Job Title"
                    value={company.title}
                    onChange={(e) => updatePreviousCompany(index, "title", e.target.value)}
                    placeholder="Job Title"
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <NestedFieldWithCopy
                        label="Start Date"
                        value={company.startDate}
                        onChange={(e) => updatePreviousCompany(index, "startDate", e.target.value)}
                        placeholder="MM/YYYY"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <NestedFieldWithCopy
                        label="End Date"
                        value={company.endDate}
                        onChange={(e) => updatePreviousCompany(index, "endDate", e.target.value)}
                        placeholder="MM/YYYY or Present"
                      />
                    </div>
                  </div>
                  <NestedFieldWithCopy
                    label="Job Description"
                    value={company.description}
                    onChange={(e) => updatePreviousCompany(index, "description", e.target.value)}
                    placeholder="Job Description / Responsibilities"
                    type="textarea"
                    style={{ minHeight: "60px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Tab */}
        {activeTab === "education" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#e0e0e0" }}>Education</h2>
              <button
                onClick={addEducation}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                + Add Education
              </button>
            </div>
            {personalInfo.education.map((edu, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#2d2d2d",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Education {index + 1}</strong>
                  <button
                    onClick={() => removeEducation(index)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ff4444",
                      fontSize: "18px",
                      padding: "0 5px",
                    }}
                  >
                    ×
                  </button>
                </div>
                <NestedFieldWithCopy
                  label="Degree"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, "degree", e.target.value)}
                  placeholder="e.g., B.Tech, B.E., M.Tech"
                />
                <NestedFieldWithCopy
                  label="University / School"
                  value={edu.university}
                  onChange={(e) => updateEducation(index, "university", e.target.value)}
                  placeholder="University / School Name"
                />
                <NestedFieldWithCopy
                  label="Field of Study"
                  value={edu.fieldOfStudy}
                  onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
                  placeholder="Field of Study / Stream"
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Start Year"
                      value={edu.startYear}
                      onChange={(e) => updateEducation(index, "startYear", e.target.value)}
                      placeholder="Start Year"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="End Year"
                      value={edu.endYear}
                      onChange={(e) => updateEducation(index, "endYear", e.target.value)}
                      placeholder="End Year"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Percentage"
                      value={edu.percentage || ""}
                      onChange={(e) => updateEducation(index, "percentage", e.target.value)}
                      placeholder="Percentage (Optional)"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="CGPA"
                      value={edu.cgpa || ""}
                      onChange={(e) => updateEducation(index, "cgpa", e.target.value)}
                      placeholder="CGPA (Optional)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#e0e0e0" }}>Skills</h2>
              <button
                onClick={addSkill}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                + Add Skill
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {personalInfo.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 12px",
                    backgroundColor: "#1e3a5f",
                    borderRadius: "4px",
                    fontSize: "13px",
                  }}
                >
                  {skill}
                  <button
                    onClick={() => copyToClipboard(skill)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#2196F3",
                      fontSize: "11px",
                      padding: "0 4px",
                    }}
                    title="Copy skill"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => removeSkill(index)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ff4444",
                      fontSize: "14px",
                      padding: "0",
                      width: "16px",
                      height: "16px",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages Tab */}
        {activeTab === "languages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#e0e0e0" }}>Languages</h2>
              <button
                onClick={addLanguage}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                + Add Language
              </button>
            </div>
            {(personalInfo.languages || []).map((lang, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#2d2d2d",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Language {index + 1}</strong>
                  <button
                    onClick={() => removeLanguage(index)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ff4444",
                      fontSize: "18px",
                      padding: "0 5px",
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Language"
                      value={lang.name}
                      onChange={(e) => updateLanguage(index, "name", e.target.value)}
                      placeholder="e.g., English, Spanish"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Proficiency"
                      value={lang.proficiency}
                      onChange={(e) => updateLanguage(index, "proficiency", e.target.value)}
                      placeholder="e.g., Native, Fluent, Conversational"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === "certifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#e0e0e0" }}>Certifications</h2>
              <button
                onClick={addCertification}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                + Add Certification
              </button>
            </div>
            {(personalInfo.certifications || []).map((cert, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#2d2d2d",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Certification {index + 1}</strong>
                  <button
                    onClick={() => removeCertification(index)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ff4444",
                      fontSize: "18px",
                      padding: "0 5px",
                    }}
                  >
                    ×
                  </button>
                </div>
                <NestedFieldWithCopy
                  label="Certification Name"
                  value={cert.name}
                  onChange={(e) => updateCertification(index, "name", e.target.value)}
                  placeholder="e.g., AWS Certified Developer"
                />
                <NestedFieldWithCopy
                  label="Issuing Organization"
                  value={cert.issuer}
                  onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                  placeholder="e.g., Amazon Web Services"
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Issue Date"
                      value={cert.issueDate}
                      onChange={(e) => updateCertification(index, "issueDate", e.target.value)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Expiry Date (Optional)"
                      value={cert.expiryDate || ""}
                      onChange={(e) => updateCertification(index, "expiryDate", e.target.value)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                </div>
                <NestedFieldWithCopy
                  label="Credential ID (Optional)"
                  value={cert.credentialId || ""}
                  onChange={(e) => updateCertification(index, "credentialId", e.target.value)}
                  placeholder="Credential ID"
                />
                <NestedFieldWithCopy
                  label="Credential URL (Optional)"
                  value={cert.credentialUrl || ""}
                  onChange={(e) => updateCertification(index, "credentialUrl", e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
            ))}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#e0e0e0" }}>Projects</h2>
              <button
                onClick={addProject}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                + Add Project
              </button>
            </div>
            {(personalInfo.projects || []).map((project, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#2d2d2d",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Project {index + 1}</strong>
                  <button
                    onClick={() => removeProject(index)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ff4444",
                      fontSize: "18px",
                      padding: "0 5px",
                    }}
                  >
                    ×
                  </button>
                </div>
                <NestedFieldWithCopy
                  label="Project Name"
                  value={project.name}
                  onChange={(e) => updateProject(index, "name", e.target.value)}
                  placeholder="Project Name"
                />
                <NestedFieldWithCopy
                  label="Description"
                  value={project.description}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  placeholder="Project Description"
                  type="textarea"
                  style={{ minHeight: "60px" }}
                />
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#666", marginBottom: "4px", display: "block" }}>Technologies</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
                    {project.technologies.map((tech, techIndex) => (
                      <span
                        key={techIndex}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          backgroundColor: "#1e3a5f",
                          borderRadius: "3px",
                          fontSize: "11px",
                        }}
                      >
                        {tech}
                        <button
                          onClick={() => removeProjectTechnology(index, techIndex)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ff4444",
                            fontSize: "12px",
                            padding: "0",
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => addProjectTechnology(index)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#333333",
                      border: "1px solid #404040",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    + Add Technology
                  </button>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Start Date (Optional)"
                      value={project.startDate || ""}
                      onChange={(e) => updateProject(index, "startDate", e.target.value)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="End Date (Optional)"
                      value={project.endDate || ""}
                      onChange={(e) => updateProject(index, "endDate", e.target.value)}
                      placeholder="MM/YYYY"
                    />
                  </div>
                </div>
                <NestedFieldWithCopy
                  label="Project Link (Optional)"
                  value={project.link || ""}
                  onChange={(e) => updateProject(index, "link", e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
                <NestedFieldWithCopy
                  label="GitHub Link (Optional)"
                  value={project.githubLink || ""}
                  onChange={(e) => updateProject(index, "githubLink", e.target.value)}
                  placeholder="https://github.com/..."
                  type="url"
                />
              </div>
            ))}
          </div>
        )}

        {/* References Tab */}
        {activeTab === "references" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#e0e0e0" }}>References</h2>
              <button
                onClick={addReference}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                + Add Reference
              </button>
            </div>
            {(personalInfo.references || []).map((ref, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#2d2d2d",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <strong>Reference {index + 1}</strong>
                  <button
                    onClick={() => removeReference(index)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ff4444",
                      fontSize: "18px",
                      padding: "0 5px",
                    }}
                  >
                    ×
                  </button>
                </div>
                <NestedFieldWithCopy
                  label="Name"
                  value={ref.name}
                  onChange={(e) => updateReference(index, "name", e.target.value)}
                  placeholder="Full Name"
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Email"
                      value={ref.email}
                      onChange={(e) => updateReference(index, "email", e.target.value)}
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Phone"
                      value={ref.phone}
                      onChange={(e) => updateReference(index, "phone", e.target.value)}
                      placeholder="+1 234 567 8900"
                      type="tel"
                    />
                  </div>
                </div>
                <NestedFieldWithCopy
                  label="Company"
                  value={ref.company}
                  onChange={(e) => updateReference(index, "company", e.target.value)}
                  placeholder="Company Name"
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Designation"
                      value={ref.designation}
                      onChange={(e) => updateReference(index, "designation", e.target.value)}
                      placeholder="Job Title"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <NestedFieldWithCopy
                      label="Relationship"
                      value={ref.relationship}
                      onChange={(e) => updateReference(index, "relationship", e.target.value)}
                      placeholder="e.g., Former Manager"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === "links" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "#e0e0e0" }}>Links</h2>
            <FieldWithCopy
              label="Resume Link"
              value={personalInfo.resumeLink}
              onChange={(e) => setPersonalInfo({ ...personalInfo, resumeLink: e.target.value })}
              placeholder="Google Drive, Dropbox, etc."
              type="url"
            />
            <FieldWithCopy
              label="GitHub Link"
              value={personalInfo.githubLink}
              onChange={(e) => setPersonalInfo({ ...personalInfo, githubLink: e.target.value })}
              placeholder="GitHub Link"
              type="url"
            />
            <FieldWithCopy
              label="Portfolio Link"
              value={personalInfo.portfolioLink}
              onChange={(e) => setPersonalInfo({ ...personalInfo, portfolioLink: e.target.value })}
              placeholder="Portfolio Link"
              type="url"
            />
            <FieldWithCopy
              label="LinkedIn Link"
              value={personalInfo.linkedinLink}
              onChange={(e) => setPersonalInfo({ ...personalInfo, linkedinLink: e.target.value })}
              placeholder="LinkedIn Link"
              type="url"
            />
            <FieldWithCopy
              label="LinkedIn Headline"
              value={personalInfo.linkedinHeadline || ""}
              onChange={(e) => setPersonalInfo({ ...personalInfo, linkedinHeadline: e.target.value })}
              placeholder="Your LinkedIn headline"
            />
            <FieldWithCopy
              label="Cover Letter"
              value={personalInfo.coverLetter || ""}
              onChange={(e) => setPersonalInfo({ ...personalInfo, coverLetter: e.target.value })}
              placeholder="Cover letter text (Optional)"
              type="textarea"
              style={{ minHeight: "120px" }}
            />
          </div>
        )}

        {/* Additional Tab */}
        {activeTab === "additional" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "#e0e0e0" }}>Additional Information</h2>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>Preferred Work Type</label>
                {personalInfo.preferredWorkType && personalInfo.preferredWorkType.length > 0 && (
                  <button
                    onClick={() => copyToClipboard((personalInfo.preferredWorkType || []).join(", "))}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#333333",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                      color: "#a0a0a0",
                    }}
                    title="Copy"
                  >
                    📋 Copy
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {(personalInfo.preferredWorkType || []).map((workType, index) => (
                  <span
                    key={index}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      backgroundColor: "#1e3a5f",
                      borderRadius: "4px",
                      fontSize: "12px",
                      color: "#1976d2",
                    }}
                  >
                    {workType}
                    <button
                      onClick={() => {
                        const updated = (personalInfo.preferredWorkType || []).filter((_, i) => i !== index);
                        setPersonalInfo({ ...personalInfo, preferredWorkType: updated });
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#1976d2",
                        fontSize: "14px",
                        padding: "0",
                        marginLeft: "4px",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <select
                value=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !(personalInfo.preferredWorkType || []).includes(value)) {
                    setPersonalInfo({
                      ...personalInfo,
                      preferredWorkType: [...(personalInfo.preferredWorkType || []), value],
                    });
                  }
                  e.target.value = "";
                }}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }}
              >
                <option value="">Add Work Type</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>Willing to Relocate</label>
                {personalInfo.willingToRelocate !== undefined && (
                  <button
                    onClick={() => copyToClipboard(personalInfo.willingToRelocate ? "Yes" : "No")}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#333333",
                      border: "1px solid #404040",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                      color: "#a0a0a0",
                    }}
                    title="Copy"
                  >
                    📋 Copy
                  </button>
                )}
              </div>
              <select
                value={personalInfo.willingToRelocate === undefined ? "" : personalInfo.willingToRelocate ? "yes" : "no"}
                onChange={(e) => setPersonalInfo({ ...personalInfo, willingToRelocate: e.target.value === "yes" })}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <FieldWithCopy
              label="Work Authorization"
              value={personalInfo.workAuthorization || ""}
              onChange={(e) => setPersonalInfo({ ...personalInfo, workAuthorization: e.target.value })}
              placeholder="e.g., Citizen, Work Permit, Visa Required"
            />
            <FieldWithCopy
              label="Availability Date"
              value={personalInfo.availabilityDate || ""}
              onChange={(e) => setPersonalInfo({ ...personalInfo, availabilityDate: e.target.value })}
              placeholder="e.g., Immediate, 2 weeks, 1 month"
            />
            <FieldWithCopy
              label="Preferred Locations"
              value={(personalInfo.preferredLocation || []).join(", ")}
              onChange={(e) => setPersonalInfo({ 
                ...personalInfo, 
                preferredLocation: e.target.value.split(",").map(loc => loc.trim()).filter(loc => loc) 
              })}
              placeholder="Comma-separated locations"
            />
          </div>
        )}
      </div>

      {/* Fixed Footer with Action Buttons */}
      <div style={{ 
        padding: "12px 16px", 
        borderTop: "2px solid #404040",
        backgroundColor: "#252525",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        {/* Auto-prefill Toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          backgroundColor: "#2d2d2d",
          borderRadius: "6px",
          border: "1px solid #404040"
        }}>
          <label style={{
            color: "#e0e0e0",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1
          }}>
            <input
              type="checkbox"
              checked={autoPrefill}
              onChange={handleToggleAutoPrefill}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
                accentColor: "#2196F3"
              }}
            />
            <span>Auto-prefill forms on page load</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "10px"
        }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: saved ? "#4CAF50" : "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {saved ? "✓ Saved!" : "Save Information"}
          </button>
          <button
            onClick={handleAutofill}
            style={{
              flex: 1,
              padding: "10px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Autofill Form
          </button>
        </div>
      </div>

      {/* Format Modal */}
      {showFormatModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => setShowFormatModal(false)}
        >
          <div
            style={{
              backgroundColor: "#2d2d2d",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "600px",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0,0,0,0.5)",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#e0e0e0", margin: 0 }}>
                JSON Format Example
              </h2>
              <button
                onClick={() => setShowFormatModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "24px",
                  color: "#a0a0a0",
                  padding: "0",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#a0a0a0", marginBottom: "10px" }}>
              Use this format when importing your data. Copy the example below and modify it with your information.
            </p>
            <pre
              style={{
                backgroundColor: "#1a1a1a",
                color: "#e0e0e0",
                padding: "15px",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "11px",
                fontFamily: "monospace",
                border: "1px solid #404040",
                maxHeight: "400px",
                marginBottom: "15px",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {JSON.stringify(SAMPLE_PERSONAL_INFO, null, 2)}
            </pre>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={copyFormatExample}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  backgroundColor: "#2196F3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "12px",
                }}
              >
                📋 Copy Example
              </button>
              <button
                onClick={() => setShowFormatModal(false)}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  backgroundColor: "#555",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "12px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
