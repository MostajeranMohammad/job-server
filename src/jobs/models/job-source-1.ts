export interface Source1Metadata {
  requestId: string;
  timestamp: string;
}

export interface JobSource1Details {
  location: string;
  type: string;
  salaryRange: string;
}

export interface CompanySource1 {
  name: string;
  industry: string;
}

export interface JobSource1 {
  jobId: string;
  title: string;
  details: JobSource1Details;
  company: CompanySource1;
  skills: string[];
  postedDate: string;
}

export interface JobSource1Response {
  metadata: Source1Metadata;
  jobs: JobSource1[];
}

// example json data
// {
//   "metadata": {
//     "requestId": "req-xyzpb7prk",
//     "timestamp": "2025-07-13T05:51:23.208Z"
//   },
//   "jobs": [
//     {
//       "jobId": "P1-672",
//       "title": "Frontend Developer",
//       "details": {
//         "location": "Seattle, WA",
//         "type": "Part-Time",
//         "salaryRange": "$62k - $136k"
//       },
//       "company": {
//         "name": "DataWorks",
//         "industry": "Design"
//       },
//       "skills": ["Java", "Spring Boot", "AWS"],
//       "postedDate": "2025-07-06T01:25:07.877Z"
//     },
//     {
//       "jobId": "P1-311",
//       "title": "Software Engineer",
//       "details": {
//         "location": "Seattle, WA",
//         "type": "Part-Time",
//         "salaryRange": "$90k - $130k"
//       },
//       "company": {
//         "name": "TechCorp",
//         "industry": "Technology"
//       },
//       "skills": ["JavaScript", "Node.js", "React"],
//       "postedDate": "2025-07-11T08:06:47.493Z"
//     }
//   ]
// }
