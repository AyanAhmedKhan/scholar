import subprocess
import compileall
import os
import sys

def check_frontend():
    print("Checking frontend...")
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
    try:
        # Run npm run lint
        result = subprocess.run(['npm.cmd', 'run', 'lint'], cwd=frontend_dir, capture_output=True, text=True)
        return f"Frontend Lint Output:\nReturn Code: {result.returncode}\nStdout: {result.stdout}\nStderr: {result.stderr}\n"
    except Exception as e:
        return f"Frontend Check Failed: {e}\n"

def check_backend():
    print("Checking backend...")
    backend_dir = os.path.dirname(__file__)
    try:
        # returns True on success suitable for this check
        # But we want to capture output? compileall prints to stdout.
        # Let's redirect stdout temporarily
        from io import StringIO
        old_stdout = sys.stdout
        sys.stdout = mystdout = StringIO()
        
        compileall.compile_dir(backend_dir, force=True, quiet=0)
        
        sys.stdout = old_stdout
        return f"Backend Compile Output:\n{mystdout.getvalue()}\n"
    except Exception as e:
        return f"Backend Check Failed: {e}\n"

if __name__ == "__main__":
    report = ""
    report += check_frontend()
    report += "\n" + "="*50 + "\n"
    report += check_backend()
    
    with open("health_report.txt", "w", encoding="utf-8") as f:
        f.write(report)
    print("Report written to health_report.txt")
