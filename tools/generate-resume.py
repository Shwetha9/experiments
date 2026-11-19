"""Generate the downloadable resume and editable Markdown from the website's content.

Run with a Python interpreter that has reportlab installed:
    python3 tools/generate-resume.py
"""

import json
from pathlib import Path
from shutil import copyfile
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "libs/editorial-content/src/lib/resume-content.json"
OUTPUT = ROOT / "output/pdf"
data = json.loads(CONTENT.read_text())
OUTPUT.mkdir(parents=True, exist_ok=True)

INK = colors.HexColor("#13231f")
GREEN = colors.HexColor("#386655")
MUTED = colors.HexColor("#47574f")
LINE = colors.HexColor("#c8d4ce")
styles = getSampleStyleSheet()
styles.add(ParagraphStyle("Name", fontName="Helvetica-Bold", fontSize=29, leading=33, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle("Target", fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=GREEN, spaceAfter=6))
styles.add(ParagraphStyle("Headline", fontName="Helvetica-Bold", fontSize=10.7, leading=15, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle("Contact", fontName="Helvetica", fontSize=9, leading=13, textColor=MUTED, spaceAfter=3))
styles.add(ParagraphStyle("Section", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=GREEN, spaceBefore=12, spaceAfter=6, keepWithNext=True))
styles.add(ParagraphStyle("Company", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=INK, spaceAfter=4, keepWithNext=True))
styles.add(ParagraphStyle("Role", fontName="Helvetica", fontSize=9.5, leading=13, textColor=INK, spaceAfter=3, keepWithNext=True))
styles.add(ParagraphStyle("Copy", fontName="Helvetica", fontSize=10, leading=13.7, textColor=INK, spaceAfter=5, alignment=TA_LEFT))
styles.add(ParagraphStyle("BulletCopy", parent=styles["Copy"], leftIndent=10, firstLineIndent=-9, spaceAfter=5))
styles.add(ParagraphStyle("SmallCopy", parent=styles["Copy"], fontSize=9.3, leading=12.5, spaceAfter=4))
styles.add(ParagraphStyle("HistoryCompany", parent=styles["Company"], fontSize=10.2, leading=13, spaceAfter=1))
styles.add(ParagraphStyle("HistoryRole", parent=styles["Role"], fontSize=9.3, leading=12, spaceAfter=2, keepWithNext=False))


def para(value, style="Copy"):
    return Paragraph(escape(value), styles[style])


def link(label, url):
    return f'<link href="{escape(url, {chr(34): "&quot;"})}" color="#386655">{escape(label)}</link>'


def bullet(value):
    return Paragraph("- " + escape(value), styles["BulletCopy"])


def section(label):
    return para(label.upper(), "Section")


def history_blocks(roles):
    for role in roles:
        block = [
            para(role["company"], "HistoryCompany"),
            para(role["title"] + " | " + role["dates"], "HistoryRole"),
        ]
        if role["detail"]:
            block.append(para(role["detail"], "SmallCopy"))
        block.append(Spacer(1, 4))
        yield KeepTogether(block)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(42, 35, A4[0] - 42, 35)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(42, 23, data["name"] + " | shwetha9.com")
    canvas.drawRightString(A4[0] - 42, 23, str(doc.page))
    canvas.restoreState()


story = [
    para(data["name"], "Name"),
    para("Target role: " + data["targetRole"], "Target"),
    para(data["headline"], "Headline"),
    Paragraph(escape(data["location"]) + " | " + link(data["email"], "mailto:" + data["email"])
              + " | " + link("shwetha9.com", data["website"]), styles["Contact"]),
    Paragraph(link("linkedin.com/in/shwetha-anand", data["linkedin"]), styles["Contact"]),
    Spacer(1, 9),
    HRFlowable(width="100%", thickness=1.2, color=GREEN),
    section("Profile"),
    para(data["summary"]),
    section("Current experience"),
    para(data["currentExperience"]["company"], "Company"),
]
for role in data["currentExperience"]["roles"]:
    story.append(para(role["title"] + " | " + role["dates"], "Role"))
story.append(Spacer(1, 3))
story.extend(bullet(item) for item in data["currentExperience"]["bullets"])
story.append(section("Previous experience"))
story.extend(history_blocks(data["previousExperience"][:4]))
story.append(section("Technical skills"))
for skill in data["skills"]:
    story.append(Paragraph("<b>" + escape(skill["title"]) + ":</b> " + escape(skill["detail"]), styles["SmallCopy"]))

story.append(PageBreak())
story.append(para(data["name"] + " | Earlier experience & qualifications", "Headline"))
story.append(section("Earlier experience"))
story.extend(history_blocks(data["previousExperience"][4:]))

story.append(section("Education"))
for item in data["education"]:
    story.append(Paragraph("<b>" + escape(item["qualification"]) + "</b><br/>"
                           + escape(item["institution"]) + " | " + escape(item["dates"]), styles["SmallCopy"]))
story.append(section("Certifications"))
story.extend(para(item, "SmallCopy") for item in data["certifications"])
story.append(section("Languages"))
story.append(para(", ".join(data["languages"]), "SmallCopy"))

pdf_path = OUTPUT / "shwetha-anand-resume.pdf"
doc = SimpleDocTemplate(str(pdf_path), pagesize=A4, topMargin=35, bottomMargin=47,
                        leftMargin=42, rightMargin=42, title=data["name"] + " - Resume",
                        author=data["name"], subject="Target role: " + data["targetRole"])
doc.build(story, onFirstPage=footer, onLaterPages=footer)
public_path = ROOT / "apps/studio/public/files/shwetha-anand-resume.pdf"
public_path.parent.mkdir(parents=True, exist_ok=True)
copyfile(pdf_path, public_path)

md = ["# " + data["name"], "", "**Target role: " + data["targetRole"] + "**", "", data["headline"], "",
      data["location"] + " | " + data["email"], "", data["website"] + " | " + data["linkedin"], "",
      "## Profile", "", data["summary"], "", "## What I bring", ""]
md.extend("- **" + item["title"] + ":** " + item["detail"] for item in data["strengths"])
md.extend(["", "## Current experience", "", "### " + data["currentExperience"]["company"], ""])
md.extend("- **" + role["title"] + "** | " + role["dates"] for role in data["currentExperience"]["roles"])
md.append("")
md.extend("- " + item for item in data["currentExperience"]["bullets"])
md.extend(["", "## Previous experience", ""])
for role in data["previousExperience"]:
    md.extend(["### " + role["company"], "", "**" + role["title"] + "** | " + role["dates"], ""])
    if role["detail"]:
        md.extend([role["detail"], ""])
md.extend(["## Technical skills", ""])
md.extend("- **" + item["title"] + ":** " + item["detail"] for item in data["skills"])
md.extend(["", "## Education", ""])
md.extend("- **" + item["qualification"] + "**, " + item["institution"] + " | " + item["dates"] for item in data["education"])
md.extend(["", "## Certifications", ""])
md.extend("- " + item for item in data["certifications"])
md.extend(["", "## Languages", "", ", ".join(data["languages"]), ""])
(OUTPUT / "shwetha-anand-resume.md").write_text("\n".join(md))
print(pdf_path)
print(public_path)
