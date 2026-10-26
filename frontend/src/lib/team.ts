export interface TeamMember {
  name: string;
  title: string;
  image: string | null;
}

// ponytail: static roster. Move back to CMS (/cms/public/team) if it needs editing.
export const TEAM: TeamMember[] = [
  { name: "Uma", title: "Founder", image: "/media/newTeam/uma.jpeg" },
  { name: "Srinivas", title: "Project Coordinator", image: "/media/newTeam/srinivas.jpeg" },
  { name: "Varun", title: "Full Stack Developer", image: "/media/newTeam/Varun_PP.png" },
  { name: "Satish", title: "Full Stack Developer", image: "/media/newTeam/satyanarayana.jpeg" },
  { name: "Harshitha", title: "Frontend Developer", image: "/media/newTeam/harsitha.jpeg" },
  { name: "Srujan", title: "Client Relations", image: "/media/newTeam/srujan.jpeg" },
  { name: "Ranadeep", title: "Full Stack Developer, Client Relations", image: "/media/newTeam/Ranaadeep.jpeg" },
  { name: "Hemanth", title: "Full Stack Developer", image: "/media/newTeam/Hemanth.jpeg" },
  { name: "Chandhini", title: "Project Coordinator, AI Development", image: "/media/newTeam/alrihab.jpg" },
  { name: "Priya", title: "Graphic Designer", image: "/media/newTeam/Priya.jpeg" },
  { name: "Gnana", title: "Frontend Developer", image: "/media/newTeam/Gnana.jpeg" },
];
