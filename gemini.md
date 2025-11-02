
# Gemini Project Overview: American Mahjong Game

This document provides a high-level overview of the American Mahjong game project to guide future development and analysis.

## 1. Project Goal

The project is a web-based, 4-player American Mahjong game. It features a single human player competing against three AI-controlled opponents. The game is built using modern web technologies and aims to provide an authentic and engaging Mahjong experience.

## 2. Core Technologies

*   **JavaScript (ES6 Modules):** The entire codebase is written in modern JavaScript, utilizing ES6 modules for a clean, organized, and maintainable structure. All scripts are loaded with `type="module"`.
*   **Vite:** The project uses Vite for a fast development server and efficient build process.
*   **Phaser 3:** The game is built on the Phaser 3 game engine (`v3.90.0`), which handles rendering, game loop management, and user input. Phaser is installed locally as a dependency.
*   **HTML5 & CSS:** The user interface, including the game board, buttons, and informational displays, is structured with HTML5 and styled with CSS.

## 3. Project Structure

The project is organized into several key files and directories:

*   **`index.html`:** The main entry point for the application. It sets up the HTML structure, includes the Phaser library, and loads the main game scripts.
*   **`main.js`:** The primary script that initializes the Phaser game instance and the main `GameScene`.
*   **`GameScene.js`:** The core of the game, extending `Phaser.Scene`. It manages game objects, handles game logic, and processes user interactions.
*   **`gameLogic.js`:** Contains the central state machine and rules engine for the game, managing turns, game phases (like the Charleston), and win conditions.
*   **`gameAI.js`:** Implements the logic and strategy for the three AI opponents, including tile evaluation, hand analysis, and decision-making.
*   **`gameObjects/`:** A directory containing classes for various game elements, such as `Tile`, `Hand`, and `Table`.
*   **`card/`:** This directory contains the hand validation system. It is structured with subdirectories for different years (e.g., `2017`, `2025`), each containing the specific rules and hand patterns for that year's Mahjong card.
*   **`assets/`:** Contains all game assets, including images for the tiles (`tiles.png`, `tiles.json`) and audio files.
*   **`constants.js`:** A centralized file for defining game-wide constants, such as window dimensions and game parameters.
*   **`package.json`:** Defines project metadata, scripts, and dependencies. Key dependencies include Phaser for the game engine and Vite for the development server and build process.

## 4. Key Features

*   **Single Player vs. AI:** The game is designed for a single human player against three AI opponents.
*   **Authentic Gameplay:** Implements official American Mahjong rules, including the Charleston, courtesy passes, and tile exposures.
*   **Multi-Year Card Support:** The game supports Mahjong cards from various years (2017-2020, and 2025), with a system in place to easily add more.
*   **Training Mode:** A special mode that allows players to practice with specific hands and scenarios.
*   **Interactive UI:** A user-friendly interface with features like drag-and-drop tile management and informational displays.

## 5. Running the Project

To run the game, you need to have Node.js and npm installed. The project uses Vite for a development server. See the README.md for detailed instructions.

## 6. Development Guidelines

*   **Modularity:** Adhere to the existing ES6 module structure.
*   **Class-Based Architecture:** Follow the object-oriented design, creating classes for distinct game components.
*   **Separation of Concerns:** Keep game logic (`gameLogic.js`), AI (`gameAI.js`), and presentation (`GameScene.js`) separate.
*   **Use of Constants:** Use the `constants.js` file for any new game-wide constants.
