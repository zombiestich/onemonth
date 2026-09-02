# One Month Anniversary Card 🎉

An interactive, animated anniversary card experience with calendar reveal, certificate scratch-off, and celebration effects.

## Features

✨ **Interactive Experience**
- Click the calendar hotspot to reveal the certificate
- Scratch off the certificate coating to complete the reveal
- Celebration particles and animations
- Replay button to restart the experience

🎨 **Visual Design**
- Responsive mobile-first design
- Smooth animations and transitions
- Dark theme with gradient background
- Accessible focus indicators

♿ **Accessibility**
- Keyboard navigation support (Enter/Space to activate buttons)
- ARIA labels for screen readers
- Focus management and indicators
- Respects `prefers-reduced-motion` preference

## File Structure

```
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── script.js       # Interactive functionality
├── images/
│   ├── calendar.png      # Calendar page image (1080x1920px)
│   └── certificate.png   # Certificate page image (1080x1920px)
└── README.md       # This file
```

## Setup Instructions

### 1. Add Images

Create an `images/` directory and add two PNG files:

- **calendar.png** - The calendar page (1080x1920px recommended)
- **certificate.png** - The certificate page (1080x1920px recommended)

Both images should match the card's aspect ratio (9:16).

### 2. Deploy

Simply open `index.html` in a web browser or deploy to a web server.

No build tools or dependencies required!

## How It Works

### Calendar Page
- Users see an interactive calendar
- A circular hotspot is positioned over a date
- Hovering shows a glow effect
- Clicking reveals the certificate

### Certificate Reveal
- The calendar animates away with a crumbling effect
- The certificate appears with an entrance animation
- A scratch-off canvas overlay is created

### Scratch-Off Interaction
- Users can scratch/drag over the canvas to reveal the certificate below
- The canvas tracks transparency percentage
- At 50% scratched, a celebration animation triggers
- The scratch overlay fades away

### Replay
- A replay button appears after scratching is complete
- Clicking resets the experience to the initial state

## Customization

### Styling
Edit `styles.css` to customize:
- Colors: Update CSS custom properties in `:root`
- Animations: Modify `@keyframes` definitions
- Layout: Adjust `.card-stage` dimensions

### Hotspot Position
The calendar hotspot position is in `styles.css`:
```css
.calendar-hotspot {
  left: 2.7%;
  top: 54.55%;
  width: 7.8%;
  height: 4.9%;
}
```

Adjust percentages to match your calendar image layout.

### Celebration Particles
In `script.js`, modify the `triggerCelebration()` function:
```javascript
const particles = ['🎉', '✨', '💫', '🌟', '💕'];
// Add or remove emoji as desired
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

The experience uses:
- CSS animations and gradients
- Canvas API for scratch-off
- ES6 JavaScript

## Performance Notes

- Images should be optimized/compressed before deployment
- Canvas scratch interaction is efficient for 60fps on most devices
- Animations use GPU acceleration (transform, opacity)

## Accessibility Checklist

✅ Keyboard navigation (Tab, Enter, Space)
✅ Focus indicators
✅ ARIA labels
✅ Respects `prefers-reduced-motion`
✅ Semantic HTML structure
✅ Touch-friendly tap targets

## Development

To make changes:

1. Edit `index.html` for structure
2. Edit `styles.css` for appearance
3. Edit `script.js` for functionality
4. Update images in `images/` folder as needed
5. Test in different browsers and devices

## License

Created with ❤️ for a special occasion.

---

**Ready to use!** Just add your calendar and certificate images to the `images/` folder and open `index.html` in a browser.
