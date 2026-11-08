# Why I Built a Voice-Enabled AI Mock Interview Coach (That Doesn't Fall Apart When the API Fails)

Finding a software engineering job right now is hard. We all know the drill: you spend months studying algorithms, system design, and database queries. But when you finally get a live interview, talking through your design decisions under pressure is a completely different skill. You can grind hundreds of coding puzzles, but if you freeze when asked to explain your architectural choices, you're out.

I looked at the tools out there to help practice this. They were either static lists of quiz questions, or they cost $150/hour for coaching. I wanted something conversational, voice-based, and smart enough to ask senior-level questions. 

So, I built **Interview Coach**.

![Interview Coach Dashboard](/interview-coach-dashboard-mockup.png)

---

## What Makes This Different?

Most mock interview apps are just wrappers around static question banks. They ask you "What is a closure in JavaScript?" or "Explain MVC." No senior developer gets asked that in a real interview. 

I focused on three specific goals:

### 1. Scenario-Based Questions
Instead of general theory, the app uses Gemini models to spin up real-world engineering problems on the fly. You'll get questions like: 
* *"Imagine we are building a high-throughput tracking pipeline. How would you handle backpressure at the gateway level?"*
* *"We need to optimize a slow-running SQL query with multiple joins on a table with 10 million rows. Walk me through your indexing strategy."*

### 2. Browser-Native Speech Recognition
To simulate a real panel interview, you don't type your answers. You speak them. The app integrates directly with the browser's speech recognition API to capture your spoken explanation on the fly, showing your response in real-time.

### 3. Smart Fallbacks (No API Lockouts)
If you've built anything with LLM APIs, you know they rate-limit or drop requests when traffic spikes. To prevent the app from freezing during a mock interview session, I implemented a robust priority-based model rotation and a heuristic local backup engine. 

Here is how the API fallback loop handles model failures under the hood:

```typescript
const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-2.0-flash'
];

for (const modelName of modelsToTry) {
    try {
        const prompt = `...`;
        return await generateWithRetry(modelName, prompt, 0.8);
    } catch (e) {
        console.warn(`Model ${modelName} failed, trying next...`);
        // Keep moving through the list instead of crashing
        continue;
    }
}
```

If every cloud model fails due to network or quota issues, a local analyzer evaluates your answer's length, keyword presence, and tone to give you instant feedback. The interview session doesn't break, and you don't lose your progress.

---

## Scanning Resumes Against Recruiter Filters

Before you even get to the interview stage, your resume has to pass the Applicant Tracking System (ATS). I added a resume scanner tool to the suite. You upload your resume (either as text, a PDF, or even a screenshot image), and it runs a series of checks:

* **Keyword Density**: Are you matching common framework and database terms?
* **Formatting & Layout**: Is the visual structure clean enough for parsers?
* **Impact Verbs**: Does your experience list actual accomplishments (e.g., *"implemented"*, *"scaled"*, *"optimized"*) instead of passive descriptions?

The scanner scores each category and returns concrete, actionable tips (like reminding you to add a clickable GitHub link or list specific cloud platforms you've used).

---

## How It's Built

The codebase uses a clean, full-stack setup:
* **Frontend**: Next.js (App Router) styled with Tailwind CSS and Radix UI components (via Shadcn) for a responsive layout.
* **Database**: MongoDB with Mongoose to manage users, track historical interview sessions, and store OTPs for secure password resets.
* **Email dispatch**: Nodemailer integration to manage email verification and login recovery.

## What's Next?

Right now, the app works entirely in the browser. Moving forward, I want to explore:
1. **Local Vector Stores**: Running a small vector database in the backend to store documentation for specific frameworks, so the coach can evaluate niche technical topics with higher accuracy.
2. **Mock Whiteboard Integration**: A simple canvas where you can draw out database schemas or flowcharts while talking to the AI.

If you want to practice your technical or behavioral communication skills, you can run the project locally, set your API keys, and start practicing for free. Let me know what you think!
