# LeetCode Friends Tracker — Project Context

## Origin Idea
Inspired by Samsung Together Health's step-count contests among friends. The idea: build a similar competitive tracker, but for LeetCode — automatically showing who solved what, when, with zero manual entry.

## Core Concept
- Friends (starting with 3, including me) do LeetCode as usual.
- The platform auto-detects and displays their solved problems from a given start date.
- Points system, leaderboard, and per-person profiles — all pulled automatically, no manual logging.

## Goals
1. Build and test it with my friend group first.
2. Eventually publish it publicly as a real, usable tool.
3. Use it as a strong resume/portfolio project (aligns with Full Stack AI Engineer track).

---

## Key Technical Decisions

### Data Source
- LeetCode has **no official public API** — no webhooks, no real-time push.
- Use the **unofficial public GraphQL endpoint** (`leetcode.com/graphql`) or wrappers like `alfa-leetcode-api`.
- `recentAcSubmissionList` works with just a **username** — no login/password needed.
- Actual submitted code is generally not accessible for other users via API — plan around metadata only (problem, difficulty, timestamp, language) for v1. Session-cookie-based code access could be an optional opt-in feature later, but not required and adds fragility/trust concerns.
- **Decision: no credentials/passwords stored, ever.** Public username-only lookup covers the core feature and removes trust/security friction — works the same whether it's 3 friends or public users.

### "Real-Time" Updates
- True real-time (instant on submit) isn't possible without a webhook, which LeetCode doesn't offer.
- Solution: **frequent polling** (every 2–5 min per user), diff against last-seen submission ID stored in DB, insert new ones only. Feels real-time enough for casual competitive use.

### Points System
- Initial idea: Easy = 1, Medium = 2.
- Refined: **Easy = 1, Medium = 3, Hard = 5** (closer to LeetCode's own relative difficulty weighting).
- Additional ideas: first-to-solve bonus, streak multiplier, only count first AC per problem (avoid resubmission farming).

### Notifications
- Feasible via **Firebase Cloud Messaging (FCM)** — works for Android and web push (PWA).
- Flow: poller detects new AC submission → triggers FCM push → friend gets phone notification with problem name, difficulty, and updated rank.
- PWA + FCM gets ~90% of native-app behavior without building a native app.

---

## Feature List
- Leaderboard: daily / weekly / all-time views (not just lifetime totals)
- Per-person profile: total solved, difficulty breakdown, favorite language, current streak, topic-tag breakdown (arrays, DP, graphs, etc.)
- GitHub-style heatmap calendar per user
- Auto-sync via stored usernames + polling job (no manual entry ever)
- Push notifications on friends' new solves
- Groups/rooms (needed once public — not just one friend circle)

## Market Alternatives (existing tools, researched)
- **LeetCode Friends Contest Tracker** (Chrome ext.) — contest-only friend rankings, no daily practice tracking.
- **LeetBuddies** (Chrome ext.) — tracks friend progress, stats, heatmap; closest existing competitor.
- **Leetcode-friends-tracker** (Flask, open source) — solved counts by difficulty, recent submissions; looks unmaintained/basic.
- **LeetCode Streak Tracker** (Python/Selenium/GitHub Pages) — streak-only, static site, scraping-based.
- Various small hosted sites (LeetTrack, Lc Friends Leaderboard) — minimal feature depth, solo-project scale.
- **Gap identified:** nobody combines daily solve tracking + weighted scoring + topic breakdown + heatmap + public multi-user leaderboard + notifications + AI insights in one polished web app. This is the differentiation angle for the resume pitch.

## Operational Notes for Public Launch
- Rate-limit polling to avoid IP blocks from LeetCode once there are many users — batch and stagger requests.
- No official sanction for scraping the public GraphQL endpoint, but it's the de facto standard approach used by all existing similar tools. Add an "unofficial, not affiliated with LeetCode" disclaimer on the site.

---

## Tech Stack
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (scales better than SQLite for public use)
- **Background jobs:** APScheduler (simple) or Celery + Redis (production-grade, resume-worthy — task queues)
- **Frontend:** React, PWA-enabled (installable on phones, supports push)
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Auth:** None needed beyond username-based public profiles (data source is public)
- **Deployment:** Docker + Render/Railway/Fly.io (free-tier friendly to start)

## AI Integration Ideas
1. **Weak-topic detector** — analyze solve history by tag, LLM generates personalized "focus on these topics next" recommendations. (Standout feature — shows building on top of raw data, not just displaying it.)
2. **Weekly AI recap/roast** — witty auto-generated weekly summary, shareable, simple LLM call over aggregated week data.
3. **Difficulty-adjusted problem suggester** — recommends next problem based on group trends + user's gaps.
4. **Natural language stats query** — "How many mediums did I solve last week vs Raj?" → LLM translates to DB query. Ties into existing RAG/LangChain experience from the PDF chatbot project.
- Recommendation: prioritize #1 or #4 since they reuse existing RAG/LangChain skills and make a stronger "AI used meaningfully" interview story.
- AI insights should be **cached, not regenerated per request** (cost and latency reasons).

---

## Database Schema (Draft)

### Core Tables
```sql
-- Users
users (
  id UUID PK,
  leetcode_username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP,
  last_synced_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
)

-- Groups (friend circles — needed once public)
groups (
  id UUID PK,
  name TEXT,
  invite_code TEXT UNIQUE,
  created_by UUID FK -> users.id,
  created_at TIMESTAMP
)

group_members (
  group_id UUID FK,
  user_id UUID FK,
  joined_at TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
)

-- Submissions
submissions (
  id UUID PK,
  user_id UUID FK -> users.id,
  leetcode_submission_id TEXT UNIQUE,  -- dedupe key, critical
  problem_slug TEXT,
  problem_title TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy','Medium','Hard')),
  language TEXT,
  topic_tags TEXT[],
  points_awarded INT,
  submitted_at TIMESTAMP,
  synced_at TIMESTAMP
)
-- Index on (user_id, submitted_at); unique index on leetcode_submission_id
```

### Points & Streaks
```sql
user_stats (
  user_id UUID PK FK,
  total_points INT,
  easy_count INT,
  medium_count INT,
  hard_count INT,
  current_streak INT,
  longest_streak INT,
  last_solved_date DATE,
  updated_at TIMESTAMP
)
```

### Notifications
```sql
device_tokens (
  id UUID PK,
  user_id UUID FK,
  fcm_token TEXT,
  platform TEXT,  -- 'web','android'
  created_at TIMESTAMP
)

notification_log (
  id UUID PK,
  triggered_by_user_id UUID FK,
  submission_id UUID FK,
  sent_to_user_id UUID FK,
  sent_at TIMESTAMP,
  status TEXT  -- 'sent','failed'
)
```

### AI Insights
```sql
ai_insights (
  id UUID PK,
  user_id UUID FK,
  insight_type TEXT,  -- 'weak_topics','weekly_recap','next_problem_suggestion'
  content TEXT,
  generated_at TIMESTAMP,
  valid_until TIMESTAMP
)
```

---

## Resume/Interview Takeaways
- Distributed systems basics: polling architecture, rate-limiting, idempotency
- Real-time-ish system design without true webhooks — good "how would you design X" interview story
- Push notification infrastructure (FCM)
- Reverse-engineered/undocumented API integration — resourcefulness
- Full-stack ownership: DB design, background workers, REST API, React frontend, deployment
- Scaling considerations for public multi-user use: caching, rate limiting, horizontal scaling
- Meaningful AI integration (not decorative) — reuses RAG/LangChain experience from PDF chatbot project

## Open / Next Steps
- Finalize polling frequency and rate-limit strategy for public scale
- Decide Celery+Redis vs APScheduler based on time available
- Design group/invite-code flow for public multi-user onboarding
- Build FCM integration and test notification latency
- Prototype AI weak-topic detector as the first AI feature
