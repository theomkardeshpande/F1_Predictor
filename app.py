from flask import Flask, request, jsonify
import pickle
import numpy as np
import os

# Create Flask app
app = Flask(__name__)

# Load your trained model, scaler, and imputer
model_path = 'saved_model.pkl'  # Ensure this path matches your saved model file
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model file not found at {model_path}. Please ensure it's correctly saved.")

with open(model_path, 'rb') as f:
    model_data = pickle.load(f)

model = model_data['model']
scaler = model_data['scaler']
imputer = model_data['imputer']
features = model_data['features']

# Optional: Feature importance for reference
feature_importances = model.feature_importances_

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        # Validate incoming data keys
        required_keys = [
            'qualifying_time', 'rain_probability', 'temperature',
            'team_performance', 'clean_air_pace', 'position_change', 'sector_time'
        ]
        missing_keys = [key for key in required_keys if key not in data]
        if missing_keys:
            return jsonify({"error": f"Missing keys: {', '.join(missing_keys)}"}), 400

        # Extract and convert input features
        input_array = np.array([[
            float(data['qualifying_time']),
            float(data['rain_probability']),
            float(data['temperature']),
            float(data['team_performance']),
            float(data['clean_air_pace']),
            float(data['position_change']),
            float(data['sector_time'])
        ]])

        # Select only relevant features for prediction
        input_df = pd.DataFrame(input_array, columns=features)

        # Impute missing values if any (though likely none)
        input_imp = imputer.transform(input_df)

        # Scale input features
        input_scaled = scaler.transform(input_imp)

        # Make prediction
        predicted_time = model.predict(input_scaled)[0]
        
        # Optional: Calculate confidence or other metrics here
        # For simplicity, we return predicted lap time with a confidence estimate
        confidence = max(85, min(100, (100 - abs(predicted_time - Y_actual_mean)))))  # placeholder

        # Return response
        return jsonify({
            'predicted_lap_time': round(predicted_time, 3),
            'confidence': round(confidence, 1)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Optional health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

# Optional info route
@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify({
        "features": features,
        "importances": feature_importances.tolist()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
