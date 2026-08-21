import pyautogui as gui
import keyboard
import time
import os

id = "dummy"
password = "dummy"
source = "SDAH"
destination = "NJP"
date = "18/09/2026"
trainNumber = "12343"
coach_type = 1
total_coach_types = 4
passenger_order = [5, 6, 3, 1, 4, 2]

# Helper
def typeword(text):
    for i in text:
        gui.press(i)

def login(id, password):
    gui.press(['tab','enter'])
    time.sleep(0.3)
    print("Language Bypassed")
    with gui.hold('shift'):
        for i in range(11):
            gui.press('tab')
    gui.press('enter')
    time.sleep(0.3)
    gui.press('tab')
    typeword(id)
    gui.press('tab')
    typeword(password)
    gui.press('tab')
    gui.press('tab')
    gui.press('enter')
    print("Login Completed")

def searchTrain(source, destination, date):
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

def selectTrain(trainNumber, coach_type):
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
    for i in range(total_coach_types+1):
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

def fillInformation(passenger_order):
    for i in range(len(passenger_order)):
        for j in range(passenger_order[i]):
            gui.press('down')
        gui.press('enter')

        for j in range(5):
            gui.press('tab')

        for j in range(len(passenger_order)):
            if passenger_order[j] > passenger_order[i]:
                passenger_order[j] -= 1
        gui.press('enter')

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

keyboard.add_hotkey("0", lambda: os._exit(0))
keyboard.add_hotkey("1", lambda: login(id, password))
keyboard.add_hotkey("2", lambda: searchTrain(source, destination, date))
keyboard.add_hotkey("3", lambda: selectTrain(trainNumber, coach_type))
keyboard.add_hotkey("alt+4", lambda: fillInformation(passenger_order))


print("\n=============================")
print("  Automation Ready")
print("  1 = Login")
print("  2 = Search Train")
print("  3 = Select Train")
print("  4 = Passenger Information")
print("  0 = EMERGENCY STOP")
print("=============================\n")

keyboard.wait()