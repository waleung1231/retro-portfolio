/* Entry for vendor/desk.bundle.js. Build with `npm run build`.
 * Exposes GSAP (+ the free plugins the desk uses) on window, and React Bits components through
 * a tiny imperative API so the plain-JS site can drop them into any element:
 *   RB.mount(el, 'Folder', { color: '#6f9be0', items: [RB.html('<b>hi</b>')] })
 *   RB.unmount(el)
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { CustomWiggle } from 'gsap/CustomWiggle';
import { CustomBounce } from 'gsap/CustomBounce';
import { TextPlugin } from 'gsap/TextPlugin';

import Folder from './reactbits/Folder.jsx';
import Stack from './reactbits/Stack.jsx';
import ElasticSlider from './reactbits/ElasticSlider.jsx';
import ClickSpark from './reactbits/ClickSpark.jsx';
import StickerPeel from './reactbits/StickerPeel.jsx';
import GlareHover from './reactbits/GlareHover.jsx';
import Magnet from './reactbits/Magnet.jsx';
import PixelTransition from './reactbits/PixelTransition.jsx';
import TextType from './reactbits/TextType.jsx';
import DecryptedText from './reactbits/DecryptedText.jsx';
import CircularText from './reactbits/CircularText.jsx';
import GlitchText from './reactbits/GlitchText.jsx';
import Shuffle from './reactbits/Shuffle.jsx';
import ShinyText from './reactbits/ShinyText.jsx';
import DotGrid from './reactbits/DotGrid.jsx';

gsap.registerPlugin(Draggable, InertiaPlugin, Flip, SplitText, ScrambleTextPlugin, DrawSVGPlugin,
  MotionPathPlugin, Physics2DPlugin, CustomEase, CustomWiggle, CustomBounce, TextPlugin);

Object.assign(window, { gsap, Draggable, InertiaPlugin, Flip, SplitText, CustomEase, CustomWiggle, CustomBounce });

const COMPONENTS = { Folder, Stack, ElasticSlider, ClickSpark, StickerPeel, GlareHover, Magnet, PixelTransition,
  TextType, DecryptedText, CircularText, GlitchText, Shuffle, ShinyText, DotGrid };

const roots = new WeakMap();

/** Wrap an HTML string so it can be passed where a component expects React children. */
const html = (markup, className) => createElement('div', { className: className || 'rb-html', dangerouslySetInnerHTML: { __html: markup } });

function mount(el, name, props) {
  const C = COMPONENTS[name];
  if (!C || !el) return null;
  let root = roots.get(el);
  if (!root) { root = createRoot(el); roots.set(el, root); }
  const p = Object.assign({}, props);
  if (typeof p.children === 'string' && name !== 'GlitchText') p.children = html(p.children);
  root.render(createElement(C, p));
  return root;
}

function unmount(el) {
  const root = roots.get(el);
  if (root) { root.unmount(); roots.delete(el); }
}

window.RB = { mount, unmount, html, components: Object.keys(COMPONENTS) };
