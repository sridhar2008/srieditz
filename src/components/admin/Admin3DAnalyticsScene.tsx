import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Expand, Layers3, RotateCw } from 'lucide-react';

export interface AnalyticsSliceDatum {
  name: string;
  value: number;
  color: string;
}

export interface AnalyticsBarDatum {
  name: string;
  count: number;
}

interface Admin3DAnalyticsSceneProps {
  statusData: AnalyticsSliceDatum[];
  categoryData: AnalyticsBarDatum[];
  activeSliceName: string | null;
  onSelectSlice: (name: string | null) => void;
  isSamplePreview?: boolean;
}

type CameraPreset = 'overview' | 'pie' | 'graph';

interface InspectedDatum {
  kind: 'pie' | 'bar';
  label: string;
  value: number;
  share?: string;
}

const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

function createPlinthGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c0c11';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.14)';
    ctx.lineWidth = 1;
    const step = 32;
    for (let i = 0; i <= 512; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.34)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(256, 256, 224, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(256, 256, 148, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 18, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.32)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoundedBarGeometry(width: number, height: number, depth: number): THREE.ExtrudeGeometry {
  const hw = width * 0.5;
  const hd = depth * 0.5;
  const r = Math.min(hw, hd) * 0.28;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.08, height),
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function createDonutSliceGeometry(
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  depth: number
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const safeEnd = Math.max(startAngle + 0.06, endAngle);
  shape.absarc(0, 0, outerR, startAngle, safeEnd, false);
  shape.lineTo(Math.cos(safeEnd) * innerR, Math.sin(safeEnd) * innerR);
  shape.absarc(0, 0, innerR, safeEnd, startAngle, true);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export const Admin3DAnalyticsScene: React.FC<Admin3DAnalyticsSceneProps> = ({
  statusData,
  categoryData,
  activeSliceName,
  onSelectSlice,
  isSamplePreview = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [explodeSlices, setExplodeSlices] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [inspected, setInspected] = useState<InspectedDatum | null>(null);

  const presetRef = useRef<CameraPreset>(cameraPreset);
  const presetDirtyRef = useRef(false);
  const explodeRef = useRef(explodeSlices);
  const autoOrbitRef = useRef(autoOrbit);
  const activeSliceRef = useRef<string | null>(activeSliceName);
  const onSelectSliceRef = useRef(onSelectSlice);

  useEffect(() => {
    presetRef.current = cameraPreset;
    presetDirtyRef.current = true;
  }, [cameraPreset]);

  useEffect(() => {
    explodeRef.current = explodeSlices;
  }, [explodeSlices]);

  useEffect(() => {
    autoOrbitRef.current = autoOrbit;
  }, [autoOrbit]);

  useEffect(() => {
    activeSliceRef.current = activeSliceName;
  }, [activeSliceName]);

  useEffect(() => {
    onSelectSliceRef.current = onSelectSlice;
  }, [onSelectSlice]);

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
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 420;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090d);
    scene.fog = new THREE.FogExp2(0x09090d, 0.036);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 80);
    camera.position.set(0.4, 4.4, 9.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.6;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minPolarAngle = 0.25;
    controls.target.set(0, 0.7, 0);

    controls.addEventListener('start', () => {
      presetDirtyRef.current = false;
    });

    // Studio 3-point lighting rig
    const keyLight = new THREE.DirectionalLight(0xffe9ba, 2.4);
    keyLight.position.set(5, 8.5, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -7;
    keyLight.shadow.camera.right = 7;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x94a3b8, 0x15151a, 0.8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 1.9);
    rimLight.position.set(-6, 4.2, -5);
    scene.add(rimLight);

    // Materials with calibrated metalness / roughness contrast
    const brushedGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.18,
      anisotropy: 0.8,
      clearcoat: 0.45,
    });
    const darkObsidianMat = new THREE.MeshStandardMaterial({
      color: 0x131319,
      metalness: 0.78,
      roughness: 0.42,
    });
    const gridTex = createPlinthGridTexture();
    gridTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const deckMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.55,
      metalness: 0.25,
    });
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Contact shadow grounding plane
    const contactPlane = new THREE.Mesh(new THREE.PlaneGeometry(15.5, 9.5), shadowMat);
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.set(0, 0.004, 0);
    stageGroup.add(contactPlane);

    // Studio floor deck
    const baseDeck = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.16, 4.9), darkObsidianMat);
    baseDeck.position.set(0, 0.1, 0);
    baseDeck.receiveShadow = true;
    stageGroup.add(baseDeck);

    const deckSurface = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 4.5), deckMat);
    deckSurface.rotation.x = -Math.PI / 2;
    deckSurface.position.set(0, 0.19, 0);
    deckSurface.receiveShadow = true;
    stageGroup.add(deckSurface);

    const deckTrim = new THREE.Mesh(new THREE.BoxGeometry(10.68, 0.035, 4.98), brushedGoldMat);
    deckTrim.position.set(0, 0.17, 0);
    stageGroup.add(deckTrim);

    // Interactive raycast meshes list
    const interactiveMeshes: THREE.Mesh[] = [];
    const disposableGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [];

    // -------------------------------------------------------------------------
    // LEFT CLUSTER: 3D Extruded Status Pie Ring on Turntable Pedestal
    // -------------------------------------------------------------------------
    const pieCluster = new THREE.Group();
    pieCluster.position.set(-2.55, 0.21, 0.1);
    stageGroup.add(pieCluster);

    const turntableBase = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.94, 0.16, 48), darkObsidianMat);
    turntableBase.position.y = 0.08;
    turntableBase.receiveShadow = true;
    pieCluster.add(turntableBase);

    const turntableGoldRing = new THREE.Mesh(new THREE.TorusGeometry(1.84, 0.03, 16, 64), brushedGoldMat);
    turntableGoldRing.rotation.x = Math.PI / 2;
    turntableGoldRing.position.y = 0.16;
    pieCluster.add(turntableGoldRing);

    const hubCore = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.52, 32), brushedGoldMat);
    hubCore.position.y = 0.34;
    hubCore.castShadow = true;
    pieCluster.add(hubCore);

    const pieSlicesGroup = new THREE.Group();
    pieSlicesGroup.position.y = 0.2;
    pieCluster.add(pieSlicesGroup);

    const totalPie = Math.max(
      1,
      statusData.reduce((sum, item) => sum + item.value, 0)
    );
    const sliceEntries: Array<{
      mesh: THREE.Mesh;
      mat: THREE.MeshPhysicalMaterial;
      midAngle: number;
      name: string;
      value: number;
      share: string;
      baseEmissive: number;
    }> = [];

    let angleCursor = 0;
    const gapAngle = statusData.length > 1 ? 0.045 : 0;
    statusData.forEach((slice) => {
      const fraction = slice.value / totalPie;
      const span = Math.max(0.12, fraction * Math.PI * 2 - gapAngle);
      const startA = angleCursor + gapAngle * 0.5;
      const endA = startA + span;
      const midAngle = (startA + endA) * 0.5;

      const geo = createDonutSliceGeometry(0.68, 1.56, startA, endA, 0.34);
      disposableGeos.push(geo);

      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(slice.color),
        metalness: 0.38,
        roughness: 0.28,
        clearcoat: 0.72,
        clearcoatRoughness: 0.16,
        emissive: new THREE.Color(slice.color),
        emissiveIntensity: 0.08,
      });
      disposableMats.push(mat);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.layers.enable(1);

      const share = `${Math.round(fraction * 100)}%`;
      mesh.userData = {
        kind: 'pie',
        label: slice.name,
        value: slice.value,
        share,
      } satisfies InspectedDatum;

      pieSlicesGroup.add(mesh);
      interactiveMeshes.push(mesh);
      sliceEntries.push({
        mesh,
        mat,
        midAngle,
        name: slice.name,
        value: slice.value,
        share,
        baseEmissive: 0.08,
      });

      angleCursor += fraction * Math.PI * 2;
    });

    // Subtle floating cinema-iris bezel ring around pie cluster
    const gyroRing = new THREE.Mesh(new THREE.TorusGeometry(2.04, 0.022, 16, 72), brushedGoldMat);
    gyroRing.rotation.x = Math.PI * 0.45;
    gyroRing.position.y = 0.55;
    pieCluster.add(gyroRing);

    // -------------------------------------------------------------------------
    // RIGHT CLUSTER: 3D Service Volume Bar Graph on Calibrated Plinth
    // -------------------------------------------------------------------------
    const barCluster = new THREE.Group();
    barCluster.position.set(2.35, 0.21, 0.1);
    stageGroup.add(barCluster);

    const barPlinth = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.14, 2.35), darkObsidianMat);
    barPlinth.position.y = 0.07;
    barPlinth.receiveShadow = true;
    barCluster.add(barPlinth);

    const backRail = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 0.04), brushedGoldMat);
    backRail.position.set(0, 0.16, -0.96);
    barCluster.add(backRail);

    const maxBarCount = Math.max(1, ...categoryData.map((d) => d.count));
    const barEntries: Array<{
      group: THREE.Group;
      mesh: THREE.Mesh;
      cap: THREE.Mesh;
      mat: THREE.MeshPhysicalMaterial;
      targetScaleY: number;
      currentScaleY: number;
      label: string;
      value: number;
    }> = [];

    const barsToRender = categoryData.slice(0, 6);
    const barSpacing = 0.64;
    const startX = -((barsToRender.length - 1) * barSpacing) * 0.5;

    barsToRender.forEach((item, idx) => {
      const normalizedHeight = 0.35 + (item.count / maxBarCount) * 2.05;
      const barGroup = new THREE.Group();
      barGroup.position.set(startX + idx * barSpacing, 0.15, 0.1);

      const socket = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.46), darkObsidianMat);
      socket.position.y = 0.025;
      barGroup.add(socket);

      const barGeo = createRoundedBarGeometry(0.36, 1.0, 0.36);
      disposableGeos.push(barGeo);

      const isPrimary = idx === 0;
      const barColor = isPrimary ? 0xd4af37 : idx % 2 === 1 ? 0x64748b : 0xb8962e;
      const barMat = new THREE.MeshPhysicalMaterial({
        color: barColor,
        metalness: isPrimary ? 0.9 : 0.65,
        roughness: isPrimary ? 0.2 : 0.38,
        clearcoat: 0.5,
        emissive: new THREE.Color(barColor),
        emissiveIntensity: 0.05,
      });
      disposableMats.push(barMat);

      const barMesh = new THREE.Mesh(barGeo, barMat);
      barMesh.position.y = 0.05;
      barMesh.scale.y = 0.01;
      barMesh.castShadow = true;
      barMesh.receiveShadow = true;
      barMesh.layers.enable(1);
      barMesh.userData = {
        kind: 'bar',
        label: item.name,
        value: item.count,
      } satisfies InspectedDatum;

      const capMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.4), brushedGoldMat);
      capMesh.position.y = 0.09;

      barGroup.add(barMesh, capMesh);
      barCluster.add(barGroup);
      interactiveMeshes.push(barMesh);

      barEntries.push({
        group: barGroup,
        mesh: barMesh,
        cap: capMesh,
        mat: barMat,
        targetScaleY: normalizedHeight,
        currentScaleY: 0.01,
        label: item.name,
        value: item.count,
      });
    });

    // Pointer interaction (throttled raycasting on layer 1)
    let hoveredMesh: THREE.Mesh | null = null;
    let lastRaycast = 0;

    const updatePointerFromEvent = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycast < 45) return;
      lastRaycast = now;

      updatePointerFromEvent(e);
      _raycaster.setFromCamera(_pointer, camera);
      const hits = _raycaster.intersectObjects(interactiveMeshes, false);

      if (hits.length > 0) {
        const hitMesh = hits[0].object as THREE.Mesh;
        if (hoveredMesh !== hitMesh) {
          hoveredMesh = hitMesh;
          setInspected(hitMesh.userData as InspectedDatum);
        }
        renderer.domElement.style.cursor = 'pointer';
      } else if (hoveredMesh) {
        hoveredMesh = null;
        setInspected(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _pointer.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      _pointer.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      _raycaster.setFromCamera(_pointer, camera);
      const hits = _raycaster.intersectObjects(interactiveMeshes, false);
      if (hits.length > 0) {
        const datum = hits[0].object.userData as InspectedDatum;
        setInspected(datum);
        if (datum.kind === 'pie') {
          onSelectSliceRef.current(
            activeSliceRef.current === datum.label ? null : datum.label
          );
        }
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglUnavailable(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
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

      // Smooth camera preset transitions
      if (presetDirtyRef.current) {
        if (presetRef.current === 'pie') {
          _targetCamPos.set(-2.5, 4.1, 4.8);
          _targetLookAt.set(-2.55, 0.55, 0.1);
        } else if (presetRef.current === 'graph') {
          _targetCamPos.set(2.35, 3.2, 5.4);
          _targetLookAt.set(2.35, 1.0, 0.1);
        } else {
          _targetCamPos.set(0.35, 4.35, 9.5);
          _targetLookAt.set(0, 0.72, 0);
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 4.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 4.5, delta);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLookAt.x, 5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLookAt.y, 5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLookAt.z, 5, delta);

        if (camera.position.distanceTo(_targetCamPos) < 0.03) {
          presetDirtyRef.current = false;
        }
      }

      if (autoOrbitRef.current && !prefersReduced && !presetDirtyRef.current) {
        stageGroup.rotation.y = Math.sin(elapsed * 0.22) * 0.14;
      }

      // Rotate outer cinema gyro ring gently
      if (!prefersReduced) {
        gyroRing.rotation.z = elapsed * 0.2;
      }

      // Animate 3D pie slices (explode or active highlight)
      sliceEntries.forEach((entry) => {
        const isSelected = activeSliceRef.current === entry.name || hoveredMesh === entry.mesh;
        const radialOffset = explodeRef.current ? 0.28 : isSelected ? 0.22 : 0;
        const targetY = isSelected ? 0.22 : 0;
        const targetX = Math.cos(entry.midAngle) * radialOffset;
        const targetZ = -Math.sin(entry.midAngle) * radialOffset;

        entry.mesh.position.x = THREE.MathUtils.damp(entry.mesh.position.x, targetX, 7, delta);
        entry.mesh.position.y = THREE.MathUtils.damp(entry.mesh.position.y, targetY, 7, delta);
        entry.mesh.position.z = THREE.MathUtils.damp(entry.mesh.position.z, targetZ, 7, delta);
        entry.mat.emissiveIntensity = THREE.MathUtils.damp(
          entry.mat.emissiveIntensity,
          isSelected ? 0.42 : entry.baseEmissive,
          8,
          delta
        );
      });

      // Animate 3D bars rising from baseline
      barEntries.forEach((bar) => {
        const isHovered = hoveredMesh === bar.mesh;
        const targetH = bar.targetScaleY * (isHovered ? 1.07 : 1);
        bar.currentScaleY = THREE.MathUtils.damp(bar.currentScaleY, targetH, 6, delta);
        bar.mesh.scale.y = bar.currentScaleY;
        bar.cap.position.y = 0.05 + bar.currentScaleY + 0.03;
        bar.mat.emissiveIntensity = THREE.MathUtils.damp(
          bar.mat.emissiveIntensity,
          isHovered ? 0.38 : 0.05,
          8,
          delta
        );
      });

      controls.update();
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
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();

      disposableGeos.forEach((g) => g.dispose());
      disposableMats.forEach((m) => m.dispose());
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      gridTex.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, [statusData, categoryData]);

  return (
    <div className="relative rounded-2xl border border-zinc-800 bg-[#09090d] overflow-hidden">
      {/* Top HUD Readout (no backdrop-blur over WebGL) */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-10 flex flex-wrap items-start justify-between gap-3">
        <div className="rounded-xl bg-[#0b0b10]/92 border border-zinc-800 px-3.5 py-2.5 max-w-md">
          <p className="text-[11px] font-medium text-[#D4AF37]">
            Interactive 3D Telemetry Stage
            {isSamplePreview ? ' · Preview Sample Data' : ' · Live Studio Metrics'}
          </p>
          {inspected ? (
            <p className="mt-0.5 text-xs text-white font-mono-tabular">
              {inspected.label} · {inspected.value}{' '}
              {inspected.kind === 'pie' ? `(${inspected.share})` : 'requests'}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-400">
              Drag to orbit 360° · Scroll to zoom · Click a 3D pie slice or hover bars
            </p>
          )}
        </div>
      </div>

      {/* Dedicated WebGL Mount Container */}
      {webglUnavailable ? (
        <div className="h-[380px] sm:h-[420px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#0e0e14] via-[#09090d] to-[#14110b]">
          <Layers3 className="w-8 h-8 text-[#D4AF37] mb-3" />
          <p className="text-sm font-semibold text-white">3D WebGL Viewport Unavailable</p>
          <p className="mt-1 text-xs text-zinc-400 max-w-md">
            Your browser graphics context is currently unavailable. Interactive 2D analytics graphs and pie charts remain active below.
          </p>
        </div>
      ) : (
        <div ref={mountRef} className="w-full h-[380px] sm:h-[420px]" />
      )}

      {/* Unified Collapsible Bottom Control Dock (solid/rgba surface, zero backdrop-blur) */}
      <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex flex-col items-center px-3">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1 rounded-t-lg rounded-b-sm bg-[#0f0f15]/95 border border-zinc-800 px-3 py-1 text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer"
        >
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{dockCollapsed ? 'Show 3D Controls' : 'Hide Controls'}</span>
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-[#0e0e14]/95 border border-zinc-800 p-1.5 shadow-2xl">
            {(
              [
                { id: 'overview', label: '3D Overview' },
                { id: 'pie', label: 'Pie Focus' },
                { id: 'graph', label: 'Graph Focus' },
              ] as const
            ).map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => setCameraPreset(cam.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  cameraPreset === cam.id
                    ? 'bg-[#D4AF37] text-black font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                {cam.label}
              </button>
            ))}

            <div className="h-4 w-px bg-zinc-800 mx-0.5 hidden sm:block" />

            <button
              type="button"
              onClick={() => setExplodeSlices((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                explodeSlices
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <Expand className="w-3.5 h-3.5" />
              <span>Explode Slices</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoOrbit((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                autoOrbit
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{autoOrbit ? 'Orbit On' : 'Orbit Paused'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
