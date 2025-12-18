# Mahjong

![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)
![Vite](https://img.shields.io/badge/bundler-Vite-blueviolet.svg)
![Testing](https://img.shields.io/badge/testing-Playwright-green.svg)

This repository contains a modern implementation of an American Mahjong game, built with JavaScript and Vite. It features separate implementations for desktop and mobile, a core game logic engine, and a comprehensive test suite using Playwright.

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed on your machine.

### Installation

1. Clone the repository:

   ```sh
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```sh
   cd mahjong
   ```

3. Install the dependencies:

   ```sh
   npm install
   ```

### Running the Development Server

To start the Vite development server, run:

```sh
npm run dev
```

Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## 🧪 Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

- **Run all tests:**

  ```sh
  npm test
  ```

- **Run tests in UI mode:**

  ```sh
  npm run test:ui
  ```

- **Run tests in headed mode:**

  ```sh
  npm run test:headed
  ```

- **Run tests specifically for the mobile version:**

  ```sh
  npm run test:mobile
  ```

- **Generate a test report:**

  ```sh
  npm run test:report
  ```

## 📂 Project Structure

The project is organized into the following main directories:

- `assets/`: Contains all game assets like images and audio files.
- `core/`: Holds the core game logic, including the AI engine and game controller, shared between platforms.
- `desktop/`: Contains the implementation specific to the desktop version of the game.
- `mobile/`: Contains the implementation specific to the mobile version of the game.
- `pwa/`: Progressive Web App configuration files.
- `tests/`: Contains all the end-to-end tests written with Playwright.
- `shared/`: Contains code shared across different parts of the application.

## ✨ Linting and Code Quality

This project uses ESLint for code linting and Knip for detecting unused files and exports.

- **Run ESLint:**

  ```sh
  npm run lint
  ```

- **Run Knip:**

  ```sh
  npm run knip
  ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is unlicensed.
