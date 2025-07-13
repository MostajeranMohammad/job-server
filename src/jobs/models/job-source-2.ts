export interface Source2Location {
  city: string;
  state: string;
  remote: boolean;
}

export interface Source2Compensation {
  min: number;
  max: number;
  currency: string;
}

export interface Source2Employer {
  companyName: string;
  website: string;
}

export interface Source2Requirements {
  experience: number;
  technologies: string[];
}

export interface Source2JobEntry {
  position: string;
  location: Source2Location;
  compensation: Source2Compensation;
  employer: Source2Employer;
  requirements: Source2Requirements;
  datePosted: string;
}

export interface JobsList {
  [jobId: string]: Source2JobEntry;
}

export interface JobsData {
  jobsList: JobsList;
}

export interface JobSource2Response {
  status: string;
  data: JobsData;
}

// example json data
// {
//   "status": "success",
//   "data": {
//     "jobsList": {
//       "job-628": {
//         "position": "Frontend Developer",
//         "location": {
//           "city": "New York",
//           "state": "WA",
//           "remote": true
//         },
//         "compensation": {
//           "min": 61000,
//           "max": 111000,
//           "currency": "USD"
//         },
//         "employer": {
//           "companyName": "Creative Design Ltd",
//           "website": "https://creativedesign ltd.com"
//         },
//         "requirements": {
//           "experience": 4,
//           "technologies": ["Java", "Spring Boot", "AWS"]
//         },
//         "datePosted": "2025-07-07"
//       },
//       "job-302": {
//         "position": "Backend Engineer",
//         "location": {
//           "city": "San Francisco",
//           "state": "WA",
//           "remote": false
//         },
//         "compensation": {
//           "min": 67000,
//           "max": 111000,
//           "currency": "USD"
//         },
//         "employer": {
//           "companyName": "TechCorp",
//           "website": "https://creativedesign ltd.com"
//         },
//         "requirements": {
//           "experience": 5,
//           "technologies": ["Java", "Spring Boot", "AWS"]
//         },
//         "datePosted": "2025-07-11"
//       }
//     }
//   }
// }
