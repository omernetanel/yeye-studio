# Third party notices

Notices that the licences of third party material used in this project require
us to carry. Kept here rather than spread through the source so a licence can be
read in full, and so the requirement travels with the repository.

---

## React Bits

Three style blocks in `app/globals.css` and three components are derived from
React Bits:

- `.border-glow` and its sweep, from **BorderGlow** — the masked cone of light
  around a card's border. The pointer tracking was dropped and replaced by a CSS
  rotation.
- `.fold-segment` / `.fold-piece`, from **FoldText** — the per-letter hinge
  geometry. It is driven from scroll by `components/ui/FoldText.tsx`.
- `components/ui/FlexCarousel.tsx` and `FlexCarousel.css`, from
  **FlexCarousel** — ported to TypeScript; sample images, click-to-zoom,
  autoplay and built-in captions removed, and the lens sized from the centred
  card.
- `components/ui/PaperCrumple.tsx` and `PaperCrumple.css`, from
  **PaperCrumple** — ported to TypeScript with Hebrew labels; the printed back,
  reset key, disabled switch and error callback removed, and reduced motion left
  to the page, which shows the plain photograph instead.
- `components/ui/StaggeredMenu.tsx` and the `.sm-` styles in `app/globals.css`,
  from **StaggeredMenu** — ported to TypeScript and turned around for RTL; its
  own toggle, logo, text cycle and social links removed, the panel narrowed,
  and the call to action drawn as a highlighted item.
- `components/ui/SquishSwitch.tsx` and `SquishSwitch.css`, from
  **SquishSwitch** — ported to TypeScript and made controlled only; the
  uncontrolled mode, built-in label, disabled state and radius option removed,
  the motion functions taken from framer-motion, reduced motion left to the
  site's own setting, and every colour passed in rather than written in.

Source: https://github.com/DavidHDev/react-bits

The licence below is reproduced in full, as its terms require.

```
MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Fonts

Both families are served from `public/fonts` and carry their own copyright,
licence and licence URL in the font binaries themselves, which is what the SIL
Open Font License accepts in place of a separate file. The built files under
`.next/static/media` keep those fields, so every copy a browser receives carries
the notice.

- **Assistant** — SIL Open Font License 1.1. Copyright 2020 The Assistant
  Project Authors; Copyright 2010 The Source Sans Pro Authors, with Reserved
  Font Name "Source".
- **Google Sans** — SIL Open Font License 1.1, without Reserved Font Names.
  Copyright 2025 The Google Sans Project Authors.
  "Google" and "Google Sans" are trademarks of Google LLC. This project uses the
  typeface only; it does not use those marks in its own name, product names or
  domains, and claims no affiliation with Google.
