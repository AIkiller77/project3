from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///site.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Initialize login manager
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'

# Models
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    date_registered = db.Column(db.DateTime, default=datetime.utcnow)
    games = db.relationship('Game', backref='player', lazy=True)

    def __repr__(self):
        return f"User('{self.username}', '{self.email}')"

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_type = db.Column(db.String(20), nullable=False)  # 'tetris' or 'snake'
    score = db.Column(db.Integer, nullable=False)
    ai_level = db.Column(db.Integer, nullable=False)
    date_played = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"Game('{self.game_type}', '{self.score}', '{self.ai_level}')"

class AIPerformance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_type = db.Column(db.String(20), nullable=False)  # 'tetris' or 'snake'
    difficulty_level = db.Column(db.Integer, nullable=False)
    average_score = db.Column(db.Float, nullable=False)
    games_played = db.Column(db.Integer, nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"AIPerformance('{self.game_type}', '{self.difficulty_level}', '{self.average_score}')"

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route('/')
def index():
    """Render the home page."""
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Handle user registration."""
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Check if username or email already exists
        user_exists = User.query.filter_by(username=username).first()
        email_exists = User.query.filter_by(email=email).first()
        
        if user_exists:
            flash('Username already taken. Please choose a different one.', 'danger')
        elif email_exists:
            flash('Email already registered. Please use a different one.', 'danger')
        else:
            # Create new user
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            new_user = User(username=username, email=email, password=hashed_password)
            db.session.add(new_user)
            db.session.commit()
            flash('Your account has been created! You can now log in.', 'success')
            return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login."""
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember') == 'on'
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password, password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Login unsuccessful. Please check username and password.', 'danger')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    """Handle user logout."""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Render the user dashboard."""
    # Get user's game history
    user_games = Game.query.filter_by(user_id=current_user.id).order_by(Game.date_played.desc()).all()
    
    # Get stats for each game type
    tetris_games = [game for game in user_games if game.game_type == 'tetris']
    snake_games = [game for game in user_games if game.game_type == 'snake']
    
    tetris_stats = {
        'games_played': len(tetris_games),
        'high_score': max([game.score for game in tetris_games]) if tetris_games else 0,
        'average_score': sum([game.score for game in tetris_games]) / len(tetris_games) if tetris_games else 0
    }
    
    snake_stats = {
        'games_played': len(snake_games),
        'high_score': max([game.score for game in snake_games]) if snake_games else 0,
        'average_score': sum([game.score for game in snake_games]) / len(snake_games) if snake_games else 0
    }
    
    # Get AI performance metrics
    ai_performance = AIPerformance.query.all()
    
    return render_template('dashboard.html', 
                          user_games=user_games[:10],  # Show only last 10 games
                          tetris_stats=tetris_stats,
                          snake_stats=snake_stats,
                          ai_performance=ai_performance)

@app.route('/play/<game_type>')
@login_required
def play_game(game_type):
    """Render the game page for the specified game type."""
    if game_type not in ['tetris', 'snake']:
        flash('Invalid game type.', 'danger')
        return redirect(url_for('dashboard'))
    
    # Get AI difficulty levels
    ai_levels = [1, 2, 3]  # Basic, Intermediate, Advanced
    
    return render_template('play.html', game_type=game_type, ai_levels=ai_levels)

@app.route('/leaderboard')
def leaderboard():
    """Render the leaderboard page."""
    # Get top scores for Tetris
    tetris_leaders = db.session.query(
        User.username, Game.score
    ).join(Game).filter(
        Game.game_type == 'tetris'
    ).order_by(
        Game.score.desc()
    ).limit(10).all()
    
    # Get top scores for Snake
    snake_leaders = db.session.query(
        User.username, Game.score
    ).join(Game).filter(
        Game.game_type == 'snake'
    ).order_by(
        Game.score.desc()
    ).limit(10).all()
    
    return render_template('leaderboard.html', tetris_leaders=tetris_leaders, snake_leaders=snake_leaders)

@app.route('/api/save_game', methods=['POST'])
@login_required
def save_game():
    """API endpoint to save game results."""
    data = request.json
    game_type = data.get('game_type')
    score = data.get('score')
    ai_level = data.get('ai_level')
    
    if not all([game_type, score, ai_level]):
        return jsonify({'success': False, 'message': 'Missing required data'}), 400
    
    # Save game result
    new_game = Game(
        game_type=game_type,
        score=score,
        ai_level=ai_level,
        user_id=current_user.id
    )
    db.session.add(new_game)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Game saved successfully'})

@app.route('/api/save_gameplay_data', methods=['POST'])
@login_required
def save_gameplay_data():
    """Save human gameplay data for AI training."""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    # Process and save the gameplay data
    # This would typically involve storing the data in a format suitable for AI training
    
    return jsonify({'success': True, 'message': 'Gameplay data saved successfully'})

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    """Handle contact form submissions."""
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')
        
        # Here you would typically send an email or save to database
        # For now, we'll just flash a success message
        
        flash(f'Thank you {name} for your message! We will get back to you soon.', 'success')
        return redirect(url_for('thank_you'))
    
    return render_template('contact.html')

@app.route('/thank-you')
def thank_you():
    """Render the thank you page."""
    return render_template('thank_you.html')

# Create database tables
with app.app_context():
    db.create_all()

# Run the application
if __name__ == '__main__':
    app.run(debug=True)
