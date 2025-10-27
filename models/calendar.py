from event import Event
from typing import List

class Calendar:
    def __init__(self):
        self.events: List[Event] = []

    def add_event(self, event: Event):
        self.events.append(event)

    

