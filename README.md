# Game AI Platform

A comprehensive web application that allows users to play Tetris and Snake against AI agents at multiple difficulty levels. Built with Flask, Python, and JavaScript.

## Features

- **Classic Games**: Play Tetris and Snake with responsive controls
- **AI Opponents**: Challenge AI agents trained with reinforcement learning at different difficulty levels
- **User Authentication**: Create an account to track your progress and scores
- **Dashboard**: View your game statistics and AI performance metrics
- **Leaderboard**: Compare your scores with other players
- **Responsive Design**: Play on desktop or mobile devices

## Technologies Used

- **Backend**: Flask, SQLAlchemy, Flask-Login
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Database**: SQLite (development), PostgreSQL (production)
- **AI**: Deep Q-Network (DQN) for reinforcement learning

## Project Structure

```
project/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── static/                # Static files
│   ├── css/               # CSS stylesheets
│   │   └── style.css      # Main stylesheet
│   ├── js/                # JavaScript files
│   │   ├── main.js        # Shared functionality
│   │   ├── tetris.js      # Tetris game implementation
│   │   └── snake.js       # Snake game implementation
│   └── images/            # Image assets
├── templates/             # HTML templates
│   ├── base.html          # Base template
│   ├── index.html         # Home page
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── dashboard.html     # User dashboard
│   ├── play.html          # Game play page
│   ├── leaderboard.html   # Leaderboard page
│   ├── contact.html       # Contact page
│   └── thank_you.html     # Thank you page
└── README.md              # Project documentation
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <project-directory>
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the project root with the following content:
   ```
   SECRET_KEY=your_secret_key
   DATABASE_URL=sqlite:///site.db
   ```

6. Initialize the database:
   ```
   python
   >>> from app import app, db
   >>> with app.app_context():
   >>>     db.create_all()
   >>> exit()
   ```

7. Run the application:
   ```
   python app.py
   ```

8. Open your browser and navigate to `http://127.0.0.1:5000`

## Development Roadmap

### Phase 1: Game Development
- [x] Implement Tetris game
- [x] Implement Snake game
- [x] Develop responsive UI controls

### Phase 2: AI Agent Development
- [x] Implement basic AI for Tetris
- [x] Implement basic AI for Snake
- [ ] Train advanced AI models using reinforcement learning
- [ ] Integrate human gameplay data into AI training

### Phase 3: Web Application Development
- [x] Set up Flask with user authentication
- [x] Design and implement database schema
- [x] Implement dashboard and leaderboard
- [x] Develop matchmaking system
- [x] Integrate game engine with web application

### Phase 4: Integration and Final Testing
- [ ] Integrate all components
- [ ] Perform final testing and quality assurance

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Tetris Guideline](https://tetris.wiki/Tetris_Guideline)
- [Snake Game Genre](https://en.wikipedia.org/wiki/Snake_%28video_game_genre%29)
- [Flask Documentation](https://flask.palletsprojects.com/)
