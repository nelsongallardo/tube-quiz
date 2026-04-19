from html.parser import HTMLParser
from pathlib import Path
import unittest


REPO_ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [REPO_ROOT / "index.html", REPO_ROOT / "docs" / "index.html"]
EMAIL = "nensol85@gmail.com"


class FooterContactParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_footer = False
        self.footer_depth = 0
        self.in_footer_link = False
        self.footer_text = []
        self.link_text = []
        self.link_href = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "footer" and "site-footer" in attrs_dict.get("class", "").split():
            self.in_footer = True
            self.footer_depth = 1
            return

        if self.in_footer:
            self.footer_depth += 1
            if tag == "a" and "footer-link" in attrs_dict.get("class", "").split():
                self.in_footer_link = True
                self.link_href = attrs_dict.get("href")

    def handle_endtag(self, tag):
        if self.in_footer:
            if tag == "a" and self.in_footer_link:
                self.in_footer_link = False
            self.footer_depth -= 1
            if self.footer_depth == 0:
                self.in_footer = False

    def handle_data(self, data):
        if self.in_footer:
            stripped = data.strip()
            if stripped:
                self.footer_text.append(stripped)
                if self.in_footer_link:
                    self.link_text.append(stripped)


class FooterContactTest(unittest.TestCase):
    def test_footer_uses_contact_link_without_showing_email(self):
        for html_path in HTML_FILES:
            with self.subTest(html_path=html_path):
                parser = FooterContactParser()
                parser.feed(html_path.read_text())

                self.assertEqual(parser.link_href, f"mailto:{EMAIL}")
                self.assertEqual(" ".join(parser.link_text), "Contact")
                self.assertNotIn(EMAIL, " ".join(parser.footer_text))

    def test_footer_css_keeps_contact_pinned_to_bottom_edge(self):
        css = (REPO_ROOT / "style.css").read_text()

        self.assertIn("body {", css)
        self.assertIn("padding-bottom: 52px;", css)
        self.assertIn(".site-footer {", css)
        self.assertIn("position: fixed;", css)
        self.assertIn("left: 0;", css)
        self.assertIn("right: 0;", css)
        self.assertIn("bottom: 0;", css)
        self.assertIn("padding: 0 12px env(safe-area-inset-bottom, 0px);", css)


if __name__ == "__main__":
    unittest.main()
