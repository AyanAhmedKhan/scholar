
try:
    import pypdf
    import PIL
    with open("dep_check.txt", "w") as f:
        f.write("OK")
except ImportError as e:
    with open("dep_check.txt", "w") as f:
        f.write(f"ImportError: {e}")
except Exception as e:
    with open("dep_check.txt", "w") as f:
        f.write(f"Error: {e}")
