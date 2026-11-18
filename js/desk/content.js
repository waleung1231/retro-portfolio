/* Everything the portfolio says lives here, so the words can change without touching the animation code.
 * Phone number and email are intentionally left out (same as the starter project).
 */
window.CONTENT = {
  name: 'Wan-Rong (Emma) Leung',
  short: 'emma',
  tagline: 'data · hardware · people',

  about: {
    hello: "hi, I'm Emma!",
    paragraphs: [
      "I'm Wan-Rong (Emma) Leung. I study Development Engineering at UC Berkeley (Master of DevEng, 2026–2027), after a B.S. in Data Science at UC San Diego (2022–2026).",
      'I like building things that mix data, hardware and people: gesture-controlled audio, a robotic flower that reacts to smiles, and tools for teams working with little or no internet.',
    ],
    education: [
      { school: 'UC Berkeley', what: 'Master of Development Engineering', when: '2026 – 2027' },
      { school: 'UC San Diego', what: 'B.S. Data Science', when: '2022 – 2026' },
    ],
    skills: ['Python', 'SQL', 'R', 'TensorFlow', 'OpenCV', 'D3.js', 'Raspberry Pi'],
  },

  // Folder colors match the clear-plastic palette. Short blurbs are drafts — edit freely.
  // url is optional: leave it out and the window just won't show an "open project" button.
  projects: [
    { id: 'bearly', title: 'bearly spent', color: '#f59a6b', tags: ['React', 'Vite', 'UI/UX'],
      blurb: 'Cal Hacks 2026: a financial literacy app for kids 7–12 and their parents. I led the frontend and UI/UX, building 30 interactive lessons, visual savings goals and parent approvals for rewards and purchases.',
      url: 'https://40-114-68-113.sslip.io' },
    { id: 'fertility', title: 'fertility grove privacy review', color: '#7cc7d9', tags: ['security', 'HIPAA', 'privacy'],
      blurb: "With UC Berkeley's Public Interest Cybersecurity Clinic: briefed a client on HIPAA and the privacy risks of storing medical records in a fertility support app, and helped scope a review of its data collection, third-party services and what matched users can see about each other." },
    { id: 'audio', title: 'hand-controlled audio player', color: '#f2c14e', tags: ['OpenCV', 'audio', 'web'],
      blurb: 'Play, pause and scrub audio forwards and backwards just by moving your hand in front of the camera.',
      url: 'https://waleung1231.github.io/Hand-Controlled-Bidirectional-Audio-Player/' },
    { id: 'vae', title: 'VAE audio scrubbing', color: '#6f9be8', tags: ['ML', 'VAE', 'sound'],
      blurb: 'Exploring sound through a variational autoencoder: scrub through audio in latent space.',
      url: 'https://vae-rav.spwnd.dev/' },
    { id: 'flower', title: 'robotic flower', color: '#ee93ae', tags: ['hardware', 'Raspberry Pi', 'CV'],
      blurb: 'A robotic flower that reacts to smiles: it opens up when it sees you happy.',
      url: 'https://github.com/waleung1231/Robotic-Flower-' },
    { id: 'hospital', title: 'hospital recovery data viz', color: '#6cc49a', tags: ['D3.js', 'data viz'],
      blurb: 'An interactive visualization of hospital recovery data, built with D3.',
      url: 'https://tanya301.github.io/dsc106_final_project' },
    { id: 'bitcoin', title: 'bitcoin sentiment analysis', color: '#a48be6', tags: ['Python', 'NLP'],
      blurb: 'Reading the mood of Bitcoin conversations with sentiment analysis.',
      url: 'https://github.com/waleung1231/Bitcoin-Sentiment-Analysis' },
    { id: 'rviz', title: 'R data analysis', color: '#e3b8f0', tags: ['R', 'ggplot2', 'EDA'],
      blurb: 'A collection of exploratory data analysis and statistical visualization projects in R with ggplot2.',
      url: 'https://drive.google.com/drive/folders/1KrThKEpS86amMnEu95gzrb7O2AnmHDZQ' },
  ],

  // Each role is a "track" on the CD. len is just the fake track length shown on the LCD.
  // org is the short name for the tracklist; where is the full name shown on the liner notes.
  experience: [
    { org: 'illuminAid', role: 'Project Manager', where: 'illuminAid Development Project · Berkeley, CA', when: 'Sep 2026 – now', len: '4:12',
      text: "Running a student team that's building an offline-first Android projector system for illuminAid's education programs in low-resource settings.",
      points: [
        'Lead a 5-person team: set the project scope, priorities, timelines and who owns what.',
        "Act as the main link between our team and illuminAid, turning their needs into technical requirements for video management, Bluetooth audience-response clickers and projector controls.",
        'Run user discovery, prototyping and technical decisions across software and hardware, so the system stays easy to maintain and works with little or no internet.',
      ] },
    { org: 'Berkeley PIT Clinic', role: 'Data Systems Analyst', where: 'Public Interest Technology Clinic, UC Berkeley · Student Consultant', when: 'Aug 2026 – now', len: '3:48',
      text: "Building a project dashboard for the City of Emeryville's Public Works Department, so project managers can see live budget, contract and schedule data that's currently spread across four disconnected city systems.",
      points: [
        'Designed the canonical data model and identifier crosswalks that join finance, contract and GIS records to a single project.',
        "Parsed the City's published capital improvement program in Python to build a 45-project baseline while system access was still pending.",
      ] },
    { org: 'Chadwick', role: 'Instructor', where: 'Chadwick High School', when: 'Jun – Jul 2026', len: '3:21',
      text: 'Designed and taught two project-based courses for high school students with mixed experience: Data Analysis with Python, and Business & Entrepreneurship.',
      points: [
        'Taught Python, Pandas and Matplotlib for data cleaning, manipulation, visualization and exploratory analysis through hands-on exercises.',
        'Guided each student through an end-to-end data science project: picking a Kaggle dataset, cleaning it, visualizing it and training a simple predictive model.',
        'Walked students through starting their own companies, covering business planning, budgeting, revenue, expenses, profit, marketing and pitching.',
      ] },
    { org: 'Minces Lab', role: 'Independent Researcher', where: 'Victor Minces Lab · Halıcıoğlu Data Science Institute, UCSD', when: 'Mar – Jul 2026', len: '3:30',
      text: 'Finished building an interactive audio scrubbing system that uses an autoencoder to explore, reconstruct and blend sounds.',
      points: [
        'Developed a Variational Autoencoder (VAE) that encodes, reconstructs and generates audio.',
        'Implemented latent-space interpolation for smooth transitions between audio samples.',
        'Built a real-time, gesture-controlled interface that uses hand tracking to navigate and blend sounds.',
      ],
      url: 'https://vae-rav.spwnd.dev/' },
    { org: 'IEEE @ UCSD', role: 'Vice Chair Internal', where: 'IEEE Student Branch, UC San Diego', when: 'Jul 2025 – Jun 2026', len: '5:02',
      text: 'Led promotion and creative direction for IEEE at UC San Diego, a community of 450+ active members.',
      points: [
        'Promoted and marketed 80+ technical, social and professional development events, helping the branch grow to 450+ active members.',
        "Led creative direction and design for event flyers, posters, merch concepts and social media content to strengthen the club's brand and outreach.",
        'Shot event photography and edited marketing videos to make events more visible and engaging across platforms.',
      ],
      url: 'https://ieeeatucsd.org' },
    { org: 'HDSI Lab 3.0', role: 'Undergraduate Research Fellow', where: 'Halıcıoğlu Data Science Institute, UC San Diego', when: 'Sep 2023 – Jun 2026', len: '4:45',
      text: 'Created the Facial Recognition Robotic Flower, an interactive art piece that reacts to your facial expressions, and taught ML to high school students.',
      points: [
        'Built the flower with a Raspberry Pi, Python, TensorFlow and an xArm robot arm.',
        'Trained a CNN for smile detection and connected it to servo control so the flower physically responds.',
        'Designed and taught a project-based data science and ML curriculum for high school students.',
        'Presented the work at project showcases and collaborated with researchers on ongoing HDSI projects.',
      ],
      url: 'https://github.com/waleung1231/Robotic-Flower-' },
    { org: 'TILOS', role: 'Data Science Boot Camp Instructor', where: 'The Institute for Learning-enabled Optimization at Scale, UC San Diego', when: 'Feb – Jul 2023 & Jun – Jul 2025', len: '2:56',
      text: 'Taught Python, NumPy and data science fundamentals to high school students across two boot camps.',
      points: [
        'Made the learning materials: slides, guides and tutorial videos.',
        'Gave students hands-on coding help and kept the classroom safe and engaging.',
      ] },
    { org: 'Resilience Inc', role: 'Data Analyst Intern', where: 'Resilience Inc', when: 'Aug 2024 – Jan 2025', len: '3:14',
      text: 'Analyzed data from K–12 social-emotional learning (SEL) programs to find behavioral trends.',
      points: [
        'Collected, cleaned and analyzed large datasets from multiple sources.',
        'Built interactive dashboards and visual reports to present insights to executives.',
        'Worked with cross-functional teams to make the data pipeline more reliable and the analysis more efficient.',
      ] },
  ],

  // Photos used in the polaroids (wall, desk, camera snaps and the about-me stack).
  photos: [
    'pictures/snoopy-woodstock.png',
    'pictures/snoopy-astronaut.png',
    'pictures/snoopy-icecream.png',
    'pictures/snoopy-winter.png',
    'pictures/snoopy-dance.png',
  ],

  contact: [
    { key: '1', label: 'LinkedIn', url: 'https://linkedin.com/in/wan-rong-leung-228650271' },
    { key: '2', label: 'GitHub', url: 'https://github.com/waleung1231' },
  ],
};
