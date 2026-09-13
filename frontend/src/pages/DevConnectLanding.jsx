/**
 * DevConnect Landing — React port of devconnect-landing-premium_1.html
 * Adapted for this project's Vite + React Router setup.
 *
 * Optimizations vs. the original static HTML:
 *  - All heavy libs (three, gsap, vanta, split-type, lenis) are dynamically
 *    imported inside useEffect, so they never block first paint — they load
 *    only in the browser, after mount.
 *  - Every renderer, scene, ScrollTrigger, Lenis instance, rAF loop and
 *    event listener is torn down in a cleanup function, so navigating away
 *    from this route doesn't leak WebGL contexts.
 *  - DOM lookups use refs / a scoped querySelectorAll on the component root
 *    instead of document-wide getElementById/querySelectorAll, so this can't
 *    clash with other components on the page.
 *  - Respects prefers-reduced-motion: skips the intro fly-in / scroll-jack
 *    animations for users who've asked for reduced motion, showing the
 *    content immediately instead.
 *  - Pixel ratio capped, single shared render loop per scene.
 */

import { useEffect, useMemo, useRef } from 'react';
import { LandingPreloader } from './landing/components/LandingPreloader';
import { LandingHero } from './landing/components/LandingHero';
import { LandingStory } from './landing/components/LandingStory';
import { LandingTestimonials } from './landing/components/LandingTestimonials';
import { buildTestimonialItems } from '../lib/testimonialCards';
import '../DevConnectLanding.css';

export default function DevConnectLanding() {
  const rootRef = useRef(null);

  // Generated once per mount — canvas-drawn cards (quote + name + role +
  // initials avatar baked into the image itself), so there's no external
  // image request that could fail and leave a blank/black card.
  const testimonialItems = useMemo(() => buildTestimonialItems(), []);

  const globalVantaRef = useRef(null);
  const bgCanvasHolderRef = useRef(null);
  const storyCanvasHolderRef = useRef(null);
  const bgBlurPanelRef = useRef(null);
  const introVeilRef = useRef(null);

  const logoStageRef = useRef(null);
  const subheadRef = useRef(null);
  const ctaPrimaryRef = useRef(null);
  const ctaSecondaryRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const storyProgressRef = useRef(null);
  const storyTrackRef = useRef(null);
  const storyStageRef = useRef(null);
  const nextSectionRef = useRef(null);

  const preloaderRef = useRef(null);
  const preLogoRef = useRef(null);
  const preCountRef = useRef(null);
  const preBarFillRef = useRef(null);
  const preRing1Ref = useRef(null);
  const preRing2Ref = useRef(null);
  const entryFlashRef = useRef(null);

  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const cleanupFns = [];
    const rafIds = [];

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    async function setup() {
      // vanta.birds is a UMD bundle that reads `window.THREE` at evaluation
      // time (`let s = window.THREE || {}` at the top of the module), so
      // THREE must be loaded and attached to window BEFORE vanta is
      // imported — they can't be Promise.all'd together, or vanta silently
      // falls back to an empty object and the bird background never renders.
      const threeModule = await import('three');
      if (cancelled || !rootRef.current) return;
      const THREE = threeModule.default || threeModule;
      window.THREE = THREE;

      const [
        gsapModule,
        ScrollTriggerModule,
        SplitTypeModule,
        LenisModule,
        vantaModule,
      ] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('split-type'),
        import('lenis'),
        import('vanta/dist/vanta.birds.min.js'),
      ]);

      if (cancelled || !rootRef.current) return;

      const gsap = gsapModule.gsap ?? gsapModule.default ?? gsapModule;
      const ScrollTrigger = ScrollTriggerModule.ScrollTrigger ?? ScrollTriggerModule.default;
      const SplitType = SplitTypeModule.default ?? SplitTypeModule;
      const Lenis = LenisModule.default ?? LenisModule;

      let VANTA_BIRDS = vantaModule.default ?? vantaModule;
      while (VANTA_BIRDS && typeof VANTA_BIRDS !== 'function' && VANTA_BIRDS.default) {
        VANTA_BIRDS = VANTA_BIRDS.default;
      }
      const FontLoader = THREE.FontLoader;
      const TextGeometry = THREE.TextGeometry;

      gsap.registerPlugin(ScrollTrigger);
      const root = rootRef.current;
      const qsa = (sel) => Array.from(root.querySelectorAll(sel));

      // Silence a known-harmless deprecation warning from the Vanta birds bundle.
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('BufferAttribute: .length has been deprecated')) return;
        originalWarn.apply(console, args);
      };
      cleanupFns.push(() => { console.warn = originalWarn; });
      cleanupFns.push(() => { delete window.THREE; });

      /* =========================================================
         0. PRELOADER
         ========================================================= */
      const preLogo = preLogoRef.current;
      const preCount = preCountRef.current;
      const preBarFill = preBarFillRef.current;
      const preloaderEl = preloaderRef.current;

      const PRE_TEXT = 'DevConnect';
      const ACCENT_FROM = 3;
      preLogo.innerHTML = '';
      PRE_TEXT.split('').forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'dc-pre-letter' + (i >= ACCENT_FROM ? ' dc-accent' : '');
        span.textContent = ch;
        preLogo.appendChild(span);
      });
      const preLetters = Array.from(preLogo.querySelectorAll('.dc-pre-letter'));

      function runPreloader(onDone) {
        if (reducedMotion) {
          gsap.set(preLetters, { opacity: 1, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotate: 0, scale: 1 });
          preloaderEl.style.display = 'none';
          onDone();
          return;
        }

        const preTl = gsap.timeline();

        preLetters.forEach((el) => {
          gsap.set(el, {
            opacity: 0,
            y: gsap.utils.random(-40, 40),
            x: gsap.utils.random(-15, 15),
            z: gsap.utils.random(-260, -80),
            rotateX: gsap.utils.random(-70, 70),
            rotateY: gsap.utils.random(-80, 80),
            rotate: gsap.utils.random(-30, 30),
            scale: 0.4,
          });
        });

        preTl
          .to(preRing1Ref.current, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0)
          .to(preRing2Ref.current, { opacity: 0.5, duration: 0.8, ease: 'power2.out' }, 0.1)
          .to(preLetters, { opacity: 1, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotate: 0, scale: 1, duration: 1.0, stagger: 0.05, ease: 'back.out(1.6)' }, 0)
          .to('.dc-pre-count', { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.3)
          .to('.dc-pre-bar', { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.3);

        const obj = { pct: 0 };
        preTl.to(obj, {
          pct: 100,
          duration: 2.4,
          ease: 'sine.inOut',
          onUpdate: () => {
            const v = Math.round(obj.pct);
            preCount.textContent = v + '%';
            preBarFill.style.width = v + '%';
          },
          onComplete: () => {
            gsap.to('.dc-pre-inner', { scale: 1.15, rotateX: 14, z: -150, opacity: 0, filter: 'blur(12px)', duration: 0.7, ease: 'power2.in' });
            gsap.to([preRing1Ref.current, preRing2Ref.current], { opacity: 0, scale: 1.3, duration: 0.6, ease: 'power2.in' });

            gsap.timeline()
              .to(entryFlashRef.current, { opacity: 1, duration: 0.25, ease: 'power2.out' })
              .to(entryFlashRef.current, { opacity: 0, duration: 0.7, ease: 'power2.in' });

            onDone();

            gsap.to(preloaderEl, {
              opacity: 0,
              duration: 0.9,
              delay: 0.15,
              ease: 'power2.inOut',
              onComplete: () => { preloaderEl.style.display = 'none'; },
            });
          },
        }, 0.6);
      }

      /* =========================================================
         1. THREE.JS BACKGROUND — particle field + flying "DevConnect" logo
         ========================================================= */
      const holder = bgCanvasHolderRef.current;
      const bgBlurPanel = bgBlurPanelRef.current;
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.set(0, 0, 22);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      holder.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0x404040, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(4, 6, 8);
      scene.add(key);
      const rim = new THREE.PointLight(0xff98a2, 2.2, 30);
      rim.position.set(-6, -2, 6);
      scene.add(rim);

      const particleCount = 160;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({ color: 0x3a3d42, size: 0.05, transparent: true, opacity: 0.55 });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      const TEXT = 'DevConnect';
      const fontLoader = new FontLoader();
      const letterMeshes = [];
      let lettersReady = false;

      fontLoader.load(
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/fonts/helvetiker_bold.typeface.json',
        (font) => {
          if (cancelled) return;
          const chars = TEXT.split('');
          const size = 1.3, depth = 0.32;

          const geos = chars.map((ch) => new TextGeometry(ch === ' ' ? ' ' : ch, {
            font, size, height: depth, curveSegments: 5,
            bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 2,
          }));

          let totalWidth = 0;
          const widths = geos.map((g) => {
            g.computeBoundingBox();
            const w = (g.boundingBox.max.x - g.boundingBox.min.x) || size * 0.5;
            totalWidth += w + 0.05;
            return w;
          });

          let cursorX = -totalWidth / 2;
          const mat = new THREE.MeshStandardMaterial({ color: 0xff98a2, metalness: 0.55, roughness: 0.25, emissive: 0x2a0a00 });

          chars.forEach((ch, i) => {
            const mesh = new THREE.Mesh(geos[i], mat.clone());
            const finalX = cursorX;
            cursorX += widths[i] + 0.05;

            mesh.userData.from = {
              pos: new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20 + (Math.random() > 0.5 ? 10 : -10), (Math.random() - 0.5) * 20 - 10),
              rot: new THREE.Vector3(Math.random() * Math.PI * 4 - Math.PI * 2, Math.random() * Math.PI * 4 - Math.PI * 2, Math.random() * Math.PI * 4 - Math.PI * 2),
            };
            mesh.userData.to = { pos: new THREE.Vector3(finalX, 1.4, 0), rot: new THREE.Vector3(0, 0, 0) };

            mesh.position.copy(mesh.userData.from.pos);
            mesh.rotation.set(mesh.userData.from.rot.x, mesh.userData.from.rot.y, mesh.userData.from.rot.z);
            mesh.visible = false;

            scene.add(mesh);
            letterMeshes.push(mesh);
          });

          lettersReady = true;
          if (introTriggered || reducedMotion) {
            animateLettersIn();
          }
        }
      );

      function lerp(a, b, t) { return a + (b - a) * t; }
      let lettersSettled = false;
      let introTriggered = false;

      function animateLettersIn() {
        introTriggered = true;
        if (!lettersReady) return;
        const total = letterMeshes.length;

        letterMeshes.forEach((mesh, i) => {
          mesh.visible = true;
          mesh.scale.set(0.55, 0.55, 0.55);
          const to = mesh.userData.to;
          const delay = reducedMotion ? 0 : i * 0.05;
          const isLast = i === total - 1;

          gsap.to(mesh.position, {
            x: to.pos.x, y: to.pos.y, z: to.pos.z,
            duration: reducedMotion ? 0.01 : 1.6, delay,
            ease: 'power4.out',
            onComplete: isLast ? () => { lettersSettled = true; } : undefined,
          });
          gsap.to(mesh.rotation, { x: 0, y: 0, z: 0, duration: reducedMotion ? 0.01 : 1.6, delay, ease: 'power4.out' });
          gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: reducedMotion ? 0.01 : 1.1, delay: delay + 0.35, ease: 'back.out(1.8)' });
        });
      }

      const mouseNorm = new THREE.Vector2(0, 0);
      const onMouseMove = (e) => {
        mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      window.addEventListener('mousemove', onMouseMove);
      cleanupFns.push(() => window.removeEventListener('mousemove', onMouseMove));

      const raycastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const raycaster = new THREE.Raycaster();
      const mouseWorld = new THREE.Vector3();

      let heroScrollProgress = 0;

      function updateLetterScrollExit() {
        if (!lettersReady || heroScrollProgress <= 0) return false;
        const eased = heroScrollProgress * heroScrollProgress;

        letterMeshes.forEach((mesh) => {
          const from = mesh.userData.from;
          const to = mesh.userData.to;
          mesh.position.set(lerp(to.pos.x, from.pos.x, eased), lerp(to.pos.y, from.pos.y, eased), lerp(to.pos.z, from.pos.z, eased));
          mesh.rotation.set(lerp(to.rot.x, from.rot.x, eased), lerp(to.rot.y, from.rot.y, eased), lerp(to.rot.z, from.rot.z, eased));
        });
        return true;
      }

      const clock = new THREE.Clock();

      function updateLetterCursorReact() {
        if (!lettersSettled || reducedMotion) return;
        if (heroScrollProgress > 0) return;
        raycaster.setFromCamera(mouseNorm, camera);
        raycaster.ray.intersectPlane(raycastPlane, mouseWorld);
        const t = clock.getElapsedTime();

        letterMeshes.forEach((mesh, i) => {
          const restY = mesh.userData.to.pos.y;
          const restX = mesh.userData.to.pos.x;
          const bob = Math.sin(t * 0.8 + i * 0.3) * 0.04;

          const dx = mouseWorld.x - restX;
          const dy = mouseWorld.y - restY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / 3.2);
          const pull = influence * influence;

          const targetX = restX + dx * pull * 0.3;
          const targetY = restY + bob - pull * 1.3;
          const targetRotY = Math.atan2(dx, 4) * influence;
          const targetRotX = Math.atan2(-dy, 4) * influence + pull * 0.4;

          mesh.position.x = lerp(mesh.position.x, targetX, 0.15);
          mesh.position.y = lerp(mesh.position.y, targetY, 0.15);
          mesh.rotation.y = lerp(mesh.rotation.y, targetRotY, 0.15);
          mesh.rotation.x = lerp(mesh.rotation.x, targetRotX, 0.15);
        });
      }

      const onResizeMain = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResizeMain);
      cleanupFns.push(() => window.removeEventListener('resize', onResizeMain));

      let mainLoopActive = true;
      function renderLoop() {
        if (!mainLoopActive) return;
        rafIds.push(requestAnimationFrame(renderLoop));
        const exiting = updateLetterScrollExit();
        if (!exiting) updateLetterCursorReact();

        particles.rotation.y += 0.0004;
        camera.position.x = lerp(camera.position.x, mouseNorm.x * 0.6, 0.04);
        camera.position.y = lerp(camera.position.y, mouseNorm.y * 0.4, 0.04);
        camera.lookAt(0, 1, 0);

        renderer.render(scene, camera);
      }
      renderLoop();
      cleanupFns.push(() => {
        mainLoopActive = false;
        renderer.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        letterMeshes.forEach((m) => { m.geometry?.dispose?.(); m.material?.dispose?.(); });
        holder.removeChild(renderer.domElement);
      });

      /* =========================================================
         1b. VANTA BIRDS — permanent site-wide background
         ========================================================= */
      let vantaEffect = null;
      if (typeof VANTA_BIRDS === 'function') {
        try {
          vantaEffect = VANTA_BIRDS({
            el: globalVantaRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            backgroundColor: 0x050506,
            backgroundAlpha: 1.0,
            color1: 0xff98a2,
            color2: 0x6b6bd6,
            colorMode: 'lerpGradient',
            birdSize: 1.4,
            wingSpan: 17,
            speedLimit: 5,
            separation: 51,
            alignment: 55,
            cohesion: 24,
            quantity: 3.5,
          });
        } catch (vantaErr) {
          console.warn('[DevConnectLanding] Vanta birds background skipped due to Three.js compatibility:', vantaErr);
        }
      } else {
        // Couldn't resolve the vanta factory — skip the birds background
        // instead of throwing and killing the rest of the landing page.
        console.warn('[DevConnectLanding] VANTA_BIRDS resolved to a non-function; skipping birds background.');
      }
      cleanupFns.push(() => {
        try {
          vantaEffect?.destroy?.();
        } catch {}
      });

      if (!reducedMotion) {
        gsap.to(globalVantaRef.current, {
          opacity: 1,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: '+=400',
            scrub: true,
          },
        });
      } else if (globalVantaRef.current) {
        gsap.set(globalVantaRef.current, { opacity: 1, scale: 1 });
      }

      /* =========================================================
         2. GSAP INTRO TIMELINE
         ========================================================= */
      const splitSub = new SplitType(subheadRef.current, { types: 'chars' });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, paused: true });

      if (reducedMotion) {
        gsap.set(introVeilRef.current, { opacity: 0 });
        gsap.set(splitSub.chars, { opacity: 1, y: 0 });
        gsap.set([ctaPrimaryRef.current, ctaSecondaryRef.current], { opacity: 1, y: 0, scale: 1 });
        gsap.set(scrollIndicatorRef.current, { opacity: 1 });
        animateLettersIn();
        setupHeroExitFade();
      } else {
        tl.to(introVeilRef.current, { opacity: 0, duration: 1.1, ease: 'power2.out' }, 0)
          .to(camera.position, { z: 14, duration: 2.2, ease: 'power2.out' }, 0)
          .call(() => animateLettersIn(), undefined, 0.6)
          .to(splitSub.chars, { opacity: 1, y: 0, duration: 0.6, stagger: 0.02 }, 2.3)
          .to([ctaPrimaryRef.current, ctaSecondaryRef.current], { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15 }, 2.8)
          .to(scrollIndicatorRef.current, { opacity: 1, duration: 0.6 }, 3.3)
          .call(() => setupHeroExitFade());
      }

      /* =========================================================
         3. MAGNETIC CTA BUTTONS
         ========================================================= */
      const magneticCleanups = [];
      if (!reducedMotion) {
        qsa('.dc-btn').forEach((btn) => {
          const onMove = (e) => {
            const rect = btn.getBoundingClientRect();
            const relX = e.clientX - rect.left - rect.width / 2;
            const relY = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: relX * 0.35, y: relY * 0.35, duration: 0.3, ease: 'power2.out' });
          };
          const onLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
          btn.addEventListener('mousemove', onMove);
          btn.addEventListener('mouseleave', onLeave);
          magneticCleanups.push(() => {
            btn.removeEventListener('mousemove', onMove);
            btn.removeEventListener('mouseleave', onLeave);
          });
        });
      }
      cleanupFns.push(() => magneticCleanups.forEach((fn) => fn()));

      /* =========================================================
         4. SCROLLTRIGGER EXIT ANIMATION for the hero
         ========================================================= */
      
      function setupHeroExitFade() {
        if (reducedMotion) return;
        gsap.fromTo(
          [subheadRef.current, ctaPrimaryRef.current, ctaSecondaryRef.current, scrollIndicatorRef.current],
          { opacity: 1, y: 0 },
          {
            opacity: 0, y: -40, stagger: 0.03, ease: 'power1.in',
            scrollTrigger: { trigger: '.dc-hero', start: 'top top', end: 'bottom top', scrub: 0.4 },
          }
        );
      }

      if (!reducedMotion) {
        ScrollTrigger.create({
          trigger: '.dc-hero',
          start: 'top top',
          end: () => '+=' + window.innerHeight * 2,
          scrub: true,
          onUpdate: (self) => {
            heroScrollProgress = self.progress;
            holder.style.opacity = String(1 - self.progress);
            bgBlurPanel.style.opacity = String(self.progress);
          },
        });
      } else {
        bgBlurPanel.style.opacity = '1';
      }

      /* =========================================================
         5. 3D SCROLL STORYTELLING
         ========================================================= */
      const storyHolder = storyCanvasHolderRef.current;
      const storyScene = new THREE.Scene();
      const storyCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
      storyCamera.position.set(0, 0, 16);

      const storyRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      storyRenderer.setSize(window.innerWidth, window.innerHeight);
      storyRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      storyRenderer.setClearColor(0x000000, 0);
      storyHolder.appendChild(storyRenderer.domElement);

      storyScene.add(new THREE.AmbientLight(0x404040, 1.0));
      const storyKey = new THREE.DirectionalLight(0xffffff, 1.1);
      storyKey.position.set(4, 6, 8);
      storyScene.add(storyKey);

      const storyProgressBar = storyProgressRef.current;
      const storyHeadings = qsa('.dc-story-beat h2');

      function updateStory(progress) {
        const angle = progress * Math.PI * 1.4;
        const dist = lerp(16, 9, progress);
        storyCamera.position.x = Math.sin(angle) * dist;
        storyCamera.position.z = Math.cos(angle) * dist;
        storyCamera.position.y = lerp(1, -1.5, progress);
        storyCamera.lookAt(0, 0, 0);

        storyProgressBar.style.width = progress * 100 + '%';

        if (storyHeadings.length) {
          const activeIdx = Math.min(storyHeadings.length - 1, Math.floor(progress * storyHeadings.length));
          storyHeadings.forEach((h2, i) => h2.classList.toggle('dc-line-glow', i === activeIdx));
        }
      }

      if (!reducedMotion) {
        gsap.fromTo(storyCanvasHolderRef.current, { opacity: 0 }, {
          opacity: 1, duration: 0.6, ease: 'none',
          scrollTrigger: { trigger: '.dc-story-stage', start: 'top 90%', end: 'top 40%', scrub: true },
        });
        gsap.to(storyCanvasHolderRef.current, {
          opacity: 0, duration: 0.6, ease: 'none',
          scrollTrigger: { trigger: '.dc-next-section', start: 'top 90%', end: 'top 40%', scrub: true },
        });
      } else {
        gsap.set(storyCanvasHolderRef.current, { opacity: 1 });
      }

      let storyLoopActive = true;
      function storyRenderLoop() {
        if (!storyLoopActive) return;
        rafIds.push(requestAnimationFrame(storyRenderLoop));
        storyRenderer.render(storyScene, storyCamera);
      }
      storyRenderLoop();

      const onResizeStory = () => {
        storyCamera.aspect = window.innerWidth / window.innerHeight;
        storyCamera.updateProjectionMatrix();
        storyRenderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', onResizeStory);
      cleanupFns.push(() => {
        window.removeEventListener('resize', onResizeStory);
        storyLoopActive = false;
        storyRenderer.dispose();
        storyHolder.removeChild(storyRenderer.domElement);
      });

      /* 5b. Cinematic blur + scale settle for content below the story */
      if (!reducedMotion) {
        qsa('.dc-next-section h2, .dc-story-beat').forEach((el) => {
          gsap.fromTo(el, { scale: 0.94, filter: 'blur(10px)' }, {
            scale: 1, filter: 'blur(0px)', ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 45%', scrub: true },
          });
        });
      }

      /* 5c. Story scroll trigger — drives camera + progress bar */
      if (!reducedMotion) {
        ScrollTrigger.create({
          trigger: '.dc-story-track',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          onUpdate: (self) => updateStory(self.progress),
        });
      } else {
        updateStory(0);
      }

      /* =========================================================
         6. LENIS — smooth scroll synced into GSAP's ticker
         ========================================================= */
      let lenis = null;
      let lenisRaf;
      if (!reducedMotion) {
        lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
        lenis.on('scroll', ScrollTrigger.update);
        lenisRaf = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(lenisRaf);
        gsap.ticker.lagSmoothing(0);
        cleanupFns.push(() => {
          gsap.ticker.remove(lenisRaf);
          lenis.destroy();
        });
      }

      /* =========================================================
         7. CUSTOM CURSOR
         ========================================================= */
      if (!reducedMotion && window.matchMedia('(hover: hover)').matches) {
        gsap.set([cursorDotRef.current, cursorRingRef.current], { xPercent: -50, yPercent: -50 });
        const dotX = gsap.quickTo(cursorDotRef.current, 'x', { duration: 0.1, ease: 'power2.out' });
        const dotY = gsap.quickTo(cursorDotRef.current, 'y', { duration: 0.1, ease: 'power2.out' });
        const ringX = gsap.quickTo(cursorRingRef.current, 'x', { duration: 0.35, ease: 'power2.out' });
        const ringY = gsap.quickTo(cursorRingRef.current, 'y', { duration: 0.35, ease: 'power2.out' });

        const onCursorMove = (e) => { dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY); };
        window.addEventListener('mousemove', onCursorMove);
        cleanupFns.push(() => window.removeEventListener('mousemove', onCursorMove));

        const cursorTargets = qsa('.dc-btn, .dc-nav-cta, a');
        const cursorEnterCleanups = [];
        cursorTargets.forEach((el) => {
          const onEnter = () => gsap.to(cursorRingRef.current, { scale: 1.8, duration: 0.3, ease: 'power2.out' });
          const onLeave = () => gsap.to(cursorRingRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' });
          el.addEventListener('mouseenter', onEnter);
          el.addEventListener('mouseleave', onLeave);
          cursorEnterCleanups.push(() => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); });
        });
        cleanupFns.push(() => cursorEnterCleanups.forEach((fn) => fn()));
      }

      /* =========================================================
         8. BLUR PANEL HEIGHT SYNC
         ========================================================= */
      function syncBlurPanelHeight() {
        bgBlurPanel.style.height = document.documentElement.scrollHeight + 'px';
      }
      window.addEventListener('load', syncBlurPanelHeight);
      window.addEventListener('resize', syncBlurPanelHeight);
      ScrollTrigger.addEventListener('refresh', syncBlurPanelHeight);
      syncBlurPanelHeight();
      const lateSyncTimeout = setTimeout(syncBlurPanelHeight, 1200);
      cleanupFns.push(() => {
        window.removeEventListener('load', syncBlurPanelHeight);
        window.removeEventListener('resize', syncBlurPanelHeight);
        ScrollTrigger.removeEventListener('refresh', syncBlurPanelHeight);
        clearTimeout(lateSyncTimeout);
      });

      /* =========================================================
         9. KICK OFF
         ========================================================= */
      runPreloader(() => tl.play());

      cleanupFns.push(() => {
        tl.kill();
        gsap.killTweensOf('*');
        splitSub.revert?.();
        ScrollTrigger.getAll().forEach((st) => st.kill());
      });
    }

    setup();

    return () => {
      cancelled = true;
      rafIds.forEach((id) => cancelAnimationFrame(id));
      cleanupFns.forEach((fn) => {
        try { fn(); } catch { /* already torn down */ }
      });
    };
  }, []);

  return (
    <div className="dc-root" ref={rootRef}>
      <LandingPreloader
        preloaderRef={preloaderRef}
        preRing2Ref={preRing2Ref}
        preRing1Ref={preRing1Ref}
        preLogoRef={preLogoRef}
        preCountRef={preCountRef}
        preBarFillRef={preBarFillRef}
      />

      <div id="dc-entryFlash" ref={entryFlashRef} />

      <div className="dc-cursor-ring" ref={cursorRingRef} />
      <div className="dc-cursor-dot" ref={cursorDotRef} />
      <div id="dc-filmGrain" />

      <div id="dc-introVeil" ref={introVeilRef} />
      <div id="dc-globalVantaBirds" ref={globalVantaRef} />
      <div id="dc-bgBlurPanel" ref={bgBlurPanelRef} />
      <div id="dc-bgCanvasHolder" ref={bgCanvasHolderRef} />

      <LandingHero
        logoStageRef={logoStageRef}
        subheadRef={subheadRef}
        ctaPrimaryRef={ctaPrimaryRef}
        ctaSecondaryRef={ctaSecondaryRef}
        scrollIndicatorRef={scrollIndicatorRef}
      />

      <LandingStory
        storyProgressRef={storyProgressRef}
        storyStageRef={storyStageRef}
        storyCanvasHolderRef={storyCanvasHolderRef}
        storyTrackRef={storyTrackRef}
      />

      <LandingTestimonials
        nextSectionRef={nextSectionRef}
        testimonialItems={testimonialItems}
      />
    </div>
  );
}