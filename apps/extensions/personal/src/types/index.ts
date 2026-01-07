export interface PreviousCompany {
  company: string;
  title: string;
  startDate: string; // Format: "YYYY-MM" or "MM/YYYY"
  endDate: string; // Format: "YYYY-MM" or "MM/YYYY" or "Present"
  description: string;
}

export interface Education {
  degree: string;
  university: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  percentage?: string;
  cgpa?: string;
}

export interface Reference {
  name: string;
  email: string;
  phone: string;
  company: string;
  designation: string;
  relationship: string; // e.g., "Former Manager", "Colleague", "Professor"
}

export interface Language {
  name: string;
  proficiency: string; // e.g., "Native", "Fluent", "Conversational", "Basic"
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  startDate?: string;
  endDate?: string;
  link?: string;
  githubLink?: string;
}

export interface PersonalInfo {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string; // Format: "YYYY-MM-DD" or "DD/MM/YYYY"
  gender?: string;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  
  // Current Employment
  currentCompany: string;
  currentTitle: string;
  currentStartDate: string;
  currentDescription: string; // Job description/responsibilities
  currentCTC: string; // Current Cost to Company (salary)
  expectedCTC: string; // Expected salary
  noticePeriod: string; // e.g., "30 days", "2 weeks", "Immediate"
  
  // Experience
  totalExperience: string; // e.g., "1+ Years"
  relevantExperience?: string;
  
  // Previous Companies
  previousCompanies: PreviousCompany[];
  
  // Education
  education: Education[];
  
  // Skills
  skills: string[]; // Array of skill names
  
  // Languages
  languages: Language[];
  
  // Certifications
  certifications: Certification[];
  
  // Projects
  projects: Project[];
  
  // References
  references: Reference[];
  
  // Links
  resumeLink: string;
  githubLink: string;
  portfolioLink: string;
  linkedinLink: string;
  
  // Additional
  currentLocation: string;
  preferredLocation?: string[];
  preferredWorkType?: string[]; // ["Remote", "Hybrid", "On-site", "Flexible"]
  willingToRelocate?: boolean;
  workAuthorization?: string; // e.g., "Citizen", "Work Permit", "Visa Required"
  availabilityDate?: string; // When can you start
  summary?: string; // Professional summary/objective
  linkedinHeadline?: string; // LinkedIn profile headline
  coverLetter?: string; // Cover letter text
}

export const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pinCode: "",
  country: "",
  currentCompany: "",
  currentTitle: "",
  currentStartDate: "",
  currentDescription: "",
  currentCTC: "",
  expectedCTC: "",
  noticePeriod: "",
  totalExperience: "",
  relevantExperience: "",
  previousCompanies: [],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
  projects: [],
  references: [],
  resumeLink: "",
  githubLink: "",
  portfolioLink: "",
  linkedinLink: "",
  currentLocation: "",
  preferredLocation: [],
  preferredWorkType: [],
  willingToRelocate: false,
  workAuthorization: "",
  availabilityDate: "",
  summary: "",
  linkedinHeadline: "",
  coverLetter: "",
};

// Sample format for import/export reference
export const SAMPLE_PERSONAL_INFO: PersonalInfo = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+1 234 567 8900",
  dateOfBirth: "01/01/1990",
  gender: "Male",
  addressLine1: "123 Main Street",
  addressLine2: "Apt 4B",
  city: "New York",
  state: "New York",
  pinCode: "10001",
  country: "United States",
  currentCompany: "Example Company Inc.",
  currentTitle: "Software Engineer",
  currentStartDate: "01/2023",
  currentDescription: "Develop and maintain web applications using React and Node.js. Collaborate with cross-functional teams to deliver high-quality software solutions.",
  currentCTC: "100000 USD",
  expectedCTC: "120000 USD",
  noticePeriod: "30 days",
  totalExperience: "3+ Years",
  relevantExperience: "3+ Years",
  previousCompanies: [
    {
      company: "Previous Company Ltd.",
      title: "Junior Developer",
      startDate: "01/2021",
      endDate: "12/2022",
      description: "Developed web applications using React and Node.js",
    },
  ],
  education: [
    {
      degree: "Bachelor of Science",
      university: "Example University",
      fieldOfStudy: "Computer Science",
      startYear: "2016",
      endYear: "2020",
      cgpa: "3.8",
      percentage: "",
    },
  ],
  skills: ["React", "JavaScript", "TypeScript", "Node.js"],
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Spanish", proficiency: "Conversational" },
  ],
  certifications: [
    {
      name: "AWS Certified Developer",
      issuer: "Amazon Web Services",
      issueDate: "01/2023",
      expiryDate: "01/2026",
      credentialId: "ABC123",
      credentialUrl: "https://example.com/credential/ABC123",
    },
  ],
  projects: [
    {
      name: "E-commerce Platform",
      description: "Built a full-featured e-commerce platform with payment integration",
      technologies: ["React", "Node.js", "MongoDB"],
      startDate: "01/2023",
      endDate: "06/2023",
      link: "https://ecommerce.example.com",
      githubLink: "https://github.com/johndoe/ecommerce",
    },
  ],
  references: [
    {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+1 234 567 8901",
      company: "Previous Company",
      designation: "Senior Manager",
      relationship: "Former Manager",
    },
  ],
  resumeLink: "https://example.com/resume.pdf",
  githubLink: "https://github.com/johndoe",
  portfolioLink: "https://johndoe.dev",
  linkedinLink: "https://linkedin.com/in/johndoe",
  currentLocation: "New York, USA",
  preferredLocation: [],
  preferredWorkType: ["Remote"],
  willingToRelocate: false,
  workAuthorization: "Citizen",
  availabilityDate: "Immediate",
  summary: "Experienced software engineer with expertise in web development",
  linkedinHeadline: "Full Stack Developer | React & Node.js Expert",
  coverLetter: "",
};
