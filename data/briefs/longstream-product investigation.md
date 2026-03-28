# Product Investigation — Longstream Distillery

## Market Overview

### NZ Gin Market
- Almost 200 commercial distilleries in NZ, the majority producing gin
- The NZ gin market saw a negative CAGR of -6.36% from 2020-2024, but the decline is slowing (-2.74% in 2023 to -2.36% in 2024)
- Projected growth rate of 4.45% by 2027, suggesting recovery and stabilisation
- Globally, the craft spirits market is growing at ~28% CAGR (2024-2030), with gin as a major driver
- NZ's craft distillery count has exploded from a handful 20 years ago to ~200 today

### Wellington/Upper Hutt Competitors
The local market is notably active, especially Upper Hutt which has become a craft spirits hub around Brewtown. Key competitors:

| Distillery | Location | Notes | Price Range (700ml) |
|---|---|---|---|
| Wildkiwi Distillery | Upper Hutt (Brewtown) | Gin, vodka, rum. Part of the Brewtown hub. | ~$60-75 |
| Enceladus | Upper Hutt (Brewtown) | Family-run, gin-focused, distillery tours | ~$65-75 |
| Aurora Distillery | Upper Hutt | Craft gins, gin-making experiences | ~$65-80 |
| Ruin Distillery | Upper Hutt (Moonshine Valley) | Award-winning small commercial distillery | ~$65-80 |
| Southward Distilling Co. | Te Aro, Wellington | Small-batch, tastings and tours | ~$65-80 |

Notable regional competitors: Reid + Reid (Wairarapa, native botanicals), Lighthouse Gin (Martinborough), Greytown Distilling Co., The Bond Store (Paraparaumu).

Notable national competitors: Scapegrace ($53-120), Rogue Society ($53), Cardrona, Dancing Sands.

### Pricing Landscape
- NZ craft gin typically retails between $45-120 NZD per 700ml bottle
- The sweet spot for established craft gins is $60-80 NZD
- Entry-level craft gins start around $45-55
- Premium/limited editions push to $90-120+

## Target Customer Profile

### Primary: Millennials and Gen Z (25-40)
- Willing to pay premium for authenticity and unique experiences
- Value transparent provenance and ethical production (70%+ of premium consumers)
- 58% of urban consumers prefer locally crafted spirits over mass-produced
- Seek flavour experimentation: exotic botanicals, seasonal releases, NZ native ingredients
- Driven by cocktail culture and social sharing

### Secondary: Experience Seekers (30-55)
- Interested in distillery tours, tastings, gin-making workshops
- Gift buyers for premium, locally made spirits
- Food and beverage enthusiasts who follow NZ produce trends

### Key Purchase Drivers
1. **Local story** — made in the Hutt Valley, NZ ingredients, craft process
2. **Flavour uniqueness** — native botanicals (manuka, horopito, kawakawa) are a strong differentiator
3. **Sustainability** — eco-friendly packaging, carbon-neutral production (60% of craft spirit buyers care about this)
4. **Experience** — distillery visits, tasting events, limited releases create engagement

## Competitive Positioning

### Longstream's Strengths
- **NZ native botanical range** — Manuka & Chilli, Horopito, Kawakawa gins are genuinely differentiated. Few NZ distillers go this deep into native botanicals as a core range.
- **Automation engineering capability** — Ben's background in sensors, PLCs, and web dashboards is rare in craft distilling. This gives a genuine path to higher throughput without losing the craft story.
- **Full vertical process** — distilling from wash (not buying neutral spirit) is more authentic and uncommon for garage-to-market operations.
- **Three-product core range** — Gin, Vodka, Limoncello covers different occasions and price points.
- **Small batch specials** — rotating limited releases create urgency and social media moments.
- **NZ-wide focus** — targeting national distribution from the start, not just a local play.
- **Production capacity already solves fermentation** — 14 fermentation vessels with 2 ready per day means throughput is not gated by fermentation time.

### Longstream's Challenges
- **Crowded local market** — Upper Hutt alone has 4+ distilleries. Wellington/Wairarapa region has many more. Differentiation is essential.
- **Still time is the bottleneck** — each batch needs ~8 hours of still time (vodka + gin runs). With 2 batches ready per day, that is 16 hours of still time daily. A single still can handle 1-2 batches per day depending on schedule.
- **No brand recognition yet** — will need to build from zero against established local and national names.
- **Sugar wash base** — some craft purists prefer grain-based spirit. Could be a perception issue, though the carbon filtering produces a clean product.
- **Garage operation** — not a tourable distillery (yet). Misses the experience/tourism angle that Upper Hutt competitors lean on heavily (Brewtown is a destination).

## Tech Feasibility: Scaling to 100+ Bottles/Week

### Current Capacity
- 9 bottles per batch, ~9 hours active still time per batch
- 14 fermentation vessels with 2 batches ready per day (fermentation is already solved)
- With a single 25L still running 1 batch/day: ~9 bottles/day, ~54 bottles/week (6 days)
- With a single 25L still running 2 batches/day (16hr days): ~18 bottles/day, ~108 bottles/week

### The Real Bottleneck: Still Time and Labour
Fermentation is not the bottleneck. The constraint is still time and the active labour to run it. Each batch requires:
- Vodka run: ~4 hours active
- Gin run: ~4 hours active
- Total: ~8 hours per batch

At 2 batches/day, that is 16 hours of still operation. This is achievable but demanding for an owner-operated side business.

### Path to 100 Bottles/Week

**Option A: Current 25L still, 2 batches/day (6 days)**
- 12 batches/week × 9 bottles = 108 bottles/week
- Requires ~96 hours of still time per week (16hr/day × 6 days)
- Labour-intensive. Automation makes this viable.

**Option B: 65L still, 1 batch/day (6 days)**
- 6 batches/week × ~27 bottles = ~162 bottles/week
- Requires ~48 hours of still time per week (8hr/day × 6 days)
- Much more manageable schedule. Excess fermentation capacity provides buffer.

**Option C: Dual stills (25L + 65L)**
- Maximum throughput. Run small batch specials on the 25L while the 65L handles core range.
- 200+ bottles/week possible.

### Automation Roadmap (aligned with Ben's skillset)
1. **Phase 1: Sensors** — temperature, ABV (density/refractometer), and liquid level sensors on the still. Arduino/ESP32 with a web dashboard for real-time monitoring. Eliminates manual watching.
2. **Phase 2: Automated cuts** — solenoid diverter valves controlled by PLC/Arduino based on temperature curves. Separates foreshots, heads, hearts, and tails automatically.
3. **Phase 3: Flow control** — pumps to transfer wash into still, eliminating manual lifting. Automated dilution with flow metering.
4. **Phase 4: Fermentation management** — temperature-controlled fermentation vessels with automated scheduling and monitoring.

Automation primarily reduces active labour per batch. With automated cuts and monitoring, a single batch could drop from ~8 hours active to ~2 hours active (setup, checks, bottling), making the 2-batch/day schedule viable as a side business.

## Market Entry Assessment

### Opportunities
- NZ craft gin market is stabilising and projected to grow from 2025
- Native NZ botanicals are a genuine differentiator that resonates with tourists and locals
- NZ-wide D2C online sales bypass the crowded Wellington local market
- Small batch specials create social media and word-of-mouth marketing
- Automation capability is a genuine competitive advantage for scaling
- Fermentation capacity already supports 100+ bottles/week, no additional vessels needed

### Risks
- High competition nationally (~200 distilleries) and locally (4+ in Upper Hutt alone)
- Excise duty is a significant cost factor for NZ spirits
- Regulatory compliance (licensing, food safety, labelling) is non-trivial
- Building brand awareness from zero requires sustained marketing investment
- Sugar wash base could be a differentiator or a liability depending on positioning

### Recommendation
The product investigation supports proceeding with the remaining research tasks. The native botanical angle is genuinely strong, the automation path is credible, and the NZ-wide online market gives reach beyond the crowded local scene. The fermentation setup is already scaled for 100+ bottles/week. The key unknowns are regulatory burden, excise costs, and realistic per-bottle economics, which the next tasks will address.