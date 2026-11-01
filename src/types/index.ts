/** Presentation models. No database, authentication or voting behavior yet. */
export interface Employee {
  id: string;
  name: string;
  role: string;
  photo?: string;
  birthday: { day: number; month: number };
}

/** A celebration belongs to a specific year; a birthday recurs annually. */
export interface BirthdayCelebration {
  id: string;
  employeeId: Employee["id"];
  title: string;
  invitation: string;
  image?: string;
  startsAt: string; // ISO 8601 with explicit timezone offset
  location: string;
}

export interface BirthdayPresentation {
  employee: Employee;
  nextBirthday: string; // Calendar date YYYY-MM-DD
  celebration?: BirthdayCelebration;
}

export interface PodiumPlace {
  position: 1 | 2 | 3;
  employee: Employee;
  recognition: string;
}

export interface WeeklyRecognition {
  weekLabel: string;
  winner: Employee;
  message: string;
  podium: readonly PodiumPlace[];
}

export interface ActivityMessage {
  id: string;
  author: Employee;
  text: string;
  sentAt: string;
}

export interface Activity {
  id: string;
  title: string;
  category: "food" | "coffee" | "social";
  creator: Employee;
  status: "open" | "closed";
  createdAt: string;
  description: string;
  messages: readonly ActivityMessage[];
}
