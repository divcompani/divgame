"""Run the extracted Divoolee pack locally with Python 3. No dependencies."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import webbrowser

folder = Path(__file__).resolve().parent
url = 'http://127.0.0.1:8790/'
try:
    with ThreadingHTTPServer(('127.0.0.1', 8790), partial(SimpleHTTPRequestHandler, directory=str(folder))) as server:
        print('Divoolee is running at ' + url)
        print('Keep this window open. Press Ctrl+C to stop.')
        webbrowser.open(url)
        server.serve_forever()
except KeyboardInterrupt:
    print('\nStopped.')
except OSError as error:
    print('Could not start the local preview:', error)
    print('Port 8790 may already be in use. Close the earlier preview and try again.')
