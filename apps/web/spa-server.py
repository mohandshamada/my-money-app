#!/usr/bin/env python3
"""
Simple SPA server - serves index.html for all routes (except static assets)
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import sys
import urllib.parse

PORT = 8080
DIRECTORY = "/root/cashflow/apps/web/dist"

class SPAHandler(SimpleHTTPRequestHandler):
    """Serve SPA by returning index.html for all non-file routes"""
    
    def translate_path(self, path):
        """Translate URL path to file path, with SPA fallback"""
        # Decode URL
        path = urllib.parse.unquote(path)
        # Remove query string
        path = path.split('?')[0]
        
        # Build file path
        file_path = os.path.normpath(os.path.join(DIRECTORY, path.lstrip('/')))
        
        # Check if it's an existing file
        if os.path.isfile(file_path):
            return file_path
        
        # Check if it's a directory with index.html
        if os.path.isdir(file_path):
            index_path = os.path.join(file_path, 'index.html')
            if os.path.isfile(index_path):
                return index_path
        
        # Check if it looks like a static asset (has extension)
        basename = os.path.basename(path)
        if '.' in basename:
            # Static asset that doesn't exist - return 404
            return file_path
        
        # SPA route - return index.html
        return os.path.join(DIRECTORY, 'index.html')
    
    def log_message(self, format, *args):
        # Suppress logging
        pass

if __name__ == "__main__":
    server = HTTPServer(('0.0.0.0', PORT), SPAHandler)
    print(f"SPA server running on port {PORT}")
    sys.stdout.flush()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()