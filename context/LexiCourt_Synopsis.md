**Jagannath International Management School**

**Vasant Kunj, New Delhi-110070**

(Affiliated to Guru Gobind Singh Indraprastha University, New Delhi)

Recognized u/s 2(f) by UGC & Accredited with ‘A+’ Grade by NAAC

NIRF Rank Band 201-300 under College Category

ISO 9001:2015 Quality Certified

**A**

**Synopsis Report**

**On**

**“LexiCourt – AI-Powered Legal Assistant &**

**Virtual Court Case Management System”**

For Partial Fulfilment of Bachelor of Technology (B.Tech)

(B.Tech 2022-2026)

|  |  |
| :---- | :---- |
| **Submitted to** Assistant Professor – IT Department JIMS, Vasant Kunj, New Delhi | **Submitted by** Jaskirat Singh Kamboh Aarush Gupta Sarthak Tuteja |

**JANUARY, 2026**

**TABLE OF CONTENTS**

| S. No. | Topic | Page No. |
| :---: | ----- | :---: |
| 1\. | Introduction | 3 |
| 2\. | Why Was This Topic Chosen? | 4 |
| 3\. | Objectives and Scope | 5 |
| 4\. | Methodology | 6 |
| 5\. | Technology Stack | 7 |
| 6\. | Testing Technologies Used | 8 |
| 7\. | Limitations and Future Scope | 9 |
| 8\. | Team Work Distribution | 10 |
| 9\. | Conclusion | 11 |

# **1\. INTRODUCTION**

Lawyers in India deal with a lot of paperwork. Case files, court orders, affidavits, notices — the pile never really stops. Most of this is still handled manually. A lawyer with 30 active cases has to physically go through files before every single hearing. Sometimes they walk into court without knowing what the last order even said. That is the kind of problem we wanted to fix.

There are legal software tools out there, but most are too expensive for someone running a small practice. A solo lawyer at a district court level is not going to pay for enterprise software. So they stick to paper folders and registers. Things get misplaced. Hearing dates get missed. And if a file is thick enough, finding one specific paragraph takes more time than it should.

## **1.1 Problem Statement**

The core problem is simple. Individual lawyers and small teams have no affordable tool to manage case documents and prepare quickly before hearings. After looking at how things actually work at the ground level, we grouped the problems into two areas:

### **Problems Faced by Lawyers:**

**1\.** No digital way to store and pull up case files by matter name, party, or date.

**2\.** A lot of time wasted flipping through physical files just to find a specific order.

**3\.** Every standard draft like an affidavit or notice has to be written from scratch each time.

### **Problems Faced by Clients:**

**1\.** No clear way to track what is happening with their case.

**2\.** Drafts take longer to receive because everything is done manually.

LexiCourt is our answer to this. It is a web app where lawyers can upload their case documents, sort them into folders, and ask an AI assistant questions about those files. The AI reads the documents and gives back summaries, pulls out key dates, and can even draft basic legal documents like affidavits and notices. We built it to be browser-based and simple enough that someone who is not a tech person can still figure it out.

# **2\. WHY WAS THIS TOPIC CHOSEN?**

The idea came from something one of us noticed while talking to a lawyer relative. Before each court appearance, they spent almost an hour just going through a file to remember what happened last time. That stuck with us. It seemed like exactly the kind of problem that software should already be solving — but apparently was not.

## **Gap in the Market for Small Practices:**

Big law firms have case management tools. The smaller ones do not, mostly because the options are either too costly or require too much setup. We looked at a few existing tools and most of them are clearly built for large organizations. There is a real gap for something light, affordable, and easy to set up for a single lawyer or a two-person team.

## **AI Makes It More Than Just a File Manager:**

Adding the Gemini API changed what the project could do. Without it, LexiCourt would just be a folder system. With it, a lawyer can actually ask a question about a document and get an answer. For example: ‘What was the last order passed in this case?’ — and instead of digging through 80 pages, the AI can point straight to it. That kind of feature saves real time.

## **Learning Opportunity for Our Team:**

Also, honestly, this project let us learn things we had never touched before. Working with a cloud backend, connecting to an AI API, handling file uploads, setting up auth — none of us had done all of that together in one project. We wanted to build something real, not just a todo app or a form. This gave us that chance. Looking back, the scope was ambitious for our skill level, but we pulled it off.

# **3\. OBJECTIVES AND SCOPE**

## **Objective of the Project:**

The main things we wanted the app to do:

**1\.** Build a working web app where lawyers can upload case documents and keep them organized in folders by case name.

**2\.** Add an AI chat feature that reads uploaded files and answers questions about them, so the lawyer does not have to search manually.

**3\.** Set up automatic case summaries, so a lawyer can get a quick overview of a long judgment without reading the whole thing.

**4\.** Pull out key dates and events from case documents so hearing timelines are easy to find at a glance.

**5\.** Include a draft generator that creates standard legal documents like affidavits and applications using the data already in the case folder.

**6\.** Add a check that alerts the lawyer if something seems to be missing from a case folder before a hearing.

**7\.** Make the whole thing work in a regular browser with no special installation needed.

## **Scope of the Project:**

This project covers: case folder management, document upload and storage, AI-based document querying, case summaries, timeline extraction, draft generation, and missing document alerts. The target user is a solo lawyer or a small team of two or three people. Everyone gets their own login and can only see their own files.

What it does NOT cover: integration with government e-filing systems like e-Courts, any payment processing, video calls, or real-time document collaboration. We kept those out on purpose. Adding them would have made the scope impossible to finish properly with our current skills and timeline. We focused on getting the core features to actually work.

# **4\. METHODOLOGY**

We did not follow any formal software development methodology by the book. But we did break the work into phases and tried not to move on until the previous phase was stable. Most of the code was written using AI-assisted tools like Claude AI and GitHub Copilot, which helped a lot since none of us are expert developers. Here is how we actually went about it:

## **Phase 1: Requirement Gathering**

We started by talking through what a lawyer actually does day-to-day. One of us had a connection to a legal professional who gave us a rough picture of the workflow. We also looked at a couple of existing legal apps to see what they offered. From that, we listed out around 10 features we wanted to include and then cut it down to 7 that were actually buildable within our time and skill level.

## **Phase 2: System Design**

The app is client-server based. Frontend talks to Firebase. Firebase handles auth, storage, and the database. The AI features go through the Gemini API. We sketched out the main screens on paper before writing any code — the dashboard, the case folder view, the document viewer, the chat window, and the draft form. We also mapped out the database collections before building anything.

## **Phase 3: Development**

We built the frontend first using HTML, CSS, Bootstrap, and JavaScript. Firebase was set up in parallel. The AI features came last, once the basic folder and upload system was working. We built one module at a time and tested each one before moving to the next. The integration part turned out to be harder than expected, especially getting the document text to reach the Gemini API in the right format.

## **Phase 4: Testing and Deployment**

After each module was done, we tested it manually. We ran through every main user flow, checked edge cases like empty folders or failed uploads, and fixed what broke. Once everything was stable, we pushed the code to GitHub and deployed through Firebase Hosting. The app is live and accessible through a browser.

# **5\. TECHNOLOGY STACK**

We picked tools based on three things: they had to be free or nearly free, well documented, and beginner-friendly enough that we could actually use them without getting stuck for days. Here is what we ended up with:

## **Frontend (User Interface):**

* HTML5 and CSS3 — for page structure and styling.

* JavaScript — for dynamic content and user interactions.

* Bootstrap 5 — made the layout responsive without us having to write a ton of CSS from scratch.

## **Backend:**

* Firebase Studio — gave us a backend environment without needing to set up a separate server. Hosting, functions, and tools all in one place.

* Firebase Authentication — handles login, signup, and session management.

* Firebase Cloud Functions — used for server-side processing where the frontend could not handle it directly.

## **Database:**

* Firebase Realtime Database — stores case folders, document metadata, chat history, and generated content.

* Firebase Cloud Storage — for the actual uploaded files, kept separate from the structured data.

## **AI Integration:**

* Google Gemini API — does the document reading, question answering, summarization, timeline extraction, and draft generation.

* Custom prompt templates — we wrote and tested different prompt structures to get legal-quality responses from the API.

## **Version Control and Deployment:**

* Git and GitHub — for version tracking and team collaboration.

* Firebase Hosting — for deployment. The app is publicly accessible online.

# **6\. TESTING TECHNOLOGIES USED**

We tested as we built, not at the end. Every module got checked before we moved on. We did not use any automated testing framework. Everything was done manually, which worked fine for a project at this scale.

## **Functional Testing:**

We went through each feature one by one. Can you create a folder? Can you rename it? Can you delete it? Does the upload save correctly? Does the AI respond to questions about the document? We also tested draft generation by comparing what the system produced against standard legal document formats. Some responses needed prompt adjustments before they looked right.

## **Integration Testing:**

Once individual parts were working, we tested how they connected. The biggest issue we ran into here was the document text not reaching the Gemini API in the right format. It was a parsing problem that took about two days to fix. After that, the full flow — upload file, extract text, send to AI, display response — worked cleanly.

## **Usability Testing:**

We asked two classmates outside our team to use the app without any instructions and tell us what confused them. A few things came up: one button label was unclear, the navigation between sections was not obvious, and the AI response text was hard to read because the line spacing was too tight. We fixed all three based on their feedback.

## **Security Testing:**

Firebase rules were configured so that each user can only read and write their own data. We tested this by logging in as one user and trying to access data stored under a different user ID. It blocked correctly. We also made sure API keys are stored server-side and not visible in the frontend code.

# **7\. LIMITATIONS AND FUTURE SCOPE**

## **Limitations:**

There are things the current version does not do well, and we want to be upfront about them:

* The AI features need an active internet connection. If the Gemini API is down or slow, those features stop working until the connection comes back.

* The drafts and summaries the AI generates are starting points, not final documents. A lawyer still needs to review them before using them for anything official. AI does make mistakes, especially with legal language.

* There is no connection to any government court system like e-Courts or ICMS. The app is strictly for internal preparation, not for submitting anything officially.

* Scanned documents with poor quality or handwriting do not process well. The AI struggles to extract clean text from those and the results can be inaccurate.

* Only English is supported right now. A lot of court documents in India are in Hindi or other regional languages. That is a significant gap we did not have time to address.

## **Future Scope:**

If we keep working on this, here is what we would add next:

* Connect to e-filing portals so lawyers can submit drafts directly from within the app without switching platforms.

* Add OCR support so scanned documents and handwritten notes can be converted to text and processed by the AI.

* Hindi and Punjabi language support, since a lot of court work in North India happens in those languages.

* Team collaboration features, so multiple lawyers in a small firm can share case folders and work on them together.

* A mobile app for Android so lawyers can check case details or use the AI assistant while they are in court.

# **8\. TEAM WORK DISTRIBUTION**

There are three of us. We split the work by area, based on what each person was most comfortable with. That said, we were always in a group chat, and if someone got stuck, the others jumped in. The split was never completely rigid.

## **Jaskirat Singh Kamboh – Frontend Development:**

Jaskirat built all the user-facing pages. Login, signup, dashboard, case folder view, document upload screen, the chat window, and the draft generation form. He used HTML, CSS, Bootstrap, and JavaScript. Making things look consistent across different screen sizes took more time than expected. Jaskirat also worked on the navigation flow and making sure moving between sections felt smooth rather than disjointed.

## **Aarush Gupta – Backend and AI Integration:**

Aarush set up everything on the Firebase side — authentication configuration, database rules, storage structure. He also handled all the Gemini API integration for the AI features. Writing the prompts was a bigger job than we expected. Aarush went through probably eight or nine versions of the summarization prompt before the output actually looked like something a lawyer could use. That part took patience.

## **Sarthak Tuteja – Database, Testing, and Deployment:**

Sarthak designed the database structure — how folders, files, user profiles, and generated content are organized in Firebase. He also ran most of the testing, tracked bugs in a shared spreadsheet, and followed up on fixes. When it came to deployment, Sarthak managed the GitHub repo, handled merge issues when branches conflicted, and did the final push to Firebase Hosting.

## **Shared Work:**

All three of us worked together on the initial planning, figuring out the feature list, writing this synopsis, and putting together the final presentation. The big integration testing sessions were also done together, usually on a video call where we could all see the same screen and debug at the same time.

# **9\. CONCLUSION**

LexiCourt started as an idea about reducing paperwork for lawyers and ended up being the most technically ambitious thing any of us had built. The app combines case file management with AI-powered document analysis. It is not trying to replace what a lawyer does. It is trying to take the boring, repetitive parts off their plate so they can focus on the actual legal thinking.

Getting here meant learning a lot of things we had not used before. Firebase as a backend, the Gemini API, deploying a live web app, writing prompts that produce structured legal output — none of that was in our coursework. We picked it up by reading documentation, making mistakes, and fixing them. Honestly, that process was probably more educational than anything else we did this year.

The current version covers everything we originally planned: case folders, document uploads, AI chat, case summaries, timeline extraction, draft generation, and missing document alerts. All of it works and has been tested. The main gaps are language support, OCR for scanned documents, and the lack of integration with official court systems. Those are real limitations, but they are also clearly scoped improvements for future versions.

If we had to say one thing about what this project taught us: picking the right tools matters more than trying to build everything yourself. Firebase and the Gemini API let a team of three students with basic coding skills actually ship something real. We tried to build something useful, not something impressive on paper. We think we managed to do that.

**\* \* \* End of Synopsis \* \* \***