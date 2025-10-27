class Event:
    def __init__(self, title, date, time=None, description=""):
        self.title = title
        self.date = date
        self.time = time
        self.description = description