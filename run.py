# Import necessary modules
import os
from flask import Flask, jsonify, request, abort
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from apps import create_app, db
from apps.config import config_dict
import logging

# Load environment variables from .env file
load_dotenv()

# Get configuration mode (Debug/Production) from environment variables
DEBUG = (os.getenv('DEBUG', 'False') == 'True')
get_config_mode = 'Debug' if DEBUG else 'Production'

try:
    app_config = config_dict[get_config_mode.capitalize()]
except KeyError:
    exit('Error: Invalid <config_mode>. Expected values [Debug, Production]')

# Create Flask app with the chosen configuration
app = create_app(app_config)

# Configure logging
logging.basicConfig(level=logging.DEBUG if DEBUG else logging.INFO)
logger = logging.getLogger(__name__)

# Function to establish a secure database connection
def get_db_connection():
    try:
        return psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'majorprojectpredictivemodel'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'Pranita@1509')  # Ideally, use a secure way to store this
        )
    except psycopg2.DatabaseError as db_error:
        logger.error(f"Database connection error: {db_error}")
        abort(500, description="Database connection failed.")

# 1. Population Search by Ward with Year Filter
@app.route('/api/population-search', methods=['GET'])
def population_search():
    wardno = request.args.get('wardno', '1')
    year = request.args.get('year', default = 1991)
    query = """
        SELECT wardno, totalpop, totalmale, totalfemale, totalcaste, totaltribes, totalliterates, totalilliterates
        FROM population1
        WHERE wardno = %s AND year = %s;
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, (wardno, year))
        data = cur.fetchall()
        if not data:
            return jsonify({'message': 'No data found for the selected ward and year'}), 404
        return jsonify(data)
    except psycopg2.Error as e:
        logger.error(f"Error executing query: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# 2. Gender-Based Comparisons
@app.route('/api/gender-comparison', methods=['GET'])
def gender_comparison():
    year = request.args.get('year', default = 1991)
    comparison_type = request.args.get('type', 'population')

    # Log or print for debugging
    logger.debug(f"Received comparison_type: {comparison_type}")

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    query_map = {
        'population': "SELECT year, SUM(totalmale) AS total_male, SUM(totalfemale) AS total_female FROM population1 WHERE year = %s GROUP BY year;",
        'literacy': "SELECT year, SUM(maleliterates) AS male_literates, SUM(femaleliterates) AS female_literates FROM population1 WHERE year = %s GROUP BY year;",
        'illiterate': "SELECT year, SUM(maleilliterates) AS male_illiterates, SUM(femaleilliterates) AS female_illiterates FROM population1 WHERE year = %s GROUP BY year;",
        'castes': "SELECT year, SUM(totalmale) AS male_castes, SUM(totalfemale) AS female_castes FROM population1 WHERE year = %s GROUP BY year;"
    }

    query = query_map.get(comparison_type)
    if not query:
        return jsonify({'error': 'Invalid comparison type'}), 400

    try:
        cur.execute(query, (year,))
        data = cur.fetchone()
        if not data:
            return jsonify({'message': 'No data found'}), 404
        return jsonify(data)
    except psycopg2.Error as e:
        logger.error(f"Error executing query: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# 3. Population Trends Over Time
@app.route('/api/population-trends', methods=['GET'])
def population_trends():
    query = """
        SELECT year, SUM(totalpop) AS total_population
        FROM population1
        WHERE year != 2041
        GROUP BY year
        ORDER BY year;
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query)
        data = cur.fetchall()
        if not data:
            return jsonify({'message': 'No data found for population trends'}), 404
        return jsonify(data)
    except psycopg2.Error as e:
        logger.error(f"Error executing query: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# 4. Caste and Tribe Analysis
@app.route('/api/caste-tribe-analysis', methods=['GET'])
def caste_tribe_analysis():
    year = request.args.get('year', default=1991)
    query = """
        SELECT year, SUM(totalcaste) AS total_caste, SUM(totaltribes) AS total_tribe
        FROM population1
        WHERE year = %s
        GROUP BY year;
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, (year,))
        data = cur.fetchall()
        if not data:
            return jsonify({'message': 'No data found'}), 404
        return jsonify(data)
    except psycopg2.Error as e:
        logger.error(f"Error executing query: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# 5. Literacy Analysis
@app.route('/api/literacy-analysis', methods=['GET'])
def literacy_analysis():
    year = request.args.get('year', default=1991)
    query = """
        SELECT year, SUM(totalliterates) AS total_literates, SUM(maleliterates) AS male_literates, SUM(femaleliterates) AS female_literates
        FROM population1
        WHERE year = %s
        GROUP BY year;
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, (year,))
        data = cur.fetchall()
        if not data:
            return jsonify({'message': 'No data found'}), 404
        return jsonify(data)
    except psycopg2.Error as e:
        logger.error(f"Error executing query: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# 6. Illiteracy Analysis
@app.route('/api/illiteracy-analysis', methods=['GET'])
def illiteracy_analysis():
    year = request.args.get('year', default=1991)
    query = """
        SELECT year, SUM(totalilliterates) AS total_illiterates, SUM(maleilliterates) AS male_illiterates, SUM(femaleilliterates) AS female_illiterates
        FROM population1
        WHERE year = %s
        GROUP BY year;
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, (year,))
        data = cur.fetchall()
        if not data:
            return jsonify({'message': 'No data found'}), 404
        return jsonify(data)
    except psycopg2.Error as e:
        logger.error(f"Error executing query: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# 7. Ward-wise Analysis with Year Filter
@app.route('/api/ward-analysis', methods=['GET'])
def ward_analysis():
    year = request.args.get('year', default=1991)
    query = """
        SELECT wardno, totalpop, totalcaste, totaltribes
        FROM population1
        WHERE year = %s;
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(query, (year,))
        data = cur.fetchall()
        if not data:
            return jsonify({'message': 'No data found for the selected year'}), 404
        return jsonify(data)
    except psycopg2.Error as e:
        logger.error(f"Error executing query: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

# Run the app with the correct debug setting
if __name__ == "__main__":
    with app.app_context():
        logger.debug("Initializing database...")
        db.create_all()
        logger.debug("Database initialized.")
    
    # Ensure debug mode is only on in development
    app.run(debug=DEBUG)
