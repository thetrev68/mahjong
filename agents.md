# AI Agents Documentation

## Overview

This American Mahjong game features sophisticated AI agents that serve as computer opponents, providing challenging and intelligent gameplay. The AI system implements advanced algorithms for mahjong strategy, hand evaluation, and decision-making.

## 🤖 AI Agent Architecture

### Core Components

The AI system consists of several interconnected components:

```
GameAI Class (gameAI.js)
├── Tile Ranking System
├── Hand Analysis Engine
├── Strategic Decision Making
├── Charleston Logic
├── Courtesy Vote System
└── Exposure Management
```

### AI Agent Capabilities

Each AI agent (players 1-3) possesses:

- **Hand Evaluation**: Analyzes current hand strength and potential
- **Tile Ranking**: Determines optimal tiles to discard
- **Strategic Planning**: Considers long-term hand development
- **Risk Assessment**: Evaluates opponent threats and opportunities
- **Pattern Recognition**: Identifies winning hand patterns
- **Adaptive Behavior**: Adjusts strategy based on game state

## 🎯 AI Decision Making Process

### 1. Hand Analysis Engine

The AI continuously evaluates its hand using sophisticated algorithms:

```javascript
// Core hand analysis workflow
rankHandArray14(hand) {
    // Generate all possible winning hands
    // Calculate ranking scores
    // Determine optimal component formation
}
```

#### Hand Ranking Algorithm

1. **Component Analysis**: Breaks down hand into potential winning components
2. **Pattern Matching**: Compares against official mahjong patterns
3. **Score Calculation**: Assigns numerical rankings to possible hands
4. **Virtual Suit Mapping**: Handles flexible suit assignments
5. **Joker Optimization**: Maximizes joker utility

#### Key Features

- **Multi-Pattern Recognition**: Supports 100+ official hand patterns
- **Dynamic Scoring**: Real-time hand strength evaluation
- **Component Matching**: Identifies optimal tile groupings
- **Virtual Number Handling**: Manages consecutive number patterns

### 2. Tile Ranking System

The AI uses a sophisticated tile ranking system to determine discard priorities:

```javascript
rankTiles14(hand) {
    // Evaluate each tile's impact on hand strength
    // Calculate ranking scores
    // Sort tiles by strategic importance
}
```

#### Ranking Methodology

1. **Impact Analysis**: Measures each tile's contribution to winning potential
2. **Delta Calculation**: Compares hand strength with/without each tile
3. **Weighting System**: Higher weights for tiles in high-ranking hands
4. **Risk Assessment**: Considers defensive implications of discards

#### Strategic Considerations

- **Offensive Priority**: Favors tiles that advance winning potential
- **Defensive Awareness**: Avoids discarding tiles that help opponents
- **Pattern Flexibility**: Maintains multiple winning possibilities
- **Joker Management**: Optimizes joker placement and usage

### 3. Strategic Decision Making

The AI makes informed decisions at each game phase:

#### Turn Decision Process

1. **Mahjong Check**: Immediate victory detection
2. **Joker Exchange**: Evaluate automatic joker exchanges
3. **Discard Selection**: Choose optimal tile to discard
4. **Exposure Assessment**: Determine if claiming discards is beneficial

#### Decision Factors

- **Hand Strength**: Current winning potential
- **Wall State**: Remaining tiles and probabilities
- **Opponent Analysis**: Predicted opponent hands and strategies
- **Risk-Reward Balance**: Probability of improvement vs. safety

### 4. Charleston Strategy

During the Charleston phase, AI agents employ strategic tile passing:

```javascript
charlestonPass(player) {
    // Analyze current hand
    // Identify least valuable tiles
    // Consider opponent weaknesses
    // Execute optimal pass strategy
}
```

#### Charleston Algorithm

1. **Tile Evaluation**: Ranks all tiles by strategic value
2. **Pass Optimization**: Selects 3 tiles that minimally harm hand strength
3. **Opponent Modeling**: Predicts opponent preferences and weaknesses
4. **Risk Mitigation**: Avoids passing potentially useful tiles

#### Strategic Principles

- **Hand Preservation**: Maintain maximum winning potential
- **Pattern Development**: Support preferred winning patterns
- **Opponent Disruption**: Avoid strengthening opponent hands
- **Flexibility Maintenance**: Keep multiple strategic options open

### 5. Courtesy Vote System

AI agents intelligently participate in courtesy voting:

```javascript
courtesyVote(player) {
    // Assess current hand strength
    // Determine optimal courtesy count
    // Balance improvement vs. disruption risk
}
```

#### Voting Logic

- **Strong Hands (70+ rank)**: Vote for 0 tiles (no courtesy)
- **Moderate Hands (50-70 rank)**: Vote for 1-2 tiles
- **Weak Hands (<50 rank)**: Vote for maximum 3 tiles
- **Strategic Considerations**: Opponent hand strength assessment

### 6. Exposure Management

The AI makes strategic decisions about claiming discarded tiles:

```javascript
claimDiscard(player, discardTile) {
    // Evaluate discard tile value
    // Assess component formation potential
    // Calculate hand improvement probability
    // Determine optimal claim decision
}
```

#### Exposure Decision Factors

1. **Immediate Benefit**: Component formation opportunities
2. **Hand Completion**: Mahjong potential improvement
3. **Pattern Compatibility**: Alignment with current strategy
4. **Defensive Considerations**: Preventing opponent benefits

## 🧠 Advanced AI Features

### 1. Pattern Recognition

The AI recognizes and adapts to various mahjong patterns:

- **Singles and Pairs**: Basic hand building blocks
- **Consecutive Numbers**: Sequential tile combinations
- **Like Numbers**: Same numbers across suits
- **Special Patterns**: Winds, Dragons, Lucky combinations
- **Complex Formations**: Multi-component winning hands

### 2. Joker Optimization

Intelligent joker management is crucial:

```javascript
exchangeTilesForJokers(currPlayer, hand) {
    // Identify optimal joker exchanges
    // Calculate hand improvement potential
    // Execute beneficial swaps
}
```

#### Joker Strategies

- **Component Completion**: Use jokers to complete sets
- **Hand Flexibility**: Maintain multiple pattern options
- **Risk Assessment**: Avoid risky joker placements
- **Timing Optimization**: Execute exchanges when most beneficial

### 3. Defensive AI

The AI employs defensive strategies:

- **Dangerous Discards**: Avoid discarding tiles opponents need
- **Wall Tracking**: Monitor remaining tile probabilities
- **Pattern Disruption**: Prevent opponent hand completion
- **Information Hiding**: Minimize strategic information leakage

### 4. Adaptive Behavior

AI agents adapt their strategy based on:

- **Game State**: Early, mid, or late game considerations
- **Opponent Behavior**: Reacting to opponent actions
- **Wall Composition**: Adjusting to remaining tiles
- **Score Position**: Aggressive vs. conservative play

## 📊 AI Performance Metrics

### Evaluation Criteria

The AI system is evaluated on multiple performance metrics:

1. **Win Rate**: Percentage of games won against human players
2. **Hand Strength**: Average ranking of completed hands
3. **Strategic Efficiency**: Optimal decision percentage
4. **Learning Adaptation**: Improvement over time
5. **Computational Efficiency**: Response time and resource usage

### Benchmarking

The AI agents are benchmarked against:

- **Human Expert Players**: Comparison with skilled human play
- **Random AI**: Baseline performance vs. random decision making
- **Simplified AI**: Performance with reduced decision complexity
- **Historical Data**: Performance across different game phases

## 🔧 AI Customization and Tuning

### Adjustable Parameters

AI behavior can be customized through various parameters:

```javascript
// AI Configuration Options
const AI_CONFIG = {
    AGGRESSION_LEVEL: 0.7,        // Risk-taking tendency
    DEFENSIVE_AWARENESS: 0.8,     // Opponent protection
    PATTERN_FLEXIBILITY: 0.6,     // Strategic adaptability
    JOKER_OPTIMIZATION: 0.9,      // Joker usage efficiency
    WALL_ANALYSIS_DEPTH: 0.75     // Tile probability analysis
};
```

### Tuning Guidelines

- **Higher Aggression**: More likely to claim discards and take risks
- **Higher Defensive**: More cautious about dangerous discards
- **Higher Flexibility**: Maintains more strategic options
- **Higher Optimization**: Better joker and exposure decisions

### Testing and Validation

AI performance is validated through:

- **Automated Testing**: Large-scale game simulations
- **Statistical Analysis**: Performance metric tracking
- **Human Evaluation**: Expert player feedback
- **A/B Testing**: Comparison of different AI configurations

## 🎮 AI Difficulty Levels

### Difficulty Scaling

The AI system supports different difficulty levels:

#### Beginner AI
- **Simplified Decision Making**: Basic tile ranking
- **Limited Pattern Recognition**: Common hand patterns only
- **Predictable Behavior**: Consistent decision patterns
- **Slower Response Time**: More deliberate processing

#### Intermediate AI
- **Enhanced Analysis**: Advanced hand evaluation
- **Improved Pattern Recognition**: Broader pattern library
- **Adaptive Behavior**: Responds to game state changes
- **Balanced Strategy**: Mix of aggressive and defensive play

#### Advanced AI
- **Full Analysis Suite**: Complete decision-making algorithms
- **Comprehensive Pattern Recognition**: All official patterns
- **Dynamic Adaptation**: Real-time strategy adjustment
- **Expert-Level Play**: Competitive with skilled human players

#### Expert AI
- **Maximum Performance**: Full computational resources
- **Perfect Information**: Complete game state analysis
- **Optimal Play**: Theoretically perfect mahjong strategy
- **Unbeatable Performance**: Championship-level gameplay

## 🚀 Future AI Enhancements

### Planned Improvements

1. **Machine Learning Integration**: Train AI on expert game data
2. **Monte Carlo Methods**: Simulate multiple game branches
3. **Neural Networks**: Pattern recognition improvements
4. **Real-time Learning**: Adaptation during gameplay
5. **Advanced Opponent Modeling**: Predict opponent strategies

### Research Directions

- **Probabilistic AI**: Handle uncertainty more effectively
- **Multi-agent Coordination**: Team-based AI strategies
- **Emotional AI**: Human-like play style variations
- **Adaptive Difficulty**: Dynamic difficulty adjustment
- **Cross-game Learning**: Transfer learning from other games

## 📈 Technical Implementation

### Performance Optimization

The AI system is optimized for:

- **Fast Decision Making**: Sub-second response times
- **Memory Efficiency**: Minimal memory footprint
- **Scalability**: Support for multiple AI instances
- **Reliability**: Consistent performance across platforms

### Code Architecture

```javascript
// AI System Structure
class GameAI {
    constructor(card, table) {
        this.card = card;           // Hand validation system
        this.table = table;         // Game state reference
        this.decisionEngine = new DecisionEngine();
        this.patternMatcher = new PatternMatcher();
        this.strategyOptimizer = new StrategyOptimizer();
    }
}
```

### Integration Points

The AI integrates with:

- **Game Logic**: Seamless interaction with game flow
- **Hand Validation**: Uses card system for hand analysis
- **Table Management**: Coordinates with table state
- **UI System**: Provides hints and suggestions

---

**AI Agents System** - Providing intelligent and challenging mahjong gameplay

*Advanced artificial intelligence for authentic mahjong experience*