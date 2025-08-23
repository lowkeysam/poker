# Poker Trainer

An interactive Texas Hold'em poker training application built with Next.js that teaches optimal play using CSI (Chip Stacks Index) based strategy from the "Kill Everyone" tournament methodology.

## Features

### 🎯 Interactive Gameplay
- Configurable multiplayer Texas Hold'em (2-9 players)
- Optional opponent card visibility for learning (never/sometimes/always)
- Dynamic CSI calculations and strategy recommendations
- Real-time hand evaluation and odds calculation

### 📊 Educational Tools
- **CSI Calculator**: Step-by-step tutorial on calculating Chip Stacks Index
- **Odds Calculator**: Interactive pot odds and equity calculations
- **Push/Fold Matrix**: Visual 13x13 grid showing optimal hand ranges
- **Hand Rankings**: Complete poker hand hierarchy reference

### 🧠 Learning System
- Quiz mode with explanations for incorrect answers
- "Calculate & Bet" mode that forces calculations before actions
- Progressive difficulty levels (beginner/intermediate/advanced)
- Real-time strategy advice based on current game state

### 📈 Strategy Implementation
- Nash Equilibrium push/fold ranges
- Position-based recommendations
- Stack size considerations
- Tournament survival strategies

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/lowkeysam/poker.git
cd poker-trainer

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start learning poker!

## How to Use

1. **Configure Game**: Select number of players and game settings
2. **Learn Mode**: Toggle opponent card visibility and strategy hints
3. **Calculate & Bet**: Enable forced calculations before making decisions
4. **Study Tools**: Access calculators and reference materials from the sidebar
5. **Practice**: Play hands while receiving real-time strategy feedback

## Game Concepts

### CSI (Chip Stacks Index)
```
CSI = Total Chips ÷ (Small Blind + Big Blind + Antes)
```
- **CSI > 10**: Play tight, avoid marginal spots
- **CSI 6-10**: Mixed strategy, position dependent
- **CSI < 6**: Push/fold mode, maximize fold equity

### Push/Fold Strategy
The application implements optimal push/fold ranges based on:
- Stack sizes (CSI calculations)
- Position at the table
- Number of players remaining
- Blind levels and antes

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Game Engine**: Custom poker logic with Monte Carlo simulation
- **Hand Evaluation**: Optimized 5-card poker hand evaluator
- **State Management**: React hooks and context

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── game/           # Poker table and game components
│   ├── quiz/           # Educational calculators
│   └── reference/      # Study materials
├── lib/                # Core game logic
│   ├── game-engine/    # Poker rules and evaluation
│   └── calculators/    # Odds and strategy calculations
└── data/               # Strategy charts and reference data
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Strategy concepts based on "Kill Everyone" tournament poker methodology
- Hand evaluation algorithms optimized for educational clarity
- UI designed for learning-focused poker instruction
