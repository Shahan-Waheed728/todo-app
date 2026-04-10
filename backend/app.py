from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import os
import time

app = Flask(__name__)
app.json.sort_keys = False
CORS(app)

# Database connection
def get_db():
    conn = psycopg2.connect(
        host=os.environ.get("DB_HOST", "db"),
        database=os.environ.get("DB_NAME", "tododb"),
        user=os.environ.get("DB_USER", "postgres"),
        password=os.environ.get("DB_PASSWORD", "postgres")
    )
    return conn

# Create table if not exists
def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            task TEXT NOT NULL,
            done BOOLEAN DEFAULT FALSE
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

# Retry connecting to database
def init_db_with_retry():
    retries = 5
    while retries > 0:
        try:
            init_db()
            print("✅ Database connected successfully!")
            break
        except Exception as e:
            retries -= 1
            print(f"⏳ Database not ready yet, retrying in 3 seconds... ({retries} retries left)")
            time.sleep(3)
    else:
        print("❌ Could not connect to database after multiple retries.")
        exit(1)

# GET all todos
@app.route('/todos', methods=['GET'])
def get_todos():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, task, done FROM todos")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    todos = [{"id": r[0], "task": r[1], "done": r[2]} for r in rows]
    return jsonify(todos)

# POST - add new todo
@app.route('/todos', methods=['POST'])
def add_todo():
    data = request.get_json()
    task = data.get("task")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO todos (task) VALUES (%s) RETURNING id", (task,))
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": new_id, "task": task, "done": False}), 201

# PUT - mark as done
@app.route('/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE todos SET done = TRUE WHERE id = %s", (todo_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Task marked as done"})

# DELETE - remove todo
@app.route('/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM todos WHERE id = %s", (todo_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Task deleted"})

if __name__ == '__main__':
    init_db_with_retry()
    app.run(host='0.0.0.0', port=5000, debug=True)