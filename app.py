from flask import Flask, request, jsonify, render_template
# from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd

app = Flask(__name__)
# core(app)

def load_model():
    try:
        with open('saved_model.pkl', 'rb') as f:
            return pickle.load(f)
    except FileNotFoundError:
        return None

MODEL_DATA = load_model()
if MODEL_DATA:
    model = MODEL_DATA['model']
    scaler = MODEL_DATA['scaler']
    imputer = MODEL_DATA['imputer']
    features = MODEL_DATA['features']
    # Compute and store the training target mean for confidence calculation
    # (Assumes MODEL_DATA contains a key 'AvgLapTime'; set this when training)
    AvgLapTime = MODEL_DATA.get('AvgLapTime', None)
    print("AVGLAPTIME:",AvgLapTime)
else:
    model = scaler = imputer = None
    features = []
    AvgLapTime = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predictor')
def predictor():
    return render_template('predictor.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if not MODEL_DATA:
            return jsonify({'error': 'Model not loaded.'}), 500

        data = request.get_json(force=True)
        required_keys = [
            'qualifying_time', 'rain_probability', 'temperature',
            'team_performance', 'clean_air_pace', 'position_change', 'sector_time'
        ]
        missing = [k for k in required_keys if k not in data]
        if missing:
            return jsonify({'error': f"Missing keys: {', '.join(missing)}"}), 400

        # Map incoming JSON to DataFrame with correct column names
        input_dict = {
            'QualifyingTime (s)': float(data['qualifying_time']),
            'RainProbability': float(data['rain_probability']) / 100.0,
            'Temperature (C)': float(data['temperature']),
            'TeamPerformanceScore': float(data['team_performance']),
            'CleanAirRacePace (s)': float(data['clean_air_pace']),
            'AveragePositionChange': float(data['position_change']),
            'TotalSectorTime (s)': float(data['sector_time'])
        }
        input_df = pd.DataFrame([input_dict], columns=features)

        # Preprocess: impute and scale
        X_imp = imputer.transform(input_df)
        X_scaled = scaler.transform(X_imp)

        # Predict
        predicted_time = model.predict(X_scaled)[0]
        print("Predicted Time:",predicted_time)

        # Confidence: require AvgLapTime to be set
        if AvgLapTime is not None:
            diff = abs(predicted_time - AvgLapTime)
            raw_conf = 100 - diff
            confidence = max(85, min(100, raw_conf))
        else:
            confidence = 85.0

        print("Data Send")
        return jsonify({
            'predicted_lap_time': round(predicted_time, 3),
            'confidence': round(confidence, 1)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

try:
    if __name__ == '__main__':
        app.run(debug=False)
except KeyboardInterrupt:
    print("Shutting Down Flask Server")
# Optional health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

# Optional info route
@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify({
        "features": features,
        # "importances": feature_importances.tolist()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

