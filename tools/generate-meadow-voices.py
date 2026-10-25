"""Regenerate the eight fixed Moonbeam Meadow story clips with ElevenLabs.

Reads the local .env key without putting it in a command line or client bundle.
The committed MP3s let every visitor hear the story without consuming API credits.
"""

from pathlib import Path
import json
import os
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'apps/studio/public/audio/meadow'
VOICE_ID = 'cgSgspJ2msm6clMCkdW9'  # Jessica, a premade playful voice
LINES = (
    'At dawn, the Moonbeam Map disappeared from the village observatory. Without it, the paths between the sky islands are fading.',
    'A tiny paper star flutters out of the window. It points toward Blossom Field. Find the blue gem to wake your wings, then follow the trail!',
    'The brook is unusually quiet. Its silver bell is trapped under a spell, and the fish have forgotten the way home.',
    'The torn map corner glows. Search the bank, gather a flying gem, and discover what the bell is trying to tell you.',
    'Snow is falling upward around the tower. Inside, someone has borrowed the stars to light a lonely room.',
    'A winged pony can cross the clouds, but only after finding the blue gem. Look for clues before you decide what to do.',
    'The last piece of the Moonbeam Map waits beyond Rainbow Hollow. The castle gate opens only for someone who brings a friend.',
    'Your clothes, your courage, and the friends you helped brought you here. Find the gem, claim the final treasures, and make the sky whole.',
)


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
    for index, line in enumerate(LINES):
        episode, scene = divmod(index, 2)
        destination = OUTPUT / f'episode-{episode + 1}-{scene + 1}.mp3'
        if destination.exists():
            print(f'Keeping {destination.name}')
            continue
        body = json.dumps({
            'text': line,
            'model_id': 'eleven_flash_v2_5',
            'voice_settings': {'stability': 0.55, 'similarity_boost': 0.75},
        }).encode()
        request = urllib.request.Request(
            f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}?output_format=mp3_22050_32',
            data=body,
            headers={'xi-api-key': key, 'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(request, timeout=45) as response:
            destination.write_bytes(response.read())
        print(f'Created {destination.name}')


if __name__ == '__main__':
    main()
