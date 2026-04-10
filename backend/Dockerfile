# Step 1 - Base image
FROM python:3.11-slim

# Step 2 - Set working directory inside container
WORKDIR /app

# Step 3 - Copy requirements file first
COPY requirements.txt .

# Step 4 - Install Python libraries
RUN pip install --no-cache-dir -r requirements.txt

# Step 5 - Copy all backend code
COPY . .

# Step 6 - Expose port 5000
EXPOSE 5000

# Step 7 - Run the Flask app
CMD ["python", "app.py"]