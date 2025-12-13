import os
import sys

def scan_for_hardlinks(start_dir):
    print(f"Scanning {start_dir} for hard links...")
    if not os.path.exists(start_dir):
        print("Directory not found.")
        return

    hard_link_count = 0
    total_files = 0
    
    for root, dirs, files in os.walk(start_dir):
        for name in files:
            total_files += 1
            path = os.path.join(root, name)
            try:
                stat = os.stat(path)
                # st_nlink tells us how many hard links point to this data
                if stat.st_nlink > 1:
                    hard_link_count += 1
                    print(f"[FOUND] {name}")
                    print(f"    - Path: {path}")
                    print(f"    - Link Count: {stat.st_nlink} (Shared by {stat.st_nlink} locations)")
                    print("-" * 40)
            except Exception as e:
                print(f"Error accessing {name}: {e}")

    print(f"\nScan Complete.")
    print(f"Total Files Scanned: {total_files}")
    print(f"Files using Hard Links: {hard_link_count}")
    
    if hard_link_count > 0:
        print("\nVERIFICATION: SUCCESS")
        print("Your system IS using hard links. These files exist in multiple places but take up space only ONCE.")
    else:
        print("\nVERIFICATION: INCONCLUSIVE / NONE")
        print("No hard links found. This might mean no applications have been submitted yet using existing vault documents, or the file system doesn't support it (e.g. FAT32), but you are on NTFS so it should work if data exists.")

if __name__ == "__main__":
    # Adjust path to your media folder
    media_path = os.path.join(os.getcwd(), "backend", "media")
    scan_for_hardlinks(media_path)
