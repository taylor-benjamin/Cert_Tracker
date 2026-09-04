// Comprehensive Question Bank for Practice Quizzes across supported certifications

export const QUIZ_QUESTIONS = {
  'aws-saa': [
    {
      id: 'aws_q1',
      certId: 'aws-saa',
      domain: 'Design Resilient Architectures',
      question: 'A company runs a stateful web application across multiple Amazon EC2 instances in an Auto Scaling group behind an Application Load Balancer. Users report that their shopping carts randomly empty during their sessions. What is the MOST resilient and decoupled architectural solution?',
      options: [
        'Enable sticky sessions (session affinity) on the Application Load Balancer target group.',
        'Migrate session state storage from local EC2 memory to an Amazon ElastiCache for Redis cluster or Amazon DynamoDB table.',
        'Increase EC2 instance size to prevent memory pressure from dropping user sessions.',
        'Attach an Amazon Elastic File System (EFS) volume to each EC2 instance and write session files to it.'
      ],
      answerIndex: 1,
      explanation: 'Offloading user session state to a fast external datastore like Amazon ElastiCache or Amazon DynamoDB enables the application layer to remain completely stateless. If an instance scales down or terminates, user sessions are preserved reliably without session sticky pin-downs.'
    },
    {
      id: 'aws_q2',
      certId: 'aws-saa',
      domain: 'Design Resilient Architectures',
      question: 'An application requires a relational database that provides high availability with automatic failover and sub-second replication latency across multiple Availability Zones. Which database engine should be recommended?',
      options: [
        'Amazon RDS for MySQL with Multi-AZ DB Cluster deployment',
        'Amazon Aurora with Multi-AZ Aurora Replicas',
        'Amazon EC2 running MySQL Enterprise with master-slave replication',
        'Amazon DynamoDB Global Tables'
      ],
      answerIndex: 1,
      explanation: 'Amazon Aurora provides a distributed, fault-tolerant storage system that automatically replicates 6 copies of data across 3 Availability Zones. Aurora Replicas share the same storage volume, yielding replication latency typically under 100 milliseconds and rapid automatic failover.'
    },
    {
      id: 'aws_q3',
      certId: 'aws-saa',
      domain: 'Design High-Performing Architectures',
      question: 'A global media streaming platform hosts video assets in an Amazon S3 bucket. Users in Europe and Asia report high buffering latency when fetching media hosted in the us-east-1 region. What should the solutions architect implement to minimize latency with minimal operational overhead?',
      options: [
        'Deploy an Amazon CloudFront distribution with the S3 bucket configured as the origin.',
        'Configure S3 Cross-Region Replication (CRR) to replicate buckets in eu-west-1 and ap-southeast-1.',
        'Use AWS Global Accelerator to route UDP/TCP traffic directly to EC2 media streaming servers.',
        'Enable S3 Transfer Acceleration on the us-east-1 bucket.'
      ],
      answerIndex: 0,
      explanation: 'Amazon CloudFront is a global Content Delivery Network (CDN) with hundreds of Edge Locations worldwide. CloudFront caches static media files close to global viewers, drastically reducing latency and egress costs from S3.'
    },
    {
      id: 'aws_q4',
      certId: 'aws-saa',
      domain: 'Design Secure Architectures',
      question: 'A company needs to strictly restrict communication so that EC2 instances in a private subnet can download operating system patches from the internet, but outside internet hosts can NEVER initiate connections to the EC2 instances. Which network component is required?',
      options: [
        'An Internet Gateway attached to the private subnet route table.',
        'A NAT Gateway deployed in a public subnet with a route in the private route table.',
        'A VPC Peering connection to an on-premises proxy appliance.',
        'An egress-only Internet Gateway.'
      ],
      answerIndex: 1,
      explanation: 'A NAT (Network Address Translation) Gateway placed in a public subnet enables instances in private subnets to initiate outbound IPv4 connections to the internet (e.g. for patching), while blocking any inbound connections initiated from the outside.'
    },
    {
      id: 'aws_q5',
      certId: 'aws-saa',
      domain: 'Design Cost-Optimized Architectures',
      question: 'A financial services firm produces compliance audit reports once per month. The reports are accessed frequently during the first 30 days, accessed occasionally for the next 90 days, and must be retained for 7 years where retrieval within 3-5 hours is acceptable. What is the most cost-effective storage strategy?',
      options: [
        'Store in S3 Standard for 7 years with versioning enabled.',
        'Create an S3 Lifecycle policy: S3 Standard for 30 days -> S3 Standard-IA for 90 days -> S3 Glacier Flexible Retrieval for 7 years.',
        'Store all data directly into S3 Glacier Deep Archive from day 1.',
        'Store data in S3 One Zone-IA for 120 days, then delete.'
      ],
      answerIndex: 1,
      explanation: 'S3 Lifecycle transitions allow data to step down storage tiers: S3 Standard provides immediate high-throughput access, S3 Standard-IA saves money for infrequent access, and S3 Glacier Flexible Retrieval provides compliant 7-year storage at pennies per GB with 3-5 hour retrieval.'
    }
  ],
  'pmp': [
    {
      id: 'pmp_q1',
      certId: 'pmp',
      domain: 'People (Conflict, Leadership, Team)',
      question: 'Two senior software engineers on an agile project have reached an impasse regarding the architectural design of a microservice. The disagreement is causing delays in sprint backlog delivery. As a servant leader project manager, what is your BEST course of action?',
      options: [
        'Make the architectural decision yourself as the project manager to keep the sprint on schedule.',
        'Escalate the disagreement to the project sponsor for executive arbitration.',
        'Facilitate a collaborative discussion where both engineers evaluate tradeoffs against project objectives and team working agreements.',
        'Assign the microservice to another developer who was not involved in the dispute.'
      ],
      answerIndex: 2,
      explanation: 'In Agile and PMP philosophy, the project manager acts as a servant leader. The preferred conflict resolution technique is Collaborating/Problem Solving, facilitating dialogue so team members reach consensus based on objective project goals.'
    },
    {
      id: 'pmp_q2',
      certId: 'pmp',
      domain: 'Process (Scope, Schedule, Budget, Quality)',
      question: 'A project has a Planned Value (PV) of $100,000, an Earned Value (EV) of $85,000, and an Actual Cost (AC) of $90,000. What is the status of the project schedule and budget?',
      options: [
        'Ahead of schedule and under budget.',
        'Behind schedule (SPI = 0.85) and over budget (CPI = 0.94).',
        'Behind schedule (SPI = 0.94) and under budget (CPI = 1.05).',
        'Ahead of schedule (SPI = 1.15) and over budget (CPI = 0.94).'
      ],
      answerIndex: 1,
      explanation: 'SPI = EV / PV = 85,000 / 100,000 = 0.85 (SPI < 1 means behind schedule). CPI = EV / AC = 85,000 / 90,000 = 0.944 (CPI < 1 means over budget).'
    },
    {
      id: 'pmp_q3',
      certId: 'pmp',
      domain: 'Process (Scope, Schedule, Budget, Quality)',
      question: 'During project execution, a key stakeholder requests an urgent feature addition that was not included in the approved scope baseline. What should the project manager do FIRST?',
      options: [
        'Update the project scope statement and instruct the development team to begin work.',
        'Reject the request immediately because the scope baseline is locked.',
        'Evaluate the impact of the requested change on the project schedule, cost, quality, and risk.',
        'Submit the change request directly to the change control board without analysis.'
      ],
      answerIndex: 2,
      explanation: 'Whenever a change request is received, the project manager must first analyze its comprehensive impact across all project dimensions (cost, time, scope, risk) before submitting it to the Change Control Board (CCB) for approval.'
    },
    {
      id: 'pmp_q4',
      certId: 'pmp',
      domain: 'Business Environment (Compliance, Value)',
      question: 'A government regulation governing data privacy will take effect midway through a multi-year IT implementation project. What should the project manager do to ensure project compliance and value delivery?',
      options: [
        'Add the new regulation to the project risk register, assess exposure, and plan compliance activities in upcoming iterations.',
        'Wait until the regulation is officially published into law before altering project plans.',
        'Inform the sponsor that the project must be paused indefinitely.',
        'Transfer the compliance liability to a third-party audit firm.'
      ],
      answerIndex: 0,
      explanation: 'Proactive compliance management in the Business Environment domain requires logging external regulatory changes into the risk register, analyzing schedule/scope implications, and integrating compliance requirements into upcoming work packages.'
    }
  ],
  'comptia-sec': [
    {
      id: 'sec_q1',
      certId: 'comptia-sec',
      domain: 'General Security Concepts',
      question: 'A security engineer is implementing a cryptographic framework that ensures a sender cannot deny having sent a critical financial transaction message. Which security concept does this provide?',
      options: [
        'Confidentiality',
        'Non-repudiation',
        'High Availability',
        'Obfuscation'
      ],
      answerIndex: 1,
      explanation: 'Non-repudiation prevents a party from denying the authenticity of their signature or sending of a message. It is typically achieved through asymmetric public-key cryptography and digital signatures.'
    },
    {
      id: 'sec_q2',
      certId: 'comptia-sec',
      domain: 'Threats, Vulnerabilities, and Mitigations',
      question: 'An attacker intercepts an encrypted authentication session between a client and server, records the ciphertext payload, and later retransmits the exact same payload to the authentication endpoint to gain unauthorized access. What type of attack is this?',
      options: [
        'Replay Attack',
        'SQL Injection',
        'Cross-Site Scripting (XSS)',
        'Buffer Overflow'
      ],
      answerIndex: 0,
      explanation: 'In a Replay Attack, valid transmission data is fraudulently captured and repeated/delayed. Mitigations include using one-time nonces, timestamps, and ephemeral session keys (like TLS with perfect forward secrecy).'
    },
    {
      id: 'sec_q3',
      certId: 'comptia-sec',
      domain: 'Security Architecture',
      question: 'Which Zero Trust Architecture principle dictates that all access requests must be authenticated, authorized, and encrypted before granting access, regardless of whether the user is inside or outside the corporate network perimeter?',
      options: [
        'Implicit Trust',
        'Never Trust, Always Verify',
        'Defense in Depth',
        'Separation of Duties'
      ],
      answerIndex: 1,
      explanation: 'The foundational tenet of Zero Trust Architecture (NIST SP 800-207) is "Never Trust, Always Verify" — eliminating implicit trust based on physical or network location.'
    },
    {
      id: 'sec_q4',
      certId: 'comptia-sec',
      domain: 'Security Operations',
      question: 'During an active malware outbreak on an employee workstation, what is the FIRST containment step an incident responder should execute according to NIST incident handling guidelines?',
      options: [
        'Immediately format the hard drive and reinstall the operating system.',
        'Isolate the compromised system from the network (unplug ethernet or disconnect Wi-Fi) while preserving volatile memory.',
        'Send an organization-wide warning email.',
        'Contact law enforcement authorities.'
      ],
      answerIndex: 1,
      explanation: 'In the Containment phase, the priority is preventing lateral movement across the network without destroying volatile forensic evidence (RAM, running processes, open network sockets).'
    }
  ],
  'cpa-aud': [
    {
      id: 'cpa_q1',
      certId: 'cpa-aud',
      domain: 'Assessing Risk and Developing a Planned Response',
      question: 'In the Audit Risk Model, which component represents the risk that the auditor will conclude that financial statements are free of material misstatement when in fact such misstatements exist?',
      options: [
        'Inherent Risk',
        'Control Risk',
        'Detection Risk',
        'Business Risk'
      ],
      answerIndex: 2,
      explanation: 'Audit Risk = Inherent Risk × Control Risk × Detection Risk. Detection Risk is the only component directly controllable by the auditor through nature, timing, and extent of substantive testing.'
    },
    {
      id: 'cpa_q2',
      certId: 'cpa-aud',
      domain: 'Performing Further Procedures and Obtaining Evidence',
      question: 'When testing the existence assertion for accounts receivable, which audit procedure provides the MOST reliable substantive evidence?',
      options: [
        'Inquiring with the credit manager about collectability.',
        'Direct positive confirmation requests sent to external customers.',
        'Reviewing internal sales orders and shipping documents.',
        'Performing an analytical trend ratio of receivable turnover.'
      ],
      answerIndex: 1,
      explanation: 'Audit evidence obtained directly from independent external sources (such as external customer accounts receivable confirmations) is generally considered more reliable than internal company records or oral inquiries.'
    },
    {
      id: 'cpa_q3',
      certId: 'cpa-aud',
      domain: 'Ethics, Professional Responsibilities and General Principles',
      question: 'Under the AICPA Code of Professional Conduct, which circumstance impairs an auditor’s independence with respect to an attest client?',
      options: [
        'An audit team member owning direct stock shares in the attest client.',
        'An auditor having a fully collateralized automobile loan with a lending client under customary market terms.',
        'The auditor providing non-tax advisory recommendations that management reviews and decides upon.',
        'The auditor performing analytical review of competitor benchmark ratios.'
      ],
      answerIndex: 0,
      explanation: 'Direct financial interests in an attest client by a covered member (such as holding shares of company stock) impair independence, regardless of whether the holding is material or immaterial.'
    }
  ],
  'azure-solutions': [
    {
      id: 'az_q1',
      certId: 'azure-solutions',
      domain: 'Design Identity, Governance, and Monitoring Solutions',
      question: 'An organization requires conditional access policies that prompt for multi-factor authentication (MFA) only when a user logs in from an unfamiliar IP address or high-risk sign-in scenario. Which Microsoft Entra feature fulfills this requirement?',
      options: [
        'Microsoft Entra ID Protection Risk-Based Conditional Access',
        'Azure Role-Based Access Control (RBAC)',
        'Microsoft Entra Privileged Identity Management (PIM)',
        'Azure Blueprints'
      ],
      answerIndex: 0,
      explanation: 'Microsoft Entra ID Protection detects sign-in risk events (e.g. anonymous IP, unfamiliar sign-in properties) and integrates with Conditional Access to enforce MFA dynamically.'
    },
    {
      id: 'az_q2',
      certId: 'azure-solutions',
      domain: 'Design Data Storage Solutions',
      question: 'An application requires a multi-model globally distributed NoSQL database with single-digit millisecond response times and five well-defined consistency levels. Which Azure service should you architect?',
      options: [
        'Azure Cosmos DB',
        'Azure SQL Database Hyperscale',
        'Azure Database for PostgreSQL',
        'Azure Synapse Analytics'
      ],
      answerIndex: 0,
      explanation: 'Azure Cosmos DB provides turnkey global distribution, multi-model APIs (SQL, MongoDB, Cassandra, Gremlin, Table), guaranteed SLA latencies < 10ms, and five distinct consistency models.'
    }
  ]
};
