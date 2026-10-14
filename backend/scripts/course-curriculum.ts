/**
 * Detailed syllabus for every course in course-catalog.ts.
 *
 * Six chapters of four topics each, plus a capstone project (title,
 * description and milestone list). Lesson titles are generated from the topic
 * in seed-curriculum.ts — the topic titles below are the authored, visible
 * curriculum. Keys must match CourseSeed.slug.
 */
export interface ChapterSpec {
  title: string;
  summary?: string;
  topics: string[];
}

export interface ProjectSpec {
  title: string;
  description: string;
  milestones: string[];
}

export interface CourseCurriculum {
  chapters: ChapterSpec[];
  project: ProjectSpec;
}

export const CURRICULUM: Record<string, CourseCurriculum> = {
  "computational-thinking": {
    chapters: [
      { title: "Thinking in Steps", topics: ["What computational thinking is", "Breaking problems into parts", "Sequencing steps", "Why order matters"] },
      { title: "Patterns and Abstraction", topics: ["Spotting patterns", "Abstraction basics", "Generalising a solution", "Patterns in everyday life"] },
      { title: "Algorithms", topics: ["What an algorithm is", "Writing step-by-step instructions", "Tracing an algorithm", "Everyday algorithms"] },
      { title: "Logic and Reasoning", topics: ["True and false", "If-then reasoning", "Conditions and branches", "Logic puzzles"] },
      { title: "Representing Information", topics: ["How computers store ideas", "Lists and tables", "Simple flowcharts", "Making ideas visual"] },
      { title: "Solving Problems", topics: ["Understanding the problem", "Planning before you code", "Testing your solution", "Improving your solution"] },
    ],
    project: {
      title: "Design an Everyday Algorithm",
      description: "Break a real daily routine into a clear, ordered algorithm, then test it with a friend to find and fix the gaps.",
      milestones: ["Pick a routine and write the goal", "List every step in order", "Add decisions and edge cases", "Test, refine and present"],
    },
  },
  "computer-basics": {
    chapters: [
      { title: "Getting Started with Computers", topics: ["Parts of a computer", "Turning it on and off safely", "Using a mouse and keyboard", "Understanding the desktop"] },
      { title: "Files and Folders", topics: ["What files and folders are", "Creating and renaming", "Moving and copying", "Finding lost files"] },
      { title: "Typing and Input", topics: ["Home-row typing", "Typing practice", "Shortcuts every beginner needs", "Copy, cut and paste"] },
      { title: "The Internet", topics: ["What the internet is", "Using a web browser", "Searching effectively", "Downloading and uploading"] },
      { title: "Everyday Software", topics: ["Word processors", "Spreadsheet basics", "Viewing photos and media", "Installing an app"] },
      { title: "Staying Safe Online", topics: ["Strong passwords", "Spotting scams", "Safe browsing habits", "Protecting your data"] },
    ],
    project: {
      title: "Organise Your Digital Workspace",
      description: "Set up a clean, logical folder system for school work and personal files, then find and rename files using what you learned.",
      milestones: ["Plan a folder structure", "Create and name folders", "Move and rename files", "Show a friend and explain it"],
    },
  },
  "scratch-block-coding": {
    chapters: [
      { title: "Meet Scratch", topics: ["The Scratch editor", "Sprites and the stage", "The blocks palette", "Your first program"] },
      { title: "Motion and Looks", topics: ["Moving a sprite", "Turning and pointing", "Costumes and backdrops", "Speech and effects"] },
      { title: "Events and Control", topics: ["Starting with events", "Loops and repeats", "Forever loops", "Waiting and timing"] },
      { title: "Sound and Sensing", topics: ["Adding sound", "Playing music", "Keyboard and mouse sensing", "Collision detection"] },
      { title: "Variables and Score", topics: ["What variables are", "Keeping score", "Countdown timers", "Lives and levels"] },
      { title: "Make a Game", topics: ["Game design basics", "Building game rules", "Levels and difficulty", "Polishing your game"] },
    ],
    project: {
      title: "Build a Playable Arcade Game",
      description: "Design and build a complete Scratch game with a goal, a score and win-or-lose conditions, then share it with the class.",
      milestones: ["Write your game idea", "Build the core loop", "Add scoring and levels", "Test, fix bugs and present"],
    },
  },
  "basic-digital-skills": {
    chapters: [
      { title: "Working with Documents", topics: ["Creating a document", "Formatting text", "Headings and lists", "Saving and sharing"] },
      { title: "Presentations", topics: ["Slide basics", "Designing clear slides", "Images and charts", "Telling a story"] },
      { title: "Spreadsheets", topics: ["Rows, columns and cells", "Simple formulas", "Formatting data", "Making a chart"] },
      { title: "Research Online", topics: ["Framing a question", "Finding reliable sources", "Taking notes", "Citing sources"] },
      { title: "Digital Communication", topics: ["Writing clear emails", "Sharing files", "Collaborating online", "Online etiquette"] },
      { title: "Productivity", topics: ["Organising your work", "Cloud storage", "Calendars and reminders", "Working faster with shortcuts"] },
    ],
    project: {
      title: "Present a Topic You Care About",
      description: "Research a topic, build a short slide deck with a chart, and present it clearly to an audience.",
      milestones: ["Choose a topic and question", "Research and take notes", "Build the slide deck", "Rehearse and present"],
    },
  },
  "python-for-kids": {
    chapters: [
      { title: "Your First Python", topics: ["What Python is", "Printing text", "Writing comments", "Running a program"] },
      { title: "Variables and Input", topics: ["Storing information", "Numbers and text", "Asking the user", "Using their answers"] },
      { title: "Making Decisions", topics: ["Comparing values", "If and else", "Combining conditions", "A guessing game"] },
      { title: "Repeating Things", topics: ["Why loops help", "For loops", "While loops", "Loop patterns"] },
      { title: "Functions", topics: ["What a function is", "Making your own", "Passing values in", "Reusing code"] },
      { title: "Lists and Fun", topics: ["Storing many things", "Adding and removing", "Looping through lists", "Random numbers"] },
    ],
    project: {
      title: "Build a Number Guessing Game",
      description: "Create a game where the computer picks a number and the player guesses, using loops, conditions and input.",
      milestones: ["Plan the game rules", "Generate a secret number", "Loop guesses and give hints", "Add attempts and a replay"],
    },
  },
  "basic-data-concepts": {
    chapters: [
      { title: "What is Data", topics: ["Data all around us", "Facts and information", "Collecting data", "Asking good questions"] },
      { title: "Tables", topics: ["Rows and columns", "Headers and labels", "Sorting a table", "Filtering data"] },
      { title: "Data Types", topics: ["Numbers", "Text", "Dates and times", "Categories"] },
      { title: "Charts", topics: ["Bar charts", "Line charts", "Pie charts", "Choosing the right chart"] },
      { title: "Simple Analysis", topics: ["Counting and totals", "Averages", "Largest and smallest", "Spotting trends"] },
      { title: "Telling a Story with Data", topics: ["Clean and clear data", "Highlighting what matters", "Avoiding misleading charts", "Presenting findings"] },
    ],
    project: {
      title: "Turn a Survey into Insights",
      description: "Collect a small survey, organise it in a table, chart it, and explain what the data shows.",
      milestones: ["Design the survey questions", "Collect and enter data", "Chart the results", "Present your conclusions"],
    },
  },
  "html-css": {
    chapters: [
      { title: "How the Web Works", topics: ["What a webpage is", "Browsers and servers", "Your first HTML file", "Viewing a page"] },
      { title: "HTML Structure", topics: ["Tags and elements", "Headings and paragraphs", "Links", "Images"] },
      { title: "Lists and Tables", topics: ["Bulleted and numbered lists", "Nesting lists", "Tables in HTML", "Semantic sections"] },
      { title: "Styling with CSS", topics: ["What CSS is", "Selectors", "Colours and fonts", "The box model"] },
      { title: "Layout", topics: ["Spacing and padding", "Flexbox basics", "Simple grids", "Responsive basics"] },
      { title: "Build a Page", topics: ["Planning the page", "Structuring content", "Styling sections", "Polishing"] },
    ],
    project: {
      title: "Build a Personal Web Page",
      description: "Create a responsive personal page with a header, an about section, a photo and links, styled with CSS.",
      milestones: ["Sketch the layout", "Write the HTML structure", "Style with CSS", "Test on mobile and publish"],
    },
  },
  "introduction-to-ai": {
    chapters: [
      { title: "What AI Is", topics: ["Defining AI", "AI and normal programs", "A short history", "AI in the news"] },
      { title: "AI You Already Use", topics: ["Search and recommendations", "Voice assistants", "Maps and photos", "Smart devices"] },
      { title: "How AI Learns", topics: ["Data and examples", "Patterns and predictions", "Training and using", "Why data quality matters"] },
      { title: "AI Strengths and Limits", topics: ["What AI is good at", "Where AI fails", "Bias and mistakes", "Confident but wrong answers"] },
      { title: "Responsible AI", topics: ["Privacy", "Fairness", "Being honest online", "AI and homework"] },
      { title: "Using AI Well", topics: ["Asking good prompts", "Checking answers", "AI as a helper", "When not to use AI"] },
    ],
    project: {
      title: "Audit AI in Your Daily Life",
      description: "Find five AI tools you use, explain what each does, and evaluate one strength and one risk of each.",
      milestones: ["List the AI you use", "Explain each in plain words", "Note strengths and risks", "Present responsible-use tips"],
    },
  },
  "python-intermediate": {
    chapters: [
      { title: "Functions Deep Dive", topics: ["Parameters and return values", "Default arguments", "Scope", "Docstrings"] },
      { title: "Collections", topics: ["Lists in depth", "Tuples", "Dictionaries", "Sets"] },
      { title: "Strings and Text", topics: ["String methods", "Formatting text", "Splitting and joining", "Working with files"] },
      { title: "Errors and Debugging", topics: ["Reading error messages", "Try and except", "Debugging techniques", "Writing clean code"] },
      { title: "Modules and Packages", topics: ["Importing modules", "The standard library", "Installing packages", "Organising code"] },
      { title: "Objects and Classes", topics: ["What a class is", "Attributes and methods", "Creating objects", "Simple inheritance"] },
    ],
    project: {
      title: "Build a Contacts Manager",
      description: "Create a command-line contacts app using dictionaries, functions, files and error handling.",
      milestones: ["Design the data model", "Implement add and search", "Save and load from a file", "Handle errors gracefully"],
    },
  },
  "algorithms-problem-solving": {
    chapters: [
      { title: "Thinking Algorithmically", topics: ["Decomposing problems", "Pseudocode", "Tracing by hand", "Big-picture efficiency"] },
      { title: "Searching", topics: ["Linear search", "Binary search", "Comparing speed", "Choosing a search"] },
      { title: "Sorting", topics: ["Bubble sort", "Selection sort", "Insertion sort", "Why sorting matters"] },
      { title: "Recursion", topics: ["What recursion is", "Base cases", "Recursive solutions", "When to recurse"] },
      { title: "Data Structures", topics: ["Arrays and lists", "Stacks and queues", "Maps", "Choosing structures"] },
      { title: "Problem-Solving Practice", topics: ["Breaking down interview problems", "Edge cases", "Optimising a solution", "Explaining your reasoning"] },
    ],
    project: {
      title: "Solve a Set of Logic Challenges",
      description: "Work through a series of algorithm problems, document your approach and compare solutions by efficiency.",
      milestones: ["Solve warm-up problems", "Implement search and sort", "Optimise a slow solution", "Write up your reasoning"],
    },
  },
  "javascript-basics": {
    chapters: [
      { title: "JavaScript on the Web", topics: ["What JavaScript does", "Adding scripts to a page", "The console", "Variables"] },
      { title: "Values and Types", topics: ["Numbers and strings", "Booleans", "Comparing values", "Template strings"] },
      { title: "Logic and Control", topics: ["If and else", "Switch", "Logical operators", "Truthy and falsy"] },
      { title: "Loops and Arrays", topics: ["Arrays", "For loops", "Array methods", "Looping objects"] },
      { title: "The DOM", topics: ["Selecting elements", "Changing content", "Changing styles", "Creating elements"] },
      { title: "Events and Interactivity", topics: ["Listening for clicks", "Forms and input", "Keyboard events", "Building an interactive widget"] },
    ],
    project: {
      title: "Build an Interactive To-Do List",
      description: "Create a to-do app in the browser with add, complete and delete, using the DOM, events and arrays.",
      milestones: ["Plan the UI and data", "Render the list from an array", "Add, complete and delete items", "Persist and polish"],
    },
  },
  "databases-basic-sql": {
    chapters: [
      { title: "Data and Databases", topics: ["Why databases", "Tables and records", "Keys", "Relational thinking"] },
      { title: "Querying with SQL", topics: ["SELECT", "WHERE filters", "ORDER BY", "LIMIT"] },
      { title: "Shaping Results", topics: ["Aggregates", "GROUP BY", "Aliases", "DISTINCT"] },
      { title: "Joining Tables", topics: ["Relationships", "INNER JOIN", "LEFT JOIN", "Combining tables"] },
      { title: "Changing Data", topics: ["INSERT", "UPDATE", "DELETE", "Transactions"] },
      { title: "Designing a Schema", topics: ["Modelling a domain", "Normalisation", "Constraints", "Indexes"] },
    ],
    project: {
      title: "Design and Query a Library Database",
      description: "Model a small library (books, members, loans) as tables and write queries to answer real questions.",
      milestones: ["Model the tables", "Create and insert data", "Write join and aggregate queries", "Answer a set of questions"],
    },
  },
  "software-development": {
    chapters: [
      { title: "The Software Lifecycle", topics: ["Idea to release", "Requirements", "Design", "Iteration"] },
      { title: "Designing a Solution", topics: ["Breaking down features", "Data and flow", "Sketching the architecture", "Planning tasks"] },
      { title: "Building", topics: ["Setting up a project", "Writing your first feature", "Working in small steps", "Version control basics"] },
      { title: "Testing and Debugging", topics: ["Why we test", "Finding bugs", "Debugging techniques", "Writing simple tests"] },
      { title: "Collaborating", topics: ["Branches", "Pull requests", "Code review", "Naming and style"] },
      { title: "Shipping", topics: ["Preparing a release", "Deploying", "Monitoring", "Improving after launch"] },
    ],
    project: {
      title: "Take a Small App from Idea to Release",
      description: "Plan, build, test and ship a small application, documenting each stage of the process.",
      milestones: ["Write requirements", "Design and plan", "Build and test", "Ship and review"],
    },
  },
  "python-projects": {
    chapters: [
      { title: "Getting Ready", topics: ["Project setup", "Organising files", "Reusable helpers", "Reading requirements"] },
      { title: "Games", topics: ["Game loops", "Handling input", "Scoring and state", "Randomness"] },
      { title: "Automation", topics: ["Automating file tasks", "Working with the operating system", "Scheduling scripts", "Handling errors"] },
      { title: "Data Mini-Apps", topics: ["Reading CSV files", "Processing records", "Producing reports", "Exporting results"] },
      { title: "Building an Interface", topics: ["Command-line menus", "Input validation", "Clear output", "A simple GUI"] },
      { title: "Clean Code", topics: ["Naming", "Splitting into functions", "Reuse", "Documentation"] },
    ],
    project: {
      title: "Ship Three Python Projects",
      description: "Build a game, an automation script and a small data tool, each finished, tested and documented.",
      milestones: ["Build the game", "Build the automation script", "Build the data tool", "Review and present all three"],
    },
  },
  "full-stack-basics": {
    chapters: [
      { title: "The Big Picture", topics: ["Frontend and backend", "How requests flow", "The stack", "Tools you will use"] },
      { title: "Frontend Refresh", topics: ["HTML structure", "Styling", "JavaScript interactivity", "Components"] },
      { title: "Backend Basics", topics: ["Servers and routes", "Handling requests", "Request bodies", "Returning JSON"] },
      { title: "Databases", topics: ["Storing data", "Reading and writing", "Modelling", "Basic queries"] },
      { title: "Connecting Them", topics: ["Fetching from the frontend", "REST endpoints", "Loading and errors", "Auth basics"] },
      { title: "Finishing an App", topics: ["State and forms", "Validation", "Styling the result", "Deploying"] },
    ],
    project: {
      title: "Build a Full-Stack To-Do App",
      description: "Create a complete app with a frontend, an API and a database that stores and returns tasks.",
      milestones: ["Set up frontend and backend", "Build the API and database", "Connect the UI to the API", "Deploy and test end to end"],
    },
  },
  "ai-fundamentals": {
    chapters: [
      { title: "What AI Really Is", topics: ["AI, ML and deep learning", "Supervised and unsupervised", "Models and features", "The ML workflow"] },
      { title: "Data for AI", topics: ["Collecting datasets", "Cleaning data", "Splitting train and test", "Labelling"] },
      { title: "How Models Learn", topics: ["Training", "Loss and optimisation", "Overfitting", "Evaluating models"] },
      { title: "Classic Models", topics: ["Linear regression", "Classification", "Decision trees", "Clustering"] },
      { title: "Neural Networks", topics: ["Perceptrons", "Layers and activation", "Training a small network", "Where deep learning wins"] },
      { title: "Applying AI", topics: ["Choosing a problem", "Matching model to task", "Bias and fairness", "Deploying a model"] },
    ],
    project: {
      title: "Train Your First Model",
      description: "Take a small dataset, train a model, evaluate it and explain its accuracy and limits.",
      milestones: ["Choose and prepare data", "Train a simple model", "Evaluate and iterate", "Present your results"],
    },
  },
  "data-science": {
    chapters: [
      { title: "The Data Science Workflow", topics: ["Framing a question", "Collecting data", "Exploring", "Communicating"] },
      { title: "Python for Data", topics: ["NumPy basics", "Pandas series and frames", "Loading data", "Inspecting data"] },
      { title: "Cleaning Data", topics: ["Missing values", "Duplicates", "Types and formatting", "Outliers"] },
      { title: "Analysis", topics: ["Filtering and grouping", "Aggregation", "Correlation", "Feature thinking"] },
      { title: "Visualisation", topics: ["Matplotlib basics", "Charts that inform", "Distributions", "Telling a story"] },
      { title: "Insights to Action", topics: ["From numbers to narrative", "Avoiding traps", "Presenting findings", "Reproducibility"] },
    ],
    project: {
      title: "Analyse a Real Dataset",
      description: "Pick a public dataset, clean it, explore it and present three clear, evidence-backed insights.",
      milestones: ["Choose and load data", "Clean and prepare", "Analyse and visualise", "Present your insights"],
    },
  },
  "machine-learning": {
    chapters: [
      { title: "Foundations", topics: ["ML problem types", "Features and labels", "The training pipeline", "Bias and variance"] },
      { title: "Regression", topics: ["Linear regression", "Multiple features", "Regularisation", "Evaluating regression"] },
      { title: "Classification", topics: ["Logistic regression", "Decision boundaries", "Metrics", "Confusion matrices"] },
      { title: "Trees and Ensembles", topics: ["Decision trees", "Random forests", "Gradient boosting", "Feature importance"] },
      { title: "Model Tuning", topics: ["Cross-validation", "Hyperparameters", "Grid search", "Avoiding overfitting"] },
      { title: "Putting It Together", topics: ["Building a pipeline", "Preprocessing", "Saving models", "From notebook to service"] },
    ],
    project: {
      title: "Build and Tune a Predictive Model",
      description: "Train, evaluate and tune a classification model on a real dataset and justify your choices.",
      milestones: ["Prepare features", "Build a baseline model", "Tune and compare", "Report metrics and limits"],
    },
  },
  "ai-with-python": {
    chapters: [
      { title: "Python for AI", topics: ["Environment setup", "NumPy essentials", "Working with arrays", "Performance thinking"] },
      { title: "Data Preparation", topics: ["Loading datasets", "Cleaning", "Encoding features", "Scaling"] },
      { title: "ML with scikit-learn", topics: ["Estimators", "Fit and predict", "Pipelines", "Model selection"] },
      { title: "Simple AI Projects", topics: ["A classifier", "A predictor", "Text basics", "Image basics"] },
      { title: "Deep Learning Intro", topics: ["Tensors", "A first neural network", "Training loops", "Evaluating"] },
      { title: "Using AI in Production", topics: ["Saving and loading models", "Serving predictions", "Calling AI APIs", "Monitoring"] },
    ],
    project: {
      title: "Build a Python AI App",
      description: "Create a working app that trains a model and serves predictions, then wrap it behind a simple interface.",
      milestones: ["Prepare data", "Train the model", "Serve predictions", "Wrap in a simple app"],
    },
  },
  "apis": {
    chapters: [
      { title: "What APIs Are", topics: ["Interfaces between systems", "Requests and responses", "Why APIs matter", "Real-world examples"] },
      { title: "HTTP Fundamentals", topics: ["Methods", "Status codes", "Headers", "Request bodies"] },
      { title: "REST Basics", topics: ["Resources", "Endpoints", "JSON payloads", "Versioning"] },
      { title: "Calling APIs", topics: ["Using fetch", "API keys", "Handling errors", "Rate limits"] },
      { title: "Connecting to AI", topics: ["AI service APIs", "Sending prompts", "Streaming responses", "Cost awareness"] },
      { title: "Building and Integrating", topics: ["Designing a simple API", "Documenting an API", "Wiring services together", "Testing integrations"] },
    ],
    project: {
      title: "Build an App That Uses an API",
      description: "Connect a small app to an external (or AI) API, handle the response and show the result to the user.",
      milestones: ["Choose an API", "Call it and parse the response", "Handle errors and loading", "Build the UI on top"],
    },
  },
  "deep-learning": {
    chapters: [
      { title: "Neural Networks", topics: ["From perceptrons to networks", "Activation functions", "The forward pass", "Why depth helps"] },
      { title: "Training Networks", topics: ["Backpropagation intuition", "Loss functions", "Optimisers", "Regularisation"] },
      { title: "Computer Vision", topics: ["Image data", "Convolutional layers", "Pooling", "Training a CNN"] },
      { title: "Natural Language Processing", topics: ["Text as data", "Embeddings", "Sequence models", "Attention"] },
      { title: "Transfer Learning", topics: ["Pretrained models", "Fine-tuning", "Data-efficient training", "Deployment"] },
      { title: "Projects and Ethics", topics: ["Building an end-to-end model", "Evaluating deeply", "Bias and fairness", "Reporting results"] },
    ],
    project: {
      title: "Build an Image or Text Model",
      description: "Train a deep learning model for a vision or text task, evaluate it carefully and document its limitations.",
      milestones: ["Prepare the dataset", "Build and train a model", "Evaluate and improve", "Document and present"],
    },
  },
  "generative-ai": {
    chapters: [
      { title: "What Generative AI Is", topics: ["Generative and predictive models", "The landscape of models", "Capabilities", "Limits"] },
      { title: "Large Language Models", topics: ["Tokens", "Transformers intuition", "Pretraining", "Scaling behaviour"] },
      { title: "Prompting", topics: ["Clear instructions", "Few-shot examples", "Structuring output", "Iterating prompts"] },
      { title: "Building with LLMs", topics: ["Calling LLM APIs", "Prompt templates", "Chaining steps", "Retrieval basics"] },
      { title: "Fine-Tuning and Customisation", topics: ["When to fine-tune", "Datasets", "Evaluation", "Fine-tuning and prompting compared"] },
      { title: "Responsible Generative AI", topics: ["Hallucinations", "Bias and safety", "Privacy", "Attribution and honesty"] },
    ],
    project: {
      title: "Build a Generative AI Assistant",
      description: "Create a tool powered by an LLM, such as a study helper or content generator, with good prompts and safety checks.",
      milestones: ["Define the use case", "Design prompts and flow", "Build and test the tool", "Evaluate and document risks"],
    },
  },
  "ai-assisted-development": {
    chapters: [
      { title: "The New Workflow", topics: ["What AI coding tools do", "Where they help most", "Where they fail", "Setting expectations"] },
      { title: "Prompting for Code", topics: ["Describing requirements", "Providing context", "Iterating on output", "Asking for explanations"] },
      { title: "Using Copilots", topics: ["Inline suggestions", "Chat workflows", "Generating tests", "Refactoring"] },
      { title: "Reviewing AI Code", topics: ["Spotting bugs", "Security concerns", "Performance", "Maintainability"] },
      { title: "Working Faster", topics: ["Scaffolding", "Boilerplate", "Documentation", "Debugging with AI"] },
      { title: "Doing It Responsibly", topics: ["Verifying everything", "Licensing", "Secrets safety", "Staying the engineer"] },
    ],
    project: {
      title: "Ship a Feature Faster with AI",
      description: "Build a real feature using AI tools, then review, correct and harden the generated code.",
      milestones: ["Plan the feature", "Generate with AI tools", "Review and fix", "Test and document"],
    },
  },
  "cloud-basics": {
    chapters: [
      { title: "Cloud Foundations", topics: ["What the cloud is", "IaaS, PaaS and SaaS", "Regions and availability", "Cost basics"] },
      { title: "Deploying an App", topics: ["Build and package", "Choosing a host", "Environment variables", "Your first deploy"] },
      { title: "Storage and Databases", topics: ["Object storage", "Managed databases", "Backups", "Choosing storage"] },
      { title: "Networking and Domains", topics: ["DNS", "Domains and TLS", "Content delivery networks", "Load balancing"] },
      { title: "Scaling and Reliability", topics: ["Scaling up and out", "Health checks", "Monitoring and logs", "Failures and recovery"] },
      { title: "Cost and Security", topics: ["Understanding bills", "Access control", "Secrets management", "Securing the cloud"] },
    ],
    project: {
      title: "Deploy and Scale a Small App",
      description: "Deploy an application to the cloud, attach a domain, monitor it and explain your scaling choices.",
      milestones: ["Prepare the app", "Deploy to a host", "Add a domain and monitoring", "Test reliability"],
    },
  },
  "advanced-software-engineering": {
    chapters: [
      { title: "Version Control Mastery", topics: ["Branching models", "Rebasing and merging", "Resolving conflicts", "History hygiene"] },
      { title: "Testing Strategy", topics: ["Unit and integration tests", "Test design", "Test-driven development", "Coverage and confidence"] },
      { title: "Architecture", topics: ["Layers and boundaries", "Separation of concerns", "Dependency management", "Scalability"] },
      { title: "Code Review", topics: ["Giving good reviews", "Receiving feedback", "Review checklists", "Automating checks"] },
      { title: "Quality and Tooling", topics: ["Linters", "CI pipelines", "Static analysis", "Documentation"] },
      { title: "Leading Engineering Work", topics: ["Breaking down epics", "Estimation", "Technical debt", "Mentoring"] },
    ],
    project: {
      title: "Harden a Real Codebase",
      description: "Take an existing project, add tests and a CI pipeline, refactor a weak area and run a structured code review.",
      milestones: ["Assess the codebase", "Add tests and CI", "Refactor and document", "Review and report"],
    },
  },
  "applied-ai": {
    chapters: [
      { title: "From Model to Product", topics: ["Framing the AI problem", "Success metrics", "Data needs", "Risks"] },
      { title: "Data Pipelines", topics: ["Ingestion", "Cleaning and features", "Versioning data", "Automation"] },
      { title: "Building AI Systems", topics: ["Pipelines and components", "Model integration", "Prompt and tool orchestration", "Caching"] },
      { title: "Evaluation", topics: ["Offline metrics", "Human evaluation", "A/B testing", "Monitoring quality"] },
      { title: "Deployment and MLOps", topics: ["Packaging models", "Serving", "CI/CD for ML", "Rollbacks"] },
      { title: "Responsible AI in Product", topics: ["Fairness", "Transparency", "Privacy", "Governance"] },
    ],
    project: {
      title: "Ship an AI-Powered Product Feature",
      description: "Design, build and deploy a small AI feature end to end, with evaluation and monitoring.",
      milestones: ["Define the problem and metrics", "Build the pipeline", "Evaluate quality", "Deploy and monitor"],
    },
  },
  "app-web-development": {
    chapters: [
      { title: "Planning an App", topics: ["User stories", "Choosing the stack", "Screens and flows", "Data model"] },
      { title: "Building the Frontend", topics: ["Components", "Routing", "State management", "Forms"] },
      { title: "Building the Backend", topics: ["API design", "Authentication", "Business logic", "Validation"] },
      { title: "Data and Integration", topics: ["Database", "Wiring frontend to backend", "Error handling", "Third-party services"] },
      { title: "Testing and Quality", topics: ["Testing flows", "Fixing bugs", "Performance", "Accessibility"] },
      { title: "Shipping to Users", topics: ["Build and deploy", "Environments", "Analytics", "Iterating"] },
    ],
    project: {
      title: "Build and Launch a Web App",
      description: "Create a complete web application with accounts, data and a polished UI, then deploy it for real users.",
      milestones: ["Plan and design", "Build frontend and backend", "Test and fix", "Deploy and gather feedback"],
    },
  },
  "cybersecurity-basics": {
    chapters: [
      { title: "Security Mindset", topics: ["Why security matters", "The attacker's view", "Confidentiality, integrity and availability", "Everyday threats"] },
      { title: "Threats and Attacks", topics: ["Malware", "Phishing", "Social engineering", "Common exploits"] },
      { title: "Secure Coding", topics: ["Input validation", "Avoiding injection", "Authentication and sessions", "Handling secrets"] },
      { title: "Data and Privacy", topics: ["Encryption basics", "Passwords and hashing", "Personal data", "Privacy laws"] },
      { title: "Defending Systems", topics: ["Updates and patching", "Firewalls and safe configuration", "Monitoring", "Backups and recovery"] },
      { title: "Responding to Incidents", topics: ["Detecting incidents", "Containing damage", "Recovering", "Learning lessons"] },
    ],
    project: {
      title: "Audit a Small App for Risks",
      description: "Review a simple application for common vulnerabilities and produce a prioritised fix report.",
      milestones: ["Map the attack surface", "Find and rank risks", "Propose fixes", "Present the report"],
    },
  },
  "specialization-track": {
    chapters: [
      { title: "Choosing Your Path", topics: ["AI and machine learning", "Software engineering", "Data science", "Cybersecurity"] },
      { title: "Foundations Deepened", topics: ["Core concepts review", "Tools and setup", "Study plan", "Project goals"] },
      { title: "Specialisation Studio I", topics: ["Guided project", "Mentor check-ins", "Iteration", "Review"] },
      { title: "Specialisation Studio II", topics: ["Advanced project", "Research", "Performance", "Documentation"] },
      { title: "Professional Practice", topics: ["Working in teams", "Git workflows", "Communication", "Portfolio"] },
      { title: "Capstone and Career", topics: ["Capstone build", "Interview preparation", "Presentation", "Next steps"] },
    ],
    project: {
      title: "Complete a Specialisation Capstone",
      description: "Deliver a substantial project in your chosen specialisation, mentored end to end, and present it as career evidence.",
      milestones: ["Pick a specialisation and scope", "Build with mentor reviews", "Document and test", "Present and prepare for interviews"],
    },
  },
  "portfolio-development": {
    chapters: [
      { title: "Why a Portfolio", topics: ["What employers look for", "Choosing what to show", "Building a habit", "Standing out"] },
      { title: "Git and GitHub", topics: ["Repositories", "Commits and history", "READMEs", "Profiles"] },
      { title: "Project Selection", topics: ["Picking projects", "Showcasing range", "Depth and breadth", "Documenting outcomes"] },
      { title: "Competitions and Challenges", topics: ["Finding competitions", "Preparing", "Submitting", "Learning from results"] },
      { title: "Presenting Your Work", topics: ["Writing a project README", "Explaining your process", "Screenshots and demos", "A personal site"] },
      { title: "Networking and Growth", topics: ["Sharing your work", "Open source basics", "Communities", "Continuous learning"] },
    ],
    project: {
      title: "Publish a Portfolio of Three Projects",
      description: "Assemble three strong projects on GitHub with clear READMEs and a personal page that presents your work.",
      milestones: ["Select and polish projects", "Write strong READMEs", "Build a personal page", "Share and get feedback"],
    },
  },
  "research-projects": {
    chapters: [
      { title: "Research Foundations", topics: ["What research is", "Forming questions", "Reading papers", "Being systematic"] },
      { title: "Choosing a Problem", topics: ["Real-world problems", "Scoping", "Feasibility", "Finding gaps"] },
      { title: "Methods and Tools", topics: ["Research methods", "Data collection", "Tools and libraries", "Reproducibility"] },
      { title: "Building the Prototype", topics: ["Rapid prototyping", "Iterating", "Measuring results", "Handling failure"] },
      { title: "Documenting and Writing", topics: ["Structuring a report", "Writing clearly", "Figures and tables", "Citations"] },
      { title: "Presenting Research", topics: ["Slides and demos", "Defending your work", "Feedback", "Next steps"] },
    ],
    project: {
      title: "Deliver a Guided Research Project",
      description: "Investigate a real problem, build a prototype solution and present a well-documented report.",
      milestones: ["Define the research question", "Build and test a prototype", "Write the report", "Present and defend"],
    },
  },
};
