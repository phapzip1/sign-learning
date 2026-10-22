"""Entry point: start the recognition web service. Run from this folder: python main.py"""
from app import App

def main():
    """Start the FastAPI service (see app.py for configuration)."""
    App.run()

if __name__ == "__main__":
    main()