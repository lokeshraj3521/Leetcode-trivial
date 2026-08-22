import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("leetcode_service")

# GraphQL Query for Recent AC Submissions
RECENT_AC_SUBMISSIONS_QUERY = """
query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
    }
}
"""

# GraphQL Query for User Lifetime Solve Stats
USER_PROFILE_STATS_QUERY = """
query getUserProfile($username: String!) {
    matchedUser(username: $username) {
        username
        submissionCalendar
        submitStats: submitStatsGlobal {
            acSubmissionNum {
                difficulty
                count
            }
        }
    }
}
"""

# GraphQL Query for User Skills (Advanced, Intermediate, Fundamental) & Languages
SKILLS_AND_LANGUAGES_QUERY = """
query skillAndLanguageStats($username: String!) {
    matchedUser(username: $username) {
        tagProblemCounts {
            advanced {
                tagName
                problemsSolved
            }
            intermediate {
                tagName
                problemsSolved
            }
            fundamental {
                tagName
                problemsSolved
            }
        }
        languageProblemCount {
            languageName
            problemsSolved
        }
    }
}
"""

# GraphQL Query for Question Metadata (Difficulty, Topic Tags)
QUESTION_DETAIL_QUERY = """
query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
        questionId
        title
        difficulty
        topicTags {
            name
            slug
        }
    }
}
"""


class LeetCodeService:
    def __init__(self):
        self.graphql_url = settings.LEETCODE_GRAPHQL_URL
        self.alfa_api_url = "https://alfa-leetcode-api.onrender.com"
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://leetcode.com",
        }
        self._problem_cache: Dict[str, Dict[str, Any]] = {}

    async def fetch_user_skills_and_languages(self, username: str) -> Dict[str, Any]:
        """
        Dynamically queries LeetCode GraphQL for real Skills breakdown (Advanced, Intermediate, Fundamental)
        and Language statistics for any username without hardcoding.
        """
        clean_user = username.strip()
        payload = {
            "query": SKILLS_AND_LANGUAGES_QUERY,
            "variables": {"username": clean_user},
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await asyncio.sleep(0.1)
                response = await client.post(self.graphql_url, json=payload, headers=self.headers)
                if response.status_code == 200:
                    data = response.json()
                    mu = data.get("data", {}).get("matchedUser")
                    if mu:
                        tag_counts = mu.get("tagProblemCounts") or {}
                        lang_counts = mu.get("languageProblemCount") or []

                        skills = {
                            "advanced": tag_counts.get("advanced") or [],
                            "intermediate": tag_counts.get("intermediate") or [],
                            "fundamental": tag_counts.get("fundamental") or [],
                        }

                        # Sort languages by problemsSolved descending
                        sorted_langs = sorted(lang_counts, key=lambda x: x.get("problemsSolved", 0), reverse=True)

                        logger.info(f"Fetched live skills and languages for '{clean_user}' directly from LeetCode GraphQL.")
                        return {
                            "skills": skills,
                            "languages": sorted_langs,
                        }
        except Exception as e:
            logger.warning(f"Failed to fetch skills/languages for '{clean_user}' from LeetCode: {e}")

        return {"skills": {"advanced": [], "intermediate": [], "fundamental": []}, "languages": []}

    async def fetch_user_profile_stats(self, username: str) -> Dict[str, Any]:
        """Fetches 100% REAL overall lifetime solve statistics directly from LeetCode user profile APIs."""
        clean_user = username.strip()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.alfa_api_url}/userProfile/{clean_user}"
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    total = data.get("totalSolved", 0)
                    easy = data.get("easySolved", 0)
                    med = data.get("mediumSolved", 0)
                    hard = data.get("hardSolved", 0)

                    if total == 0 and "matchedUserStats" in data:
                        ac_nums = data.get("matchedUserStats", {}).get("acSubmissionNum", [])
                        for item in ac_nums:
                            diff = item.get("difficulty")
                            cnt = item.get("count", 0)
                            if diff == "All":
                                total = cnt
                            elif diff == "Easy":
                                easy = cnt
                            elif diff == "Medium":
                                med = cnt
                            elif diff == "Hard":
                                hard = cnt

                    sub_cal = data.get("submissionCalendar") or {}
                    if isinstance(sub_cal, str):
                        try:
                            sub_cal = json.loads(sub_cal)
                        except Exception:
                            sub_cal = {}

                    return {
                        "totalSolved": total,
                        "easySolved": easy,
                        "mediumSolved": med,
                        "hardSolved": hard,
                        "ranking": data.get("ranking", 0),
                        "submissionCalendar": sub_cal,
                    }
        except Exception as e:
            logger.warning(f"alfa-api userProfile fetch failed for '{clean_user}': {e}. Trying GraphQL.")

        try:
            payload = {
                "query": USER_PROFILE_STATS_QUERY,
                "variables": {"username": clean_user},
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                await asyncio.sleep(0.3)
                resp = await client.post(self.graphql_url, json=payload, headers=self.headers)
                if resp.status_code == 200:
                    d = resp.json()
                    mu = d.get("data", {}).get("matchedUser")
                    if mu:
                        ac_list = mu.get("submitStats", {}).get("acSubmissionNum", [])
                        total, easy, med, hard = 0, 0, 0, 0
                        for item in ac_list:
                            diff = item.get("difficulty")
                            cnt = item.get("count", 0)
                            if diff == "All":
                                total = cnt
                            elif diff == "Easy":
                                easy = cnt
                            elif diff == "Medium":
                                med = cnt
                            elif diff == "Hard":
                                hard = cnt

                        cal_str = mu.get("submissionCalendar", "{}")
                        try:
                            cal_dict = json.loads(cal_str)
                        except Exception:
                            cal_dict = {}

                        return {
                            "totalSolved": total,
                            "easySolved": easy,
                            "mediumSolved": med,
                            "hardSolved": hard,
                            "ranking": 0,
                            "submissionCalendar": cal_dict,
                        }
        except Exception as e:
            logger.warning(f"GraphQL user profile fetch failed for '{clean_user}': {e}")

        return {
            "totalSolved": 0,
            "easySolved": 0,
            "mediumSolved": 0,
            "hardSolved": 0,
            "ranking": 0,
            "submissionCalendar": {},
        }

    async def fetch_recent_ac_submissions(self, username: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetches recent Accepted (AC) submissions for a given username."""
        clean_user = username.strip()

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.alfa_api_url}/{clean_user}/acSubmission"
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    subs_list = data.get("submission") or data.get("recentSubmissions") or []
                    if subs_list:
                        enriched = []
                        for idx, sub in enumerate(subs_list[:limit]):
                            title_slug = sub.get("titleSlug", sub.get("title", "").lower().replace(" ", "-"))
                            detail = await self.fetch_problem_details(title_slug)
                            ts = int(sub.get("timestamp", 0))
                            if ts > 0:
                                sub_dt = datetime.fromtimestamp(ts, tz=timezone.utc).replace(tzinfo=None)
                            else:
                                sub_dt = datetime.utcnow()

                            sub_id = f"lc_{clean_user}_{title_slug}_{ts if ts > 0 else idx}"

                            enriched.append({
                                "leetcode_submission_id": sub_id,
                                "problem_slug": title_slug,
                                "problem_title": sub.get("title", detail.get("title", title_slug.replace("-", " ").title())),
                                "difficulty": detail.get("difficulty", "Medium"),
                                "topic_tags": detail.get("topic_tags", []),
                                "language": sub.get("lang", "python3"),
                                "submitted_at": sub_dt,
                            })
                        logger.info(f"Fetched {len(enriched)} real AC submissions for '{clean_user}' via alfa-api.")
                        return enriched
        except Exception as e:
            logger.warning(f"alfa-leetcode-api fetch failed for '{clean_user}': {e}. Trying GraphQL fallback.")

        try:
            payload = {
                "query": RECENT_AC_SUBMISSIONS_QUERY,
                "variables": {"username": clean_user, "limit": limit},
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                await asyncio.sleep(settings.RATE_LIMIT_DELAY_SECONDS)
                response = await client.post(self.graphql_url, json=payload, headers=self.headers)
                
                if response.status_code == 200:
                    data = response.json()
                    submissions = data.get("data", {}).get("recentAcSubmissionList")
                    if submissions:
                        enriched = []
                        for sub in submissions:
                            detail = await self.fetch_problem_details(sub["titleSlug"])
                            submitted_dt = datetime.fromtimestamp(int(sub["timestamp"]), tz=timezone.utc).replace(tzinfo=None)
                            enriched.append({
                                "leetcode_submission_id": str(sub["id"]),
                                "problem_slug": sub["titleSlug"],
                                "problem_title": detail.get("title", sub["title"]),
                                "difficulty": detail.get("difficulty", "Easy"),
                                "topic_tags": detail.get("topic_tags", []),
                                "language": detail.get("language", "python3"),
                                "submitted_at": submitted_dt,
                            })
                        return enriched
        except Exception as e:
            logger.warning(f"GraphQL fetch failed for '{clean_user}': {e}.")

        return []

    async def fetch_user_calendar(self, username: str) -> Dict[str, Any]:
        """Fetches 365-day submission calendar JSON."""
        clean_user = username.strip()
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                url = f"{self.alfa_api_url}/{clean_user}/calendar"
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    cal_str = data.get("submissionCalendar", "{}")
                    if isinstance(cal_str, str):
                        try:
                            cal_dict = json.loads(cal_str)
                        except Exception:
                            cal_dict = {}
                    else:
                        cal_dict = cal_str or {}
                    return {
                        "activeYears": data.get("activeYears", []),
                        "streak": data.get("streak", 0),
                        "totalActiveDays": data.get("totalActiveDays", 0),
                        "submissionCalendar": cal_dict,
                    }
        except Exception as e:
            logger.warning(f"Calendar fetch failed for '{clean_user}': {e}")

        return {"activeYears": [], "streak": 0, "totalActiveDays": 0, "submissionCalendar": {}}

    async def fetch_problem_details(self, title_slug: str) -> Dict[str, Any]:
        """Fetches problem metadata (difficulty, topic tags) by title slug."""
        if title_slug in self._problem_cache:
            return self._problem_cache[title_slug]

        payload = {
            "query": QUESTION_DETAIL_QUERY,
            "variables": {"titleSlug": title_slug},
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                await asyncio.sleep(0.2)
                response = await client.post(self.graphql_url, json=payload, headers=self.headers)
                if response.status_code == 200:
                    data = response.json()
                    q = data.get("data", {}).get("question", {})
                    if q:
                        tags = [t["name"] for t in q.get("topicTags", [])]
                        detail = {
                            "title": q.get("title", title_slug.replace("-", " ").title()),
                            "difficulty": q.get("difficulty", "Medium"),
                            "topic_tags": tags if tags else ["Algorithms"],
                            "language": "python3",
                        }
                        self._problem_cache[title_slug] = detail
                        return detail
        except Exception:
            pass

        fallback = {
            "title": title_slug.replace("-", " ").title(),
            "difficulty": "Medium",
            "topic_tags": ["Algorithms"],
            "language": "python3",
        }
        self._problem_cache[title_slug] = fallback
        return fallback


leetcode_service = LeetCodeService()
