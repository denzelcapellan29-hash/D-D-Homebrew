"""Start MapForge locally and open it in the default browser (Python 3)."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser


def main():
    root = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        url = f'http://127.0.0.1:{server.server_port}/'
        print(f'\nMapForge 3D is running at {url}\nKeep this window open. Press Ctrl+C to stop.\n', flush=True)
        Timer(0.4, lambda: webbrowser.open(url)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nMapForge stopped.')


if __name__ == '__main__':
    main()
