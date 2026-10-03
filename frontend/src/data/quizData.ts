export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export const quizData: Record<string, QuizQuestion[]> = {
  "juice-shop": [
    {
      id: "js-q1",
      question: "What is Broken Access Control?",
      options: [
        "A failure to properly restrict what users can access",
        "A failure to encrypt network traffic",
        "A database connection error",
        "A problem with server hardware",
      ],
      correctAnswer: 0,
      explanation:
        "Broken Access Control occurs when users can access resources or perform actions beyond their intended permissions.",
    },
    {
      id: "js-q2",
      question: "Which vulnerability involves injecting malicious input into an application?",
      options: [
        "Broken Access Control",
        "Injection",
        "Security Misconfiguration",
        "Cryptographic Failure",
      ],
      correctAnswer: 1,
      explanation:
        "Injection vulnerabilities occur when untrusted input is interpreted as part of a command or query.",
    },
    {
      id: "js-q3",
      question: "What is the main purpose of reconnaissance?",
      options: [
        "Delete application data",
        "Identify useful information about the target",
        "Change the application's source code",
        "Restart the Kubernetes cluster",
      ],
      correctAnswer: 1,
      explanation:
        "Reconnaissance is the process of gathering information about a target before deeper investigation.",
    },
    {
      id: "js-q4",
      question: "Why is Juice Shop useful for cybersecurity training?",
      options: [
        "It is a production banking application",
        "It contains deliberately vulnerable functionality",
        "It automatically fixes vulnerabilities",
        "It replaces Kubernetes",
      ],
      correctAnswer: 1,
      explanation:
        "Juice Shop is intentionally vulnerable so students can safely practice identifying and understanding web security weaknesses.",
    },
  ],

  dvwa: [
    {
      id: "dvwa-q1",
      question: "What does SQL Injection target?",
      options: [
        "Database queries",
        "Network cables",
        "Operating system hardware",
        "CSS styling",
      ],
      correctAnswer: 0,
      explanation:
        "SQL Injection occurs when attacker-controlled input is improperly incorporated into database queries.",
    },
    {
      id: "dvwa-q2",
      question: "What does XSS allow an attacker to inject?",
      options: [
        "Network packets",
        "Malicious client-side script",
        "Operating system drivers",
        "Kubernetes nodes",
      ],
      correctAnswer: 1,
      explanation:
        "Cross-Site Scripting allows malicious scripts to execute in a victim's browser.",
    },
  ],

  metasploitable: [
    {
      id: "meta-q1",
      question: "What is network reconnaissance used for?",
      options: [
        "Discovering hosts and services",
        "Designing web pages",
        "Compressing files",
        "Creating database backups",
      ],
      correctAnswer: 0,
      explanation:
        "Network reconnaissance helps identify reachable hosts, open ports, and exposed services.",
    },
    {
      id: "meta-q2",
      question: "Why are unnecessary exposed services a security concern?",
      options: [
        "They increase the attack surface",
        "They improve encryption",
        "They reduce network traffic",
        "They automatically patch vulnerabilities",
      ],
      correctAnswer: 0,
      explanation:
        "Every exposed service can potentially introduce additional vulnerabilities or attack paths.",
    },
  ],
};
