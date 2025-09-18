# Color Harmony System Workflow

## Complete Color Setting Cycle

### 1. Initialization Phase
```
User adds logo to canvas
    ↓
ColorHarmonyManager is initialized
    ↓
Logo object is detected and set as reference
    ↓
All existing objects get color state initialized
```

### 2. Logo Detection & Color Extraction
```
Logo object added/selected
    ↓
extractLogoColor() function called
    ↓
Extracts dominant color from logo
    ↓
Logo color stored for contrast calculations
```

### 3. Overlap Detection Phase
```
Logo position changes
    ↓
detectOverlappingObjects() called
    ↓
Checks geometric overlap between logo and all objects
    ↓
Returns list of overlapping objects
```

### 4. Color Analysis Phase
```
For each overlapping object:
    ↓
analyzeColorHarmony() called
    ↓
Calculates Delta E between logo color and object color
    ↓
Determines if color needs adjustment
```

### 5. Color Application Phase
```
Object type check:
    ├── Path objects (waves) → applyGradientToObject()
    │   ├── Generate random gradient with 2 colors
    │   ├── Set _hasGradient = true
    │   ├── Apply gradient using fabricObject.set('fill', gradient)
    │   └── Render canvas
    │
    └── Other objects → applyColorToObject()
        ├── Generate random solid color
        ├── Check if object has gradient (skip if true)
        ├── Apply solid color using fabricObject.set('fill', color)
        └── Render canvas
```

### 6. State Management Phase
```
Color state updated:
    ├── currentColor = new color/gradient
    ├── harmonyType = 'random_gradient' or 'random_predefined'
    ├── isColorLocked = true
    ├── hasBeenChanged = true
    └── lastChangeTime = timestamp
```

### 7. Restoration Phase (when logo moves away)
```
Logo no longer overlaps object
    ↓
restoreOriginalColors() called
    ↓
For each object that was changed:
    ├── Check if object has gradient
    │   ├── Yes → restoreOriginalColorToObject() with gradient
    │   └── No → applyColorToObject() with solid color
    ├── Reset color state flags
    └── Render canvas
```

## Key Functions in the Cycle

### 1. `extractLogoColor(logoObject)`
- Extracts dominant color from logo
- Handles different logo types (image, text, shape)
- Returns hex color string

### 2. `detectOverlappingObjects(logoObject, allObjects)`
- Uses `getBoundingRect()` to get object bounds
- Calculates geometric overlap percentage
- Returns array of overlapping objects

### 3. `analyzeColorHarmony(logoColor, overlappingObjects)`
- Calculates Delta E for each object
- Determines if color adjustment is needed
- Calls appropriate color application function

### 4. `applyGradientToObject(fabricObject, gradient)`
- Applies gradient to path objects (waves)--helve for ddd   
- Sets `_hasGradient = true` flag
- Uses `fabricObject.set('fill', gradient)`

### 5. `applyColorToObject(fabricObject, color)`
- Applies solid color to non-path objects
- Checks for existing gradients (skips if found)
- Uses `fabricObject.set('fill', color)`

### 6. `restoreOriginalColors(allObjects, currentlyOverlapping)`
- Restores original colors when logo moves away
- Handles both gradient and solid color restoration
- Resets all color state flags

## Color State Management

Each object has a `colorState` object:
```javascript
{
  originalColor: string,        // Original color before changes
  currentColor: string,         // Current applied color
  isOverlapping: boolean,       // Currently overlapping with logo
  deltaE: number,              // Color difference from logo
  harmonyType: string,         // Type of harmony applied
  isColorLocked: boolean,      // Prevents further changes
  hasBeenChanged: boolean,     // Object has been modified
  lastChangeTime: number,      // Timestamp of last change
  originalData: object         // Complete original object data
}
```

## Gradient vs Solid Color Logic

### Path Objects (Waves)
```
Has gradient? → Yes → Skip color override
Has gradient? → No → Apply solid color + clear _hasGradient flag
```

### Other Objects
```
Always apply solid color (no gradient support)
```

## Delta E Threshold
- Default: 16 (adjustable)
- Lower = more strict color similarity detection
- Higher = more lenient color similarity detection

## Canvas Rendering
- `fabricObject.canvas.renderAll()` called after each color change
- Ensures visual updates are immediately visible
- Maintains smooth user experience

