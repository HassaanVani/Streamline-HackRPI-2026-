from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT/'data'


def airports():
    return json.loads((DATA/'airports.json').read_text())


def config():
    return json.loads((DATA/'config.json').read_text())
