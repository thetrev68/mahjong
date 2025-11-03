# American Mahjong Game

![American Mahjong](https://img.shields.io/badge/Game-American%20Mahjong-green)
![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow)
![Phaser](https://img.shields.io/badge/Engine-Phaser.IO-blue)
![ES6 Modules](https://img.shields.io/badge/Modules-ES6-brightgreen)

A fully-featured American Mahjong game implementation in JavaScript using the Phaser.IO game engine. Play against intelligent AI opponents with authentic mahjong rules and mechanics.

## 🎮 Game Overview

This American Mahjong game features:

- **4-Player Game**: Human player vs 3 AI opponents
- **Authentic Rules**: Complete American Mahjong gameplay including Charleston, courtesy passes, and exposures
- **Smart AI**: Intelligent computer opponents with advanced decision-making algorithms
- **Training Mode**: Practice with predefined hands and tile counts
- **Multiple Card Years**: Support for 2017-2020 mahjong card variations
- **Interactive UI**: Mouse-based controls with drag-and-drop tile management

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, or Edge recommended)
- [Node.js](https://nodejs.org/) and npm

### Running the Game

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).**

4. **Click "Start Game" to begin playing!**

### Browser Requirements

- **Chrome**: Latest version (recommended)
- **Firefox**: With ES6 module support enabled
- **Microsoft Edge**: Latest version

## 🎯 How to Play

### Basic Game Flow

1. **Start**: Click "Start Game" to initialize a new match
2. **Charleston**: Pass 3 tiles to each opponent (mandatory)
3. **Courtesy Pass**: Optional tile exchange with opposite player
4. **Game Loop**: 
   - Pick tile from wall
   - Discard or claim opponent's discards
   - Form sets (Pung/Kong/Quint) through exposures
   - Declare Mahjong when you have a winning hand

### Player Controls

#### Mouse Interactions
- **Click**: Select/deselect tiles
- **Drag & Drop**: Reorder tiles in your hand
- **Button Clicks**: Perform game actions

#### Game Buttons
- **Start Game**: Begin a new game
- **Discard**: Discard selected tile
- **Exchange Joker**: Swap selected tile for exposed joker
- **Mahjong!**: Declare victory when you have a winning hand
- **Sort by suit/rank**: Organize your tiles
- **Hint**: Get AI suggestions for best moves

### Training Mode

Enable training mode to:
- Select specific starting hands for practice
- Choose tile count (1-14 tiles)
- Skip Charleston for faster gameplay
- Focus on specific mahjong strategies

## 🏗️ Technical Architecture

### Core Components

```
main.js                 # Main entry point and Phaser initialization
gameLogic.js           # Game state management and flow control
gameAI.js              # AI decision making and strategy
gameObjects/           # Game object classes
├── gameObjects.js     # Tile, Wall, Discard classes
├── gameObjects_table.js # Table and player coordination
├── gameObjects_hand.js # Hand management and interactions
└── gameObjects_player.js # Player class
constants.js           # Game constants and enumerations
card/                  # Mahjong hand validation system
├── card.js           # Main validation logic
├── 2017/, 2018/, 2019/, 2020/ # Different card years
```

### Key Features

#### AI System (`gameAI.js`)
- **Tile Ranking**: Evaluates tile importance for discarding
- **Hand Analysis**: Ranks possible winning hands
- **Strategic Decisions**: 
  - Charleston pass selection
  - Courtesy voting
  - Discard claiming
  - Joker exchanges

#### Hand Validation (`card/`)
- **Multi-Year Support**: Handles different mahjong card rules
- **Pattern Matching**: Validates hands against official patterns
- **Component Analysis**: Breaks down hands into winning components
- **Rank Calculation**: Scores hands for AI decision making

#### Game State Management
- **Turn Order**: Proper clockwise player progression
- **State Machine**: Handles all game phases seamlessly
- **Event System**: Manages player interactions and AI responses
- **Error Handling**: Robust validation and user feedback

## 📁 Project Structure

```
├── index.html                 # Main game interface
├── main.js                   # Phaser game initialization
├── constants.js              # Game constants
├── assets/                   # Game assets
│   ├── tiles.png            # Tile sprite sheet
│   ├── tiles.json           # Tile sprite atlas
│   └── back.png             # Tile back texture
├── card/                     # Hand validation system
│   ├── card.js              # Main validation engine
│   ├── 2017/                # 2017 mahjong card rules
│   ├── 2018/                # 2018 mahjong card rules
│   ├── 2019/                # 2019 mahjong card rules
│   ├── 2020/                # 2020 mahjong card rules
│   └── 2025/                # 2025 mahjong card rules
└── game*.js                  # Core game logic files
```

## 🎲 Mahjong Rules Implementation

### American Mahjong Features

- **152 Tiles**: Complete American Mahjong tile set
- **Charleston**: Mandatory 3-tile passes (can repeat twice)
- **Courtesy Pass**: Optional tile exchange with opposite player
- **Exposures**: Form Pung (3), Kong (4), Quint (5) sets
- **Jokers**: Special tiles that can substitute for any tile
- **Seats**: Fixed positions (Bottom/Right/Top/Left)
- **Wall**: 144 tiles in wall, 8 in dead wall

### Hand Categories

The game supports multiple hand categories:
- Singles and Pairs
- Consecutive Numbers
- Like Numbers (same number, different suits)
- 2468 and 13579 patterns
- Winds and Dragons
- Lucky 13 combinations
- Quints (5-of-a-kind)

### Winning Conditions

- **Mahjong**: Complete valid 14-tile hand
- **Concealed vs Exposed**: Different requirements based on hand type
- **Dead Wall**: Last 8 tiles are not drawn from

## 🔧 Development

### Code Organization

- **ES6 Modules**: Modern JavaScript module system
- **Class-based Architecture**: Clean object-oriented design
- **Separation of Concerns**: Logic, AI, and presentation layers
- **Constants**: Centralized game configuration

### Key Classes

- **`GameLogic`**: Main game controller and state manager
- **`GameAI`**: Computer player decision making
- **`Table`**: Game table and player coordination
- **`Hand`**: Player hand management and validation
- **`Tile`**: Individual tile representation and behavior
- **`Card`**: Mahjong hand validation engine

### AI Algorithm Details

The AI system uses sophisticated algorithms:

1. **Hand Ranking**: Evaluates all possible winning hands
2. **Tile Valuation**: Ranks tiles by importance to winning
3. **Pattern Recognition**: Identifies optimal component formation
4. **Risk Assessment**: Considers opponent actions and wall state
5. **Strategic Exchange**: Optimizes joker and exposure decisions

## 🎨 Customization

### Adding New Hand Patterns

1. Create new hand definition files in `card/[year]/`
2. Update the hand categories and validation logic
3. Add corresponding tests to ensure accuracy

### Modifying AI Behavior

- Adjust tile ranking weights in `gameAI.js`
- Modify hand analysis algorithms
- Customize decision-making thresholds

### Visual Customization

- Replace tile sprites in `assets/`
- Modify UI styling in `index.html`
- Adjust game dimensions in `constants.js`

## 📄 License

This American Mahjong implementation is provided as-is for educational and entertainment purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

### Development Guidelines

- Follow ES6 module patterns
- Maintain separation between game logic and presentation
- Add comprehensive comments for complex algorithms
- Test new features across different mahjong card years

## 📞 Support

For questions or issues:
- Check browser console for error messages
- Ensure ES6 module support is enabled
- Verify local web server is running
- Test with latest Chrome or Firefox

---

## Credits

### Audio

- みんなの創作支援サイトＴスタ (discard_tile.mp3).

### Sprites, AI Logic, and Game Core

- https://github.com/pauls-gh/mahjong

---

**American Mahjong v1.00** - Built with Phaser.IO and modern JavaScript

*Enjoy playing authentic American Mahjong against intelligent AI opponents!*
