import socket
import urllib.request
import urllib.error
import os
import sys

def check_port(host, port):
    """Check if a port is open."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(2)
            result = s.connect_ex((host, port))
            return result == 0
    except Exception:
        return False

def check_url(url):
    """Check if a URL responds with 200 OK."""
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            return response.getcode() == 200
    except urllib.error.URLError as e:
        return False, str(e)
    except Exception as e:
        return False, str(e)

def main():
    print("="*60)
    print("🚀 SCHOLARSHIP PORTAL DEPLOYMENT VERIFIER")
    print("="*60)

    # 1. Check Backend Port
    backend_port = 5001
    print(f"\n[1] Checking Backend Port (localhost:{backend_port})...")
    if check_port("127.0.0.1", backend_port):
        print(f"✅ Backend port {backend_port} is OPEN (Listening).")
    else:
        print(f"❌ Backend port {backend_port} is CLOSED. Is FastAPI running?")

    # 2. Check Frontend Port
    frontend_port = 4255
    print(f"\n[2] Checking Frontend Port (localhost:{frontend_port})...")
    if check_port("127.0.0.1", frontend_port):
        print(f"✅ Frontend port {frontend_port} is OPEN (Listening).")
    else:
        print(f"❌ Frontend port {frontend_port} is CLOSED. Is 'npx serve' running?")

    # 3. Check Backend Health Endpoint
    print("\n[3] Checking Backend Health Endpoint...")
    health_url = "http://127.0.0.1:5001/api/v1/health"
    try:
        # Note: Depending on your API, /health might not exist, but root / usually returns 404 or Welcome
        # Trying root path
        root_url = "http://127.0.0.1:5001/"
        with urllib.request.urlopen(root_url, timeout=5) as response:
             print(f"✅ Backend is RESPONDING (Status: {response.getcode()})")
             print(f"   Response: {response.read().decode('utf-8')[:100]}...")
    except Exception as e:
        print(f"❌ Backend NOT responding nicely: {e}")
        print("   -> Verify FastAPI started without errors.")

    # 4. Check Environment for CORS
    print("\n[4] Checking CORS Configuration in .env...")
    env_path = os.path.join("backend", ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r") as f:
                content = f.read()
                if "scholar.mitsgwalior.in" in content:
                    print("✅ 'scholar.mitsgwalior.in' found in backend .env")
                else:
                    print("⚠️ 'scholar.mitsgwalior.in' NOT found in backend/.env")
                    print("   -> Frontend might receive CORS errors.")
        except Exception as e:
            print(f"⚠️ Could not read backend/.env: {e}")
    else:
        print("⚠️ backend/.env file not found at expected path.")

    print("\n" + "="*60)

if __name__ == "__main__":
    main()
