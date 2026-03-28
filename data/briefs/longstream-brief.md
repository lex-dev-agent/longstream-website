# Longstream Distillery — Business Overview

We're starting a craft spirit distilling business with a focus on gin. We've been making gin in our garage (30A breaker) and are now exploring bringing it to market. We've settled on the name **Longstream Distillery** and have a placeholder website up at [longstream.nz](https://longstream.nz).

## Current Yield per Run

| Stage | Output | Notes |
| --- | --- | --- |
| Wash | 21L | Granular sugar + Ultra 8 super yeast, fermented in a bucket |
| Vodka distillation | ~3.2L @ 90% ABV | Activated carbon filtered; cloudy tails recycled into next run |
| Gin distillation | ~3L @ 85% ABV | London Dry style, diluted to 40% before redistilling |
| Bottled | ~9 x 750ml | ~6.5L at 38% ABV, currently using recycled bottles |

## Distilling Process

### 1. Fermentation (6 days)
A 21L sugar wash is prepared using granular sugar and Ultra 8 super yeast, then left to ferment in a bucket.

### 2. Vodka Run (~4 hours)
The wash is distilled in our 25L still to produce pure vodka:
- Remove ~100ml of foreshots (discarded)
- Collect all heads, all hearts, and some tails into the main reservoir (our vodka)
- Collect the last of the tails into a separate reservoir (cloudy, recycled back into the next vodka run)
- Run the vodka through an activated carbon filter to purify it
- Clean the still
Output: ~3.2L at 90% ABV.

### 3. Gin Run (~4 hours)
The vodka is diluted down to 40% ABV and redistilled in our 25L still with a botanical basket to produce a London Dry Gin.
- Change the still head to the gin configuration and add the botanicals basket
- Remove ~100ml of foreshots (discarded)
- Collect all heads, all hearts, and some tails into the main reservoir (our gin)
- Collect the last of the tails into a separate reservoir (cloudy, recycled back into the next vodka run)
- Clean the still
Output: ~3L at 85% ABV.

### 4. Dilution and Bottling (~1 hour)
The gin is diluted by hand with spring water to 38% ABV (~6.5L), measured using a handheld refractometer, then bottled into recycled bottles.

Total per batch: ~6 days fermentation + ~9 hours active work = ~9x 750ml bottles of gin.

## Products

### Core Range
- **London Dry Gin** — Flagship. Botanical-forward, distilled from our own base spirit and diluted with spring water.
- **Pure Vodka** — Carbon-filtered for exceptional purity. Stands on its own.
- **Limoncello** — Made from our high-purity vodka base. Already a hit with friends and family.

### Small Batch Specials
- Manuka and Chilli Gin — Native manuka leaf with a slow chilli heat on the finish.
- Horopito Gin — NZ bush pepper for a warm, peppery bite.
- Kawakawa Gin — Earthy, anise-forward native botanical.
- Pink Gin — Hibiscus and rose petal, naturally pink.
- Barrel-Rested Gin — Aged in oak for a golden, mellow character.
- Citrus Gin — Heavy on the grapefruit and yuzu peel.
- Sloe Gin — Classic sloe berry steep, rich and sweet.

## Power and Electrical
The garage runs on a 30A breaker (230V = 6.9kW max capacity).

### Current Still (25L)
- Elements: 2kW + 1kW separate elements (3kW total)
- Heating: Both elements across 2x 10A sockets to bring the still up to temperature
- Running: 1kW element only to maintain temperature once at boil

### Dual-Still Setup (Planned)
- Two stills would use 4 elements (2 per still), kept below 6kW total to stay within the 30A breaker
- Only one still heated to boil at a time — simple schedule control to stagger the high-draw phase
- Once at temperature, each still needs just 1kW to maintain
- The pool pump (~1kW) provides cooling water for the still head — factored into the load budget

## Scaling Up
Currently very manual. Target: 100 bottles per week.

### Planned Upgrades
- Liquid sugar — Switch from granular to streamline wash preparation
- 1 x 65L still — Larger capacity for bigger batches. The old 25L still moves to small-batch experiments.
- Bottle standardisation — Decide between 700ml and 750ml
- Digital sensors — ABV sensors, temperature sensors, and depth sensors to replace manual monitoring
- Automated flow control — Pumps and solenoid diverter valves for an automated cut system, controlled via PLC/Arduino with a web dashboard