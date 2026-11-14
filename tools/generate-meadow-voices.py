"""Regenerate Moonbeam Meadow's fixed narration with one consistent voice.

Reads the local .env key without putting it in a command line or client bundle.
The committed MP3s let every visitor hear the story without consuming API credits.
"""

from pathlib import Path
import json
import os
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'apps/studio/public/audio/meadow'
VOICE_ID = 'XEQBC9sleaE3f5ff82UR'  # Charlotte, a warm Australian female voice
SCRIPT = ROOT / 'apps/studio/src/app/meadow/meadow-story.json'


def read_key():
    key = os.environ.get('ELEVENLABS_API_KEY') or os.environ.get('elevenlabs_api_key')
    if key:
        return key
    for line in (ROOT / '.env').read_text().splitlines():
        name, _, value = line.partition('=')
        if name.strip().lower() == 'elevenlabs_api_key':
            return value.strip().strip('"\'')
    raise RuntimeError('Set ELEVENLABS_API_KEY or elevenlabs_api_key in the local .env file.')


def main():
    key = read_key()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    lines = json.loads(SCRIPT.read_text())['lines']
    with tempfile.TemporaryDirectory(prefix='meadow-narration-') as temporary:
        staged = Path(temporary)
        for line_id, line in lines.items():
            destination = staged / f'{line_id}.mp3'
            body = json.dumps({
                'text': line,
                'model_id': 'eleven_flash_v2_5',
                'voice_settings': {'stability': 0.48, 'similarity_boost': 0.78},
            }).encode()
            request = urllib.request.Request(
                f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_22050_32',
                data=body,
                headers={'xi-api-key': key, 'Content-Type': 'application/json'},
                method='POST',
            )
            with urllib.request.urlopen(request, timeout=45) as response:
                audio = response.read()
            if len(audio) < 1000:
                raise RuntimeError(f'Unexpectedly short audio for {line_id}')
            destination.write_bytes(audio)
            print(f'Staged {destination.name}', flush=True)
        for file in staged.glob('*.mp3'):
            file.replace(OUTPUT / file.name)
    print(f'Published {len(lines)} clips with one female Australian narrator.')


if __name__ == '__main__':
    main()
