// Default certifications and exam domains
export const DEFAULT_CERTIFICATIONS = [
  {
    id: 'aws-saa',
    code: 'AWS-SAA-C03',
    name: 'AWS Certified Solutions Architect – Associate',
    category: 'Cloud Computing',
    provider: 'Amazon Web Services',
    icon: '☁️',
    color: '#FF9900',
    defaultTargetHours: 90,
    avgWeeksToCertify: 10,
    avgHoursPerWeek: 9,
    domains: [
      { id: 'd1', name: 'Design Resilient Architectures', weight: 26 },
      { id: 'd2', name: 'Design High-Performing Architectures', weight: 24 },
      { id: 'd3', name: 'Design Secure Architectures', weight: 30 },
      { id: 'd4', name: 'Design Cost-Optimized Architectures', weight: 20 }
    ],
    suggestedResources: [
      { title: 'AWS Well-Architected Framework Whitepaper', url: 'https://aws.amazon.com/architecture/well-architected/', type: 'Whitepaper' },
      { title: 'Stephane Maarek: AWS Certified Solutions Architect Associate', url: 'https://udemy.com', type: 'Video Course' },
      { title: 'Tutorials Dojo AWS Practice Exams (Jon Bonso)', url: 'https://tutorialsdojo.com', type: 'Practice Exams' },
      { title: 'Official AWS Skill Builder Free Ramp-Up Guide', url: 'https://explore.skillbuilder.aws', type: 'Official Guide' }
    ]
  },
  {
    id: 'pmp',
    code: 'PMP-2024',
    name: 'Project Management Professional (PMP)',
    category: 'Project Management',
    provider: 'Project Management Institute (PMI)',
    icon: '📊',
    color: '#4F46E5',
    defaultTargetHours: 120,
    avgWeeksToCertify: 12,
    avgHoursPerWeek: 10,
    domains: [
      { id: 'd1', name: 'People (Conflict, Leadership, Team)', weight: 42 },
      { id: 'd2', name: 'Process (Scope, Schedule, Budget, Quality)', weight: 50 },
      { id: 'd3', name: 'Business Environment (Compliance, Value)', weight: 8 }
    ],
    suggestedResources: [
      { title: 'PMBOK Guide 7th Edition & Agile Practice Guide', url: 'https://www.pmi.org', type: 'Official Standard' },
      { title: 'Andrew Ramdayal: PMP Exam Prep Simplified 35 PDUs', url: 'https://udemy.com', type: 'Video Course' },
      { title: 'PMI Study Hall Practice Tests & Flashcards', url: 'https://www.pmi.org/certifications/project-management-pmp/study-hall', type: 'Practice Exams' },
      { title: 'Ricardo Vargas PMBOK 7 Process Flow Breakdown', url: 'https://ricardovargas.com', type: 'Cheat Sheet' }
    ]
  },
  {
    id: 'comptia-sec',
    code: 'SY0-701',
    name: 'CompTIA Security+ (SY0-701)',
    category: 'Cybersecurity',
    provider: 'CompTIA',
    icon: '🛡️',
    color: '#EF4444',
    defaultTargetHours: 80,
    avgWeeksToCertify: 8,
    avgHoursPerWeek: 10,
    domains: [
      { id: 'd1', name: 'General Security Concepts', weight: 12 },
      { id: 'd2', name: 'Threats, Vulnerabilities, and Mitigations', weight: 22 },
      { id: 'd3', name: 'Security Architecture', weight: 18 },
      { id: 'd4', name: 'Security Operations', weight: 28 },
      { id: 'd5', name: 'Security Program Management and Oversight', weight: 20 }
    ],
    suggestedResources: [
      { title: 'Professor Messer CompTIA SY0-701 Training Course', url: 'https://professormesser.com', type: 'Free Video Series' },
      { title: 'Jason Dion Security+ Practice Tests & PBQs', url: 'https://udemy.com', type: 'Practice Exams' },
      { title: 'CompTIA Security+ Exam Objectives Document', url: 'https://comptia.org', type: 'Official Guide' }
    ]
  },
  {
    id: 'cpa-aud',
    code: 'CPA-AUD',
    name: 'Certified Public Accountant (CPA) – Auditing & Attestation',
    category: 'Finance & Accounting',
    provider: 'AICPA / NASBA',
    icon: '📈',
    color: '#10B981',
    defaultTargetHours: 110,
    avgWeeksToCertify: 10,
    avgHoursPerWeek: 11,
    domains: [
      { id: 'd1', name: 'Ethics, Professional Responsibilities and General Principles', weight: 20 },
      { id: 'd2', name: 'Assessing Risk and Developing a Planned Response', weight: 30 },
      { id: 'd3', name: 'Performing Further Procedures and Obtaining Evidence', weight: 35 },
      { id: 'd4', name: 'Forming Conclusions and Reporting', weight: 15 }
    ],
    suggestedResources: [
      { title: 'Becker CPA Review AUD Exam Prep', url: 'https://becker.com', type: 'Comprehensive Review' },
      { title: 'AICPA CPA Exam Blueprints for AUD', url: 'https://aicpa.org', type: 'Official Blueprint' },
      { title: 'Ninja CPA Review AUD Supplement & Audio Notes', url: 'https://ninjacpareview.com', type: 'Study Supplement' }
    ]
  },
  {
    id: 'azure-solutions',
    code: 'AZ-305',
    name: 'Microsoft Certified: Azure Solutions Architect Expert',
    category: 'Cloud Computing',
    provider: 'Microsoft',
    icon: '⚡',
    color: '#0284C7',
    defaultTargetHours: 85,
    avgWeeksToCertify: 9,
    avgHoursPerWeek: 9.5,
    domains: [
      { id: 'd1', name: 'Design Identity, Governance, and Monitoring Solutions', weight: 27 },
      { id: 'd2', name: 'Design Data Storage Solutions', weight: 25 },
      { id: 'd3', name: 'Design Business Continuity Solutions', weight: 16 },
      { id: 'd4', name: 'Design Infrastructure Solutions', weight: 32 }
    ],
    suggestedResources: [
      { title: 'Microsoft Learn: AZ-305 Official Learning Paths', url: 'https://learn.microsoft.com', type: 'Free Official Labs' },
      { title: 'John Savill Azure Master Class & Exam Cram', url: 'https://youtube.com', type: 'Free Video Series' },
      { title: 'MeasureUp AZ-305 Practice Test Suite', url: 'https://measureup.com', type: 'Practice Exams' }
    ]
  }
];

export const DEFAULT_BADGES = [
  {
    id: 'first_session',
    name: 'First Step',
    description: 'Logged your very first study session.',
    icon: '🌱',
    unlockedAt: null
  },
  {
    id: 'streak_3',
    name: 'Momentum Builder',
    description: 'Maintained a 3-day consecutive study streak.',
    icon: '🔥',
    unlockedAt: null
  },
  {
    id: 'streak_7',
    name: 'Unstoppable Flame',
    description: 'Maintained a 7-day consecutive study streak.',
    icon: '⚡',
    unlockedAt: null
  },
  {
    id: 'hours_10',
    name: 'Dedicated Student',
    description: 'Completed 10 total hours of certification study.',
    icon: '📖',
    unlockedAt: null
  },
  {
    id: 'hours_50',
    name: 'Deep Diver',
    description: 'Passed 50 hours of intensive study.',
    icon: '🛡️',
    unlockedAt: null
  },
  {
    id: 'hours_100',
    name: 'Century Club',
    description: 'Hit 100 logged study hours across certifications!',
    icon: '👑',
    unlockedAt: null
  },
  {
    id: 'quiz_ace',
    name: 'Quiz Master',
    description: 'Scored 90% or higher on a practice quiz.',
    icon: '🎯',
    unlockedAt: null
  },
  {
    id: 'exam_ready',
    name: 'Exam Ready',
    description: 'Achieved an overall exam-readiness score of 80% or above.',
    icon: '🚀',
    unlockedAt: null
  },
  {
    id: 'first_pass',
    name: 'Certified Champion',
    description: 'Marked a certification goal as Passed/Completed!',
    icon: '🏆',
    unlockedAt: null
  }
];

export const INITIAL_USER = {
  id: 'usr_demo',
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  avatar: '👨‍💻',
  role: 'member',
  joinedDate: '2026-08-15'
};

// Seed sample goals to give user an immediate rich experience
export function getInitialGoals() {
  const today = new Date();
  const examDateAWS = new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // in 18 days
  const examDatePMP = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // in 45 days

  return [
    {
      id: 'goal_aws',
      certId: 'aws-saa',
      certName: 'AWS Certified Solutions Architect – Associate',
      certCode: 'AWS-SAA-C03',
      targetDate: examDateAWS,
      targetHours: 85,
      weeklyHourTarget: 10,
      status: 'in_progress', // 'in_progress' | 'passed' | 'paused'
      notes: 'Focusing on VPC peering, multi-tier HA architectures, and RDS Aurora read-replicas.',
      createdAt: '2026-08-15',
      resources: [
        { id: 'r1', title: 'AWS Solutions Architect Official Exam Guide PDF', url: 'https://d1.awsstatic.com/training-and-certification/docs-sa-assoc/AWS-Certified-Solutions-Architect-Associate_Exam-Guide.pdf', type: 'PDF' },
        { id: 'r2', title: 'My VPC & Subnet Routing Cheat Sheet', url: 'https://gist.github.com/example/aws-vpc', type: 'Link' }
      ]
    },
    {
      id: 'goal_pmp',
      certId: 'pmp',
      certName: 'Project Management Professional (PMP)',
      certCode: 'PMP-2024',
      targetDate: examDatePMP,
      targetHours: 110,
      weeklyHourTarget: 8,
      status: 'in_progress',
      notes: 'Mastering the Servant Leadership mindset and Agile ceremony cadences.',
      createdAt: '2026-08-20',
      resources: [
        { id: 'r3', title: 'Agile vs Predictive Matrix Notion Page', url: 'https://notion.so/pmp-framework', type: 'Link' }
      ]
    }
  ];
}

// Seed sample study sessions for realistic metrics and streaks
export function getInitialSessions() {
  const d = new Date();
  const fmt = (offsetDays) => {
    const target = new Date(d.getTime() - offsetDays * 24 * 60 * 60 * 1000);
    return target.toISOString().split('T')[0];
  };

  return [
    {
      id: 'sess_1',
      goalId: 'goal_aws',
      certId: 'aws-saa',
      certName: 'AWS Certified Solutions Architect',
      domain: 'Design Resilient Architectures',
      topic: 'Multi-AZ Deployments & Auto Scaling Groups',
      durationMinutes: 120, // 2.0 hrs
      date: fmt(0), // Today
      notes: 'Reviewed launch templates, scaling policies (target tracking vs step scaling), and ELB health check thresholds.',
      method: 'Hands-on Lab'
    },
    {
      id: 'sess_2',
      goalId: 'goal_aws',
      certId: 'aws-saa',
      certName: 'AWS Certified Solutions Architect',
      domain: 'Design High-Performing Architectures',
      topic: 'ElastiCache (Redis vs Memcached) & CloudFront Caching',
      durationMinutes: 90, // 1.5 hrs
      date: fmt(1), // Yesterday
      notes: 'Practiced invalidation strategies, TTL settings, and signed URLs for private S3 content.',
      method: 'Video Course'
    },
    {
      id: 'sess_3',
      goalId: 'goal_aws',
      certId: 'aws-saa',
      certName: 'AWS Certified Solutions Architect',
      domain: 'Design Secure Architectures',
      topic: 'IAM Roles, SCPs, and KMS Envelope Encryption',
      durationMinutes: 105, // 1.75 hrs
      date: fmt(2), // 2 days ago
      notes: 'Clear understanding of DEK generation and HSM key rotation policies.',
      method: 'Reading'
    },
    {
      id: 'sess_4',
      goalId: 'goal_pmp',
      certId: 'pmp',
      certName: 'Project Management Professional (PMP)',
      domain: 'People (Conflict, Leadership, Team)',
      topic: 'Conflict Resolution Techniques & Tuckman Ladder',
      durationMinutes: 150, // 2.5 hrs
      date: fmt(3), // 3 days ago
      notes: 'Collaborating/Problem Solving is almost always the best answer on the exam.',
      method: 'Flashcards'
    },
    {
      id: 'sess_5',
      goalId: 'goal_aws',
      certId: 'aws-saa',
      certName: 'AWS Certified Solutions Architect',
      domain: 'Design Cost-Optimized Architectures',
      topic: 'S3 Storage Classes & Lifecycle Transitions',
      durationMinutes: 75, // 1.25 hrs
      date: fmt(4), // 4 days ago
      notes: 'S3 Intelligent-Tiering deep dive and Glacier Flexible Retrieval minimum retention days.',
      method: 'Practice Questions'
    },
    {
      id: 'sess_6',
      goalId: 'goal_pmp',
      certId: 'pmp',
      certName: 'Project Management Professional (PMP)',
      domain: 'Process (Scope, Schedule, Budget, Quality)',
      topic: 'Earned Value Analysis (CPI, SPI, EAC, ETC)',
      durationMinutes: 120, // 2 hrs
      date: fmt(5), // 5 days ago
      notes: 'Practiced formulas: CPI = EV/AC, SPI = EV/PV. CPI > 1 is under budget!',
      method: 'Video Course'
    }
  ];
}

// Initial Sprint Hub items for Sprint 1
export const SPRINT_1_STORIES = [
  {
    id: 'US-1',
    title: 'User Sign Up with Email/Password',
    description: 'As a new user, I want to sign up with email/password so I can create my account.',
    points: 3,
    status: 'done', // 'todo' | 'in_progress' | 'done'
    category: 'Auth'
  },
  {
    id: 'US-2',
    title: 'Log In & Log Out Privacy',
    description: 'As a returning user, I want to log in and out so my data stays private.',
    points: 2,
    status: 'done',
    category: 'Auth'
  },
  {
    id: 'US-3',
    title: 'Password Reset Flow',
    description: 'As a user, I want to reset my password so I am not locked out if I forget it.',
    points: 3,
    status: 'done',
    category: 'Auth'
  },
  {
    id: 'US-4',
    title: 'Create Certification Goal with Target Date',
    description: 'As a user, I want to create a certification goal with a target exam date so I can start tracking progress.',
    points: 5,
    status: 'done',
    category: 'Goals'
  },
  {
    id: 'US-5',
    title: 'Log Study Session (Topic, Duration, Date)',
    description: 'As a user, I want to log a study session (topic, duration, date) so my effort is recorded.',
    points: 5,
    status: 'done',
    category: 'Tracking'
  },
  {
    id: 'US-6',
    title: 'View Past Study Sessions & Filter',
    description: 'As a user, I want to view my past study sessions so I can review what I have covered.',
    points: 3,
    status: 'done',
    category: 'Tracking'
  },
  {
    id: 'US-7',
    title: 'Progress Bar & Hours Tracker',
    description: 'As a user, I want to see total hours studied and a progress bar toward my goal so I know how close I am.',
    points: 8,
    status: 'done',
    category: 'Analytics'
  },
  {
    id: 'US-8',
    title: 'Dashboard Summary for Active Goals',
    description: 'As a user, I want a dashboard summarizing all my active certification goals so I can see everything at a glance.',
    points: 5,
    status: 'done',
    category: 'Dashboard'
  }
];

export const INITIAL_BURNDOWN_DAYS = [
  { day: 0, ideal: 34.0, actual: 34 },
  { day: 1, ideal: 30.6, actual: 32 },
  { day: 2, ideal: 27.2, actual: 29 },
  { day: 3, ideal: 23.8, actual: 26 },
  { day: 4, ideal: 20.4, actual: 21 },
  { day: 5, ideal: 17.0, actual: 16 },
  { day: 6, ideal: 13.6, actual: 13 },
  { day: 7, ideal: 10.2, actual: 8 },
  { day: 8, ideal: 6.8, actual: 5 },
  { day: 9, ideal: 3.4, actual: 2 },
  { day: 10, ideal: 0.0, actual: 0 }
];

export const INITIAL_RETROSPECTIVE = {
  wentWell: [
    'Baseline sizing anchored to US-2 (2 pts) kept estimation debates focused and structured.',
    'Clear modular UI architecture enabled parallel work on goals and session tracking.',
    'Interactive streak counter and readiness calculations turned out more engaging than initial spec.'
  ],
  harderThanExpected: [
    'US-7 (Progress bar & hours tracker) dependency on both US-4 and US-5 caused brief blocking until data schemas settled.',
    'Date boundary edge cases when calculating consecutive day streaks across timezones.'
  ],
  changesForNextCycle: [
    'Define shared data schemas in Sprint Zero before estimating dependent calculation user stories.',
    'Break 8-point stories into two smaller 3-5 point increments for smoother burndown flow.'
  ]
};
