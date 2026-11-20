#!/usr/bin/env python3
"""Capture frames from Three.js scene using Playwright"""
import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright

async def capture_frames(scene_html, output_dir, duration=80, fps=30, width=1080, height=1920):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    total_frames = duration * fps
    frame_duration = 1.0 / fps
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--use-angle=swiftshader',
                '--enable-unsafe-swiftshader',
                '--ignore-gpu-blocklist',
                '--disable-gpu-sandbox',
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ]
        )
        
        page = await browser.new_page()
        await page.set_viewport_size({"width": width, "height": height})
        
        # Listen for console messages
        page.on("console", lambda msg: print(f"BROWSER: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err.message}"))
        
        scene_html_str = str(scene_html)
        if scene_html_str.startswith("http://") or scene_html_str.startswith("https://"):
            file_url = scene_html_str
        else:
            file_url = f"file:///{Path(scene_html_str).absolute().as_posix()}"
        print(f"Loading: {file_url}")
        await page.goto(file_url, wait_until="networkidle", timeout=120000)
        
        # Wait for models to load
        await page.wait_for_timeout(5000)
        
        # Check if scene is ready
        ready = await page.evaluate("() => window.models && window.models.size > 0")
        print(f"Models loaded: {ready}")
        
        if not ready:
            await page.wait_for_timeout(10000)
        
        print(f"Capturing {total_frames} frames...")
        
        for frame in range(total_frames):
            # Wait for frame time
            await page.wait_for_timeout(int(frame_duration * 1000))
            
            # Capture frame
            filename = f"frame_{frame:06d}.png"
            filepath = output_dir / filename
            
            await page.screenshot(path=str(filepath), type='png', full_page=False)
            
            if frame % 30 == 0:
                print(f"  Frame {frame}/{total_frames} ({frame/total_frames*100:.1f}%)")
        
        await browser.close()
        print(f"Capture complete: {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python capture_threejs.py <scene_html> <output_dir> [duration] [fps] [width] [height]")
        sys.exit(1)
    
    scene_html = sys.argv[1]  # Keep as string for URLs
    output_dir = Path(sys.argv[2])
    duration = int(sys.argv[3]) if len(sys.argv) > 3 else 80
    fps = int(sys.argv[4]) if len(sys.argv) > 4 else 30
    width = int(sys.argv[5]) if len(sys.argv) > 5 else 1080
    height = int(sys.argv[6]) if len(sys.argv) > 6 else 1920
    
    asyncio.run(capture_frames(scene_html, output_dir, duration, fps, width, height))