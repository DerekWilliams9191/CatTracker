import json
import time
import os

def read_position_queue(queue_file="position_queue.json"):
    last_read_count = 0
    
    while True:
        try:
            if os.path.exists(queue_file):
                with open(queue_file, 'r') as f:
                    queue_data = json.load(f)
                
                # Only process new entries
                if len(queue_data) > last_read_count:
                    new_entries = queue_data[last_read_count:]
                    for entry in new_entries:
                        print(f"Received: {entry}")
                    last_read_count = len(queue_data)
            
            time.sleep(0.1)  # Check every 100ms
            
        except KeyboardInterrupt:
            print("Stopping queue reader...")
            break
        except Exception as e:
            print(f"Error reading queue: {e}")
            time.sleep(1)

if __name__ == "__main__":
    print("Starting position queue reader...")
    read_position_queue()