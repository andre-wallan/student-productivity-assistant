from datetime import date


def main():
    print("=" * 50)
    print("       STUDENT PRODUCTIVITY ASSISTANT")
    print("=" * 50)

    print("\nHello World!")
    print("Your personal assistant for better study planning.")

    name = input("\nEnter your name: ").strip()

    if not name:
        name = "Student"

    print(f"\nWelcome, {name}!")

    today = date.today()
    print(f"Today's date: {today.strftime('%A, %d %B %Y')}")

    print("\n--- DAILY STUDY PLANNER ---")

    task = input("What is your most important study task today? ").strip()

    if task:
        print("\nYOUR STUDY PLAN")
        print("-" * 50)
        print(f"Student: {name}")
        print(f"Priority task: {task}")
        print("Status: Pending")
        print("\nReminder: Start with your most important task.")
    else:
        print("\nYou have not entered a study task yet.")

    print("\nThank you for using Student Productivity Assistant!")
    print("=" * 50)


if __name__ == "__main__":
    main()