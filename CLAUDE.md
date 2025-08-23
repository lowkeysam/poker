# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server at localhost:3000
- `npm run build` - Build production version
- `npm run lint` - Run ESLint for code quality checks
- `npm start` - Start production server

## Architecture Overview

This is an interactive Texas Hold'em poker training application built with Next.js 15, designed to teach CSI (Chip Stacks Index) based strategy from "Kill Everyone" tournament methodology.

### Core Architecture Layers

**Game Engine** (`src/lib/game-engine/`)
- `game.ts` - Main PokerGame class managing game state, player actions, betting rounds
- `deck.ts` - Card deck management, shuffling, dealing, utility functions
- `evaluator.ts` - Hand evaluation logic, ranking comparison, Monte Carlo simulation support

**Calculators** (`src/lib/calculators/`)
- `csi.ts` - CSI calculations and push/fold strategy recommendations
- `odds.ts` - Pot odds, equity calculations, implied odds, Monte Carlo simulation

**UI Components** (`src/components/`)
- `game/` - Core poker table interface (Table, PlayerSeat, Controls, etc.)
- `quiz/` - Educational tools (CSICalculator, OddsCalculator, QuizModal)
- `reference/` - Study materials (HandRankings, PushFoldMatrix)

**Data Layer** (`src/data/`)
- Strategy charts, hand rankings, quiz questions in both JSON and Markdown formats
- CSI push/fold ranges based on "Kill Everyone" methodology

### Key Patterns

**State Management**
The main page (`src/app/page.tsx`) manages game state through the PokerGame class instance, with React state syncing to game engine state after each action.

**Educational Flow**
"Calculate & Bet" mode enforces learning by requiring users to complete calculations before actions are executed. This is managed through `pendingAction` state that holds the intended action until educational requirements are met.

**CSI Strategy Integration**
The application calculates CSI dynamically and provides real-time strategy advice based on tournament position, stack sizes, and game stage. All recommendations are derived from the digitized "Kill Everyone" strategy charts.

**TypeScript Paths**
Uses `@/*` alias pointing to `src/*` - ensure all imports use this pattern for consistency.

## Key Implementation Details

**Hand Evaluation**
Uses optimized 5-card poker evaluation with support for 7-card hands (hole cards + community cards). Supports both exact calculation and Monte Carlo simulation for equity estimation.

**Game Engine Design**
The PokerGame class is stateful and handles all poker rules, betting logic, and stage progression. It maintains separation between game logic and UI components.

**Quiz System**
Questions are loaded from JSON files and presented contextually based on game situations. Each question includes explanations and difficulty levels.

**Push/Fold Matrix**
13x13 grid showing optimal hand ranges based on CSI values. Supports hand highlighting and interactive exploration of strategy ranges.