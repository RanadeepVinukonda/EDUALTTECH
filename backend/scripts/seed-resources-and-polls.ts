import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] Seeding multidisciplinary resource categories...");

  // 1. Categories
  const categoriesData = [
    {
      slug: "technology-and-computer-science",
      name: "Technology & Computer Science",
      description: "Core computing, modern programming, distributed systems, and cutting-edge artificial intelligence.",
      icon: "code",
      order: 1,
      subcategories: [
        { slug: "ai-and-machine-learning", name: "AI & Machine Learning", description: "Deep neural networks, transformers, reinforcement learning, and production ML pipelines.", order: 1 },
        { slug: "web-development", name: "Web Development", description: "Modern responsive frontend architectures, performant backends, and full-stack engineering.", order: 2 },
        { slug: "data-structures-and-algorithms", name: "Data Structures & Algorithms", description: "Algorithmic thinking, complexity analysis, graph theory, and dynamic programming.", order: 3 },
        { slug: "cloud-and-devops", name: "Cloud & DevOps", description: "Container orchestration, CI/CD automation, cloud infrastructure, and site reliability.", order: 4 },
      ],
    },
    {
      slug: "academic-learning",
      name: "Academic Learning",
      description: "Rigorous fundamentals in mathematics, physics, engineering principles, and computational theory.",
      icon: "school",
      order: 2,
      subcategories: [
        { slug: "applied-mathematics", name: "Applied Mathematics", description: "Linear algebra, multivariable calculus, probability, and optimization methods.", order: 1 },
        { slug: "engineering-physics", name: "Engineering Physics", description: "Electromagnetism, quantum mechanics fundamentals, and thermodynamics.", order: 2 },
      ],
    },
    {
      slug: "creative-and-performing-arts",
      name: "Creative & Performing Arts",
      description: "Music production, visual arts, design systems, sound engineering, and creative expression.",
      icon: "palette",
      order: 3,
      subcategories: [
        { slug: "music-production", name: "Music Production & Sound", description: "Synthesis, sound design, mixing, mastering, and modern digital audio workstations.", order: 1 },
        { slug: "ui-ux-design", name: "UI/UX & Visual Design", description: "Design systems, typography, cognitive psychology, and interactive prototyping.", order: 2 },
      ],
    },
    {
      slug: "professional-and-practical-skills",
      name: "Professional & Practical Skills",
      description: "Entrepreneurship, leadership, strategic communication, financial literacy, and career growth.",
      icon: "work",
      order: 4,
      subcategories: [
        { slug: "entrepreneurship", name: "Entrepreneurship & Startups", description: "Validation, business modeling, go-to-market execution, and fundraising mechanics.", order: 1 },
        { slug: "leadership-communication", name: "Leadership & Communication", description: "High-impact storytelling, technical negotiation, and organizational leadership.", order: 2 },
      ],
    },
  ];

  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const authorId = adminUser?.id;

  for (const cat of categoriesData) {
    const category = await prisma.resourceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, order: cat.order },
      create: { slug: cat.slug, name: cat.name, description: cat.description, icon: cat.icon, order: cat.order },
    });

    for (const sub of cat.subcategories) {
      await prisma.resourceSubcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: sub.slug } },
        update: { name: sub.name, description: sub.description, order: sub.order },
        create: { categoryId: category.id, slug: sub.slug, name: sub.name, description: sub.description, order: sub.order },
      });
    }
  }

  // 2. Fetch created categories and subcategories for article assignment
  const techCat = await prisma.resourceCategory.findUnique({ where: { slug: "technology-and-computer-science" } });
  const aiSub = await prisma.resourceSubcategory.findFirst({ where: { categoryId: techCat!.id, slug: "ai-and-machine-learning" } });
  const webSub = await prisma.resourceSubcategory.findFirst({ where: { categoryId: techCat!.id, slug: "web-development" } });

  const creativeCat = await prisma.resourceCategory.findUnique({ where: { slug: "creative-and-performing-arts" } });
  const musicSub = await prisma.resourceSubcategory.findFirst({ where: { categoryId: creativeCat!.id, slug: "music-production" } });

  const profCat = await prisma.resourceCategory.findUnique({ where: { slug: "professional-and-practical-skills" } });
  const bizSub = await prisma.resourceSubcategory.findFirst({ where: { categoryId: profCat!.id, slug: "entrepreneurship" } });

  const mathCat = await prisma.resourceCategory.findUnique({ where: { slug: "academic-learning" } });
  const mathSub = await prisma.resourceSubcategory.findFirst({ where: { categoryId: mathCat!.id, slug: "applied-mathematics" } });

  // 3. Articles & Tutorials
  const articles = [
    {
      slug: "modern-full-stack-web-architecture-guide",
      title: "Comprehensive Guide to Modern Full-Stack Web Architecture",
      description: "From client-side hydration and server components to edge caching and transactional data layers.",
      categoryId: techCat!.id,
      subcategoryId: webSub?.id,
      difficulty: "Intermediate",
      estimatedMinutes: 12,
      isFeatured: true,
      tags: ["Web Architecture", "Next.js", "React 19", "System Design"],
      content: `## 1. Introduction: The Evolution of Web Architecture

Modern web architecture has shifted from traditional monolithic Model-View-Controller (MVC) server-rendered pages to decoupled, hybrid rendering pipelines. Today's applications balance server-side pre-rendering, edge streaming, client-side reactivity, and transactional API layers.

### Key Objectives
* Understand server-side rendering (SSR), static site generation (SSG), and incremental static regeneration (ISR).
* Master API boundaries, state management, and optimistic client updates.
* Explore production data modeling with ACID compliance and connection pooling.

---

## 2. The Core Request-Response Lifecycle

When a user visits a modern web application:
1. **Edge Resolution:** The CDN route resolves the incoming HTTP request.
2. **Streaming HTML:** The server renders the initial HTML skeleton and streams it chunk-by-chunk to the browser.
3. **Hydration:** React attaches event listeners to DOM nodes without re-rendering existing markup.
4. **Data Mutations:** Client actions communicate via structured REST/GraphQL or Server Actions, validating input with strict schemas.

\`\`\`typescript
// Example: Safe API invocation with type validation
import { z } from "zod";

export const CourseEnrollmentSchema = z.object({
  courseId: z.string().cuid(),
  mentorUserId: z.string().cuid().optional(),
});

export type CourseEnrollmentInput = z.infer<typeof CourseEnrollmentSchema>;
\`\`\`

---

## 3. Database Layer & Transactional Integrity

When handling operations like course enrollments, payments, or mentor assignments, race conditions must be prevented using database-level locks and transactional semantics:

\`\`\`typescript
await prisma.$transaction(async (tx) => {
  // Acquire row-level lock on user
  await tx.$queryRaw\`SELECT id FROM "User" WHERE id = \${userId} FOR UPDATE\`;

  // Create participant seat
  return tx.courseParticipant.create({
    data: { courseId, userId, role: "LEARNER", status: "ACTIVE" }
  });
});
\`\`\`

---

## 4. Key Takeaways and Best Practices
* **Keep APIs Idempotent:** Always snapshot critical parameters (such as price and seat capacity) at transaction time.
* **Optimize Critical Render Paths:** Avoid loading multi-megabyte JavaScript bundles before rendering primary text content.
* **Fail Gracefully:** Implement comprehensive empty, error, and loading states for every data-fetching interface.`,
    },
    {
      slug: "deep-learning-transformers-attention-mechanisms",
      title: "Deep Dive into Transformers & Multi-Head Self-Attention",
      description: "A mathematical and practical breakdown of self-attention mechanisms powering modern LLMs and vision models.",
      categoryId: techCat!.id,
      subcategoryId: aiSub?.id,
      difficulty: "Advanced",
      estimatedMinutes: 15,
      isFeatured: true,
      tags: ["AI", "Deep Learning", "Transformers", "PyTorch"],
      content: `## 1. Why Transformers Replaced Recurrent Neural Networks

Before transformers, sequential modeling relied heavily on Recurrent Neural Networks (RNNs) and LSTMs. These architectures suffered from vanishing gradients across long token sequences and could not be parallelized efficiently across GPU clusters.

Attention mechanisms eliminated sequential recurrence by allowing tokens to attend directly to every other token in the sequence simultaneously.

---

## 2. The Scaled Dot-Product Attention Equation

Attention is computed using three primary projections:
* **Query (Q):** What the current token is seeking.
* **Key (K):** What other tokens advertise about themselves.
* **Value (V):** The actual informational content passed forward.

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$

\`\`\`python
import torch
import torch.nn as nn
import math

def scaled_dot_product_attention(Q, K, V, mask=None):
    d_k = Q.size(-1)
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)
    weights = torch.softmax(scores, dim=-1)
    return torch.matmul(weights, V), weights
\`\`\`

---

## 3. Practical Implications in Production
When deploying transformer architectures:
* **KV-Caching:** Reduces generation time from $O(N^2)$ to $O(N)$ during autoregressive decoding.
* **FlashAttention:** IO-aware GPU memory tiling that dramatically speeds up training and inference without altering numerical output.`,
    },
    {
      slug: "electronic-music-production-subtractive-synthesis",
      title: "Fundamentals of Subtractive Synthesis & Sound Design",
      description: "Master oscillators, filters, envelope generators, and LFOs to create punchy basslines, leads, and ambient textures.",
      categoryId: creativeCat!.id,
      subcategoryId: musicSub?.id,
      difficulty: "Beginner",
      estimatedMinutes: 8,
      isFeatured: true,
      tags: ["Music Production", "Synthesis", "Sound Design", "Audio Engineering"],
      content: `## 1. Introduction to Sound Synthesis

Subtractive synthesis is the foundation of modern electronic music production. The core concept is straightforward: start with a harmonically rich waveform and subtract frequencies using filters to sculpt the desired timbre.

---

## 2. The Core Synthesis Signal Chain

1. **Oscillator (VCO/DCO):** Generates initial wave shapes:
   * **Sawtooth:** Bright, buzzy, rich in all harmonics. Ideal for leads and reese basses.
   * **Square/Pulse:** Hollow, woody, contains odd harmonics only. Great for chiptune, plucks, and clarinets.
   * **Sine:** Pure fundamental frequency with zero overtones. The backbone of sub-bass.
2. **Filter (VCF):** Attenuates unwanted frequency spectra.
   * **Low-Pass Filter (LPF):** Cuts highs, passes lows. The most critical control in subtractive synthesis.
   * **Resonance:** Boosts frequencies immediately around the cutoff point.
3. **Envelope Generator (ADSR):** Shapes parameters over time:
   * **Attack:** Time to reach peak amplitude.
   * **Decay:** Time to settle to sustain level.
   * **Sustain:** Constant volume held while a key is pressed.
   * **Release:** Time to fade to silence after key is released.

---

## 3. Practical Exercise: Designing a Punchy Pluck
1. Select a Sawtooth oscillator.
2. Set the Filter Cutoff low (around 300 Hz).
3. Route Filter Envelope with zero Attack, short Decay (250 ms), zero Sustain, and quick Release (150 ms).
4. Turn up Filter Envelope Amount to 60-70% to produce a signature punchy attack.`,
    },
    {
      slug: "tech-startup-from-zero-validation-to-mvp",
      title: "From Idea to First 100 Paying Users: The Practical Founder Guide",
      description: "Customer discovery, avoiding false positives, rapid MVP validation, and establishing repeatable unit economics.",
      categoryId: profCat!.id,
      subcategoryId: bizSub?.id,
      difficulty: "Beginner",
      estimatedMinutes: 10,
      isFeatured: true,
      tags: ["Entrepreneurship", "Startups", "Product Strategy", "Growth"],
      content: `## 1. The Myth of the Overnight Product

Most failed startups do not fail because they could not write code; they fail because they built something nobody truly needed or was willing to pay for.

### The Problem-Solution Fit Checklist
* Does the customer experience this problem weekly or daily?
* Are they currently spending money or manual hours on a clunky workaround?
* Can you reach the decision-maker directly without a 6-month enterprise sales cycle?

---

## 2. The Mom Test: How to Talk to Customers

Never ask: *"Would you buy a product that does X?"* Everyone says yes to hypothetical questions.

Instead, ask about their actual past behavior:
* *"When was the last time you ran into this problem?"*
* *"How much did you spend trying to solve it?"*
* *"What was the hardest part about that experience?"*

---

## 3. Building the MVP: The Scrappy Truth

Your Minimum Viable Product should test one core value hypothesis with the absolute minimum surface area:
* Prefer no-code, lightweight web forms, or concierge onboarding before building automated multi-tenant systems.
* Validate that users complete the desired action before spending months polishing secondary settings pages.`,
    },
    {
      slug: "linear-algebra-for-machine-learning-intuition",
      title: "Linear Algebra Intuition: Vectors, Matrices & Eigenvalues",
      description: "Geometric visual intuition behind dot products, matrix transformations, and dimensional reduction.",
      categoryId: mathCat!.id,
      subcategoryId: mathSub?.id,
      difficulty: "Intermediate",
      estimatedMinutes: 11,
      isFeatured: false,
      tags: ["Mathematics", "Linear Algebra", "Data Science"],
      content: `## 1. Geometric Intuition of Vectors

In machine learning, a vector is not just a list of numbers; it represents a point or directed arrow in high-dimensional feature space.

### Dot Product as Similarity Measure
The dot product of two vectors $A$ and $B$:
$$A \\cdot B = \\sum_{i=1}^n A_i B_i = \\|A\\| \\|B\\| \\cos(\\theta)$$

When two vectors point in the exact same direction, $\\cos(0) = 1$, maximizing their dot product. When orthogonal (perpendicular), $A \\cdot B = 0$. This fundamental insight is why cosine similarity powers semantic vector search and recommendation engines.

---

## 2. Matrices as Linear Transformations

Every matrix represents a transformation of space (stretching, rotating, shearing). Matrix multiplication $Ax$ applies transformation $A$ to vector $x$.

### Eigenvalues and Eigenvectors
An eigenvector is a vector whose direction does not change under the linear transformation $A$; it is only scaled by an eigenvalue $\\lambda$:
$$A v = \\lambda v$$

Principal Component Analysis (PCA) computes eigenvectors of data covariance matrices to identify the axes of maximum variance, allowing compression of high-dimensional datasets into low-dimensional representations.`,
    },
  ];

  for (const art of articles) {
    await prisma.resourceArticle.upsert({
      where: { slug: art.slug },
      update: {
        title: art.title,
        description: art.description,
        content: art.content,
        categoryId: art.categoryId,
        subcategoryId: art.subcategoryId,
        difficulty: art.difficulty,
        estimatedMinutes: art.estimatedMinutes,
        isFeatured: art.isFeatured,
        tags: art.tags,
        authorId,
      },
      create: {
        slug: art.slug,
        title: art.title,
        description: art.description,
        content: art.content,
        categoryId: art.categoryId,
        subcategoryId: art.subcategoryId,
        difficulty: art.difficulty,
        estimatedMinutes: art.estimatedMinutes,
        isFeatured: art.isFeatured,
        tags: art.tags,
        authorId,
      },
    });
  }

  // 4. Seed Course Polls
  console.log("[seed] Seeding community course polls...");
  if (adminUser) {
    const poll = await prisma.coursePoll.upsert({
      where: { id: "seed-poll-q1-2027" },
      update: {
        title: "Community Prioritization: What Course Should We Build Next?",
        description: "Vote on upcoming curriculum tracks for EduAltTech. Winning proposals are fast-tracked into syllabus design, mentor recruitment, and live cohort scheduling.",
        status: "OPEN",
        allowMultipleVotes: false,
        allowVoteChange: true,
        hideResultsUntilClosed: false,
      },
      create: {
        id: "seed-poll-q1-2027",
        title: "Community Prioritization: What Course Should We Build Next?",
        description: "Vote on upcoming curriculum tracks for EduAltTech. Winning proposals are fast-tracked into syllabus design, mentor recruitment, and live cohort scheduling.",
        status: "OPEN",
        allowMultipleVotes: false,
        allowVoteChange: true,
        hideResultsUntilClosed: false,
        createdById: adminUser.id,
      },
    });

    const pollOptions = [
      {
        id: "opt-ai-agents",
        title: "Autonomous AI Agents & Multi-Modal Workflows",
        description: "Build deployed agentic systems with memory, persistent tool usage, LangGraph, and real-world API orchestrations.",
        category: "Applied AI",
        domain: "Technology & CS",
        difficulty: "Intermediate",
        estimatedDuration: "8 Weeks",
        outcomes: ["Build multi-agent collaboration loops", "Implement vector memory with RAG", "Deploy production agent monitoring"],
        voteCount: 942,
        order: 1,
      },
      {
        id: "opt-music-prod",
        title: "Electronic Music Production & Mixing Mastery",
        description: "From sound design and wavetable synthesis to final club mixdown, dynamics processing, and release mastering.",
        category: "Creative Arts",
        domain: "Arts & Production",
        difficulty: "Beginner to Advanced",
        estimatedDuration: "10 Weeks",
        outcomes: ["Master subtractive and FM synthesis", "Equalization and multi-band compression", "Deliver streaming-ready audio masters"],
        voteCount: 785,
        order: 2,
      },
      {
        id: "opt-contemporary-dance",
        title: "Contemporary Choreography & Expressive Movement",
        description: "Body alignment, rhythm improvisation, floorwork transitions, and stage-ready performance techniques.",
        category: "Performing Arts",
        domain: "Alternate Arts",
        difficulty: "All Levels",
        estimatedDuration: "6 Weeks",
        outcomes: ["Choreographic staging fundamentals", "Expressive movement improvisation", "Live performance critique"],
        voteCount: 624,
        order: 3,
      },
      {
        id: "opt-rust-systems",
        title: "Rust Systems & Microcontroller Robotics",
        description: "Low-level memory safety without garbage collection, sensory interfacing, RTOS principles, and physical computing.",
        category: "Engineering",
        domain: "Technology & CS",
        difficulty: "Advanced",
        estimatedDuration: "12 Weeks",
        outcomes: ["Embedded Rust on ARM Cortex-M", "Asynchronous hardware interrupts", "Build a teleoperated robotic rover"],
        voteCount: 512,
        order: 4,
      },
    ];

    for (const opt of pollOptions) {
      await prisma.pollOption.upsert({
        where: { id: opt.id },
        update: {
          title: opt.title,
          description: opt.description,
          category: opt.category,
          domain: opt.domain,
          difficulty: opt.difficulty,
          estimatedDuration: opt.estimatedDuration,
          outcomes: opt.outcomes,
          voteCount: opt.voteCount,
          order: opt.order,
        },
        create: {
          id: opt.id,
          pollId: poll.id,
          title: opt.title,
          description: opt.description,
          category: opt.category,
          domain: opt.domain,
          difficulty: opt.difficulty,
          estimatedDuration: opt.estimatedDuration,
          outcomes: opt.outcomes,
          voteCount: opt.voteCount,
          order: opt.order,
        },
      });
    }
  }

  console.log("[seed] Finished seeding multidisciplinary resources and community course polls successfully.");
}

main()
  .catch((e) => {
    console.error("[seed error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
