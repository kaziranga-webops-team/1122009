export const LEVELS = ["Foundation", "Diploma", "Degree"] as const;
export type Level = (typeof LEVELS)[number];

export function isLevel(value: string | null | undefined): value is Level {
  return LEVELS.includes(value as Level);
}

/**
 * The subject catalogue for each level. Notes, YouTube channels and books are
 * matched to a subject by this exact name, so keep the spelling identical.
 */
export const SUBJECTS: Record<Level, string[]> = {
  Foundation: [
    "Mathematics for Data Science I",
    "Statistics for Data Science I",
    "Computational Thinking",
    "English I",
    "Mathematics for Data Science II",
    "Statistics for Data Science II",
    "Programming in Python",
    "English II",
  ],
  Diploma: [
    "Database Management Systems",
    "Programming, Data Structures and Algorithms using Python",
    "Modern Application Development I",
    "Programming Concepts using Java",
    "Modern Application Development II",
    "System Commands",
    "Machine Learning Foundations",
    "Business Data Management",
    "Machine Learning Techniques",
    "Machine Learning Practice",
    "Business Analytics",
    "Tools in Data Science",
  ],
  Degree: [
    "Software Engineering",
    "Software Testing",
    "AI: Search Methods for Problem Solving",
    "Deep Learning",
    "Strategies for Professional Growth",
    "Computer Systems Design",
    "Programming in C",
    "Deep Learning for Computer Vision",
    "Large Language Models",
    "Introduction to Big Data",
    "Linear Statistical Models",
    "Reinforcement Learning",
    "Introduction to Natural Language Processing",
    "Deep Learning Practice",
    "Operating Systems",
  ],
};

const ACRONYM_MAP: Record<string, string> = {
  mlt: "Machine Learning Techniques",
  mlf: "Machine Learning Foundations",
  mlp: "Machine Learning Practice",
  dbms: "Database Management Systems",
  pdsa: "Programming, Data Structures & Algorithms",
  ct: "Computational Thinking",
  tds: "Tools in Data Science",
  bdm: "Business Data Management",
  ba: "Business Analytics",
  se: "Software Engineering",
  st: "Software Testing",
  os: "Operating Systems",
  cso: "Computer Systems Organization",
  sc: "System Commands",
  mad1: "Modern Application Development 1",
  "mad 1": "Modern Application Development 1",
  mad2: "Modern Application Development 2",
  "mad 2": "Modern Application Development 2",
  dl: "Deep Learning",
  dlp: "Deep Learning Practice",
  ai: "Artificial Intelligence",
  nlp: "Natural Language Processing",
  rl: "Reinforcement Learning",
  lsm: "Linear Statistical Models",
};

const SHORT_ACRONYMS: Record<string, string> = {
  "machine learning technique": "MLT",
  "machine learning foundation": "MLF",
  "machine learning practice": "MLP",
  "database management": "DBMS",
  "deep learning practice": "DLP",
  "deep learning for computer vision": "DLCV",
  "deep learning": "DL",
  "search methods for problem solving": "AI",
  "artificial intelligence": "AI",
  "natural language processing": "NLP",
  "large language models": "LLM",
  "reinforcement learning": "RL",
  "linear statistical": "LSM",
  "computational thinking": "CT",
  "business data management": "BDM",
  "business analytics": "BA",
  "tools in data science": "TDS",
  "software engineering": "SE",
  "software testing": "ST",
  "operating system": "OS",
  "computer systems organization": "CSO",
  "computer systems design": "CSD",
  "system command": "SC",
  "strategies for professional growth": "SPG",
  "introduction to big data": "Big Data",
  "programming in c": "C",
  "statistics for data science 1": "Stats 1",
  "statistics for data science i": "Stats 1",
  "statistics for data science 2": "Stats 2",
  "statistics for data science ii": "Stats 2",
  "mathematics for data science 1": "Maths 1",
  "mathematics for data science i": "Maths 1",
  "mathematics for data science 2": "Maths 2",
  "mathematics for data science ii": "Maths 2",
  "modern application development 1": "MAD 1",
  "modern application development i": "MAD 1",
  "modern application development 2": "MAD 2",
  "modern application development ii": "MAD 2",
  "data structures and algorithms": "PDSA",
  "programming, data structures": "PDSA",
  "financial accounting": "Accounting",
};

const MINOR_WORDS = new Set(["and", "for", "in", "of", "to", "the", "a", "an", "with", "via", "by", "from", "using"]);

/** "MACHINE LEARNING TECHNIQUES", "ct" → "Machine Learning Techniques", "Computational Thinking". */
export function formatSubjectTitle(name: string): string {
  if (!name) return "";
  const cleaned = name.trim();
  const expanded = ACRONYM_MAP[cleaned.toLowerCase()];
  if (expanded) return expanded;

  return cleaned
    .split(/\s+/)
    .map((word, index) => {
      if (/^(I|II|III|IV|V|VI|[0-9]+)$/i.test(word)) return word.toUpperCase();
      if (/^[A-Z]{2,}:?$/.test(word)) return word;
      const lower = word.toLowerCase();
      if (index > 0 && MINOR_WORDS.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** The short name students use: "MLT", "DBMS", "Stats 1". */
export function getSubjectShortName(name: string): string {
  if (!name) return "";
  const cleaned = name.trim();
  const lower = cleaned.toLowerCase().replace(/[-_]/g, " ");

  for (const [key, short] of Object.entries(SHORT_ACRONYMS)) {
    // Keys ending in a course number must end on a word boundary, or "… i" would also match "… ii".
    const matches = /\s(i|ii|[0-9])$/.test(key)
      ? new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)
      : lower.includes(key);
    if (matches) return short;
  }

  if (lower.includes("python")) return "Python";
  if (lower.includes("java")) return "Java";
  if (lower.includes("english 2") || lower.includes("english ii")) return "English 2";
  if (lower.includes("english 1") || lower.includes("english i")) return "English 1";
  if (cleaned.length <= 6) return cleaned.toUpperCase();
  return formatSubjectTitle(cleaned);
}

/** Which level a subject belongs to, or null if it isn't in the catalogue. */
export function findSubjectLevel(subject: string): Level | null {
  const s = subject.toLowerCase();
  return LEVELS.find((lvl) => SUBJECTS[lvl].some((name) => name.toLowerCase() === s)) ?? null;
}
