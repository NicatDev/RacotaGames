# syntax=docker/dockerfile:1
FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
RUN groupadd --gid 10001 racota && useradd --uid 10001 --gid racota --no-create-home racota
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=racota:racota . .
RUN mkdir -p /app/media /app/staticfiles && chown -R racota:racota /app/media /app/staticfiles && chmod +x /app/entrypoint.sh
USER racota
EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--config", "gunicorn.conf.py", "config.wsgi:application"]
