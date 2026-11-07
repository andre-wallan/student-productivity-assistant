import json
import threading
import uuid
from datetime import date
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "json" / "tasks.json"
TASKS_LOCK = threading.Lock()
PRIORITIES = {"High", "Medium", "Low"}


def load_tasks():
    try:
        tasks = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []
    except (OSError, json.JSONDecodeError):
        return []

    if not isinstance(tasks, list):
        return []
    return [task for task in tasks if isinstance(task, dict)]


def save_tasks(tasks):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = DATA_FILE.with_suffix(".tmp")
    temporary_file.write_text(json.dumps(tasks, indent=2), encoding="utf-8")
    temporary_file.replace(DATA_FILE)


class PlannerHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if urlparse(self.path).path == "/api/tasks":
            with TASKS_LOCK:
                self._send_json(200, load_tasks())
            return
        if urlparse(self.path).path.startswith("/api/"):
            self._send_json(404, {"error": "Not found"})
            return
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api/tasks":
            self._send_json(404, {"error": "Not found"})
            return

        payload = self._read_json()
        if payload is None:
            return
        title = payload.get("title", "").strip()
        due_date = payload.get("due_date", "").strip()
        priority = payload.get("priority", "Medium")
        if not title:
            self._send_json(400, {"error": "Enter a task name."})
            return
        if len(title) > 200:
            self._send_json(400, {"error": "Task names must be 200 characters or fewer."})
            return
        if priority not in PRIORITIES:
            self._send_json(400, {"error": "Choose a valid priority."})
            return
        if due_date:
            try:
                if date.fromisoformat(due_date).isoformat() != due_date:
                    raise ValueError
            except ValueError:
                self._send_json(400, {"error": "Use YYYY-MM-DD for the due date."})
                return

        task = {
            "id": uuid.uuid4().hex,
            "title": title,
            "due_date": due_date,
            "priority": priority,
            "completed": False,
        }
        with TASKS_LOCK:
            tasks = load_tasks()
            tasks.append(task)
            try:
                save_tasks(tasks)
            except OSError:
                self._send_json(500, {"error": "Could not save your task."})
                return
        self._send_json(201, task)

    def do_PATCH(self):
        task_id = self._task_id_from_path()
        if task_id is None:
            self._send_json(404, {"error": "Not found"})
            return
        payload = self._read_json()
        if payload is None:
            return
        if not isinstance(payload.get("completed"), bool):
            self._send_json(400, {"error": "Completion status must be true or false."})
            return

        with TASKS_LOCK:
            tasks = load_tasks()
            task = next((item for item in tasks if item.get("id") == task_id), None)
            if task is None:
                self._send_json(404, {"error": "Task not found."})
                return
            task["completed"] = payload["completed"]
            try:
                save_tasks(tasks)
            except OSError:
                self._send_json(500, {"error": "Could not save your task."})
                return
        self._send_json(200, task)

    def do_DELETE(self):
        task_id = self._task_id_from_path()
        if task_id is None:
            self._send_json(404, {"error": "Not found"})
            return

        with TASKS_LOCK:
            tasks = load_tasks()
            remaining_tasks = [task for task in tasks if task.get("id") != task_id]
            if len(remaining_tasks) == len(tasks):
                self._send_json(404, {"error": "Task not found."})
                return
            try:
                save_tasks(remaining_tasks)
            except OSError:
                self._send_json(500, {"error": "Could not save your task."})
                return
        self._send_json(204, None)

    def _task_id_from_path(self):
        parts = urlparse(self.path).path.strip("/").split("/")
        if len(parts) == 3 and parts[:2] == ["api", "tasks"] and parts[2]:
            return parts[2]
        return None

    def _read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 100_000:
                raise ValueError
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError
            return payload
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Request body must be a JSON object."})
            return None

    def _send_json(self, status, payload):
        body = b"" if payload is None else json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if body:
            self.wfile.write(body)

    def log_message(self, format_string, *args):
        print(f"[{self.log_date_time_string()}] {format_string % args}")


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 8000), PlannerHandler)
    print("Student Productivity Assistant is running at http://127.0.0.1:8000")
    print("Press Ctrl+C to stop the server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPlanner server stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()