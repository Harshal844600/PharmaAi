
import uvicorn
import os
import sys

# Ensure root is in path
sys.path.append(os.getcwd())

if __name__ == "__main__":
    print("Starting PharmaGuard Backend...")
    try:
        uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception as e:
        print(f"Failed to start backend: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to close...")
