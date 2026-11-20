#!/usr/bin/env python3
"""
Audio Assembly Script for D.B. Cooper Short
Creates 50-second soundtrack from music + SFX
"""
import subprocess
import os

PROJECT_DIR = r"C:\Users\Roberth 2\Desktop\Gilmer\Creación de videos con IA\projects\db-cooper"
AUDIO_DIR = os.path.join(PROJECT_DIR, "audio")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "exports")

# SFX timeline: (start_seconds, sfx_file, volume_db)
# Available SFX: bend, boot, clang, crate, ding, music, night, pan, pop, rock, sit, tree, whoosh
SFX_TIMELINE = [
    # Shot 1: Airport (0-5s)
    (0.5, "night.mp3", -10),     # Rain ambience (use night as ambient)
    (1.0, "boot.mp3", -6),       # Footsteps
    (3.0, "crate.mp3", -8),      # Briefcase click
    
    # Shot 2: Takeoff (5-10s)
    (5.5, "rock.mp3", -6),       # Jet engine spool
    (6.0, "crate.mp3", -10),     # Gear thunk
    (7.0, "whoosh.mp3", -8),     # Wind rush
    
    # Shot 3: The Note (10-15s)
    (10.5, "crate.mp3", -6),     # Paper whisper (use crate)
    (11.5, "pop.mp3", -8),       # Sharp intake
    (12.5, "crate.mp3", -6),     # Briefcase latch
    (13.0, "night.mp3", -12),    # Ominous tone
    
    # Shot 4: Hijack (15-20s)
    (15.5, "ding.mp3", -8),      # Cockpit switches
    (16.5, "crate.mp3", -10),    # Radio static
    (17.5, "rock.mp3", -10),     # Pen on paper
    (18.5, "ding.mp3", -8),      # Altitude chime
    
    # Shot 5: Money (20-25s)
    (20.5, "night.mp3", -8),     # Rain on tarmac
    (21.5, "rock.mp3", -6),      # Diesel engine
    (22.0, "crate.mp3", -6),     # Bag thud
    (22.5, "crate.mp3", -6),     # Bills flutter
    (23.5, "crate.mp3", -6),     # Zipper
    
    # Shot 6: Second Takeoff (25-30s)
    (25.5, "rock.mp3", -4),      # Full throttle
    (26.0, "crate.mp3", -6),     # Gear retraction
    (27.0, "whoosh.mp3", -6),    # Wind noise increase
    (28.0, "pop.mp3", -8),       # Cabin pressure pop
    
    # Shot 7: The Jump (30-35s) - CLIMAX
    (30.5, "whoosh.mp3", 0),     # Deafening wind
    (31.0, "clang.mp3", -4),     # Metal stairs
    (32.0, "pop.mp3", 0),        # Parachute snap-crack-WHUMP
    (33.0, "whoosh.mp3", -4),    # Jet fade
    
    # Shot 8: Forest (35-40s)
    (35.5, "night.mp3", -6),     # Rain on needles
    (36.5, "tree.mp3", -8),      # Wind in trees
    (37.5, "crate.mp3", -8),     # Parachute settle
    (38.5, "night.mp3", -10),    # Distant owl
    
    # Shot 9: Evidence (40-45s)
    (40.5, "ding.mp3", -6),      # Camera shutter
    (41.5, "crate.mp3", -8),     # Paper shuffle
    (42.5, "rock.mp3", -10),     # Pin tap
    (43.5, "night.mp3", -12),    # UV hum
    (44.5, "crate.mp3", -8),     # Page turn
    
    # Shot 10: Finale (45-50s)
    (45.5, "rock.mp3", -8),      # Jet cruise hum
    (48.0, "ding.mp3", 0),       # Final piano note
    (49.5, "crate.mp3", 0),      # Final sub-bass thud
]

def build_ffmpeg_filter():
    """Build FFmpeg filter_complex for mixing music + SFX."""
    filter_parts = []
    input_idx = 0
    
    # Input 0: music.mp3
    # Trim/loop to 50 seconds
    filter_parts.append("[0:a]aloop=loop=-1:size=2e+06,atrim=0:50,volume=0.7[a_music]")
    
    # Add each SFX as separate input
    for i, (start, sfx_file, vol_db) in enumerate(SFX_TIMELINE):
        input_idx += 1
        # Volume: convert dB to linear (FFmpeg volume filter uses linear)
        # 0 dB = 1.0, -6 dB = 0.5, -10 dB = 0.316
        vol_linear = 10 ** (vol_db / 20.0)
        filter_parts.append(f"[{input_idx}:a]adelay={int(start*1000)}|{int(start*1000)},volume={vol_linear}[sfx{i}]")
    
    # Mix all SFX together
    sfx_labels = "".join([f"[sfx{i}]" for i in range(len(SFX_TIMELINE))])
    filter_parts.append(f"{sfx_labels}amix=inputs={len(SFX_TIMELINE)}:duration=first:dropout_transition=0[a_sfx]")
    
    # Final mix: music + sfx
    filter_parts.append("[a_music][a_sfx]amix=inputs=2:duration=first:dropout_transition=0[a_out]")
    
    return ";".join(filter_parts)

def main():
    # Build input files list
    inputs = ["-i", os.path.join(AUDIO_DIR, "music.mp3")]
    for _, sfx_file, _ in SFX_TIMELINE:
        inputs.extend(["-i", os.path.join(AUDIO_DIR, sfx_file)])
    
    # Build filter
    filter_complex = build_ffmpeg_filter()
    
    # Output
    output_file = os.path.join(OUTPUT_DIR, "db_cooper_soundtrack.wav")
    
    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[a_out]",
        "-c:a", "pcm_s16le",  # Uncompressed WAV for quality
        "-ar", "48000",
        "-ac", "2",
        output_file
    ]
    
    print("Building soundtrack...")
    print(f"Command: {' '.join(cmd[:10])}... (truncated)")
    
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    
    if result.returncode == 0:
        print(f"Success! Soundtrack saved to: {output_file}")
    else:
        print(f"Error: {result.stderr}")
        return False
    
    return True

if __name__ == "__main__":
    main()