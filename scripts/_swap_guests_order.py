from pathlib import Path

path = Path(__file__).resolve().parents[1] / "src" / "WeddingPlannerApp.jsx"
text = path.read_text(encoding="utf-8")
marker = "function GuestsPanel("
i = text.index(marker)
sub = text[i:]
r0 = sub.index("  return (\n    <section className=\"space-y-8\">")
# RSVP outer: first div relative overflow-hidden ... until blank line before guest flex justify-between
gap = "\n\n      <div className=\"flex justify-between gap-4\">"
pos_gap = sub.index(gap)
rsvp_block = sub[r0 + len("  return (\n    <section className=\"space-y-8\">\n      ") : pos_gap]
# guest: from gap's guest div through table wrapper closing </div> before final </section>
guest_start = pos_gap + len("\n\n      ")
sec_close = sub.index("\n    </section>\n  );", guest_start)
guest_block = sub[guest_start:sec_close]
new_inner = guest_block.rstrip() + "\n\n      " + rsvp_block.rstrip()
new_return = "  return (\n    <section className=\"space-y-8\">\n      " + new_inner + "\n    </section>\n  );"
old_return_start = sub.index("  return (\n    <section className=\"space-y-8\">")
old_return_end = sub.index("\n    </section>\n  );", old_return_start) + len("\n    </section>\n  );")
old_return = sub[old_return_start:old_return_end]
assert old_return != new_return
path.write_text(text[: i + old_return_start] + new_return + text[i + old_return_end :], encoding="utf-8")
print("OK: swapped GuestsPanel order")
