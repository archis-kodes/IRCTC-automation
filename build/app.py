import customtkinter as ctk
from tkinter import filedialog, messagebox
import pyautogui as gui
import keyboard
import webbrowser
import json
import os

JSON_GENERATOR_URL = "https://irctc-automation.vercel.app"

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ------------------------------------------------------------------
# Global config (populated from the selected JSON file)
# ------------------------------------------------------------------
config = {}
hotkeys_registered = False

REQUIRED_KEYS = [
    "id", "password", "source", "destination", "date",
    "trainNumber", "coach_type", "total_coach_types", "passenger_order"
]

INSTRUCTIONS = (
    "HOW TO USE\n"
    "------------------------------------------------------------------------------------------------------------------------------------------\n"
    "1. Click 'Select JSON File' and choose your booking config file.\n"
    "2. Click 'Start Automation' to arm the hotkeys.\n"
    "3. Switch to your browser window (e.g. IRCTC) and press:\n\n"
    "     1        --->     Login\n"
    "     2        --->     Search Train\n"
    "     3        --->     Select Train\n"
    "     Alt + 4  --->     Fill Passenger Information\n"
    "     0        --->     EMERGENCY STOP (quits immediately)\n\n"
    "These hotkeys work globally, so the app window does not need\n"
    "to be focused once automation has been started.\n"
)


# ------------------------------------------------------------------
# Automation logic (ported from bot.py, parameterised by `config`)
# ------------------------------------------------------------------
def typeword(text):
    for i in text:
        gui.press(i)


def login():
    id_ = config["id"]
    password = config["password"]
    gui.press(['tab', 'enter'])
    gui.sleep(0.3) if hasattr(gui, "sleep") else None
    import time
    time.sleep(0.3)
    print("Language Bypassed")
    with gui.hold('shift'):
        for i in range(11):
            gui.press('tab')
    gui.press('enter')
    time.sleep(0.3)
    gui.press('tab')
    typeword(id_)
    gui.press('tab')
    typeword(password)
    gui.press('tab')
    gui.press('tab')
    gui.press('enter')
    print("Login Completed")


def searchTrain():
    import time
    source = config["source"]
    destination = config["destination"]
    date = config["date"]
    for i in range(14):
        gui.press('tab')
    print("Reached Form")
    gui.write(source)
    time.sleep(0.3)
    gui.press('enter')
    gui.press('tab')
    gui.write(destination)
    time.sleep(0.3)
    gui.press('enter')
    gui.press('tab')
    gui.write(date)
    gui.press('enter')
    print("Search Completed")


def selectTrain():
    import time
    trainNumber = config["trainNumber"]
    coach_type = config["coach_type"]
    total_coach_types = config["total_coach_types"]

    with gui.hold('ctrl'):
        gui.press('f')
    gui.write(trainNumber)
    time.sleep(0.3)
    gui.press('enter')
    gui.press('esc')
    gui.press('tab')
    for i in range(coach_type):
        gui.press('tab')
    gui.press('enter')
    # Refresh Delay
    time.sleep(1)
    # Press cross
    for i in range(total_coach_types + 1):
        gui.press('tab')
    gui.press('enter')

    # Go backward
    with gui.hold('shift'):
        for i in range(total_coach_types - coach_type + 1):
            gui.press('tab')
    # Select
    gui.press('enter')
    for i in range(total_coach_types - coach_type + 2):
        gui.press('tab')
    print("Train Selected")


def fillInformation():
    import time
    passenger_order = config["passenger_order"]
    for passenger in range(len(passenger_order)):
        for i in range(passenger_order[passenger]):
            gui.press('down')
        gui.press('enter')
        for i in range(5):
            gui.press('tab')
        gui.press('enter')
        for i in range(len(passenger_order)):
            if passenger_order[i]>passenger_order[passenger]:
                passenger_order[i] -= 1
        time.sleep(0.3)
    print("Passenger Information filled")
    for i in range(6):
        gui.press('tab')
    time.sleep(0.3)
    gui.press('space')
    for i in range(4):
        gui.press('tab')
    time.sleep(0.3)
    gui.press('down')
    gui.press('tab')
    gui.press('tab')
    print("Go to Payments")
    os._exit(0)


# ------------------------------------------------------------------
# GUI
# ------------------------------------------------------------------
class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("IRCTC Automation")
        self.geometry("520x520")
        self.resizable(False, False)

        self.json_path = None

        # Title
        ctk.CTkLabel(
            self, text="IRCTC Automation",
            font=ctk.CTkFont(size=20, weight="bold")
        ).pack(pady=(20, 10))

        # Generate JSON button (opens web tool)
        self.generate_btn = ctk.CTkButton(
            self, text="Generate JSON File", fg_color="red",
            hover_color="darkred", command=self.open_json_generator
        )
        self.generate_btn.pack(pady=5)

        # File select button
        self.select_btn = ctk.CTkButton(
            self, text="Select JSON File", command=self.select_json
        )
        self.select_btn.pack(pady=5)

        self.file_label = ctk.CTkLabel(
            self, text="No file selected", text_color="gray"
        )
        self.file_label.pack(pady=(0, 10))

        # Instructions box
        self.instructions_box = ctk.CTkTextbox(self, width=460, height=245)
        self.instructions_box.insert("1.0", INSTRUCTIONS)
        self.instructions_box.configure(state="disabled")
        self.instructions_box.pack(pady=10)

        # Start button
        self.start_btn = ctk.CTkButton(
            self, text="Start Automation", fg_color="green",
            hover_color="darkgreen", command=self.start_automation,
            state="disabled"
        )
        self.start_btn.pack(pady=10)

        # Status label
        self.status_label = ctk.CTkLabel(self, text="Status: Idle", text_color="gray")
        self.status_label.pack(pady=(5, 0))

    def open_json_generator(self):
        webbrowser.open(JSON_GENERATOR_URL)

    def select_json(self):
        path = filedialog.askopenfilename(
            title="Select booking config JSON",
            filetypes=[("JSON files", "*.json")]
        )
        if not path:
            return

        try:
            with open(path, "r") as f:
                data = json.load(f)
        except Exception as e:
            messagebox.showerror("Invalid JSON", f"Could not parse file:\n{e}")
            return

        missing = [k for k in REQUIRED_KEYS if k not in data]
        if missing:
            messagebox.showerror(
                "Missing Fields", f"JSON is missing required keys:\n{', '.join(missing)}"
            )
            return

        self.json_path = path
        config.clear()
        config.update(data)

        self.file_label.configure(text=os.path.basename(path), text_color="white")
        self.start_btn.configure(state="normal")
        self.status_label.configure(text="Status: Config loaded, ready to start")

    def start_automation(self):
        global hotkeys_registered
        if hotkeys_registered:
            messagebox.showinfo("Already Running", "Hotkeys are already active.")
            return

        def register():
            keyboard.add_hotkey("0", lambda: os._exit(0))
            keyboard.add_hotkey("1", login)
            keyboard.add_hotkey("2", searchTrain)
            keyboard.add_hotkey("3", selectTrain)
            keyboard.add_hotkey("alt+4", fillInformation)

        register()
        hotkeys_registered = True

        self.status_label.configure(
            text="Status: ARMED — press 1/2/3/Alt+4 in your browser, 0 to stop",
            text_color="lightgreen"
        )
        self.start_btn.configure(state="disabled", text="Automation Running")
        self.select_btn.configure(state="disabled")


if __name__ == "__main__":
    app = App()
    app.mainloop()
