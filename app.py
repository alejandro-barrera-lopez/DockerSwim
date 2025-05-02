from flask import Flask, send_from_directory
import os

# Configurar Flask para servir archivos desde la carpeta 'static'
app = Flask(__name__, static_folder='static', static_url_path='')

# Ruta principal que sirve el index.html
@app.route('/')
def index():
    # Asegurarse que siempre se sirva index.html para la ruta raíz
    return send_from_directory(app.static_folder, 'index.html')

# Flask manejará automáticamente el servicio de otros archivos en static/
# (como .css, .js, .png) gracias a static_folder y static_url_path=''

# No es necesario app.run() porque Gunicorn lo manejará