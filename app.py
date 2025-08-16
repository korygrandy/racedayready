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
import json
from flask import Flask, render_template, jsonify, request
import firebase_admin
from firebase_admin import credentials, firestore
from version import APP_VERSION

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
    # This version number will be incremented with each new set of changes.
    default_version = APP_VERSION
    try:
        config_ref = db.collection('config').document('app_info')
        config_doc = config_ref.get()
        if config_doc.exists:
            version = config_doc.to_dict().get('version')
            # If version is missing or empty in Firestore, use the default
            if not version:
                print(f"⚠️ Warning: 'version' field in Firestore is empty. Using default version '{default_version}'.")
                return default_version
            print(f"✅ Loaded app version from Firestore: {version}")
            return version
        else:
            print(
                f"⚠️ Warning: 'app_info' document not found in 'config' collection. Using default version '{default_version}'.")
            # Create the setting if it doesn't exist
            config_ref.set({'version': default_version})
            return default_version
    except Exception as e:
        print(f"❌ Error loading app version from Firestore: {e}. Using default version '{default_version}'.")
        return default_version


# --- Function to get a generic limit from Firestore ---
def get_limit(collection_name, document_name, default_limit):
    try:
        settings_ref = db.collection(collection_name).document(document_name)
        settings_doc = settings_ref.get()
        if settings_doc.exists:
            limit = settings_doc.to_dict().get('limit', default_limit)
            print(f"✅ Loaded {document_name} limit from Firestore: {limit}")
            return int(limit)
        else:
            print(f"⚠️ {document_name} limit setting not found. Defaulting to {default_limit}.")
            settings_ref.set({'limit': default_limit})
            return default_limit
    except Exception as e:
        print(f"❌ Error getting {document_name} limit: {e}. Defaulting to {default_limit}.")
        return default_limit


# --- Function to get feature request settings from Firestore ---
def get_feature_request_settings():
    """
    Retrieves feature request settings from admin_settings in Firestore.
    Defaults to deletion disabled and a limit of 3 if not set.
    """
    default_settings = {'deletion_enabled': False, 'limit': 3}
    try:
        settings_ref = db.collection('admin_settings').document('feature_requests')
        settings_doc = settings_ref.get()
        if settings_doc.exists:
            settings = settings_doc.to_dict()
            # Ensure both keys exist, falling back to defaults if necessary
            settings['deletion_enabled'] = settings.get('deletion_enabled', default_settings['deletion_enabled'])
            settings['limit'] = int(settings.get('limit', default_settings['limit']))
            print(f"✅ Loaded feature request settings from Firestore: {settings}")
            return settings
        else:
            print(f"⚠️ Feature request settings not found. Defaulting to {default_settings}.")
            settings_ref.set(default_settings)
            return default_settings
    except Exception as e:
        print(f"❌ Error getting feature request settings: {e}. Defaulting to {default_settings}.")
        return default_settings


# --- Function to get lap time settings from Firestore ---
def get_lap_time_settings():
    """
    Retrieves lap time settings from admin_settings in Firestore.
    Defaults to deletion disabled.
    """
    default_settings = {'deletion_enabled': False}
    try:
        settings_ref = db.collection('admin_settings').document('lap_times')
        settings_doc = settings_ref.get()
        if settings_doc.exists:
            settings = settings_doc.to_dict()
            settings['deletion_enabled'] = settings.get('deletion_enabled', default_settings['deletion_enabled'])
            print(f"✅ Loaded lap time settings from Firestore: {settings}")
            return settings
        else:
            print(f"⚠️ Lap time settings not found. Defaulting to {default_settings}.")
            settings_ref.set(default_settings)
            return default_settings
    except Exception as e:
        print(f"❌ Error getting lap time settings: {e}. Defaulting to {default_settings}.")
        return default_settings


# --- Function to get maintenance settings from Firestore ---
def get_maintenance_settings():
    default_settings = {'enabled': False}
    try:
        settings_ref = db.collection('config').document('maintenance')
        settings_doc = settings_ref.get()
        if settings_doc.exists:
            return settings_doc.to_dict()
        else:
            settings_ref.set(default_settings)
            return default_settings
    except Exception as e:
        print(f"❌ Error getting maintenance settings: {e}")
        return default_settings


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
    maintenance_settings = get_maintenance_settings()

    # Load changelog and defects from JSON files
    with open('changelog.json', 'r') as f:
        changelog_data = json.load(f)
    with open('defects.json', 'r') as f:
        defects_data = json.load(f)

    return render_template('index.html', app_version=app_version, last_updated=last_updated_date,
                           changelog=changelog_data, defects=defects_data,
                           maintenance_mode_on=maintenance_settings.get('enabled', False))


# --- Route to get the admin PIN ---
@app.route('/get-admin-pin', methods=['GET'])
def get_admin_pin():
    try:
        pin_ref = db.collection('config').document('admin_pin')
        pin_doc = pin_ref.get()
        if pin_doc.exists:
            pin = pin_doc.to_dict().get('pin')
            return jsonify({'success': True, 'pin': pin}), 200
        else:
            # If the PIN doesn't exist, create it with a default value
            pin_ref.set({'pin': '3511'})
            return jsonify({'success': True, 'pin': '3511'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
                'pin': profile_data.get('pin'),
                'theme': profile_data.get('theme', 'dark')
            })

        profile_limit = get_limit('admin_settings', 'profiles', 3)
        limit_reached = len(profiles) >= profile_limit

        if profiles:
            print(f"✅ DB Check: Found {len(profiles)} driver profile(s).")
            return jsonify({'profiles_exist': True, 'profiles': profiles, 'limit_reached': limit_reached}), 200
        else:
            print("ℹ️ DB Check: No driver profiles found in the system.")
            return jsonify({'profiles_exist': False, 'profiles': [], 'limit_reached': limit_reached}), 200
    except Exception as e:
        print(f"❌ Error checking profiles: {e}")
        return jsonify({'error': str(e)}), 500


# --- Route to create a driver profile ---
@app.route('/create-profile', methods=['POST'])
def create_profile():
    """
    Creates a new driver profile document in Firestore, checking for duplicates and the profile limit.
    """
    try:
        # Check against the profile limit first
        profile_limit = get_limit('admin_settings', 'profiles', 3)
        current_profiles = list(db.collection('driver_profiles').stream())
        if len(current_profiles) >= profile_limit:
            return jsonify({'success': False, 'message': f'Profile limit of {profile_limit} reached.'}), 403

        data = request.get_json()
        username = data.get('username')
        helmet_color = data.get('helmetColor', '#ffffff')
        pin = data.get('pin')
        pin_enabled = data.get('pinEnabled', False)
        theme = data.get('theme', 'dark')

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
            'theme': theme,
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
        if 'theme' in data:
            updates['theme'] = data['theme']

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
    Deletes a driver profile and all its subcollections.
    """
    try:
        if not profile_id:
            return jsonify({'success': False, 'message': 'Profile ID is required.'}), 400

        profile_ref = db.collection('driver_profiles').document(profile_id)

        # Delete subcollections
        for collection in ['garages', 'vehicles', 'events', 'checklists', 'tracks']:
            docs = profile_ref.collection(collection).stream()
            for doc in docs:
                doc.reference.delete()
            print(f"✅ Deleted {collection} for profile {profile_id}")

        # Delete the main profile document
        profile_ref.delete()
        print(f"✅ Driver profile deleted: {profile_id}")

        return jsonify({'success': True, 'message': 'Profile and all associated data deleted successfully!'}), 200
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
        username = data.get('username', 'Anonymous Readiness Check')  # Default username
        app_version = get_app_version()

        print(f"LOG: '{username}' is getting ready. Writing to Firestore...")
        doc_ref = db.collection('readiness_checks').document()
        doc_ref.set({
            'username': username,
            'timestamp': datetime.datetime.now(datetime.timezone.utc),
            'status': 'Ready!',
            'app_version': app_version
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
        # Check against the feature request limit
        settings = get_feature_request_settings()
        current_requests = list(db.collection('feature_requests').stream())
        if len(current_requests) >= settings['limit']:
            return jsonify({'success': False, 'message': f"Feature request limit of {settings['limit']} reached."}), 403

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


# --- Route to get existing feature requests ---
@app.route('/get-feature-requests', methods=['GET'])
def get_feature_requests():
    """
    Retrieves all feature requests from Firestore, ordered by submission time.
    """
    try:
        requests_ref = db.collection('feature_requests').order_by(
            'submitted_at', direction=firestore.Query.DESCENDING
        ).stream()

        requests = []
        for doc in requests_ref:
            request_data = doc.to_dict()
            requests.append({
                'id': doc.id,
                'username': request_data.get('username'),
                'requestText': request_data.get('requestText')
            })

        settings = get_feature_request_settings()
        limit_reached = len(requests) >= settings['limit']

        print(f"✅ DB Check: Found {len(requests)} feature request(s).")
        return jsonify({
            'success': True,
            'requests': requests,
            'deletion_enabled': settings['deletion_enabled'],
            'limit_reached': limit_reached
        }), 200
    except Exception as e:
        print(f"❌ Error getting feature requests: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# --- Route to delete a feature request ---
@app.route('/delete-feature-request/<request_id>', methods=['DELETE'])
def delete_feature_request(request_id):
    """
    Deletes a specific feature request document from Firestore.
    """
    try:
        if not request_id:
            return jsonify({'success': False, 'message': 'Request ID is required.'}), 400

        db.collection('feature_requests').document(request_id).delete()
        print(f"✅ Feature request deleted: {request_id}")
        return jsonify({'success': True, 'message': 'Feature request deleted successfully!'}), 200
    except Exception as e:
        print(f"❌ Error deleting feature request: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Routes for Admin Settings ---
@app.route('/get-admin-settings', methods=['GET'])
def get_admin_settings():
    profile_limit = get_limit('admin_settings', 'profiles', 3)
    feature_request_settings = get_feature_request_settings()
    garage_limit = get_limit('admin_settings', 'garages', 10)
    vehicle_limit = get_limit('admin_settings', 'vehicles', 25)
    lap_time_settings = get_lap_time_settings()
    maintenance_settings = get_maintenance_settings()
    garage_settings = get_garage_settings()
    return jsonify({
        'success': True,
        'profile_limit': profile_limit,
        'feature_request_settings': feature_request_settings,
        'garage_limit': garage_limit,
        'vehicle_limit': vehicle_limit,
        'lap_time_settings': lap_time_settings,
        'maintenance_settings': maintenance_settings,
        'garage_settings': garage_settings,
    }), 200


def update_limit(collection_name, document_name, min_val, max_val):
    try:
        data = request.get_json()
        new_limit = data.get('limit')

        if new_limit is None:
            return jsonify({'success': False, 'message': 'Limit is required.'}), 400

        try:
            new_limit = int(new_limit)
        except ValueError:
            return jsonify({'success': False, 'message': 'Limit must be a number.'}), 400

        if not min_val <= new_limit <= max_val:
            return jsonify({'success': False, 'message': f'Limit must be between {min_val} and {max_val}.'}), 400

        db.collection(collection_name).document(document_name).set({'limit': new_limit})
        print(f"✅ {document_name.capitalize()} limit updated to: {new_limit}")
        return jsonify({'success': True, 'message': f'{document_name.capitalize()} limit updated to {new_limit}.'}), 200
    except Exception as e:
        print(f"❌ Error updating {document_name} limit: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/update-profile-limit', methods=['POST'])
def update_profile_limit():
    return update_limit('admin_settings', 'profiles', 1, 20)


@app.route('/update-garage-limit', methods=['POST'])
def update_garage_limit():
    return update_limit('admin_settings', 'garages', 1, 10)


@app.route('/update-vehicle-limit', methods=['POST'])
def update_vehicle_limit():
    return update_limit('admin_settings', 'vehicles', 1, 25)


@app.route('/update-feature-request-settings', methods=['POST'])
def update_feature_request_settings():
    """
    Updates the feature request settings in Firestore.
    """
    try:
        data = request.get_json()
        new_limit = data.get('limit')
        deletion_enabled = data.get('deletion_enabled')

        updates = {}
        if new_limit is not None:
            try:
                new_limit = int(new_limit)
                if not 1 <= new_limit <= 50:
                    return jsonify({'success': False, 'message': 'Limit must be between 1 and 50.'}), 400
                updates['limit'] = new_limit
            except ValueError:
                return jsonify({'success': False, 'message': 'Limit must be a number.'}), 400

        if deletion_enabled is not None:
            if not isinstance(deletion_enabled, bool):
                return jsonify({'success': False, 'message': 'Deletion enabled must be a boolean.'}), 400
            updates['deletion_enabled'] = deletion_enabled

        if not updates:
            return jsonify({'success': False, 'message': 'No settings to update.'}), 400

        db.collection('admin_settings').document('feature_requests').update(updates)
        print(f"✅ Feature request settings updated: {updates}")
        return jsonify({'success': True, 'message': 'Feature request settings updated.'}), 200
    except Exception as e:
        print(f"❌ Error updating feature request settings: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/update-lap-time-settings', methods=['POST'])
def update_lap_time_settings():
    """
    Updates the lap time settings in Firestore.
    """
    try:
        data = request.get_json()
        deletion_enabled = data.get('deletion_enabled')
        updates = {}
        if deletion_enabled is not None:
            if not isinstance(deletion_enabled, bool):
                return jsonify({'success': False, 'message': 'Deletion enabled must be a boolean.'}), 400
            updates['deletion_enabled'] = deletion_enabled

        if not updates:
            return jsonify({'success': False, 'message': 'No settings to update.'}), 400

        db.collection('admin_settings').document('lap_times').update(updates)
        print(f"✅ Lap time settings updated: {updates}")
        return jsonify({'success': True, 'message': 'Lap time settings updated.'}), 200
    except Exception as e:
        print(f"❌ Error updating lap time settings: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/update-garage-settings', methods=['POST'])
def update_garage_settings():
    """
    Updates the garage settings in Firestore.
    """
    try:
        data = request.get_json()
        deletion_enabled = data.get('deletion_enabled')
        updates = {}
        if deletion_enabled is not None:
            if not isinstance(deletion_enabled, bool):
                return jsonify({'success': False, 'message': 'Deletion enabled must be a boolean.'}), 400
            updates['deletion_enabled'] = deletion_enabled

        if not updates:
            return jsonify({'success': False, 'message': 'No settings to update.'}), 400

        db.collection('admin_settings').document('garages').update(updates)
        print(f"✅ Garage settings updated: {updates}")
        return jsonify({'success': True, 'message': 'Garage settings updated.'}), 200
    except Exception as e:
        print(f"❌ Error updating garage settings: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/update-maintenance-mode', methods=['POST'])
def update_maintenance_mode():
    try:
        data = request.get_json()
        enabled = data.get('enabled')
        if not isinstance(enabled, bool):
            return jsonify({'success': False, 'message': 'Enabled must be a boolean.'}), 400

        db.collection('config').document('maintenance').set({'enabled': enabled})
        status = "enabled" if enabled else "disabled"
        return jsonify({'success': True, 'message': f'Maintenance mode {status}.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Garage Management Routes ---
@app.route('/add-garage', methods=['POST'])
def add_garage():
    """
    Adds a new garage for a specific user profile.
    """
    try:
        data = request.get_json()
        profile_id = data.get('profileId')
        garage_name = data.get('garageName')

        if not profile_id or not garage_name:
            return jsonify({'success': False, 'message': 'Profile ID and garage name are required.'}), 400

        if len(garage_name) > 25:
            return jsonify({'success': False, 'message': 'Garage name cannot exceed 25 characters.'}), 400

        garage_limit = get_limit('admin_settings', 'garages', 10)
        garages_ref = db.collection('driver_profiles').document(profile_id).collection('garages')
        current_garages = list(garages_ref.stream())
        if len(current_garages) >= garage_limit:
            return jsonify({'success': False, 'message': f'Garage limit of {garage_limit} reached.'}), 403

        # Check for duplicate name
        existing_garage = garages_ref.where('name', '==', garage_name).limit(1).get()
        if existing_garage:
            return jsonify(
                {'success': False, 'message': f'A garage with the name "{garage_name}" already exists.'}), 409

        doc_ref = garages_ref.document()
        doc_ref.set({
            'name': garage_name,
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        })
        print(f"✅ New garage '{garage_name}' added for profile {profile_id}")
        return jsonify(
            {'success': True, 'message': f"Garage '{garage_name}' added successfully!", 'garageId': doc_ref.id}), 201
    except Exception as e:
        print(f"❌ Error adding garage: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/get-garages/<profile_id>', methods=['GET'])
def get_garages(profile_id):
    """
    Retrieves all garages for a specific user profile and their associated vehicles.
    """
    try:
        if not profile_id:
            return jsonify({'success': False, 'message': 'Profile ID is required.'}), 400

        vehicles_ref = db.collection('driver_profiles').document(profile_id).collection('vehicles').stream()
        all_vehicles = []
        for doc in vehicles_ref:
            vehicle = doc.to_dict()
            vehicle['id'] = doc.id
            all_vehicles.append(vehicle)

        garages_ref = db.collection('driver_profiles').document(profile_id).collection('garages').stream()
        garages = []
        for doc in garages_ref:
            garage_data = doc.to_dict()
            garage_id = doc.id
            garages.append({
                'id': garage_id,
                'name': garage_data.get('name'),
                'vehicles': [v for v in all_vehicles if v.get('garageId') == garage_id],
                'shared': garage_data.get('shared', False),
                'garageDoorCode': garage_data.get('garageDoorCode', '')
            })

        garage_limit = get_limit('admin_settings', 'garages', 10)
        limit_reached = len(garages) >= garage_limit

        print(f"✅ Found {len(garages)} garages for profile {profile_id}")
        return jsonify({'success': True, 'garages': garages, 'limit_reached': limit_reached}), 200
    except Exception as e:
        print(f"❌ Error getting garages: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/update-garage/<profile_id>/<garage_id>', methods=['PUT'])
def update_garage(profile_id, garage_id):
    """
    Updates a garage's name.
    """
    try:
        data = request.get_json()
        new_name = data.get('name')

        if not new_name:
            return jsonify({'success': False, 'message': 'New garage name is required.'}), 400
        if len(new_name) > 25:
            return jsonify({'success': False, 'message': 'Garage name cannot exceed 25 characters.'}), 400

        db.collection('driver_profiles').document(profile_id).collection('garages').document(garage_id).update({
            'name': new_name
        })
        print(f"✅ Garage {garage_id} updated to '{new_name}' for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Garage updated successfully!'}), 200
    except Exception as e:
        print(f"❌ Error updating garage: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/delete-garage/<profile_id>/<garage_id>', methods=['DELETE'])
def delete_garage(profile_id, garage_id):
    """
    Deletes a garage.
    """
    try:
        db.collection('driver_profiles').document(profile_id).collection('garages').document(garage_id).delete()
        print(f"✅ Garage {garage_id} deleted for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Garage deleted successfully!'}), 200
    except Exception as e:
        print(f"❌ Error deleting garage: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Vehicle Management Routes ---
@app.route('/add-vehicle/<profile_id>', methods=['POST'])
def add_vehicle(profile_id):
    try:
        vehicle_limit = get_limit('admin_settings', 'vehicles', 25)
        current_vehicles = list(db.collection('driver_profiles').document(profile_id).collection('vehicles').stream())
        if len(current_vehicles) >= vehicle_limit:
            return jsonify({'success': False, 'message': f'Vehicle limit of {vehicle_limit} reached.'}), 403

        data = request.get_json()
        vehicle_data = {
            'year': data.get('year'),
            'make': data.get('make'),
            'model': data.get('model'),
            'garageId': data.get('garageId'),
            'photo': data.get('photo'),  # Base64 string
            'photoURL': data.get('photoURL'),  # URL string
            'created_at': datetime.datetime.now(datetime.timezone.utc),
            'order': len(current_vehicles)
        }

        if not all([vehicle_data['year'], vehicle_data['make'], vehicle_data['model']]):
            return jsonify({'success': False, 'message': 'Year, Make, and Model are required.'}), 400

        doc_ref = db.collection('driver_profiles').document(profile_id).collection('vehicles').document()
        doc_ref.set(vehicle_data)
        print(f"✅ New vehicle added for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Vehicle added successfully!', 'vehicleId': doc_ref.id}), 201
    except Exception as e:
        print(f"❌ Error adding vehicle: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/get-vehicles/<profile_id>', methods=['GET'])
def get_vehicles(profile_id):
    try:
        garages_ref = db.collection('driver_profiles').document(profile_id).collection('garages').stream()
        garage_map = {doc.id: doc.to_dict().get('name', 'Unknown') for doc in garages_ref}

        vehicles_ref = db.collection('driver_profiles').document(profile_id).collection('vehicles').order_by(
            'order').stream()
        vehicles = []
        for doc in vehicles_ref:
            vehicle = doc.to_dict()
            vehicle['id'] = doc.id
            vehicle['garageName'] = garage_map.get(vehicle.get('garageId'))
            vehicles.append(vehicle)

        vehicle_limit = get_limit('admin_settings', 'vehicles', 25)
        limit_reached = len(vehicles) >= vehicle_limit

        print(f"✅ Found {len(vehicles)} vehicles for profile {profile_id}")
        return jsonify({'success': True, 'vehicles': vehicles, 'limit_reached': limit_reached}), 200
    except Exception as e:
        print(f"❌ Error getting vehicles: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/update-vehicle/<profile_id>/<vehicle_id>', methods=['PUT'])
def update_vehicle(profile_id, vehicle_id):
    try:
        data = request.get_json()
        updates = {
            'year': data.get('year'),
            'make': data.get('make'),
            'model': data.get('model'),
            'garageId': data.get('garageId'),
        }
        if data.get('photo'):
            updates['photo'] = data.get('photo')
            updates['photoURL'] = None
        elif 'photoURL' in data:
            updates['photoURL'] = data.get('photoURL')
            updates['photo'] = None

        if not all([updates['year'], updates['make'], updates['model']]):
            return jsonify({'success': False, 'message': 'Year, Make, and Model are required.'}), 400

        db.collection('driver_profiles').document(profile_id).collection('vehicles').document(vehicle_id).update(
            updates)
        print(f"✅ Vehicle {vehicle_id} updated for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Vehicle updated successfully!'}), 200
    except Exception as e:
        print(f"❌ Error updating vehicle: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/delete-vehicle/<profile_id>/<vehicle_id>', methods=['DELETE'])
def delete_vehicle(profile_id, vehicle_id):
    try:
        db.collection('driver_profiles').document(profile_id).collection('vehicles').document(vehicle_id).delete()
        print(f"✅ Vehicle {vehicle_id} deleted for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Vehicle deleted successfully!'}), 200
    except Exception as e:
        print(f"❌ Error deleting vehicle: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/update-vehicle-order/<profile_id>', methods=['POST'])
def update_vehicle_order(profile_id):
    try:
        data = request.get_json()
        ordered_ids = data.get('order')
        batch = db.batch()
        for index, vehicle_id in enumerate(ordered_ids):
            vehicle_ref = db.collection('driver_profiles').document(profile_id).collection('vehicles').document(
                vehicle_id)
            batch.update(vehicle_ref, {'order': index})
        batch.commit()
        print(f"✅ Vehicle order updated for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Vehicle order saved!'}), 200
    except Exception as e:
        print(f"❌ Error updating vehicle order: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Race Schedule Routes ---
@app.route('/add-event/<profile_id>', methods=['POST'])
def add_event(profile_id):
    try:
        data = request.get_json()
        event_data = {
            'name': data.get('name'),
            'start_time': data.get('startTime'),
            'end_time': data.get('endTime'),
            'vehicles': data.get('vehicles', []),
            'checklists': data.get('checklists', []),
            'trackId': data.get('trackId'),
            'is_raceday': data.get('isRaceday', False),
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        if not event_data['name'] or not event_data['start_time']:
            return jsonify({'success': False, 'message': 'Event name and start time are required.'}), 400

        doc_ref = db.collection('driver_profiles').document(profile_id).collection('events').document()
        doc_ref.set(event_data)
        print(f"✅ New event '{event_data['name']}' added for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Event added successfully!', 'eventId': doc_ref.id}), 201
    except Exception as e:
        print(f"❌ Error adding event: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/get-events/<profile_id>', methods=['GET'])
def get_events(profile_id):
    try:
        vehicles_ref = db.collection('driver_profiles').document(profile_id).collection('vehicles').stream()
        vehicle_map = {doc.id: doc.to_dict() for doc in vehicles_ref}

        tracks_ref = db.collection('tracks').stream()
        track_map = {doc.id: doc.to_dict() for doc in tracks_ref}

        events_ref = db.collection('driver_profiles').document(profile_id).collection('events').order_by(
            'start_time').stream()
        events = []
        for doc in events_ref:
            event = doc.to_dict()
            event['id'] = doc.id

            track_id = event.get('trackId')
            if track_id in track_map:
                event['trackName'] = track_map[track_id].get('name', 'Unknown Track')
                event['trackPhoto'] = track_map[track_id].get('photo')
                event['trackPhotoURL'] = track_map[track_id].get('photoURL')

            event_vehicles = []
            for vehicle_id in event.get('vehicles', []):
                if vehicle_id in vehicle_map:
                    event_vehicles.append(vehicle_map[vehicle_id])
            event['vehicles'] = event_vehicles

            events.append(event)
        return jsonify({'success': True, 'events': events}), 200
    except Exception as e:
        print(f"❌ Error getting events: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/get-all-events', methods=['GET'])
def get_all_events():
    """
    Retrieves all events from all profiles for the global lap time feature.
    """
    try:
        events_ref = db.collection_group('events').stream()
        events = []
        for doc in events_ref:
            event = doc.to_dict()
            event['id'] = doc.id
            events.append(event)

        events.sort(key=lambda x: x.get('start_time', ''), reverse=True)

        print(f"✅ Found and sorted {len(events)} total events for Winner's Circle.")
        return jsonify({'success': True, 'events': events}), 200
    except Exception as e:
        print(f"❌ Error getting all events: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/update-event/<profile_id>/<event_id>', methods=['PUT'])
def update_event(profile_id, event_id):
    try:
        data = request.get_json()
        updates = {
            'name': data.get('name'),
            'start_time': data.get('startTime'),
            'end_time': data.get('endTime'),
            'vehicles': data.get('vehicles', []),
            'checklists': data.get('checklists', []),
            'trackId': data.get('trackId'),
            'is_raceday': data.get('isRaceday', False)
        }
        if not updates['name'] or not updates['start_time']:
            return jsonify({'success': False, 'message': 'Event name and start time are required.'}), 400

        db.collection('driver_profiles').document(profile_id).collection('events').document(event_id).update(updates)
        print(f"✅ Event {event_id} updated for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Event updated successfully!'}), 200
    except Exception as e:
        print(f"❌ Error updating event: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/delete-event/<profile_id>/<event_id>', methods=['DELETE'])
def delete_event(profile_id, event_id):
    try:
        db.collection('driver_profiles').document(profile_id).collection('events').document(event_id).delete()
        print(f"✅ Event {event_id} deleted for profile {profile_id}")
        return jsonify({'success': True, 'message': 'Event deleted successfully!'}), 200
    except Exception as e:
        print(f"❌ Error deleting event: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/get-next-raceday/<profile_id>', methods=['GET'])
def get_next_raceday(profile_id):
    try:
        now = datetime.datetime.now(datetime.timezone.utc)

        events_ref = db.collection('driver_profiles').document(profile_id).collection('events') \
            .where('is_raceday', '==', True).stream()

        future_events = []
        for doc in events_ref:
            event = doc.to_dict()
            start_time_str = event.get('start_time')
            if start_time_str:
                event_time = datetime.datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                if event_time > now:
                    future_events.append(event)

        if not future_events:
            return jsonify({'success': True, 'event': None}), 200

        future_events.sort(key=lambda x: x['start_time'])
        next_event = future_events[0]

        return jsonify({'success': True, 'event': next_event}), 200
    except Exception as e:
        print(f"❌ Error getting next raceday for profile {profile_id}: {e}")
        return jsonify({'success': False, 'event': None}), 500


# --- Checklist Routes ---
@app.route('/add-checklist/<profile_id>', methods=['POST'])
def add_checklist(profile_id):
    try:
        data = request.get_json()
        checklist_data = {
            'name': data.get('name'),
            'pre_race_tasks': data.get('pre_race_tasks', []),
            'mid_day_tasks': data.get('mid_day_tasks', []),
            'post_race_tasks': data.get('post_race_tasks', []),
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        if not checklist_data['name']:
            return jsonify({'success': False, 'message': 'Checklist name is required.'}), 400

        doc_ref = db.collection('driver_profiles').document(profile_id).collection('checklists').document()
        doc_ref.set(checklist_data)
        return jsonify({'success': True, 'message': 'Checklist created successfully!', 'checklistId': doc_ref.id}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/get-checklists/<profile_id>', methods=['GET'])
def get_checklists(profile_id):
    try:
        checklists_ref = db.collection('driver_profiles').document(profile_id).collection('checklists').stream()
        checklists = [doc.to_dict() for doc in checklists_ref]
        for checklist, doc in zip(checklists, checklists_ref):
            checklist['id'] = doc.id
        return jsonify({'success': True, 'checklists': checklists}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/update-checklist/<profile_id>/<checklist_id>', methods=['PUT'])
def update_checklist(profile_id, checklist_id):
    try:
        data = request.get_json()
        updates = {
            'name': data.get('name'),
            'pre_race_tasks': data.get('pre_race_tasks', []),
            'mid_day_tasks': data.get('mid_day_tasks', []),
            'post_race_tasks': data.get('post_race_tasks', []),
        }
        if not updates['name']:
            return jsonify({'success': False, 'message': 'Checklist name is required.'}), 400

        db.collection('driver_profiles').document(profile_id).collection('checklists').document(checklist_id).update(
            updates)
        return jsonify({'success': True, 'message': 'Checklist updated successfully!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/delete-checklist/<profile_id>/<checklist_id>', methods=['DELETE'])
def delete_checklist(profile_id, checklist_id):
    try:
        db.collection('driver_profiles').document(profile_id).collection('checklists').document(checklist_id).delete()
        return jsonify({'success': True, 'message': 'Checklist deleted successfully!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Lap Time Routes ---
@app.route('/add-lap-time', methods=['POST'])
def add_lap_time():
    try:
        data = request.get_json()
        event_id = data.get('eventId')
        lap_time = data.get('lapTime')
        username = data.get('username')

        if not all([event_id, lap_time, username]):
            return jsonify({'success': False, 'message': 'Missing data.'}), 400

        doc_ref = db.collection('lap_times').document()
        doc_ref.set({
            'eventId': event_id,
            'lapTime': lap_time,
            'username': username,
            'timestamp': datetime.datetime.now(datetime.timezone.utc)
        })
        return jsonify({'success': True, 'message': 'Lap time recorded!', 'lapId': doc_ref.id}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/get-lap-times/<event_id>', methods=['GET'])
def get_lap_times(event_id):
    try:
        lap_time_settings = get_lap_time_settings()
        times_ref = db.collection('lap_times').where('eventId', '==', event_id).stream()
        lap_times = []
        for doc in times_ref:
            time = doc.to_dict()
            time['id'] = doc.id
            lap_times.append(time)

        lap_times.sort(key=lambda x: x['lapTime'])
        return jsonify({
            'success': True,
            'lap_times': lap_times,
            'deletion_enabled': lap_time_settings['deletion_enabled']
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/update-lap-time/<lap_id>', methods=['PUT'])
def update_lap_time(lap_id):
    try:
        data = request.get_json()
        new_lap_time = data.get('lapTime')
        requesting_user = data.get('username')

        lap_ref = db.collection('lap_times').document(lap_id)
        lap_doc = lap_ref.get()

        if not lap_doc.exists:
            return jsonify({'success': False, 'message': 'Lap time not found.'}), 404

        if lap_doc.to_dict().get('username') != requesting_user:
            return jsonify({'success': False, 'message': 'You can only edit your own lap times.'}), 403

        lap_ref.update({'lapTime': new_lap_time})
        print(f"✅ Lap time updated: {lap_id}")
        return jsonify({'success': True, 'message': 'Lap time updated successfully!'}), 200
    except Exception as e:
        print(f"❌ Error updating lap time: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/delete-lap-time/<lap_id>', methods=['DELETE'])
def delete_lap_time(lap_id):
    try:
        settings = get_lap_time_settings()
        if not settings['deletion_enabled']:
            return jsonify({'success': False, 'message': 'Deletion is not enabled.'}), 403

        db.collection('lap_times').document(lap_id).delete()
        print(f"✅ Lap time deleted: {lap_id}")
        return jsonify({'success': True, 'message': 'Lap time deleted successfully!'}), 200
    except Exception as e:
        print(f"❌ Error deleting lap time: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Track Management Routes ---
@app.route('/add-track', methods=['POST'])
def add_track():
    try:
        data = request.get_json()
        track_data = {
            'name': data.get('name'),
            'location': data.get('location'),
            'type': data.get('type'),
            'photo': data.get('photo'),
            'photoURL': data.get('photoURL'),
            'layout_photo': data.get('layout_photo'),
            'layout_photoURL': data.get('layout_photoURL'),
            'google_url': data.get('google_url'),
            'profileId': data.get('profileId'),  # Creator's ID for ownership
            'created_at': datetime.datetime.now(datetime.timezone.utc)
        }
        if not all([track_data['name'], track_data['location'], track_data['type'], track_data['profileId']]):
            return jsonify({'success': False, 'message': 'Missing required track data.'}), 400

        doc_ref = db.collection('tracks').document()
        doc_ref.set(track_data)
        return jsonify({'success': True, 'message': 'Track added successfully!', 'trackId': doc_ref.id}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/get-all-tracks', methods=['GET'])
def get_all_tracks():
    try:
        all_events_ref = db.collection_group('events').stream()
        events_by_track = {}
        for doc in all_events_ref:
            event = doc.to_dict()
            track_id = event.get('trackId')
            if track_id:
                if track_id not in events_by_track:
                    events_by_track[track_id] = []
                events_by_track[track_id].append(event.get('name'))

        tracks_ref = db.collection('tracks').stream()
        tracks = []
        for doc in tracks_ref:
            track = doc.to_dict()
            track['id'] = doc.id
            track['events'] = events_by_track.get(doc.id, [])
            tracks.append(track)

        tracks.sort(key=lambda x: x.get('name', ''))
        return jsonify({'success': True, 'tracks': tracks}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/update-track/<track_id>', methods=['PUT'])
def update_track(track_id):
    try:
        data = request.get_json()
        requesting_user_id = data.pop('profileId', None)

        track_ref = db.collection('tracks').document(track_id)
        track_doc = track_ref.get()
        if not track_doc.exists:
            return jsonify({'success': False, 'message': 'Track not found.'}), 404

        if track_doc.to_dict().get('profileId') != requesting_user_id:
            return jsonify({'success': False, 'message': 'You can only edit tracks you created.'}), 403

        track_ref.update(data)
        return jsonify({'success': True, 'message': 'Track updated successfully!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/delete-track/<track_id>', methods=['DELETE'])
def delete_track(track_id):
    try:
        data = request.get_json()
        requesting_user_id = data.get('profileId')

        track_ref = db.collection('tracks').document(track_id)
        track_doc = track_ref.get()
        if not track_doc.exists:
            return jsonify({'success': False, 'message': 'Track not found.'}), 404

        if track_doc.to_dict().get('profileId') != requesting_user_id:
            return jsonify({'success': False, 'message': 'You can only delete tracks you created.'}), 403

        track_ref.delete()
        return jsonify({'success': True, 'message': 'Track deleted successfully!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


# --- Data Seeding and Clearing Routes ---
def delete_collection(coll_ref, batch_size):
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0
    for doc in docs:
        # Recursively delete subcollections
        for sub_coll in doc.reference.collections():
            delete_collection(sub_coll, batch_size)
        doc.reference.delete()
        deleted += 1
    if deleted >= batch_size:
        return delete_collection(coll_ref, batch_size)


@app.route('/clear-all-data', methods=['DELETE'])
def clear_all_data():
    try:
        print("--- ⚠️ DANGER: Deleting all user data from Firestore. ---")
        collections_to_delete = ['driver_profiles', 'lap_times', 'tracks', 'readiness_checks']
        for coll_name in collections_to_delete:
            coll_ref = db.collection(coll_name)
            delete_collection(coll_ref, 50)
            print(f"✅ Successfully deleted all documents in '{coll_name}'.")
        print("ℹ️ Skipping deletion of 'feature_requests' collection.")
        return jsonify({'success': True, 'message': 'All user data has been cleared.'}), 200
    except Exception as e:
        print(f"❌ Error clearing all data: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


@app.route('/seed-database', methods=['POST'])
def seed_database():
    try:
        data = request.get_json()
        mock_users = data.get('users')
        mock_tracks = data.get('tracks')

        # 1. Seed Tracks
        track_id_map = {}
        for i, track_data in enumerate(mock_tracks):
            track_data['created_at'] = datetime.datetime.now(datetime.timezone.utc)
            # Add a placeholder profileId, as it's required by the schema
            track_data['profileId'] = "SEED_DATA"
            track_ref = db.collection('tracks').document()
            track_ref.set(track_data)
            track_id_map[i] = track_ref.id
        print(f"✅ Seeded {len(mock_tracks)} tracks.")

        # 2. Seed Users and their data
        for user_data in mock_users:
            # Create Profile
            profile_data = user_data['profile']
            profile_data['created_at'] = datetime.datetime.now(datetime.timezone.utc)
            profile_ref = db.collection('driver_profiles').document()
            profile_ref.set(profile_data)

            # Create Garages
            garage_id_map = {}
            for i, garage_data in enumerate(user_data['garages']):
                garage_data['created_at'] = datetime.datetime.now(datetime.timezone.utc)
                garage_ref = profile_ref.collection('garages').document()
                garage_ref.set(garage_data)
                garage_id_map[i] = garage_ref.id

            # Create Vehicles
            vehicle_id_map = {}
            for i, vehicle_data in enumerate(user_data['vehicles']):
                garage_index = vehicle_data.pop('garageIndex', None)
                if garage_index is not None and garage_index in garage_id_map:
                    vehicle_data['garageId'] = garage_id_map[garage_index]
                vehicle_data['created_at'] = datetime.datetime.now(datetime.timezone.utc)
                vehicle_data['order'] = i
                vehicle_ref = profile_ref.collection('vehicles').document()
                vehicle_ref.set(vehicle_data)
                vehicle_id_map[i] = vehicle_ref.id

            # Create Checklists
            checklist_id_map = {}
            for i, checklist_data in enumerate(user_data['checklists']):
                checklist_data['created_at'] = datetime.datetime.now(datetime.timezone.utc)
                checklist_ref = profile_ref.collection('checklists').document()
                checklist_ref.set(checklist_data)
                checklist_id_map[i] = checklist_ref.id

            # Create Events
            event_id_map = {}
            for event_data in user_data.get('events', []):
                track_index = event_data.pop('trackIndex', None)
                if track_index is not None and track_index in track_id_map:
                    event_data['trackId'] = track_id_map[track_index]

                vehicle_indices = event_data.pop('vehicleIndices', [])
                event_data['vehicles'] = [vehicle_id_map[i] for i in vehicle_indices if i in vehicle_id_map]

                checklist_indices = event_data.pop('checklistIndices', [])
                event_data['checklists'] = [checklist_id_map[i] for i in checklist_indices if i in checklist_id_map]

                # Generate dynamic start/end times relative to today
                start_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
                    days=10 + len(user_data['events']))
                end_time = start_time + datetime.timedelta(hours=8)
                event_data['start_time'] = start_time.isoformat()
                event_data['end_time'] = end_time.isoformat()

                event_data['created_at'] = datetime.datetime.now(datetime.timezone.utc)
                event_ref = profile_ref.collection('events').document()
                event_ref.set(event_data)
                event_id_map[event_data['name']] = event_ref.id

            # Seed lap times for this event if they exist
            if 'lap_times' in user_data:
                for lap_time_data in user_data['lap_times']:
                    event_name = lap_time_data['eventName']
                    if event_name in event_id_map:
                        db.collection('lap_times').add({
                            'eventId': event_id_map[event_name],
                            'lapTime': lap_time_data['lapTime'],
                            'username': profile_data['username'],
                            'timestamp': datetime.datetime.now(datetime.timezone.utc)
                        })

        print(f"✅ Seeded {len(mock_users)} users and their associated data.")
        return jsonify({'success': True, 'message': 'Database seeded successfully!'}), 200
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        return jsonify({'success': False, 'message': f'An error occurred: {e}'}), 500


if __name__ == '__main__':
    # This block allows the script to be run directly.
    # debug=True allows for auto-reloading when you save changes.
    app.run(debug=True)
