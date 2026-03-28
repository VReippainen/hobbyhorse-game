# 🐴 Keppari Runner – Game Design & Implementation Plan

## 🎯 Goal
Build a simple endless runner browser game where:
- The player controls a small red-haired woman riding a hobby horse (keppihevonen)
- The goal is to avoid obstacles and survive as long as possible
- The game runs in browser (desktop + mobile)
- High scores are saved (initially in-memory backend)

## 🧩 Core Gameplay

### Player
- Constant forward movement (world moves left)
- Can:
  - Jump (space / tap)
- Affected by gravity

### Obstacles

There are 3 obstacle types:

#### 1. Jump obstacle (static)
- Type: "jump"
- Examples:
  - Horse jumping obstacle (esteteline)
- Behavior:
  - Stationary
  - Must be jumped over

#### 2. Dog obstacle (static)
- Type: "dog"
- Example:
  - Black cocker spaniel
- Behavior:
  - Stationary (or slight idle animation optional)
  - Must be jumped over

#### 3. Car obstacle (dynamic)
- Type: "car"
- Example:
  - Small Ford Fiesta
- Behavior:
  - Moves toward the player faster than other obstacles
  - Optional: spawns slightly further away
  - Creates "panic" moments

### Difficulty Scaling
- Game speed increases over time
- Obstacle spawn rate increases
- Car obstacles appear more frequently later

### Scoring
- Score increases over time survived
- Optional bonus:
  - +points per obstacle passed

### Game Over
- Collision with any obstacle
- Show:
  - Final score
  - High score
  - Restart button

## 🎮 Controls

| Input        | Action |
|-------------|--------|
| Space       | Jump   |
| Mouse click | Jump   |
| Touch       | Jump   |

## 🖥️ Technical Architecture

### Frontend
- React + TypeScript
- Canvas rendering (preferred)

### Game Loop
Use `requestAnimationFrame`

```ts
function gameLoop(timestamp: number) {
  update(deltaTime)
  render()
  requestAnimationFrame(gameLoop)
}
```

### Game State

```ts
type GameState = {
  player: {
    x: number
    y: number
    velocityY: number
    isJumping: boolean
  }
  obstacles: Obstacle[]
  speed: number
  score: number
  gameOver: boolean
}
```

### Obstacle Type

```ts
type Obstacle = {
  id: string
  type: "jump" | "dog" | "car"
  x: number
  y: number
  width: number
  height: number
  speedMultiplier?: number
}
```

### Physics

#### Gravity + Jump

```ts
const GRAVITY = 0.5
const JUMP_FORCE = -10
```

```ts
player.velocityY += GRAVITY
player.y += player.velocityY

if (player.y >= groundY) {
  player.y = groundY
  player.velocityY = 0
  player.isJumping = false
}
```

### Collision Detection

```ts
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}
```

### Obstacle Spawning

```ts
const types = ["jump", "dog", "car"]
```

### Movement

```ts
obstacle.x -= gameState.speed * (obstacle.speedMultiplier ?? 1)
```

## 🎨 Rendering

### Style
- Retro pixel style (80s–90s)
- Simple rectangles initially OK

### Layers
1. Background (sky)
2. Ground
3. Player
4. Obstacles
5. UI (score)

## 📱 Mobile Support
- Touch input = jump
- Canvas scales to screen width
- Use `window.devicePixelRatio`

## 🏆 High Score System

### Phase 1 (simple)
- localStorage

```ts
localStorage.setItem("highscore", score.toString())
```

### Phase 2 (backend)

```ts
let scores = []

app.post("/score", (req, res) => {
  scores.push(req.body)
  res.sendStatus(200)
})

app.get("/scores", (req, res) => {
  res.json(
    scores.sort((a, b) => b.score - a.score).slice(0, 10)
  )
})
```

### Score Object

```ts
{
  name: string
  score: number
  date: number
}
```

## 🚀 MVP Scope

### MUST HAVE
- Player jump
- Obstacles (all 3 types)
- Collision detection
- Score counter
- Game over + restart
- Basic visuals

### NICE TO HAVE
- Sounds
- High score backend
- Mobile polish
- Better graphics

## 🧠 Implementation Order

1. Setup React + Canvas
2. Implement game loop
3. Add player + gravity + jump
4. Add ground
5. Add obstacle spawning
6. Add collision detection
7. Add score
8. Add game over screen
9. Add restart
10. Add polish
