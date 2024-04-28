import os

def rename_files_in_directory(directory):
    # Get a list of PNG files in the directory
    files = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f)) and f.endswith('.png')]
    
    files.sort()
    
    # Temporary renaming to avoid naming conflicts
    temp_files = []
    for idx, file_name in enumerate(files):
        temp_file_name = f"temp_{idx}.png"
        temp_file_path = os.path.join(directory, temp_file_name)
        current_file_path = os.path.join(directory, file_name)
        
        os.rename(current_file_path, temp_file_path)
        temp_files.append(temp_file_name)
        print(f"Temporarily renamed {file_name} to {temp_file_name}")
    
    # Final renaming to "1.png", "2.png", ..., "n.png"
    for idx, temp_file_name in enumerate(temp_files, start=1):
        new_file_name = f"{idx}.png"
        new_file_path = os.path.join(directory, new_file_name)
        temp_file_path = os.path.join(directory, temp_file_name)
        
        # Rename the file from temporary name to final name
        os.rename(temp_file_path, new_file_path) 
        print(f"Renamed {temp_file_name} to {new_file_name}")

directory_path = '.'
rename_files_in_directory(directory_path)
