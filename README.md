# Rescate Nutria

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black)

**Rescate Nutria** es una experiencia web educativa e infanto-juvenil creada con Django. La misión consiste en guiar a una nutria bebé de vuelta a su madriguera mientras se cuida el humedal: se recogen residuos y conchas, se evitan especies invasoras y se toman decisiones sin límite de tiempo.

## Características

- Partida configurable por modo, escenario y dificultad.
- Juego en `canvas` con controles de teclado y botones táctiles.
- Objetivos de limpieza, colección de conchas, puntaje y bonus por colección completa.
- Pausa, reinicio y mensajes de estado accesibles durante la partida.
- Mejor puntaje conservado localmente en el navegador.
- Interfaz en español, adaptable a distintos tamaños de pantalla.

## Requisitos

- Python 3.12 o una versión compatible con Django 5.1.
- `pip`.

Las dependencias de la aplicación están definidas en [`requirements.txt`](requirements.txt): Django, Gunicorn y WhiteNoise.

## Ejecutar localmente

1. Creá y activá un entorno virtual:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Instalá las dependencias y configurá las variables locales:

   ```bash
   pip install -r requirements.txt
   cp .env.example .env
   ```

3. Aplicá las migraciones e iniciá el servidor:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

Abrí [http://127.0.0.1:8000/](http://127.0.0.1:8000/) en el navegador.

> El proyecto no carga automáticamente el archivo `.env`. Para usar valores distintos de los predeterminados, exportalos en la sesión de la terminal o configurá tu entorno de ejecución para que los inyecte.

## Cómo jugar

1. Elegí **Nueva partida** o **Empezar una misión**.
2. Seleccioná el modo, el escenario y la dificultad, y creá la partida.
3. Mové a la nutria con las flechas, **WASD** o los controles táctiles.
4. Recogé residuos y conchas, evitá los invasores y llevá a la nutria a casa.
5. Usá la tecla **P** o el botón **Pausar** para detener o reanudar la misión. El botón **Reiniciar** comienza una nueva partida con la configuración actual.

El mejor puntaje se almacena en `localStorage` bajo la clave `otter-rescue-high-score`, por lo que permanece disponible en el mismo navegador.

## Variables de entorno

| Variable | Valor local sugerido | Uso |
| --- | --- | --- |
| `SECRET_KEY` | Una clave larga y privada | Firma de sesiones y protección criptográfica de Django. |
| `DEBUG` | `True` | Activa las herramientas de depuración durante el desarrollo. Debe ser `False` en producción. |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Lista de hosts permitidos, separados por comas. |
| `CSRF_TRUSTED_ORIGINS` | `https://tu-app.onrender.com` | Orígenes confiables para solicitudes POST, separados por comas. |
| `PYTHON_VERSION` | `3.12.8` | Versión de Python usada por el despliegue en Render. |

Encontrá valores de ejemplo en [`.env.example`](.env.example).

## Despliegue en Render

El archivo [`render.yaml`](render.yaml) incluye un Blueprint para crear un servicio web de Python. Durante la compilación se ejecuta [`build.sh`](build.sh), que instala las dependencias, recopila los archivos estáticos y aplica las migraciones. El servicio se inicia con Gunicorn y WhiteNoise entrega los estáticos.

Antes de publicar:

- Usá una `SECRET_KEY` única y privada.
- Mantené `DEBUG=False`.
- Configurá `ALLOWED_HOSTS` con el dominio real del servicio y cualquier dominio propio.
- Agregá a `CSRF_TRUSTED_ORIGINS` los orígenes HTTPS desde los que la aplicación recibirá formularios POST.
- La configuración actual utiliza SQLite. Para datos persistentes de usuarios en producción, migrá a una base de datos administrada como PostgreSQL.

## Comprobaciones

```bash
python manage.py test
python manage.py collectstatic --noinput
```

## Estructura principal

```text
otter_rescue/                  Configuración del proyecto Django
rescue/                        Aplicación, plantilla, estilos y lógica del juego
rescue/templates/rescue/       Página principal
rescue/static/rescue/          Recursos estáticos de la experiencia
render.yaml                    Configuración de despliegue en Render
build.sh                       Pasos de compilación para Render
```
