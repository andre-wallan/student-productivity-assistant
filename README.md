# Student Productivity Assistant

## Overview

Students often struggle to organize their academic activities, remember important assignments, and manage their study time effectively. This can make it difficult to stay focused and complete important tasks on time.

The Student Productivity Assistant is a local web application designed to help students organize their daily study activities.

The browser interface displays the current date, task progress, and a study task list. Students can add tasks with priorities and optional due dates, filter open and completed tasks, mark tasks complete, and delete tasks. The stylesheet is stored in `css/styles.css`, and task data is stored in `json/tasks.json`.

The main purpose of this project is to develop a practical tool that encourages better study organization and time management. As the application develops, additional features will be introduced to make task management easier and more effective.

### Current Features

- Personalized student welcome.
- Displays the current date.
- Add multiple study tasks with high, medium, or low priority.
- Set optional due dates using `YYYY-MM-DD` format.
- View pending, completed, and overdue tasks.
- Mark tasks complete.
- Delete tasks.
- Filter between all, open, and completed tasks.
- Save tasks between sessions in `json/tasks.json`.

### Future Improvements

- Edit or delete existing tasks.
- Generate weekly productivity summaries.
- Add estimated study durations and scheduling suggestions.

## Running the Application

Run `python main.py` from the project directory, then open `http://127.0.0.1:8000` in your browser. Use the form to add tasks, and the task list to mark tasks complete or remove them. Stop the local server with Ctrl+C. The app uses only Python's standard library; no third-party packages are required.

## Project Structure

```text
main.py
index.html
app.js
css/
	styles.css
json/
	tasks.json
```

## Software Demo Video

[Software Demo Video] https://youtu.be/Uq1_YzywF6A

## Development Environment

The application was developed using:

- **Visual Studio Code:** Code editor.
- **Python 3:** Programming language.
- **Windows PowerShell:** Running and testing the application.
- **Git:** Version control.
- **GitHub:** Hosting and sharing the source code.

Python was selected because it is readable, beginner-friendly, and suitable for developing practical software applications.

The program uses Python's built-in HTTP server for local hosting and task endpoints, JSON for local task storage, and browser HTML, CSS, and JavaScript for the interface.

## Useful Websites

- [Python Official Documentation](https://docs.python.org/3/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [GitHub](https://github.com/)
- [Git Documentation](https://git-scm.com/doc)
- [Markdown Guide](https://www.markdownguide.org/cheat-sheet/)