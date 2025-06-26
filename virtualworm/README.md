# Virtual Worm Native

A React Native game featuring an AI-powered worm with neural network movement, toxic substance management, enemy spawning, and dynamic speed systems.

## 🏗️ File Structure

The project has been reorganized into a clean, modular architecture:

```
src/
├── constants/
│   └── GameConstants.js          # Global game parameters and constants
├── engine/
│   └── WormEngine.js             # Neural network engine for worm movement
├── systems/
│   ├── GameManager.js            # Main game coordinator
│   ├── WormMovementSystem.js     # Worm movement and pathfinding
│   ├── EnemySystem.js            # Enemy spawning and AI
│   ├── ToxicSubstanceSystem.js   # Toxic area management
│   ├── FoodSystem.js             # Food placement and consumption
│   ├── RestSystem.js             # Worm resting mechanics
│   └── SpeedSystem.js            # Speed variations and bursts
└── screens/
    └── GameScreen.js             # Main game UI and rendering
```

## 🎮 Game Systems

### 1. **Game Constants** (`constants/GameConstants.js`)
Centralized configuration for all game parameters:
- Screen dimensions and UI constants
- Worm properties (size, speed, sense radius)
- Enemy settings (size, speed, spawn intervals)
- Toxic substance parameters (duration, renewal thresholds)
- Rest system configuration
- Speed system parameters
- Animation constants

### 2. **Worm Engine** (`engine/WormEngine.js`)
Neural network-based movement system:
- Multi-layer neural network with sensory, hidden, and motor neurons
- Activation functions (sigmoid, ReLU, tanh)
- Direction prediction based on sensory inputs
- Boundary collision detection

### 3. **Game Manager** (`systems/GameManager.js`)
Main coordinator that orchestrates all systems:
- Initializes and manages all game systems
- Handles the main game loop
- Coordinates system interactions
- Manages game state updates

### 4. **Worm Movement System** (`systems/WormMovementSystem.js`)
Handles worm movement logic:
- Target selection (food, toxic areas, random points)
- Pathfinding and movement calculations
- Target reached detection
- Movement animation with sway effects

### 5. **Enemy System** (`systems/EnemySystem.js`)
Manages enemy behavior:
- Enemy spawning from screen edges
- AI movement towards the worm
- Toxic area protection (enemies destroyed near toxic areas)
- Collision detection and cleanup

### 6. **Toxic Substance System** (`systems/ToxicSubstanceSystem.js`)
Manages toxic area mechanics:
- Toxic area initialization and status tracking
- Duration management and renewal logic
- Status formatting for UI display
- Developer functions for testing

### 7. **Food System** (`systems/FoodSystem.js`)
Handles food mechanics:
- Food placement on screen
- Food consumption by worm
- Food state management

### 8. **Rest System** (`systems/RestSystem.js`)
Manages worm resting behavior:
- Random rest initiation
- Rest duration and cooldown management
- Speed reduction during rest periods

### 9. **Speed System** (`systems/SpeedSystem.js`)
Handles speed variations:
- Random speed changes
- Burst (depar) mechanics
- Speed multiplier management
- Integration with rest system

## 🎯 Key Features

### Neural Network Movement
- The worm uses a 5-layer neural network for movement decisions
- Sensory inputs include movement direction and environmental data
- Smooth, organic movement patterns with sway effects

### Toxic Substance Management
- 4 strategic toxic areas on the map
- 48-hour duration with 12-hour renewal threshold
- Enemies are destroyed when approaching toxic areas
- Visual status indicators for each area

### Dynamic Enemy System
- Enemies spawn from screen edges
- AI-driven movement towards the worm
- Spawn rate inversely proportional to active toxic areas
- Click to remove enemies manually

### Rest and Speed Mechanics
- Random rest periods with natural variation
- Speed bursts (depar) for dynamic gameplay
- Continuous speed variations for realistic movement
- Rest cooldown system

### Food System
- Click to place food anywhere on screen
- Worm prioritizes food within sense radius
- Automatic food consumption
- Multiple food items supported

## 🔧 Development

### Adding New Features
1. **Constants**: Add new parameters to `GameConstants.js`
2. **System**: Create a new system class in `systems/`
3. **Integration**: Add the system to `GameManager.js`
4. **UI**: Update `GameScreen.js` for visual representation

### Modifying Game Parameters
All game parameters are centralized in `GameConstants.js`:
- Worm speed: `WORM.BASE_SPEED`
- Enemy spawn rate: `ENEMY.SPAWN_INTERVAL`
- Toxic duration: `TOXIC.DURATION`
- Rest probability: `REST.PROBABILITY`

### Testing Features
Use the Developer Panel (accessible via the "Geliştirici" button):
- Reset toxic areas
- Fill all toxic areas
- Test with 30-second toxic duration

## 🚀 Performance Optimizations

- **Modular Systems**: Each system handles its own logic independently
- **Efficient Updates**: Only necessary state updates are performed
- **Optimized Rendering**: Canvas-based rendering with minimal re-renders
- **Memory Management**: Proper cleanup of enemies and expired toxic areas

## 📱 UI Components

- **Canvas**: Main game area with Skia rendering
- **Debug Panel**: Real-time game state information
- **Menu Bar**: Food placement, toxic status, and developer panel
- **Overlays**: Interactive areas for food placement and toxic area management

## 🔄 Game Loop

1. **Update Systems**: Each system updates its state
2. **Process Interactions**: Handle user input and system interactions
3. **Update Game State**: Apply changes to game state
4. **Render**: Update UI with new state
5. **Repeat**: Continue loop at 60 FPS

This modular architecture makes the codebase maintainable, extensible, and easy to understand while preserving all the original game functionality.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
