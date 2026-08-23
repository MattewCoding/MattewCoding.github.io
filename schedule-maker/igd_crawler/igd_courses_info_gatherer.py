"""Download the IGD course catalogue and write it to data/courses.json.

The scraper intentionally uses only the Python standard library, so it can be
run without installing requests or BeautifulSoup::

    python igd_crawler/igd_courses_info_gatherer.py

If the website changes its CSS classes, edit only ``CLASSES`` below.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin
from urllib.request import Request, urlopen


SOURCE_URL = "https://web.archive.org/web/20260116042313/https://igd.telecom-paris.fr/allcourses.html"
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "data" / "courses.json"

# Set this to True to keep the current JSON entries and append the downloaded
# courses. False completely replaces the contents of courses.json.
ADD_TO_EXISTING_COURSES = False

# All website-specific class names are kept here for easy future maintenance.
CLASSES = {
    "course": "course",
    "course_id": "course-id",
    "title": "course-title",
    "info": "course-info",
    "summary": "course-summary",
    "schedule": "course-schedule-descriptor",
}

NO_URL = "no url lol"
UNKNOWN = "UNKNOWN"


@dataclass
class Element:
    """A deliberately small DOM node, sufficient for this scraper."""

    tag: str
    attrs: dict[str, str] = field(default_factory=dict)
    children: list["Element | str"] = field(default_factory=list)

    @property
    def classes(self) -> set[str]:
        return set(self.attrs.get("class", "").split())

    def text(self) -> str:
        pieces: list[str] = []

        def collect(node: Element | str) -> None:
            if isinstance(node, str):
                pieces.append(node)
            else:
                for child in node.children:
                    collect(child)

        collect(self)
        return " ".join("".join(pieces).split())

    def descendants(self) -> Iterable["Element"]:
        for child in self.children:
            if isinstance(child, Element):
                yield child
                yield from child.descendants()

    def first_with_class(self, class_name: str) -> "Element | None":
        return next(
            (node for node in self.descendants() if class_name in node.classes),
            None,
        )

    def first_tag(self, tag: str) -> "Element | None":
        return next((node for node in self.descendants() if node.tag == tag), None)


class DOMParser(HTMLParser):
    """Turn the page into a tiny DOM without third-party dependencies."""

    VOID_TAGS = {
        "area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Element("document")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Element(tag.lower(), {key: value or "" for key, value in attrs})
        self.stack[-1].children.append(node)
        if tag.lower() not in self.VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() not in self.VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data: str) -> None:
        self.stack[-1].children.append(data)


DAY_NAMES = {
    "mon": "Monday", "monday": "Monday", "mondays": "Monday",
    "tue": "Tuesday", "tues": "Tuesday", "tuesday": "Tuesday", "tuesdays": "Tuesday",
    "wed": "Wednesday", "weds": "Wednesday", "wednesday": "Wednesday", "wednesdays": "Wednesday",
    "thu": "Thursday", "thur": "Thursday", "thurs": "Thursday", "thursday": "Thursday", "thursdays": "Thursday",
    "fri": "Friday", "friday": "Friday", "fridays": "Friday",
    "sat": "Saturday", "saturday": "Saturday", "saturdays": "Saturday",
    "sun": "Sunday", "sunday": "Sunday", "sundays": "Sunday",
}

MONTH_NAMES = {
    "jan": 1, "january": 1,
    "feb": 2, "fev": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4, "avr": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

DAY_PATTERN = "|".join(sorted(DAY_NAMES, key=len, reverse=True))
DATE_PATTERN = r"(?:\d{1,2}/(?:\d{1,2}|[A-Za-z]+)(?:/\d{2,4})?|\d{1,2}[A-Za-z]+)"
TIME_PATTERN = r"\d{1,2}(?::|h)\d{1,2}"
SLOT_RE = re.compile(
    rf"\b(?P<day>{DAY_PATTERN})\b\s+"
    rf"(?P<start_date>{DATE_PATTERN})"
    rf"(?:\s*-\s*(?P<end_date>{DATE_PATTERN}))?\s+"
    rf"(?P<start_time>{TIME_PATTERN})\s*-\s*(?P<end_time>{TIME_PATTERN})",
    re.IGNORECASE,
)


def download_page(url: str) -> str:
    request = Request(
        url,
        headers={"User-Agent": "schedule-maker-course-crawler/1.0"},
    )
    with urlopen(request, timeout=30) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def normalize_time(raw_time: str) -> str:
    hours, minutes = re.split(r"[:h]", raw_time.lower())
    return f"{int(hours):02d}:{int(minutes):02d}"


def infer_academic_start_year(schedule_texts: Iterable[str]) -> int:
    """Use an explicit page year, falling back to the current academic year."""
    for text in schedule_texts:
        match = re.search(r"\b\d{1,2}/\d{1,2}/(\d{4})\b", text)
        if match:
            year = int(match.group(1))
            # Jan-Aug belongs to the second half of an academic year.
            month_match = re.search(r"\b\d{1,2}/(\d{1,2})/\d{4}\b", match.group(0))
            month = int(month_match.group(1)) if month_match else 9
            return year if month >= 9 else year - 1

    today = date.today()
    return today.year if today.month >= 9 else today.year - 1


def parse_date(raw_date: str, academic_start_year: int) -> str | None:
    value = raw_date.strip().lower()
    match = re.fullmatch(r"(\d{1,2})/(\d{1,2}|[a-z]+)(?:/(\d{2,4}))?", value)
    if not match:
        match = re.fullmatch(r"(\d{1,2})([a-z]+)", value)
    if not match:
        return None

    day = int(match.group(1))
    month_value = match.group(2)
    month = int(month_value) if month_value.isdigit() else MONTH_NAMES.get(month_value)
    if month is None:
        return None

    explicit_year = match.group(3) if match.lastindex and match.lastindex >= 3 else None
    if explicit_year:
        year = int(explicit_year)
        if year < 100:
            year += 2000
    else:
        year = academic_start_year if month >= 9 else academic_start_year + 1

    try:
        return date(year, month, day).isoformat()
    except ValueError:
        return None


def parse_schedule(descriptor: str, academic_start_year: int) -> dict:
    schedule: dict[str, list] = {"recurring": [], "oneOff": []}
    unknown_count = 0

    # Searching globally is more tolerant than relying on exactly three prefix
    # characters or on one particular capitalization of the word "and".
    for match in SLOT_RE.finditer(descriptor.replace("–", "-").replace("—", "-")):
        start_date = parse_date(match.group("start_date"), academic_start_year)
        end_date_raw = match.group("end_date")
        end_date = parse_date(end_date_raw, academic_start_year) if end_date_raw else None
        start_time = normalize_time(match.group("start_time"))
        end_time = normalize_time(match.group("end_time"))

        if start_date is None or (end_date_raw and end_date is None):
            unknown_count += 1
            continue

        if end_date_raw:
            schedule["recurring"].append(
                {
                    "startDate": start_date,
                    "endDate": end_date,
                    "day": DAY_NAMES[match.group("day").lower()],
                    "startTime": start_time,
                    "endTime": end_time,
                }
            )
        else:
            schedule["oneOff"].append(
                {
                    "date": start_date,
                    "startTime": start_time,
                    "endTime": end_time,
                }
            )

    if not schedule["recurring"] and not schedule["oneOff"]:
        unknown_count = max(unknown_count, 1)
    if unknown_count:
        schedule["unknown"] = [UNKNOWN] * unknown_count
    return schedule


def required_text(course: Element, class_name: str) -> str:
    element = course.first_with_class(class_name)
    return element.text() if element else UNKNOWN


def parse_ects(info_text: str) -> float | str:
    first_word = info_text.split(maxsplit=1)[0] if info_text else ""
    try:
        return float(first_word.replace(",", "."))
    except ValueError:
        return UNKNOWN


def scrape_courses(html: str) -> list[dict]:
    parser = DOMParser()
    parser.feed(html)
    parser.close()

    course_elements = [
        node for node in parser.root.descendants()
        if CLASSES["course"] in node.classes
    ]
    schedule_texts = [required_text(course, CLASSES["schedule"]) for course in course_elements]
    academic_start_year = infer_academic_start_year(schedule_texts)

    courses = []
    for course, schedule_text in zip(course_elements, schedule_texts):
        info = course.first_with_class(CLASSES["info"])
        info_text = info.text() if info else ""
        website_link = info.first_tag("a") if info else None
        href = website_link.attrs.get("href", "").strip() if website_link else ""

        courses.append(
            {
                "ects": parse_ects(info_text),
                "newCourseId": required_text(course, CLASSES["course_id"]),
                "name": required_text(course, CLASSES["title"]),
                "description": required_text(course, CLASSES["summary"]),
                "url": urljoin(SOURCE_URL, href) if href else NO_URL,
                "schedule": parse_schedule(schedule_text, academic_start_year),
            }
        )
    return courses


def write_courses(downloaded_courses: list[dict]) -> None:
    courses = downloaded_courses
    if ADD_TO_EXISTING_COURSES and OUTPUT_FILE.exists():
        with OUTPUT_FILE.open("r", encoding="utf-8") as file:
            existing_courses = json.load(file)
        if not isinstance(existing_courses, list):
            raise ValueError(f"{OUTPUT_FILE} must contain a JSON array")
        courses = existing_courses + downloaded_courses

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(courses, file, ensure_ascii=False, indent=4)
        file.write("\n")


def main() -> None:
    courses = scrape_courses(download_page(SOURCE_URL))
    if not courses:
        raise RuntimeError(
            "No courses were found. Check SOURCE_URL and the values in CLASSES."
        )
    write_courses(courses)
    action = "Appended" if ADD_TO_EXISTING_COURSES else "Wrote"
    print(f"{action} {len(courses)} courses to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
