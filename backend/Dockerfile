FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get install -y poppler-utils
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["python", "endpoints.py"]