import asyncio
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
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://leetcode.com",
        }
        # In-memory metadata cache for problem details (slug -> details) to reduce API calls
        self._problem_cache: Dict[str, Dict[str, Any]] = {}

    async def fetch_recent_ac_submissions(self, username: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Fetches recent Accepted (AC) submissions for a given LeetCode username.
        Includes rate limit delays and fallback mock generation for testing/offline support.
        """
        payload = {
            "query": RECENT_AC_SUBMISSIONS_QUERY,
            "variables": {"username": username, "limit": limit},
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await asyncio.sleep(settings.RATE_LIMIT_DELAY_SECONDS)
                response = await client.post(self.graphql_url, json=payload, headers=self.headers)
                
                if response.status_code == 200:
                    data = response.json()
                    submissions = data.get("data", {}).get("recentAcSubmissionList")
                    if submissions is not None:
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
            logger.warning(f"Failed to fetch live LeetCode submissions for '{username}': {e}. Using fallback generator.")

        # Fallback Mock Generator for seamless offline/dev testing
        return self._generate_mock_submissions(username, limit)

    async def fetch_problem_details(self, title_slug: str) -> Dict[str, Any]:
        """
        Fetches problem metadata (difficulty, topic tags) by title slug with caching.
        """
        if title_slug in self._problem_cache:
            return self._problem_cache[title_slug]

        payload = {
            "query": QUESTION_DETAIL_QUERY,
            "variables": {"titleSlug": title_slug},
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                await asyncio.sleep(0.3)
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

        # Fallback estimation based on common problem slugs
        fallback = self._get_fallback_problem_detail(title_slug)
        self._problem_cache[title_slug] = fallback
        return fallback

    def _get_fallback_problem_detail(self, title_slug: str) -> Dict[str, Any]:
        known_problems = {
            "two-sum": {"title": "Two Sum", "difficulty": "Easy", "topic_tags": ["Array", "Hash Table"]},
            "add-two-numbers": {"title": "Add Two Numbers", "difficulty": "Medium", "topic_tags": ["Linked List", "Math"]},
            "longest-substring-without-repeating-characters": {"title": "Longest Substring Without Repeating Characters", "difficulty": "Medium", "topic_tags": ["Hash Table", "Sliding Window"]},
            "median-of-two-sorted-arrays": {"title": "Median of Two Sorted Arrays", "difficulty": "Hard", "topic_tags": ["Array", "Binary Search", "Divide and Conquer"]},
            "container-with-most-water": {"title": "Container With Most Water", "difficulty": "Medium", "topic_tags": ["Array", "Two Pointers", "Greedy"]},
            "trapping-rain-water": {"title": "Trapping Rain Water", "difficulty": "Hard", "topic_tags": ["Array", "Two Pointers", "Stack", "Dynamic Programming"]},
            "climbing-stairs": {"title": "Climbing Stairs", "difficulty": "Easy", "topic_tags": ["Math", "Dynamic Programming", "Memoization"]},
            "coin-change": {"title": "Coin Change", "difficulty": "Medium", "topic_tags": ["Array", "Dynamic Programming", "Breadth-First Search"]},
        }
        if title_slug in known_problems:
            p = known_problems[title_slug]
            p["language"] = "python3"
            return p

        return {
            "title": title_slug.replace("-", " ").title(),
            "difficulty": "Medium",
            "topic_tags": ["Algorithms"],
            "language": "python3",
        }

    def _generate_mock_submissions(self, username: str, limit: int) -> List[Dict[str, Any]]:
        """Generates deterministic mock AC submissions for demo/offline users."""
        import random
        from datetime import datetime, timedelta

        seed_val = sum(ord(c) for c in username)
        rng = random.Random(seed_val)

        sample_pool = [
            ("two-sum", "Two Sum", "Easy", ["Array", "Hash Table"]),
            ("valid-parentheses", "Valid Parentheses", "Easy", ["String", "Stack"]),
            ("best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "Easy", ["Array", "Dynamic Programming"]),
            ("add-two-numbers", "Add Two Numbers", "Medium", ["Linked List", "Math"]),
            ("container-with-most-water", "Container With Most Water", "Medium", ["Array", "Two Pointers"]),
            ("3sum", "3Sum", "Medium", ["Array", "Two Pointers", "Sorting"]),
            ("coin-change", "Coin Change", "Medium", ["Dynamic Programming", "Breadth-First Search"]),
            ("course-schedule", "Course Schedule", "Medium", ["Graph", "Topological Sort"]),
            ("trapping-rain-water", "Trapping Rain Water", "Hard", ["Array", "Two Pointers", "Dynamic Programming"]),
            ("merge-k-sorted-lists", "Merge k Sorted Lists", "Hard", ["Linked List", "Heap (Priority Queue)"]),
        ]

        submissions = []
        now = datetime.utcnow()
        count = min(limit, 8)

        for i in range(count):
            prob = rng.choice(sample_pool)
            days_ago = i * rng.randint(1, 2)
            sub_dt = now - timedelta(days=days_ago, hours=rng.randint(1, 12))
            sub_id = f"sub_{username}_{prob[0]}_{i}"

            submissions.append({
                "leetcode_submission_id": sub_id,
                "problem_slug": prob[0],
                "problem_title": prob[1],
                "difficulty": prob[2],
                "topic_tags": prob[3],
                "language": rng.choice(["python3", "cpp", "java", "javascript"]),
                "submitted_at": sub_dt,
            })

        return submissions


leetcode_service = LeetCodeService()
