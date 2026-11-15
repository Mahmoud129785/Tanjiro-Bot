#!/usr/bin/env python3
"""Render the Tanjiro Arabic pairing tutorial from the self-contained HTML source."""
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "tools" / "tutorial-video.html"
MEDIA = ROOT / "public" / "media"
FRAMES = Path("/tmp/tanjiro-tutorial-frames")
OUTPUT = MEDIA / "copy-and-link-tanjiro.mp4"
POSTER = MEDIA / "tutorial-poster.jpg"
SCENES = [
    ("intro", 4.0),
    ("number", 4.1),
    ("request", 4.2),
    ("copy", 4.4),
    ("linked", 5.1),
    ("phonecode", 5.4),
    ("success", 4.6),
]
FPS = 30
FADE = 0.4


def run(command):
    subprocess.run(command, check=True)


def main():
    MEDIA.mkdir(parents=True, exist_ok=True)
    FRAMES.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 720, "height": 1280}, device_scale_factor=1)
        page.goto(HTML.as_uri(), wait_until="load")
        page.evaluate("document.fonts.ready")
        for name, _duration in SCENES:
            page.evaluate("name => window.renderTutorialScene(name)", name)
            page.wait_for_timeout(80)
            page.screenshot(path=str(FRAMES / f"{name}.png"), animations="disabled")
        browser.close()

    clips = []
    for index, (name, duration) in enumerate(SCENES):
        clip = FRAMES / f"clip-{index:02d}.mp4"
        frames = round(duration * FPS)
        zoom = "1.025" if index % 2 == 0 else "1.018"
        run([
            "ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-i", str(FRAMES / f"{name}.png"),
            "-vf", f"zoompan=z='min(zoom+0.00012,{zoom})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=720x1280:fps={FPS},format=yuv420p",
            "-frames:v", str(frames), "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "22", str(clip)
        ])
        clips.append(clip)

    inputs = []
    for clip in clips:
        inputs += ["-i", str(clip)]
    filters = []
    previous = "[0:v]"
    offset = SCENES[0][1] - FADE
    for i in range(1, len(SCENES)):
        out = f"[v{i}]"
        filters.append(f"{previous}[{i}:v]xfade=transition=fade:duration={FADE}:offset={offset:.3f}{out}")
        previous = out
        offset += SCENES[i][1] - FADE
    run([
        "ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", previous,
        "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(OUTPUT)
    ])
    run(["ffmpeg", "-y", "-ss", "0.5", "-i", str(OUTPUT), "-frames:v", "1", "-q:v", "2", str(POSTER)])
    print(f"Rendered {OUTPUT}")
    print(f"Poster {POSTER}")


if __name__ == "__main__":
    main()
