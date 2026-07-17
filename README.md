# Rescate Nutria

Una portada de juego infanto-juvenil hecha con Django: invita a rescatar a una nutria bebé mientras se exploran decisiones de cuidado del humedal. Incluye navegación hacia la guía y el ranking, y un configurador de partida con modo, escenario y dificultad.

## Ejecutar localmente

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Abrí `http://127.0.0.1:8000/`.

## Variables de entorno para Render

| Variable | Valor recomendado | Uso |
| --- | --- | --- |
| `SECRET_KEY` | Una clave aleatoria larga | Firma de sesiones y protección criptográfica de Django. En Render puede generarse automáticamente con `generateValue`. |
| `DEBUG` | `False` | Debe permanecer desactivado en producción. |
| `ALLOWED_HOSTS` | `.onrender.com` | Permite el hostname entregado por Render y sus subdominios. Si se conecta un dominio propio, agregalo separado por comas. |
| `CSRF_TRUSTED_ORIGINS` | `https://tu-servicio.onrender.com` | Requerido si el proyecto recibe formularios POST desde el dominio publicado. Para varios orígenes, usar comas. |
| `PYTHON_VERSION` | `3.12.8` | Selecciona la versión de Python del servicio de Render. |

El archivo [`render.yaml`](render.yaml) ya contiene un Blueprint listo: instala dependencias, recopila estáticos, aplica migraciones y arranca Gunicorn. Para una base de datos persistente, reemplazá SQLite por PostgreSQL antes de manejar datos de usuarios en producción.

## Comprobaciones

```bash
python manage.py test
python manage.py collectstatic --noinput
```
