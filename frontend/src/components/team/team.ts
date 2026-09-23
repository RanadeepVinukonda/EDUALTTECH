// Team members. Each entry has the photo file name for /images/team/{file}.
// If the file isn't there yet the grid falls back to a clean initials avatar,
// so pages keep looking right while photos are gathered.

export interface TeamMember {
  name: string;
  file: string;
}

export const TEAM: TeamMember[] = [
  { name: "Ranadeep Vinukonda", file: "ranadeep.jpg" },
  { name: "Yuva", file: "Yuva.jpeg" },
  { name: "Venkat", file: "venkat.jpg" },
  { name: "Uma", file: "uma.jpg" },
  { name: "Srinivas", file: "srinivas.jpeg" },
  { name: "Sanju", file: "sanju.jpeg" },
  { name: "Lavaraju", file: "lavaraju.jpg" },
  { name: "Kavya", file: "kavya.jpeg" },
  { name: "Gnanasri", file: "gnanasri.jpg" },
  { name: "Alrihab", file: "alrihab.jpg" },
];