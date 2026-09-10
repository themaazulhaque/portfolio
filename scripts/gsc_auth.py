#!/usr/bin/env python3
"""Authenticate locally with an existing Google Desktop OAuth client."""

import json
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/webmasters"]
SCRIPT_DIR = Path(__file__).resolve().parent
CREDENTIALS_PATH = SCRIPT_DIR / "oauth_credentials.json"
TOKEN_PATH = SCRIPT_DIR / "gsc_token.json"


def authenticate():
    client = json.loads(CREDENTIALS_PATH.read_text(encoding="utf-8"))
    if "installed" not in client or "web" in client:
        raise ValueError("The OAuth client must be a Desktop/Installed client.")

    flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
    credentials = flow.run_local_server(
        port=0,
        access_type="offline",
        prompt="consent",
    )
    TOKEN_PATH.write_text(credentials.to_json(), encoding="utf-8")
    return credentials


if __name__ == "__main__":
    try:
        authenticate()
        print("Authentication successful. Token saved locally.")
    except Exception as error:
        print(f"Authentication failed: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
