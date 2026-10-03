export type Lab = {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  status: "Available" | "Coming Soon";
  objectives: string[];
  vulnerabilities: string[];
};

export const labs: Lab[] = [
  {
    id: "juice-shop",
    name: "OWASP Juice Shop",
    description:
      "A deliberately vulnerable web application designed for practical web security training.",
    category: "WEB SECURITY",
    difficulty: "Beginner",
    duration: "45 min",
    status: "Available",
    objectives: [
      "Understand common web application vulnerabilities",
      "Identify security weaknesses in a running application",
      "Practice reconnaissance and vulnerability analysis",
      "Complete guided security missions",
    ],
    vulnerabilities: [
      "Broken Access Control",
      "Injection",
      "Authentication vulnerabilities",
      "Cross-Site Scripting",
    ],
  },
  {
    id: "dvwa",
    name: "DVWA",
    description:
      "A deliberately vulnerable web application for practicing common security vulnerabilities.",
    category: "WEB SECURITY",
    difficulty: "Intermediate",
    duration: "60 min",
    status: "Coming Soon",
    objectives: [
      "Understand common application vulnerabilities",
      "Practice controlled exploitation",
      "Analyze vulnerable application behavior",
    ],
    vulnerabilities: [
      "SQL Injection",
      "XSS",
      "Command Injection",
      "File Inclusion",
    ],
  },
  {
    id: "metasploitable",
    name: "Metasploitable",
    description:
      "A vulnerable system environment for practicing network and system security concepts.",
    category: "NETWORK SECURITY",
    difficulty: "Advanced",
    duration: "90 min",
    status: "Coming Soon",
    objectives: [
      "Identify exposed services",
      "Understand system-level vulnerabilities",
      "Practice network reconnaissance",
    ],
    vulnerabilities: [
      "Weak Services",
      "Misconfiguration",
      "Network Exposure",
      "System Vulnerabilities",
    ],
  },
];