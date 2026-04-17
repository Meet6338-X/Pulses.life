"""
Core bot dispatcher logic for Pulses.life.
Refactored to use modular data and persistent sessions.
"""

from src.data.triage import LANG_DETECT, EMERGENCY_KEYWORDS, SYMPTOM_TRIAGE
from src.data.messages import (
    WELCOME_EN,
    WELCOME_HI,
    EMERGENCY_EN,
    EMERGENCY_HI,
    NOT_UNDERSTOOD_EN,
    NOT_UNDERSTOOD_HI,
    HOSPITAL_GUIDE_EN,
    HOSPITAL_GUIDE_HI,
)
from src.core.sessions import session_manager


def detect_language(text: str) -> str:
    """Best-effort language detection from keyword lists."""
    text_lower = text.lower()
    for lang, keywords in LANG_DETECT.items():
        if any(kw in text_lower for kw in keywords):
            return lang
    return "en"


def is_emergency(text: str) -> bool:
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in EMERGENCY_KEYWORDS)


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def is_fuzzy_match(word1: str, word2: str, threshold: int = 2) -> bool:
    """Check if two words are similar within edit distance threshold."""
    distance = levenshtein_distance(word1.lower(), word2.lower())
    max_len = max(len(word1), len(word2))
    return distance <= threshold and distance / max_len < 0.5


def calculate_match_confidence(keyword: str, text: str) -> float:
    """Calculate confidence score for keyword match in text."""
    keyword_lower = keyword.lower()
    text_lower = text.lower()

    # Exact match gets high confidence
    if keyword_lower in text_lower:
        return len(keyword.split()) * 2.0

    # Check word-level matches
    keyword_words = keyword_lower.split()
    text_words = text_lower.split()
    score = 0.0

    for kw_word in keyword_words:
        for txt_word in text_words:
            if kw_word in txt_word or txt_word in kw_word:
                score += 1.0
            elif is_fuzzy_match(kw_word, txt_word):
                score += 0.8

    return score


def match_symptom(text: str) -> dict | None:
    text_lower = text.lower()
    best_match = None
    best_confidence = 0.0

    for key, data in SYMPTOM_TRIAGE.items():
        for keyword in data["keywords"]:
            confidence = calculate_match_confidence(keyword, text)
            if confidence > best_confidence:
                best_confidence = confidence
                best_match = data

    # Only return if confidence is above threshold
    return best_match if best_confidence > 0.5 else None


def handle_message(user_id: str, text: str, name: str = "User") -> str:
    session = session_manager.get_session(user_id)

    # 1. Detect language (if not already locked or if forced by menu)
    incoming_lang = detect_language(text)
    if incoming_lang != "en":
        session["language"] = incoming_lang

    lang = session["language"]
    use_hindi = lang in ("hi", "mr")  # Marathi falls back to Hindi advice in v1

    # ── Commands ────────────────────────────────
    upper = text.strip().upper()

    if upper in ("HI", "HELLO", "START", "HELP", "MENU", "नमस्ते"):
        session = session_manager.reset_session(user_id)
        return WELCOME_HI if use_hindi else WELCOME_EN

    if upper == "RESET":
        session = session_manager.reset_session(user_id)
        return "✅ Session reset. " + (WELCOME_HI if use_hindi else WELCOME_EN)

    if upper in ("HOSPITAL", "HOSPITALS", "FIND HOSPITAL", "अस्पताल"):
        return HOSPITAL_GUIDE_HI if use_hindi else HOSPITAL_GUIDE_EN

    # ── Emergency detection ──────────────────────
    if is_emergency(text):
        session["step"] = "emergency"
        session_manager.save_session(user_id, session)
        return EMERGENCY_HI if use_hindi else EMERGENCY_EN

    # ── Symptom triage ───────────────────────────
    matched = match_symptom(text)
    if matched:
        session["step"] = "triaged"
        session["symptom"] = matched["department"]
        session_manager.save_session(user_id, session)
        return matched["advice_hi"] if use_hindi else matched["advice_en"]

    # ── Follow-up after triage ───────────────────
    if session.get("step") == "triaged":
        return (
            f"ℹ️ You were asking about: *{session['symptom']}*\n\n"
            "Would you like to know:\n"
            "• How to find the nearest hospital? → type *HOSPITAL*\n"
            "• Start a new question? → type *RESET*\n"
            "• Something else? Just describe your symptoms again."
        )

    # ── Fallback ─────────────────────────────────
    return NOT_UNDERSTOOD_HI if use_hindi else NOT_UNDERSTOOD_EN
