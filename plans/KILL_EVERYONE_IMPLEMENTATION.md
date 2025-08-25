# Kill Everyone Tournament Strategy Implementation

## Overview

This document describes the comprehensive implementation of the Kill Everyone tournament strategy charts from the book "Kill Everyone: Advanced Strategies for No-Limit Hold'em Poker Tournaments and Sit-n-Gos" (2nd Edition) by Lee Nelson, Tysen Streib, and Kim Lee.

## Implemented Strategy Matrices

### 1. Complete Suited Hands Strategy (Page 184)
- **Source**: IMG_7568 - Kill Everyone suited hands matrix
- **Implementation**: `SUITED_STRATEGY` object in PushFoldMatrix.tsx
- **Coverage**: All suited combinations from AA down to 32s
- **Action**: JAM for all suited hands (aggressive tournament strategy)

### 2. Complete Offsuit Hands Strategy (Page 186)
- **Source**: IMG_7570 - Kill Everyone offsuit hands matrix  
- **Implementation**: `OFFSUIT_STRATEGY` object in PushFoldMatrix.tsx
- **Coverage**: All offsuit combinations with appropriate actions
- **Actions**: Mix of CALL/FOLD based on hand strength
- **Special**: Includes mixed strategies with 2.5F ratios (page 188)

### 3. Equilibrium Calling Ranges (Short-handed)
- **Source**: IMG_7564 - Equilibrium calling strategy for suited hands
- **Implementation**: `CALLING_RANGES_SUITED` object
- **Purpose**: Shows CSI thresholds for calling vs jamming opponents
- **Format**: CSI values (1-8) indicating minimum stack size for calls

### 4. Heads-up 3BB Raise Ranges (Page 185)
- **Source**: IMG_7569 - Heads-up play suited matrix for 3BB raises
- **Implementation**: `HEADSUP_3BB_SUITED` object
- **Purpose**: Specialized ranges for heads-up play with 3BB opening sizes
- **Coverage**: Wider ranges appropriate for heads-up dynamics

## Key Strategic Concepts Implemented

### Mixed Strategy Ratios (Page 188)
From IMG_7571, the implementation includes mixed strategies where:
- **2.5F**: Fold 2.5 times more often than calling
- Applied to borderline offsuit hands like 96o, 85o, 75o, etc.
- Represents optimal game theory solutions

### CSI-Based Ranges
- **CSI 0-2**: Emergency situations, any two cards playable
- **CSI 2-5**: Very short stack, wide pushing ranges
- **CSI 5-7**: Short stack, position-dependent ranges
- **CSI 7-10**: Medium short, tighter ranges
- **CSI 10-15**: Medium stack, selective ranges

### Position Adjustments
- **Early Position**: Tightest ranges (UTG)
- **Middle Position**: Moderate expansion (MP)
- **Late Position**: Wider ranges (CO)
- **Button**: Widest ranges in full-table play
- **Small Blind**: Heads-up considerations
- **Big Blind**: Calling ranges vs pushes

## UI Implementation Features

### Strategy Mode Selection
1. **Push/Fold (Legacy)**: Original simple push/fold ranges
2. **Kill Everyone Complete Strategy**: Full jam/call/fold matrix from book
3. **Equilibrium Calling Ranges**: CSI-based calling thresholds vs opponents

### Raise Size Support
- **2.0 BB**: More flexible, allows post-flop play
- **2.5 BB**: Standard tournament size, balanced commitment
- **3.0 BB**: Higher commitment, heads-up focused

### Visual Indicators
- **Green**: JAM actions
- **Blue**: CALL actions  
- **Red**: FOLD actions
- **Yellow**: Raise/Fold mixed strategies
- **Purple**: Limp/Call strategies
- **Gray**: Mixed strategies with ratios

### Educational Content
- Page number references (183-186, 188)
- Strategy explanations and context
- CSI calculation reminders
- Position-specific guidance
- Tournament scenario adjustments

## Mathematical Accuracy

The implementation directly translates the book's matrices with:
- **Exact hand mappings** from image analysis
- **Proper suit/offsuit distinctions** (upper triangle vs lower triangle)
- **Accurate CSI thresholds** from equilibrium charts
- **Correct mixed strategy ratios** (2.5F notation preserved)
- **Position-adjusted ranges** matching book recommendations

## Testing and Verification

Test cases verify accuracy against known book values:
- AKs → JAM (suited hands always jam)
- A2o → CALL (offsuit aces call)
- 96o → CALL with 2.5F ratio (mixed strategy)
- CSI thresholds match equilibrium charts

## Usage in Poker Training

This implementation allows players to:
1. **Study optimal tournament strategy** from a proven book
2. **Practice decision-making** with real-time strategy advice
3. **Understand position dependencies** in tournament play
4. **Learn mixed strategies** and game theory concepts
5. **Adjust for different scenarios** (heads-up, raise sizes, stack depths)

## References

- Kill Everyone: Advanced Strategies for No-Limit Hold'em Poker Tournaments and Sit-n-Gos (2nd Edition)
- Authors: Lee Nelson, Tysen Streib, Kim Lee
- Pages: 183-186 (strategy matrices), 188 (mixed ratios)
- Implementation preserves mathematical accuracy of original charts