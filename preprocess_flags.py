import os
import json
from PIL import Image
import numpy as np
from sklearn.cluster import KMeans

FLAGS_DIR = 'state_flags_png'
OUTPUT_JSON = 'state_flags_data.json'
CLUSTERS = 4

# Get all PNG files
flag_files = [f for f in os.listdir(FLAGS_DIR) if f.endswith('.png')]

state_data = []

for flag_file in flag_files:
    state_name = flag_file.replace('.png', '').replace('_', ' ')
    img_path = os.path.join(FLAGS_DIR, flag_file)
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img).reshape(-1, 3)
    avg_rgb = arr.mean(axis=0) / 255.0  # Normalize to [0, 1]
    state_data.append({
        'state': state_name,
        'flag_file': img_path,
        'rgb': avg_rgb.tolist()
    })

# K-means clustering
X = np.array([s['rgb'] for s in state_data])
kmeans = KMeans(n_clusters=CLUSTERS, n_init=10, random_state=42)
labels = kmeans.fit_predict(X)
centroids = kmeans.cluster_centers_.tolist()

# Add cluster info to state data
for i, s in enumerate(state_data):
    s['cluster'] = int(labels[i])

# Save all data
output = {
    'states': state_data,
    'centroids': centroids
}

with open(OUTPUT_JSON, 'w') as f:
    json.dump(output, f, indent=2)

print(f"Saved {OUTPUT_JSON} with {len(state_data)} states and {CLUSTERS} clusters.")
