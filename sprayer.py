import json
import time
import os

def read_position_queue(queue_file="position_queue.txt"):
    last_position = 0
    
    # Clear old queue file on startup
    if os.path.exists(queue_file):
        os.remove(queue_file)
        print("Cleared old queue file")
    
    while True:
        try:
            if os.path.exists(queue_file):
                with open(queue_file, 'r') as f:
                    f.seek(last_position)
                    new_lines = f.readlines()
                    last_position = f.tell()
                
                for line in new_lines:
                    line = line.strip()
                    if line:
                        try:
                            entry = json.loads(line)
                            print(f"Received: {entry}")
                        except json.JSONDecodeError:
                            continue
            
            time.sleep(0.05)  # Check every 50ms for faster response
            
        except KeyboardInterrupt:
            print("Stopping queue reader...")
            break
        except Exception as e:
            print(f"Error reading queue: {e}")
            time.sleep(0.5)

if __name__ == "__main__":
    print("Starting position queue reader...")
    read_position_queue()