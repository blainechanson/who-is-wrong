# Android Gavel Timing Backup

This timing was confirmed working on Android on 2026-06-30.

Do not change these values unless Android visual/audio timing is being intentionally retested:

```js
const gavelHitTimes = isAndroidDevice ? [120, 620, 1120] : (isPhoneLikeDevice ? [0, 380, 760] : [0, 430, 860]);
```

Mobile gavel animation timing:

```css
.gavel-scene.strike-now .gavel-photo { animation: gavelStrike 0.28s ease-out both; }
.gavel-scene.strike-now .impact-lines { animation: impactFlash 0.22s linear both; }
```

User-confirmed result: Android gavel is perfect.
