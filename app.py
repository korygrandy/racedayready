# app.py
# This is the main Python file for the Flask web server.
# To run this:
# 1. Install Flask & Firebase Admin:
#    pip install Flask firebase-admin
# 2. Place your serviceAccountKey.json in this directory.
# 3. Create a 'static' folder for CSS and JS files.
# 4. Run from your terminal: python app.py
# 5. Open your browser to http://127.0.0.1:5000

import os
import datetime
from flask import Flask, render_template, jsonify, request
import firebase_admin
from firebase_admin import credentials, firestore

# --- Firebase Initialization ---
# Check if the service account key file exists
if not os.path.exists('serviceAccountKey.json'):
    print("\n--- ERROR ---")
    print("Firebase service account key file ('serviceAccountKey.json') not found.")
    print("Please download it from your Firebase project settings and place it in the same directory as this script.")
    input("Press Enter to exit...")
    exit()

# Initialize Firebase Admin SDK
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()
# --- End Firebase Initialization ---
print("✅ Firebase Initialized Successfully.")


# --- App Configuration Loading ---
# This function fetches the version from Firestore, with a fallback.
def get_app_version():
    default_version = '1.4.8'
    try:
        config_ref = db.collection('config').document('app_info')
        config_doc = config_ref.get()
        if config_doc.exists:
            print("✅ DB Check Passed: 'app_info' document found in 'config' collection.")
            version = config_doc.to_dict().get('version')
            if version:
                print(f"✅ Loaded app version from Firestore: {version}")
                return version
            else:
                print(f"⚠️ Warning: 'version' field in Firestore is empty. Using default version '{default_version}'.")
                return default_version
        else:
            print(
                f"⚠️ Warning: 'app_info' document not found in 'config' collection. Using default version '{default_version}'.")
            return default_version
    except Exception as e:
        print(f"❌ Error loading app version from Firestore: {e}. Using default version '{default_version}'.")
        return default_version


# Initialize the Flask application
app = Flask(__name__)


# Define the main route for the application
@app.route('/')
def index():
    """
    This function handles requests to the root URL ('/') and
    renders the main HTML page, passing the app version and date to it.
    """
    app_version = get_app_version()
    last_updated_date = datetime.datetime.now().strftime("%B %d, %Y")
    return render_template('index.html', app_version=app_version, last_updated=last_updated_date)


# --- Route to check for and retrieve driver profiles ---
@app.route('/check-profiles', methods=['GET'])
def check_profiles():
    """
    Checks for driver profiles and returns them if they exist.
    """
    try:
        profiles_ref = db.collection('driver_profiles').stream()
        profiles = []
        for doc in profiles_ref:
            profile_data = doc.to_dict()
            profiles.append({
                'id': doc.id,
                'username': profile_data.get('username'),
                'helmetColor': profile_data.get('helmetColor', '#ffffff'),
                'pinEnabled': profile_data.get('pinEnabled', False),
                'pin': profile_data.get('pin')  # Pass the pin for editing
            })

        if profiles:
            print(f"✅ DB Check: Found {len(profiles)} driver profile(s).")
            return jsonify({'profiles_exist': True, 'profiles': profiles}), 200
        else:
            print("ℹ️ DB Check: No driver profiles found in the system.")
            return jsonify({'profiles_exist': False, 'profiles': []}), 200
    except Exception as e:
        print(f"❌ Error checking profiles: {e}")
        return jsonify({'error': str(e)}), 500


# --- Route to create a driver profile ---
@app.route('/create-profile', methods=['POST'])
def create_profile():
    """
    Creates a new driver profile document in Firestore, checking for duplicates.
    """
    try:
        data = request.get_json()
        username = data.get('username')
        helmet_color = data.get('helmetColor', '#ffffff')
        pin = data.get('pin')
        pin_enabled = data.get('pinEnabled', False)

        if not username:
            return jsonify({'success': False, 'message': 'Username is required.'}), 400
        if len(username) > 12:
            return jsonify({'success': False, 'message': 'Username cannot exceed 12 characters.'}), 400

        existing_profiles = db.collection('driver_profiles').where('username', '==', username).limit(1).get()
        if existing_profiles:
            print(f"⚠️ Attempted to create a duplicate profile for: {username}")
            return jsonify({'success': False, 'message': f'Username "{username}" is already taken.'}), 409

        doc_ref = db.collection('driver_profiles').document()
        doc_ref.set({
            'username': username,
            'helmetColor': helmet_color,
            'pin': pin,
            'pinEnabled': pin_enabled,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        })
        print(f"✅ New driver profile created: {username}")
        return jsonify({'success': True, 'message': f'Profile for {username} created successfully!'}), 201
    except Exception as e:
        print(f"❌ Error creating profile: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Route to update a driver profile ---
@app.route('/update-profile/<profile_id>', methods=['PUT'])
def update_profile(profile_id):
    """
    Updates a driver profile's username and/or helmet color in Firestore.
    """
    try:
        data = request.get_json()
        updates = {}
        if 'username' in data:
            new_username = data['username']
            if len(new_username) > 12:
                return jsonify({'success': False, 'message': 'Username cannot exceed 12 characters.'}), 400
            updates['username'] = new_username
        if 'helmetColor' in data:
            updates['helmetColor'] = data['helmetColor']
        if 'pin' in data:
            updates['pin'] = data['pin']
        if 'pinEnabled' in data:
            updates['pinEnabled'] = data['pinEnabled']

        if not profile_id or not updates:
            return jsonify({'success': False, 'message': 'Profile ID and update data are required.'}), 400

        db.collection('driver_profiles').document(profile_id).update(updates)
        print(f"✅ Driver profile updated: {profile_id} with {updates}")
        return jsonify({'success': True, 'message': 'Profile updated successfully!'}), 200
    except Exception as e:
        print(f"❌ Error updating profile: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Route to verify a driver's PIN ---
@app.route('/verify-pin/<profile_id>', methods=['POST'])
def verify_pin(profile_id):
    """
    Verifies the PIN for a given profile.
    """
    try:
        data = request.get_json()
        submitted_pin = data.get('pin')

        doc_ref = db.collection('driver_profiles').document(profile_id)
        doc = doc_ref.get()

        if not doc.exists:
            return jsonify({'success': False, 'message': 'Profile not found.'}), 404

        stored_pin = doc.to_dict().get('pin')
        if stored_pin == submitted_pin:
            print(f"✅ PIN verified for profile: {profile_id}")
            return jsonify({'success': True}), 200
        else:
            print(f"❌ PIN verification failed for profile: {profile_id}")
            return jsonify({'success': False, 'message': 'Incorrect PIN.'}), 401
    except Exception as e:
        print(f"❌ Error verifying PIN: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Route to delete a driver profile ---
@app.route('/delete-profile/<profile_id>', methods=['DELETE'])
def delete_profile(profile_id):
    """
    Deletes a driver profile document from Firestore.
    """
    try:
        if not profile_id:
            return jsonify({'success': False, 'message': 'Profile ID is required.'}), 400

        db.collection('driver_profiles').document(profile_id).delete()
        print(f"✅ Driver profile deleted: {profile_id}")
        return jsonify({'success': True, 'message': 'Profile deleted successfully!'}), 200
    except Exception as e:
        print(f"❌ Error deleting profile: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Route to handle readiness check ---
@app.route('/get-ready', methods=['POST'])
def get_ready():
    """
    Logs a readiness check for a selected driver profile.
    """
    try:
        data = request.get_json()
        username = data.get('username')
        if not username:
            return jsonify({'success': False, 'message': 'Username is required.'}), 400

        print(f"LOG: '{username}' is getting ready. Writing to Firestore...")
        doc_ref = db.collection('readiness_checks').document()
        doc_ref.set({
            'username': username,
            'timestamp': datetime.datetime.now(datetime.timezone.utc),
            'status': 'Ready!'
        })
        print(f"✅ Successfully wrote to Firestore for {username}. Document ID: {doc_ref.id}")
        return jsonify({'success': True, 'message': f'{username} is now Raceday Ready!'}), 200
    except Exception as e:
        print(f"❌ Error writing to Firestore: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Route to submit a feature request ---
@app.route('/submit-feature-request', methods=['POST'])
def submit_feature_request():
    """
    Saves a new feature request to Firestore.
    """
    try:
        data = request.get_json()
        username = data.get('username')
        request_text = data.get('requestText')

        if not username or not request_text:
            return jsonify({'success': False, 'message': 'Username and request text are required.'}), 400
        if len(request_text) > 500:
            return jsonify({'success': False, 'message': 'Feature request cannot exceed 500 characters.'}), 400

        doc_ref = db.collection('feature_requests').document()
        doc_ref.set({
            'username': username,
            'requestText': request_text,
            'submitted_at': datetime.datetime.now(datetime.timezone.utc)
        })
        print(f"✅ New feature request submitted by {username}")
        return jsonify({'success': True, 'message': 'Your feature request has been submitted!'}), 201
    except Exception as e:
        print(f"❌ Error submitting feature request: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- NEW: Route to get existing feature requests ---
@app.route('/get-feature-requests', methods=['GET'])
def get_feature_requests():
    """
    Retrieves all feature requests from Firestore.
    """
    try:
        requests_ref = db.collection('feature_requests').stream()
        requests = []
        for doc in requests_ref:
            request_data = doc.to_dict()
            requests.append({
                'username': request_data.get('username'),
                'requestText': request_data.get('requestText')
            })
        return jsonify({'success': True, 'requests': requests}), 200
    except Exception as e:
        print(f"❌ Error getting feature requests: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# --- HTML Template ---
# This would be in 'templates/index.html'
""""""

# --- Static CSS File ---
# This would be in 'static/style.css'
"""
body {
    transition: background-color 0.5s ease-in-out, color 0.5s ease-in-out;
}
#message-box {
    transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
}
"""

# --- Static JavaScript File ---
# This would be in 'static/script.js'
""""""

if __name__ == '__main__':
    # This block allows the script to be run directly.
    # debug=True allows for auto-reloading when you save changes.
    app.run(debug=True)
