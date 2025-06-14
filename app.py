from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Import utility function for analytics
from calculate_frequencies import calculate_frequencies

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
db = SQLAlchemy(app)

# Models
class Spin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=datetime.now)

class SpinBackup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    result = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime)
    backup_time = db.Column(db.DateTime)

# Homepage
@app.route('/')
def index():
    return render_template('index.html')

# Add or retrieve spins
@app.route('/spins', methods=['GET', 'POST'])
def handle_spins():
    if request.method == 'POST':
        data = request.get_json()
        if not data or "result" not in data:
            return jsonify({"error": "Missing 'result' field"}), 400
        try:
            result = int(data["result"])
        except (ValueError, TypeError):
            return jsonify({"error": "Result must be an integer"}), 400

        spin = Spin(number=result)
        db.session.add(spin)
        db.session.commit()
        return jsonify({
            "result": spin.number,
            "timestamp": spin.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }), 201

    spins = Spin.query.order_by(Spin.timestamp).all()
    return jsonify([
        {
            "result": spin.number,
            "timestamp": spin.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        } for spin in spins
    ])

# Delete a spin by index (based on timestamp order)
@app.route('/spins/<int:index>', methods=['DELETE'])
def delete_spin(index):
    spins = Spin.query.order_by(Spin.timestamp).all()
    if 0 <= index < len(spins):
        spin_to_delete = spins[index]
        db.session.delete(spin_to_delete)
        db.session.commit()
        return jsonify({
            "result": spin_to_delete.number,
            "timestamp": spin_to_delete.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }), 200
    return jsonify({"error": "Invalid spin index"}), 404

# Backup and reset spins
@app.route('/reset', methods=['POST'])
def reset_database_create_backup():
    spins = Spin.query.all()
    if spins:
        backup_time = datetime.now()

        for spin in spins:
            db.session.add(SpinBackup(
                result=spin.number,
                timestamp=spin.timestamp,
                backup_time=backup_time
            ))

        # JSON backup
        backup_data = [
            {
                "result": spin.number,
                "timestamp": spin.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            } for spin in spins
        ]
        filename = f"backup_spins_{backup_time.strftime('%Y-%m-%d_%H-%M-%S')}.json"
        with open(filename, 'w') as f:
            json.dump(backup_data, f, indent=2)

        for spin in spins:
            db.session.delete(spin)

        db.session.commit()

    return jsonify({"message": "Spins backed up and database cleared."}), 200

# Statistics route
@app.route('/stats')
def get_stats():
    spins = [s.number for s in Spin.query.order_by(Spin.timestamp).all()]
    number_freq, color_freq = calculate_frequencies(spins)
    return jsonify({
        'number_freq': number_freq,
        'color_freq': color_freq,
    })

# Run app
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
