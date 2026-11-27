import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GENERATED_MEDIA } from '../../data/defaultCatalog';

interface HeroThreeSceneProps {
  variant?: 'background' | 'card';
}

function drawAnimatedReelFrame(
  ctx: CanvasRenderingContext2D,
  t: number
) {
  const w = 384;
  const h = 240;

  // Deep cinematic gradient backdrop shifting subtly over time
  const shift = Math.sin(t * 0.6) * 18;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0e0e13');
  grad.addColorStop(0.5 + shift * 0.004, '#241c10');
  grad.addColorStop(1, '#09090d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Moving light sweep across the frame
  const sweepX = ((t * 75) % (w + 160)) - 80;
  const sweep = ctx.createLinearGradient(sweepX - 70, 0, sweepX + 70, h);
  sweep.addColorStop(0, 'rgba(212, 175, 55, 0)');
  sweep.addColorStop(0.5, 'rgba(212, 175, 55, 0.22)');
  sweep.addColorStop(1, 'rgba(212, 175, 55, 0)');
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, w, h);

  // Outer cinema viewfinder border
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, w - 28, h - 28);

  // Live animated audio / color-scope spectrum bars
  const barCount = 18;
  for (let i = 0; i < barCount; i++) {
    const wave =
      Math.sin(t * 3.1 + i * 0.55) * 0.45 +
      Math.cos(t * 1.9 - i * 0.35) * 0.3 +
      0.55;
    const barH = 18 + Math.max(0.1, wave) * 76;
    const x = 34 + i * 18;
    const y = 132 - barH * 0.5;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(212, 175, 55, 0.92)' : 'rgba(244, 244, 245, 0.32)';
    ctx.fillRect(x, y, 10, barH);
  }

  // Animated timeline scrubber bar along bottom of frame
  const scrubProgress = (t * 0.14) % 1;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(28, h - 34, w - 56, 4);
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(28, h - 34, (w - 56) * scrubProgress, 4);

  // Rule-of-thirds overlay
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 3, 14);
  ctx.lineTo(w / 3, h - 14);
  ctx.moveTo((w * 2) / 3, 14);
  ctx.lineTo((w * 2) / 3, h - 14);
  ctx.moveTo(14, h / 3);
  ctx.lineTo(w - 14, h / 3);
  ctx.moveTo(14, (h * 2) / 3);
  ctx.lineTo(w - 14, (h * 2) / 3);
  ctx.stroke();
}

function createParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 232, 165, 1)');
    grad.addColorStop(0.45, 'rgba(212, 175, 55, 0.48)');
    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const HeroThreeScene: React.FC<HeroThreeSceneProps> = ({ variant = 'background' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth || 1280;
    const height = container.clientHeight || 640;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070709, 0.042);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.25, variant === 'background' ? 8.2 : 7.6);

    // 3-point warm/cool studio lighting rig
    const keyLight = new THREE.DirectionalLight(0xffe7b3, 2.3);
    keyLight.position.set(5, 6, 5.5);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x18181b, 0.75);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 2.0);
    rimLight.position.set(-5.5, 2.8, -4);
    scene.add(rimLight);

    // Materials
    const brushedGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.2,
      anisotropy: 0.8,
      clearcoat: 0.45,
    });
    const obsidianMetalMat = new THREE.MeshStandardMaterial({
      color: 0x141418,
      metalness: 0.82,
      roughness: 0.36,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.08,
      transparent: true,
      opacity: isSoftwareGl ? 0.32 : 0.44,
      ior: 1.52,
      clearcoat: 1.0,
      depthWrite: false,
    });

    // Dynamic animated reel canvas texture
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 384;
    screenCanvas.height = 240;
    const screenCtx = screenCanvas.getContext('2d');
    if (screenCtx) drawAnimatedReelFrame(screenCtx, 0);
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTex,
      roughness: 0.24,
      metalness: 0.12,
      emissive: new THREE.Color(0x221a09),
      emissiveIntensity: 0.45,
    });

    const studioRig = new THREE.Group();
    const getRigOffsetX = (w: number) =>
      variant === 'background' ? (w >= 1024 ? 1.85 : 0.4) : 0;
    studioRig.position.x = getRigOffsetX(width);
    scene.add(studioRig);

    // 1. Composite Cinema Lens & Iris Assembly
    const lensGroup = new THREE.Group();
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.095, 24, 64), obsidianMetalMat);
    const goldBevel = new THREE.Mesh(new THREE.TorusGeometry(1.56, 0.036, 20, 64), brushedGoldMat);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.05, 16, 48), obsidianMetalMat);
    const lensGlass = new THREE.Mesh(new THREE.CircleGeometry(1.26, 48), glassMat);
    lensGlass.position.z = 0.025;
    lensGroup.add(outerRing, goldBevel, innerRing, lensGlass);

    const bladeGeo = new THREE.BoxGeometry(0.54, 0.11, 0.022);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeo, obsidianMetalMat);
      blade.position.set(Math.cos(angle) * 1.05, Math.sin(angle) * 1.05, -0.02);
      blade.rotation.z = angle + 0.55;
      lensGroup.add(blade);
    }
    lensGroup.position.set(0.4, 0.2, -0.6);
    studioRig.add(lensGroup);

    // 2. Floating Animated Video Frame Panels
    function createFramePanel(w: number, h: number): THREE.Group {
      const grp = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), obsidianMetalMat);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.18, h - 0.18), screenMat);
      screen.position.z = 0.045;
      const accentBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.035, 0.09), brushedGoldMat);
      accentBar.position.set(-w * 0.18, -h * 0.5 - 0.05, 0);
      grp.add(body, screen, accentBar);
      return grp;
    }

    const mainFrame = createFramePanel(3.1, 1.92);
    mainFrame.position.set(-0.35, 0.15, 0.85);
    mainFrame.rotation.set(-0.05, -0.2, 0.02);
    studioRig.add(mainFrame);

    const secondaryFrame = createFramePanel(1.9, 1.2);
    secondaryFrame.position.set(2.15, -0.7, 0.15);
    secondaryFrame.rotation.set(0.08, -0.38, -0.04);
    studioRig.add(secondaryFrame);

    const backgroundFrame = createFramePanel(1.55, 0.96);
    backgroundFrame.position.set(-2.6, 1.05, -1.35);
    backgroundFrame.rotation.set(0.04, 0.28, -0.03);
    studioRig.add(backgroundFrame);

    // 3. 3D Editing Timeline Track with Animated Playhead
    const timelineGroup = new THREE.Group();
    const rail = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.045, 0.06), obsidianMetalMat);
    timelineGroup.add(rail);

    const clipWidths = [0.78, 1.15, 0.55, 0.96, 0.68];
    let cursorX = -2.1;
    clipWidths.forEach((cw, idx) => {
      const clip = new THREE.Mesh(
        new THREE.BoxGeometry(cw, 0.18, 0.085),
        idx % 2 === 0 ? brushedGoldMat : obsidianMetalMat
      );
      clip.position.set(cursorX + cw * 0.5, idx % 2 === 0 ? 0.12 : -0.12, 0);
      timelineGroup.add(clip);
      cursorX += cw + 0.12;
    });

    const playhead = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.68, 0.12), brushedGoldMat);
    playhead.position.set(-2.0, 0.05, 0.05);
    timelineGroup.add(playhead);

    timelineGroup.position.set(0.1, -1.65, 0.55);
    timelineGroup.rotation.x = -0.2;
    studioRig.add(timelineGroup);

    // 4. Atmospheric Gold Dust Particles
    const particleCount = variant === 'background' ? 95 : 65;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 7.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleTex = createParticleTexture();
    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTex,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Smooth parallax across window when used as full background
    let targetRotX = 0;
    let targetRotY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      targetRotY = nx * 0.14;
      targetRotX = -ny * 0.09;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnavailable(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth || 1280;
      const h = container.clientHeight || 640;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      studioRig.position.x = getRigOffsetX(w);
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let lastTexUpdate = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Update live animated video frame on screens (~15fps on GPU, every tick on software)
      if (screenCtx && (isSoftwareGl || elapsed - lastTexUpdate >= 0.065)) {
        drawAnimatedReelFrame(screenCtx, elapsed);
        screenTex.needsUpdate = true;
        lastTexUpdate = elapsed;
      }

      // Smooth continuous orbital sweep + pointer parallax
      const autoYaw = Math.sin(elapsed * 0.25) * 0.14;
      const autoPitch = Math.cos(elapsed * 0.19) * 0.05;
      studioRig.rotation.y = THREE.MathUtils.damp(
        studioRig.rotation.y,
        targetRotY + autoYaw,
        3.5,
        delta
      );
      studioRig.rotation.x = THREE.MathUtils.damp(
        studioRig.rotation.x,
        targetRotX + autoPitch,
        3.5,
        delta
      );

      camera.position.x = Math.sin(elapsed * 0.18) * 0.22;
      camera.position.y = 0.25 + Math.cos(elapsed * 0.21) * 0.12;

      lensGroup.rotation.z = elapsed * 0.14;
      mainFrame.position.y = 0.15 + Math.sin(elapsed * 0.85) * 0.09;
      secondaryFrame.position.y = -0.7 + Math.cos(elapsed * 1.05) * 0.08;
      backgroundFrame.position.y = 1.05 + Math.sin(elapsed * 0.7 + 1.2) * 0.1;

      // Playhead glides smoothly across the 3D timeline
      const loopProgress = (elapsed * 0.16) % 1;
      playhead.position.x = -2.2 + loopProgress * 4.4;

      particles.rotation.y = elapsed * 0.035;
      particles.position.y = Math.sin(elapsed * 0.25) * 0.15;

      renderer.render(scene, camera);

      if (prefersReduced) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      screenTex.dispose();
      particleTex.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, [variant]);

  if (webglUnavailable) {
    return (
      <div
        className={
          variant === 'background'
            ? 'absolute inset-0 overflow-hidden bg-[#070709]'
            : 'relative w-full h-full rounded-2xl overflow-hidden border border-zinc-800 bg-[#111115]'
        }
      >
        <img
          src={GENERATED_MEDIA.heroStudio}
          alt="Sri Editing Studio color grading suite"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709]/90 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      aria-hidden={variant === 'background'}
      aria-label={
        variant === 'background'
          ? undefined
          : 'Interactive 3D cinema lens and editing timeline scene'
      }
      className={
        variant === 'background'
          ? 'absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden bg-[#070709]'
          : 'w-full h-full min-h-[340px] lg:min-h-[460px] rounded-2xl overflow-hidden bg-[#0b0b0f] border border-zinc-800/80'
      }
    />
  );
};
