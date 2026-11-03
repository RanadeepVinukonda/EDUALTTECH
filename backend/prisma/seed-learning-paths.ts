import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type LessonSeed = {
  title: string;
  description: string;
  concept: string;
  activity: string;
  check: string;
  minutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
};

type ChapterSeed = {
  name: string;
  slug: string;
  description: string;
  lessons: LessonSeed[];
};

type PathSeed = {
  name: string;
  slug: string;
  description: string;
  chapters: ChapterSeed[];
};

const paths: PathSeed[] = [
  {
    name: "AI for Kids",
    slug: "ai-for-kids",
    description:
      "A friendly, hands-on introduction to artificial intelligence for young learners. Explore patterns, ask better questions, and make small projects while protecting privacy and checking what AI says.",
    chapters: [
      {
        name: "Meet artificial intelligence",
        slug: "meet-ai",
        description: "Start with everyday examples and learn what AI can and cannot do.",
        lessons: [
          {
            title: "What is artificial intelligence?",
            description: "Learn how computers use examples and instructions to help with specific tasks.",
            concept: "Artificial intelligence is a name for computer systems that perform tasks such as sorting pictures, recognizing spoken words, or suggesting a next step. A computer does not understand the world as a person does. People choose the task, build the system, and decide how to use its result.",
            activity: "Make two lists: tasks a computer can do by following exact steps, and tasks where examples may help it make a guess. Add one everyday example to each list.",
            check: "Can you describe the task, the examples it might use, and one thing a human still needs to decide?",
            minutes: 6,
            difficulty: "Beginner",
            tags: ["artificial intelligence", "computers", "basics"],
          },
          {
            title: "How examples help a computer find patterns",
            description: "Use a small, human-readable set of examples to understand training data.",
            concept: "A learning system can use examples to find patterns. If examples are missing, confusing, or unfair, its results can also be confusing or unfair. The examples are not the same as the whole world, so a pattern that works in one set may fail somewhere else.",
            activity: "Write down five made-up examples of objects with two visible features, such as shape and color. Sort them using one rule, then change the rule and see how the groups change.",
            check: "Which examples did your rule handle poorly? What new example would help you notice that problem?",
            minutes: 7,
            difficulty: "Beginner",
            tags: ["patterns", "data", "classification"],
          },
          {
            title: "Why AI sometimes gets things wrong",
            description: "Understand guesses, missing context, and why confident wording is not proof.",
            concept: "AI output can be mistaken because its examples may not fit the question, it may miss important context, or it may produce a plausible-sounding answer without checking facts. A confident tone does not make an answer correct.",
            activity: "Ask an adult to prepare three short factual statements, including one with a deliberate mistake. Use a book or trusted reference to check each statement and mark what evidence supports your decision.",
            check: "Did you verify the claim somewhere other than the answer itself? Can you point to the evidence?",
            minutes: 7,
            difficulty: "Beginner",
            tags: ["accuracy", "critical thinking", "AI limits"],
          },
        ],
      },
      {
        name: "Ask, check, and stay safe",
        slug: "ask-check-stay-safe",
        description: "Practice clear questions, verify answers, and protect personal information.",
        lessons: [
          {
            title: "Give an AI helper a clear task",
            description: "Add a goal, useful context, and a format to a question.",
            concept: "A clear request says what you want to do, who it is for, and what shape the answer should take. Asking for a short list or a simple explanation can make an answer easier to review. Do not include private details to make a prompt seem more specific.",
            activity: "Rewrite “tell me about space” as a request for three short facts about the Moon for a class poster. Ask an adult to review the request before using any AI tool.",
            check: "Does the request have one clear goal, an appropriate audience, and a useful answer format?",
            minutes: 6,
            difficulty: "Beginner",
            tags: ["prompts", "communication", "AI literacy"],
          },
          {
            title: "Check facts with a trusted source",
            description: "Build a simple routine for checking AI-generated information.",
            concept: "For an important fact, compare the answer with a trustworthy book, teacher, museum, or official educational source. Check whether the source actually supports the statement, and ask a teacher or caregiver when sources disagree.",
            activity: "Choose one low-stakes science question. Write down the answer, then look for the same fact in a library book or a teacher-approved website. Record what matches and what needs more checking.",
            check: "Can you name the source you checked and explain which part of the answer it supports?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["fact checking", "research", "sources"],
          },
          {
            title: "Keep personal information private",
            description: "Recognize private details and ask an adult before using an AI service.",
            concept: "A name, home address, school, password, phone number, face, or private family detail should not be shared with a tool unless a trusted adult has checked that the service is appropriate. Follow the service's age rules and your school's guidance.",
            activity: "Review a pretend prompt together with an adult. Circle any identifying details and rewrite it so it asks the same general question without them.",
            check: "Would someone who does not know you be able to identify you from the prompt? If unsure, do not send it.",
            minutes: 6,
            difficulty: "Beginner",
            tags: ["privacy", "online safety", "responsible AI"],
          },
        ],
      },
      {
        name: "Make a small AI-inspired project",
        slug: "small-ai-projects",
        description: "Use observation and testing to make a simple project with adult guidance.",
        lessons: [
          {
            title: "Make a story idea helper",
            description: "Use a constrained prompt to explore ideas without giving away authorship.",
            concept: "An idea helper can suggest possibilities, but you choose the characters, events, and meaning. Treat suggestions as optional starting points, not finished work. Keep your own voice and make the final choices yourself.",
            activity: "With an adult-approved tool, request three settings for a story about a lost seed. Pick one, change two details, and write the opening in your own words.",
            check: "Can you explain which ideas are yours and which suggestions you changed or did not use?",
            minutes: 10,
            difficulty: "Beginner",
            tags: ["creative writing", "ideas", "human creativity"],
          },
          {
            title: "Sort a tiny set of examples",
            description: "Create a paper classifier and test where its rule stops working.",
            concept: "A classifier places examples into groups using rules or patterns. A paper version makes the choices visible: you can inspect each example, change the rule, and notice when two groups are not as clear as you first thought.",
            activity: "Draw ten imaginary garden objects and label each as plant or not-plant. Add one unusual example, such as a plastic flower, then decide whether your labels and definition still make sense.",
            check: "Could another person use your definition and make the same choice for every example?",
            minutes: 9,
            difficulty: "Beginner",
            tags: ["classification", "logic", "unplugged activity"],
          },
          {
            title: "Plan a responsible mini project",
            description: "Combine a small goal, safe inputs, a human check, and a clear stopping point.",
            concept: "A good beginner project is small enough to test. Decide what it should help with, what information it is allowed to use, how a person will check the result, and what to do when the system is unsure.",
            activity: "Sketch a helper that suggests a color palette for a drawing. Label its input, output, one way to check a suggestion, and one kind of information it should never ask for.",
            check: "Can a person ignore a suggestion, and does the project avoid collecting personal information?",
            minutes: 10,
            difficulty: "Beginner",
            tags: ["project planning", "responsible technology", "design"],
          },
        ],
      },
    ],
  },
  {
    name: "Game Development with AI",
    slug: "ai-game-development",
    description:
      "Design and build small games with AI as an optional coding helper. Learn game loops, input, collisions, debugging, and playtesting while keeping creative decisions and code review in your hands.",
    chapters: [
      {
        name: "Design a playable idea",
        slug: "design-a-game",
        description: "Define a simple goal, rules, and player feedback before writing code.",
        lessons: [
          {
            title: "Find the core game loop",
            description: "Describe what the player does, what happens next, and why they continue.",
            concept: "A core loop is the repeated action at the heart of a game: the player makes a move, the game responds, and the player chooses again. A small, understandable loop is easier to build and test than a large list of features.",
            activity: "For a one-screen collect-and-avoid game, write the loop in three steps: move, collect or avoid, see the result. Remove any step that does not support the goal.",
            check: "Can a new player understand what to do after one sentence and one example?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["game design", "core loop", "prototyping"],
          },
          {
            title: "Turn an idea into clear game rules",
            description: "Specify controls, objectives, obstacles, and how a round ends.",
            concept: "Rules explain what actions are possible and how the game responds. Clear rules include the player's goal, the controls, the obstacles, and a win, loss, or stopping condition. If a rule is hard to explain, it may be hard to implement too.",
            activity: "Write a one-page design for a tiny maze game. Include the goal, two controls, one obstacle, and what happens when the player reaches the exit.",
            check: "Could someone else build a paper prototype from your rules without needing extra instructions?",
            minutes: 9,
            difficulty: "Beginner",
            tags: ["rules", "game design document", "planning"],
          },
          {
            title: "Ask AI for a useful coding explanation",
            description: "Use AI to explain a small programming concept without trusting untested code.",
            concept: "An AI coding helper may produce code that does not match your engine, version, or project. Ask it to explain one small idea, state your tool and goal, and test any suggested code in a safe copy of your project.",
            activity: "Ask an adult-approved tool to explain how a keyboard input event works in your chosen engine. Compare the explanation with the engine's official beginner documentation before using it.",
            check: "Can you explain the code yourself and identify which documentation confirms the important details?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["AI coding", "documentation", "prompts"],
          },
        ],
      },
      {
        name: "Build the game",
        slug: "build-the-game",
        description: "Connect player input, game state, and simple interactions.",
        lessons: [
          {
            title: "Track player movement and game state",
            description: "Represent position and one simple state change in a small project.",
            concept: "Games store changing information such as a character's position or whether a key has been collected. Keep each value responsible for one clear idea, update it when an event happens, and show the player the result.",
            activity: "In your chosen beginner-friendly engine, move a placeholder character left and right. Add one variable that changes when the character reaches a marked area.",
            check: "Can you point to the input, the value that changes, and the visual feedback?",
            minutes: 12,
            difficulty: "Beginner",
            tags: ["variables", "input", "game state"],
          },
          {
            title: "Add a collision and a clear response",
            description: "Make two objects interact and communicate the result to the player.",
            concept: "A collision check detects when game objects overlap or touch. The response is a design choice: collect an item, stop movement, lose a turn, or show feedback. Test edge cases such as touching from different directions.",
            activity: "Add a collectible object to a test scene. When the player touches it, remove the object and display a short confirmation or update a counter.",
            check: "Does the event happen once, and can the player tell that the game registered it?",
            minutes: 12,
            difficulty: "Beginner",
            tags: ["collisions", "events", "feedback"],
          },
          {
            title: "Use AI suggestions without losing control",
            description: "Review one small code suggestion and test it separately before integration.",
            concept: "A helpful coding workflow starts with a precise task, asks for an explanation, and tests the result in isolation. Never paste secrets or private project data into a tool. Keep a working copy so you can undo a suggestion that breaks the game.",
            activity: "Ask for a short explanation of a timer or counter in your engine. Check the names and behavior against official docs, then implement the idea in a separate test scene.",
            check: "Can you explain each changed line and restore the previous version if the test fails?",
            minutes: 10,
            difficulty: "Intermediate",
            tags: ["AI assistance", "code review", "testing"],
          },
        ],
      },
      {
        name: "Test and improve",
        slug: "test-and-improve",
        description: "Observe real play, fix problems, and prepare a shareable project.",
        lessons: [
          {
            title: "Debug with a small repeatable test",
            description: "Reproduce a problem, change one thing, and verify the result.",
            concept: "A bug report is most useful when it names the action, the expected result, and what actually happened. Repeating the same steps helps isolate the cause. Change one thing at a time so you can tell what fixed the issue.",
            activity: "Ask a classmate to try your game. Write down one confusing moment as steps to repeat, change one rule or line, and ask them to try the same steps again.",
            check: "Can another person reproduce the issue and confirm whether your change improved it?",
            minutes: 10,
            difficulty: "Intermediate",
            tags: ["debugging", "testing", "iteration"],
          },
          {
            title: "Design a fair computer-controlled opponent",
            description: "Create a predictable behavior rule before adding complexity.",
            concept: "A computer-controlled character can begin with a small rule, such as moving between two points or reacting only when the player enters an area. Predictable behavior gives players a chance to learn and makes bugs easier to find.",
            activity: "Draw a patrol route with two turning points. Write the rule in plain language, then test whether the character behaves consistently when the player waits or moves away.",
            check: "Can the player learn the behavior, and does it respond consistently to the same situation?",
            minutes: 10,
            difficulty: "Intermediate",
            tags: ["game AI", "behavior", "game balance"],
          },
          {
            title: "Playtest and share responsibly",
            description: "Use feedback, credit original assets, and check a project before sharing it.",
            concept: "A playtest is for learning where players get stuck, not for defending every design choice. Before sharing, remove private information, check that you have permission to use each image and sound, and follow the platform's safety and age rules.",
            activity: "Invite one person to play without coaching. Record where they hesitate, make one improvement, and list the original assets or sources you used.",
            check: "Does the build run, are the controls explained, and do you have permission to share every included asset?",
            minutes: 12,
            difficulty: "Intermediate",
            tags: ["playtesting", "accessibility", "asset credits"],
          },
        ],
      },
    ],
  },
  {
    name: "Music Making",
    slug: "music",
    description:
      "Explore sound, rhythm, melody, and recording through small original music exercises. Use an instrument, everyday sounds, or audio software, and make creative choices that are yours.",
    chapters: [
      {
        name: "Hear the building blocks",
        slug: "music-foundations",
        description: "Notice sound, pulse, tempo, and patterns before arranging a piece.",
        lessons: [
          {
            title: "Listen for pitch, volume, and tone",
            description: "Compare how sounds differ without needing specialist equipment.",
            concept: "Pitch describes how high or low a sound seems. Volume describes how loud or soft it is. Tone color, also called timbre, helps distinguish two instruments playing the same note. Listening for one feature at a time makes sound easier to describe.",
            activity: "Choose three safe, everyday sound sources. Listen to each quietly and describe its pitch, loudness, and tone color using your own words.",
            check: "Can you describe one difference between two sounds without calling one better?",
            minutes: 7,
            difficulty: "Beginner",
            tags: ["sound", "listening", "music basics"],
          },
          {
            title: "Feel a steady beat and tempo",
            description: "Separate the steady pulse from the speed of a musical passage.",
            concept: "A beat is a repeated pulse you can tap along with. Tempo is how quickly those beats happen. A steady beat can support many rhythms, and changing tempo changes the energy without changing the melody itself.",
            activity: "Tap a comfortable steady pulse. Count four taps repeatedly, then try the same pattern slowly and quickly while keeping the count even.",
            check: "Can you keep the pulse steady when the speed changes?",
            minutes: 6,
            difficulty: "Beginner",
            tags: ["beat", "tempo", "rhythm"],
          },
          {
            title: "Build a rhythm with rests",
            description: "Create a short rhythm and use silence as part of the pattern.",
            concept: "Rhythm is the arrangement of sounds and silences over time. A rest is a planned quiet space, not a mistake. Repeating a pattern helps a listener recognize it, while a small change can make the next phrase feel new.",
            activity: "Clap a four-count rhythm using claps and rests. Repeat it three times, changing only the final count on the last repeat.",
            check: "Can another person repeat your pattern after hearing it twice?",
            minutes: 7,
            difficulty: "Beginner",
            tags: ["rhythm", "rests", "composition"],
          },
        ],
      },
      {
        name: "Make an original musical idea",
        slug: "make-a-musical-idea",
        description: "Create a melody, develop a motif, and shape a beginning and ending.",
        lessons: [
          {
            title: "Create a short melody",
            description: "Choose a few notes and shape them into a phrase with direction.",
            concept: "A melody is a sequence of notes that listeners can follow. Repeating a note, moving by a small step, or making one larger jump creates different shapes. A phrase often feels clearer when it has a beginning and a place to rest.",
            activity: "Hum or play a four-note phrase using notes you can comfortably sing or reach. Repeat it, then change the final note to make a second version.",
            check: "Can you remember the phrase without replaying it, and does its ending sound settled or open?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["melody", "phrasing", "composition"],
          },
          {
            title: "Develop a motif with variation",
            description: "Turn a tiny musical idea into a phrase that changes but stays recognizable.",
            concept: "A motif is a short musical idea. You can repeat it, change its rhythm, move its starting note, or leave out part of it. Keeping one recognizable feature helps the listener connect the variations.",
            activity: "Make a two-beat motif with voice, claps, or an instrument. Create two variations: change the rhythm in one and the pitch direction in the other.",
            check: "Which feature makes all three versions sound related?",
            minutes: 9,
            difficulty: "Beginner",
            tags: ["motif", "variation", "creativity"],
          },
          {
            title: "Shape a beginning, middle, and ending",
            description: "Arrange short sections so an original piece has a clear journey.",
            concept: "A piece can feel complete when its sections have a relationship. A simple structure might introduce an idea, repeat it with a change, and return to it for an ending. Structure guides attention without requiring complex music theory.",
            activity: "Arrange three short versions of your motif: introduce it, change one feature, then return to the original and end with a rest.",
            check: "Can a listener tell when the idea changes and when the piece is finished?",
            minutes: 10,
            difficulty: "Intermediate",
            tags: ["song structure", "arrangement", "composition"],
          },
        ],
      },
      {
        name: "Record and share",
        slug: "record-and-share",
        description: "Capture a clean take, balance parts, and share original work with care.",
        lessons: [
          {
            title: "Record a clean first take",
            description: "Prepare a quiet space and record one idea without over-editing.",
            concept: "A clear recording starts with a stable microphone or recorder, a quiet environment, and a sound level that does not distort. A short test recording helps you check distance and background noise before performing the full idea.",
            activity: "Record a short rhythm or melody on a device you are allowed to use. Listen once for clipping, background sounds, and whether the whole phrase is audible.",
            check: "Can you hear the important sound clearly without the recording becoming harsh or distorted?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["recording", "audio", "practice"],
          },
          {
            title: "Balance multiple music parts",
            description: "Make a simple mix where each part can be heard.",
            concept: "A mix combines recorded or performed parts. Start by setting comfortable levels, then listen for parts that mask each other. Small changes to volume or timing can improve clarity more than adding extra effects.",
            activity: "If you have two original recorded parts, play them together. Lower one slightly, listen again, and decide whether each part still has a clear role.",
            check: "Can you identify both parts, and does either one overpower the other?",
            minutes: 10,
            difficulty: "Intermediate",
            tags: ["mixing", "balance", "listening"],
          },
          {
            title: "Export and credit your music",
            description: "Choose a practical audio format and respect ownership when sharing.",
            concept: "An export creates a file that other devices can play. Check that the start and end are clean and that the file plays back. Share only recordings you made or have permission to use, and credit collaborators as they request.",
            activity: "Export a short original piece using your editor's standard audio option. Play the exported file from the beginning and check its ending before sharing it privately with a trusted listener.",
            check: "Does the exported file play correctly, and can you identify who created every sound in it?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["export", "copyright", "sharing"],
          },
        ],
      },
    ],
  },
  {
    name: "Video Editing",
    slug: "video-editing",
    description:
      "Learn a practical editing workflow from story plan to final export. Work with footage you created or have permission to use, and make clear choices about pacing, sound, captions, and sharing.",
    chapters: [
      {
        name: "Plan and organize footage",
        slug: "plan-footage",
        description: "Decide what the viewer needs to understand and prepare source clips.",
        lessons: [
          {
            title: "Choose the point of your video",
            description: "Write one sentence that explains what the viewer should learn or feel.",
            concept: "An editing plan begins with purpose. A short video cannot give equal attention to every detail, so choose the central idea and the audience. That choice helps decide which shots to keep and which to leave out.",
            activity: "Plan a one-minute video showing how to make or do something. Write its purpose in one sentence and list three moments the viewer needs to see.",
            check: "Does every planned moment help explain the same central idea?",
            minutes: 7,
            difficulty: "Beginner",
            tags: ["storytelling", "planning", "video"],
          },
          {
            title: "Make a simple shot sequence",
            description: "Arrange a wide view, useful details, and an ending before editing.",
            concept: "A shot sequence gives viewers enough context to follow an action. A wide view can show where something happens, while a closer view can show an important detail. A clear ending helps the video feel intentional.",
            activity: "Draw three boxes for a process: show the setup, show one important detail, and show the finished result. Decide which shot each box needs.",
            check: "Could someone understand the process from the order of your three shots?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["storyboard", "shots", "sequence"],
          },
          {
            title: "Organize clips before editing",
            description: "Name, group, and protect source media so the project stays manageable.",
            concept: "Organized source files make a project easier to reopen and revise. Use clear filenames or folders, keep the original clips safe, and avoid moving files after an editor links to them unless you know how to relink the media.",
            activity: "Make folders for original footage, audio, and exports. Rename three practice clips so their names describe what they show, not just when they were recorded.",
            check: "Can you find the original clip and the latest export without opening every file?",
            minutes: 7,
            difficulty: "Beginner",
            tags: ["workflow", "media management", "editing"],
          },
        ],
      },
      {
        name: "Build a clear timeline",
        slug: "build-timeline",
        description: "Trim clips, choose pacing, and make sound support the story.",
        lessons: [
          {
            title: "Trim a clip to its useful moment",
            description: "Remove pauses and repeated actions while preserving the meaning.",
            concept: "Trimming sets where a clip begins and ends. Keep enough context for viewers to understand what happened, but remove time that does not help the story. Watch the edit before and after the cut to check for an abrupt jump.",
            activity: "Choose a practice clip with a clear action. Mark where the action begins and ends, then trim the extra lead-in and tail while keeping the full action understandable.",
            check: "Does the action still make sense without the removed footage?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["trim", "timeline", "pacing"],
          },
          {
            title: "Use cuts and transitions with purpose",
            description: "Keep the viewer oriented by choosing simple edits that support the action.",
            concept: "A cut moves directly from one shot to another and often keeps a video clear. A transition can signal time passing or a change of scene, but too many effects distract from what is happening. Continuity helps viewers understand where to look.",
            activity: "Create a three-shot sequence using simple cuts. Add one transition only where time or place changes, then compare which version is easier to follow.",
            check: "Does each transition communicate a change, or is it only decoration?",
            minutes: 9,
            difficulty: "Beginner",
            tags: ["cuts", "transitions", "continuity"],
          },
          {
            title: "Make dialogue and music easy to hear",
            description: "Balance speech, background sound, and music for comfortable listening.",
            concept: "Speech should remain understandable. Music and effects should support the scene without covering important words. Listen on more than one device at a comfortable volume, and use only audio that you created or have permission to use.",
            activity: "Place a short voice recording and a quiet music bed on separate tracks. Lower the music until every spoken word is clear, then listen with headphones and device speakers.",
            check: "Can you understand the speech at a comfortable volume on both listening setups?",
            minutes: 10,
            difficulty: "Intermediate",
            tags: ["audio", "mixing", "dialogue"],
          },
        ],
      },
      {
        name: "Finish for the audience",
        slug: "finish-for-audience",
        description: "Add readable titles, captions, and a reliable final export.",
        lessons: [
          {
            title: "Add titles that viewers can read",
            description: "Use short text, strong contrast, and enough time on screen.",
            concept: "A title should help viewers understand the subject or next step. Short wording, readable size, and contrast against the background make it easier to follow. Keep important text away from screen edges where players may crop it.",
            activity: "Add a simple opening title to a practice video. Preview it at the size it will be watched and make sure it remains readable against every frame.",
            check: "Can someone read the title once without pausing, and does it stay clear on a small screen?",
            minutes: 8,
            difficulty: "Beginner",
            tags: ["titles", "design", "accessibility"],
          },
          {
            title: "Create and check captions",
            description: "Make spoken information available to viewers who cannot hear the audio.",
            concept: "Captions show spoken words and useful sound cues. Automated captions can mishear names or technical terms, so review every line against the recording. Keep captions timed with speech and avoid covering essential visual details.",
            activity: "Create captions for a short original voice recording. Replay it while reading the captions and correct any missed words or timing problems.",
            check: "Do the captions match the audio, stay readable, and give viewers enough time to read?",
            minutes: 10,
            difficulty: "Intermediate",
            tags: ["captions", "accessibility", "review"],
          },
          {
            title: "Export and share a final cut",
            description: "Check playback, file settings, credits, and privacy before sharing.",
            concept: "An export turns an editing timeline into a video file. Choose a format supported by the intended platform, watch the exported file from beginning to end, and check that all footage, music, and images may be shared. Remove private details from frames and metadata where possible.",
            activity: "Export a short practice edit with your editor's standard settings. Play the exported file on a second device and make a checklist of any credits or permissions needed before sharing.",
            check: "Does the exported file play correctly, and do you have permission for every included asset?",
            minutes: 10,
            difficulty: "Beginner",
            tags: ["export", "permissions", "video review"],
          },
        ],
      },
    ],
  },
];

const learningPathSlugs = paths.map((path) => path.slug);
const articleSlug = (path: PathSeed, lesson: LessonSeed) =>
  `learn-${path.slug}-${lesson.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const seededArticleSlugs = paths.flatMap((path) =>
  path.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => articleSlug(path, lesson))),
);

function lessonContent(lesson: LessonSeed): string {
  return [
    `# ${lesson.title}`,
    "",
    "## What you will learn",
    lesson.description,
    "",
    "## The key idea",
    lesson.concept,
    "",
    "## Try it",
    lesson.activity,
    "",
    "## Check your understanding",
    lesson.check,
    "",
    "## Keep learning thoughtfully",
    "Use your own ideas, work at a comfortable pace, and ask a teacher or trusted adult for help when a tool, source, or instruction is unclear. Respect other people's privacy and creative work.",
  ].join("\n");
}

async function main(): Promise<void> {
  if (process.argv.includes("--dry-run")) {
    if (new Set(seededArticleSlugs).size !== seededArticleSlugs.length) {
      throw new Error("Learning path lesson slugs must be unique.");
    }
    console.log(
      `[seed-learning-paths] validated ${seededArticleSlugs.length} lessons across ${learningPathSlugs.length} learning paths; no database changes made`,
    );
    return;
  }

  const slugConflicts = await prisma.resourceArticle.findMany({
    where: { slug: { in: seededArticleSlugs } },
    select: {
      slug: true,
      title: true,
      category: { select: { slug: true } },
    },
  });
  for (const existing of slugConflicts) {
    const expected = paths
      .flatMap((path) => path.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ path, lesson }))))
      .find(({ path, lesson }) => articleSlug(path, lesson) === existing.slug);
    if (!expected || expected.path.slug !== existing.category.slug || expected.lesson.title !== existing.title) {
      throw new Error(`Refusing to overwrite an existing resource with slug "${existing.slug}".`);
    }
  }

  const seedStartedAt = Date.now();
  await prisma.$transaction(async (tx) => {
    await tx.resourceArticle.updateMany({
      where: { slug: { notIn: seededArticleSlugs }, isPublished: true },
      data: { isPublished: false, isFeatured: false },
    });

    let lessonOrder = 0;
    for (const [pathIndex, path] of paths.entries()) {
      const category = await tx.resourceCategory.upsert({
        where: { slug: path.slug },
        update: {
          name: path.name,
          description: path.description,
          icon: "school",
          order: pathIndex + 1,
        },
        create: {
          slug: path.slug,
          name: path.name,
          description: path.description,
          icon: "school",
          order: pathIndex + 1,
        },
      });

      for (const [chapterIndex, chapter] of path.chapters.entries()) {
        const subcategory = await tx.resourceSubcategory.upsert({
          where: {
            categoryId_slug: {
              categoryId: category.id,
              slug: chapter.slug,
            },
          },
          update: {
            name: chapter.name,
            description: chapter.description,
            order: chapterIndex + 1,
          },
          create: {
            categoryId: category.id,
            slug: chapter.slug,
            name: chapter.name,
            description: chapter.description,
            order: chapterIndex + 1,
          },
        });

        for (const lesson of chapter.lessons) {
          const slug = articleSlug(path, lesson);
          const articleData = {
            title: lesson.title,
            description: lesson.description,
            content: lessonContent(lesson),
            categoryId: category.id,
            subcategoryId: subcategory.id,
            difficulty: lesson.difficulty,
            estimatedMinutes: lesson.minutes,
            coverUrl: null,
            tags: lesson.tags,
            isPublished: true,
            isFeatured: false,
            createdAt: new Date(seedStartedAt + lessonOrder),
          };

          await tx.resourceArticle.upsert({
            where: { slug },
            update: articleData,
            create: { slug, ...articleData },
          });
          lessonOrder += 1;
        }
      }
    }
  });

  console.log(
    `[seed-learning-paths] published ${seededArticleSlugs.length} lessons across ${learningPathSlugs.length} learning paths; previous articles are preserved as unpublished`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("[seed-learning-paths] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
