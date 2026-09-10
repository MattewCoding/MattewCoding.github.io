"""Download the IGD course catalogue and write it to data/courses.json.

The scraper intentionally uses only the Python standard library, so it can be
run without installing requests or BeautifulSoup::

    python igd_crawler/igd_courses_info_gatherer.py
    python igd_crawler/igd_courses_info_gatherer.py --source igd_crawler/examples.html

If the website changes its CSS classes, edit only ``CLASSES`` below.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from html.parser import HTMLParser
from pathlib import Path
from typing import Callable, Iterable
from urllib.error import URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


SOURCE_URL = "https://igd.telecom-paris.fr/allcourses.html"
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
    "notice_container": "course-notice-container",
    "notice_label": "course-notice-label",
    "notice": "course-notice",
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
        return " ".join(" ".join(pieces).split())

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

    def all_with_class(self, class_name: str) -> list["Element"]:
        return [node for node in self.descendants() if class_name in node.classes]

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
    rf"(?:\s*(?:-|\bto\b)\s*(?P<end_date>{DATE_PATTERN}))?\s+"
    rf"(?P<start_time>{TIME_PATTERN})\s*-\s*(?P<end_time>{TIME_PATTERN})",
    re.IGNORECASE,
)
WEEK_RE = re.compile(
    rf"\bWeek\b\s+"
    rf"(?P<start_date>{DATE_PATTERN})"
    rf"\s*(?:-|\bto\b)\s*(?P<end_date>{DATE_PATTERN})\s+"
    rf"(?P<start_time>{TIME_PATTERN})\s*-\s*(?P<end_time>{TIME_PATTERN})",
    re.IGNORECASE,
)

ICAL_WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
CALENDAR_URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)
NO_SCHEDULE_MESSAGE = "No schedule has been posted."
UNPARSEABLE_SCHEDULE_MESSAGE = "The posted schedule could not be parsed."


def download_page(url: str) -> str:
    request = Request(
        url,
        headers={"User-Agent": "schedule-maker-course-crawler/1.0"},
    )
    with urlopen(request, timeout=30) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def load_html_source(source: str) -> tuple[str, str]:
    """Load an HTTP(S) page or local fixture and return its base URL."""
    if CALENDAR_URL_RE.fullmatch(source):
        return download_page(source), source

    source_file = Path(source).expanduser().resolve()
    return source_file.read_text(encoding="utf-8"), source_file.as_uri()


def normalize_time(raw_time: str) -> str:
    hours, minutes = re.split(r"[:h]", raw_time.lower())
    return f"{int(hours):02d}:{int(minutes):02d}"


def combine_one_off_slots(slots: list[dict]) -> list[dict]:
    """Combine one-off sessions on the same date without bridging noon."""
    combined: list[dict] = []
    for slot in sorted(slots, key=lambda item: (item["date"], item["startTime"])):
        slot = slot.copy()
        same_half_day = bool(combined) and (
            (combined[-1]["startTime"] < "12:00")
            == (slot["startTime"] < "12:00")
        )
        if combined and combined[-1]["date"] == slot["date"] and same_half_day:
            combined[-1]["endTime"] = max(combined[-1]["endTime"], slot["endTime"])
        else:
            combined.append(slot)
    return combined


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

    # A descriptor such as "Week 16nov-20nov 8h30-17h00" represents a
    # concentrated block course, not a once-per-week recurring course.
    for match in WEEK_RE.finditer(descriptor.replace("–", "-").replace("—", "-")):
        start_date = parse_date(match.group("start_date"), academic_start_year)
        end_date = parse_date(match.group("end_date"), academic_start_year)
        if start_date is None or end_date is None:
            unknown_count += 1
            continue

        current_date = date.fromisoformat(start_date)
        final_date = date.fromisoformat(end_date)
        if final_date < current_date:
            unknown_count += 1
            continue

        start_time = normalize_time(match.group("start_time"))
        end_time = normalize_time(match.group("end_time"))
        while current_date <= final_date:
            schedule["oneOff"].append(
                {
                    "date": current_date.isoformat(),
                    "startTime": start_time,
                    "endTime": end_time,
                }
            )
            current_date += timedelta(days=1)

    schedule["oneOff"] = combine_one_off_slots(schedule["oneOff"])
    if not schedule["recurring"] and not schedule["oneOff"]:
        unknown_count = max(unknown_count, 1)
    if unknown_count:
        schedule["unknown"] = [UNKNOWN] * unknown_count
        schedule["notice"] = UNPARSEABLE_SCHEDULE_MESSAGE
    return schedule


def unfold_ical_lines(calendar_text: str) -> list[str]:
    """Join RFC 5545 continuation lines."""
    unfolded: list[str] = []
    for raw_line in calendar_text.splitlines():
        if raw_line.startswith((" ", "\t")) and unfolded:
            unfolded[-1] += raw_line[1:]
        else:
            unfolded.append(raw_line.rstrip("\r"))
    return unfolded


def parse_ical_datetime(value: str) -> datetime | None:
    value = value.strip().removesuffix("Z")
    for date_format in ("%Y%m%dT%H%M%S", "%Y%m%dT%H%M", "%Y%m%d"):
        try:
            return datetime.strptime(value, date_format)
        except ValueError:
            continue
    return None


def parse_calendar_schedule(calendar_text: str) -> dict:
    """Convert iCalendar events into recurring and exceptional slots.

    Calendar feeds often split a class around a short break. Events on the
    same date that touch or are at most 15 minutes apart are merged. A time
    slot occurring at least twice on one weekday is considered recurring;
    exceptional dates remain one-off sessions.
    """
    raw_events: list[tuple[datetime, datetime]] = []
    event: dict[str, str] | None = None

    for line in unfold_ical_lines(calendar_text):
        if line.upper() == "BEGIN:VEVENT":
            event = {}
            continue
        if line.upper() == "END:VEVENT":
            if event and event.get("STATUS", "").upper() != "CANCELLED":
                start = parse_ical_datetime(event.get("DTSTART", ""))
                end = parse_ical_datetime(event.get("DTEND", ""))
                if start and end and end > start:
                    raw_events.append((start, end))
            event = None
            continue
        if event is not None and ":" in line:
            property_part, value = line.split(":", 1)
            property_name = property_part.split(";", 1)[0].upper()
            event[property_name] = value

    raw_events.sort()
    merged_events: list[list[datetime]] = []
    for start, end in raw_events:
        if (
            merged_events
            and merged_events[-1][0].date() == start.date()
            and start <= merged_events[-1][1] + timedelta(minutes=15)
        ):
            merged_events[-1][1] = max(merged_events[-1][1], end)
        else:
            merged_events.append([start, end])

    occurrences: dict[tuple[int, str, str], list[date]] = defaultdict(list)
    for start, end in merged_events:
        key = (start.weekday(), start.strftime("%H:%M"), end.strftime("%H:%M"))
        occurrences[key].append(start.date())

    schedule: dict[str, list] = {"recurring": [], "oneOff": []}
    for (weekday, start_time, end_time), dates in occurrences.items():
        dates.sort()
        if len(dates) >= 2:
            schedule["recurring"].append(
                {
                    "startDate": dates[0].isoformat(),
                    "endDate": dates[-1].isoformat(),
                    "day": ICAL_WEEKDAYS[weekday],
                    "startTime": start_time,
                    "endTime": end_time,
                }
            )
        else:
            schedule["oneOff"].append(
                {
                    "date": dates[0].isoformat(),
                    "startTime": start_time,
                    "endTime": end_time,
                }
            )

    schedule["recurring"].sort(key=lambda slot: (slot["startDate"], slot["startTime"]))
    schedule["oneOff"] = combine_one_off_slots(schedule["oneOff"])
    if not raw_events:
        schedule["unknown"] = [UNKNOWN]
        schedule["notice"] = UNPARSEABLE_SCHEDULE_MESSAGE
    return schedule


def parse_schedule_descriptor(
    descriptor: str,
    academic_start_year: int,
    calendar_loader: Callable[[str], str] = download_page,
) -> dict:
    descriptor = descriptor.strip()
    if not descriptor or descriptor == UNKNOWN:
        return {"recurring": [], "oneOff": [], "notice": NO_SCHEDULE_MESSAGE}

    if CALENDAR_URL_RE.fullmatch(descriptor):
        try:
            print("    Downloading posted calendar...", flush=True)
            schedule = parse_calendar_schedule(calendar_loader(descriptor))
            event_count = len(schedule["recurring"]) + len(schedule["oneOff"])
            print(f"    Calendar parsed ({event_count} schedule slots).", flush=True)
            return schedule
        except (OSError, ValueError) as error:
            print(f"    Warning: could not download calendar: {error}", flush=True)
            return {
                "recurring": [],
                "oneOff": [],
                "unknown": [UNKNOWN],
                "notice": "The posted calendar could not be downloaded.",
            }

    return parse_schedule(descriptor, academic_start_year)


def required_text(course: Element, class_name: str) -> str:
    element = course.first_with_class(class_name)
    return element.text() if element else UNKNOWN


def course_notices(course: Element) -> list[str]:
    notices: list[str] = []
    for notice_container in course.all_with_class(CLASSES["notice_container"]):
        label = notice_container.first_with_class(CLASSES["notice_label"])
        notice = notice_container.first_with_class(CLASSES["notice"])
        label_text = label.text() if label else ""
        notice_text = notice.text() if notice else notice_container.text()
        if label_text and notice_text:
            notices.append(f"{label_text}: {notice_text}")
        elif notice_text:
            notices.append(notice_text)
    return notices


def course_description(course: Element) -> str:
    summary = course.first_with_class(CLASSES["summary"])
    return summary.text() if summary and summary.text() else UNKNOWN


def course_is_cancelled(course: Element) -> bool:
    notices = course.all_with_class(CLASSES["notice_container"])
    return any(re.search(r"\bcancel(?:led|ed)\b", notice.text(), re.IGNORECASE) for notice in notices)


def parse_ects(info_text: str) -> float | str:
    first_word = info_text.split(maxsplit=1)[0] if info_text else ""
    try:
        return float(first_word.replace(",", "."))
    except ValueError:
        return UNKNOWN


def scrape_courses(
    html: str,
    calendar_loader: Callable[[str], str] = download_page,
    base_url: str = SOURCE_URL,
) -> list[dict]:
    parser = DOMParser()
    parser.feed(html)
    parser.close()

    course_elements = [
        node for node in parser.root.descendants()
        if CLASSES["course"] in node.classes
    ]
    schedule_texts = []
    for course in course_elements:
        schedule_element = course.first_with_class(CLASSES["schedule"])
        schedule_texts.append(schedule_element.text() if schedule_element else "")
    academic_start_year = infer_academic_start_year(schedule_texts)
    print(f"Found {len(course_elements)} course entries.", flush=True)

    courses = []
    seen_course_ids: set[str] = set()
    for position, (course, schedule_text) in enumerate(
        zip(course_elements, schedule_texts),
        start=1,
    ):
        course_id = required_text(course, CLASSES["course_id"])
        if course_is_cancelled(course):
            print(
                f"[{position}/{len(course_elements)}] Skipping cancelled course {course_id}.",
                flush=True,
            )
            continue

        if course_id in seen_course_ids:
            print(
                f"[{position}/{len(course_elements)}] Skipping duplicate course {course_id}.",
                flush=True,
            )
            continue
        seen_course_ids.add(course_id)

        course_name = required_text(course, CLASSES["title"])
        print(
            f"[{position}/{len(course_elements)}] Parsing {course_id}: {course_name}",
            flush=True,
        )

        info = course.first_with_class(CLASSES["info"])
        info_text = info.text() if info else ""
        website_link = info.first_tag("a") if info else None
        href = website_link.attrs.get("href", "").strip() if website_link else ""

        courses.append(
            {
                "ects": parse_ects(info_text),
                "newCourseId": course_id,
                "name": course_name,
                "notices": course_notices(course),
                "description": course_description(course),
                "url": urljoin(base_url, href) if href else NO_URL,
                "schedule": parse_schedule_descriptor(
                    schedule_text,
                    academic_start_year,
                    calendar_loader,
                ),
            }
        )
    return courses


def write_courses(downloaded_courses: list[dict], output_file: Path = OUTPUT_FILE) -> None:
    courses = downloaded_courses
    if ADD_TO_EXISTING_COURSES and output_file.exists():
        with output_file.open("r", encoding="utf-8") as file:
            existing_courses = json.load(file)
        if not isinstance(existing_courses, list):
            raise ValueError(f"{output_file} must contain a JSON array")
        courses = existing_courses + downloaded_courses

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with output_file.open("w", encoding="utf-8") as file:
        json.dump(courses, file, ensure_ascii=False, indent=4)
        file.write("\n")


def main() -> None:
    argument_parser = argparse.ArgumentParser(description=__doc__)
    argument_parser.add_argument(
        "--source",
        default=SOURCE_URL,
        help="HTTP(S) course page or local HTML file (default: %(default)s)",
    )
    argument_parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_FILE,
        help="JSON destination (default: %(default)s)",
    )
    arguments = argument_parser.parse_args()

    print(f"Loading course data from {arguments.source}...", flush=True)
    try:
        html, base_url = load_html_source(arguments.source)
    except URLError as error:
        reason = getattr(error, "reason", error)
        raise SystemExit(
            f"Could not download {arguments.source}: {reason}\n"
            "Check your internet/DNS connection, or parse a local file with "
            "--source igd_crawler/examples.html"
        ) from None
    except OSError as error:
        raise SystemExit(f"Could not read {arguments.source}: {error}") from None

    courses = scrape_courses(html, base_url=base_url)
    if not courses:
        raise SystemExit("No courses were found. Check the source and the values in CLASSES.")
    print(f"Writing {len(courses)} courses to {arguments.output}...", flush=True)
    write_courses(courses, arguments.output)
    action = "Appended" if ADD_TO_EXISTING_COURSES else "Wrote"
    print(f"{action} {len(courses)} courses to {arguments.output}")


if __name__ == "__main__":
    main()
