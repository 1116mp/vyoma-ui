"use client";

import * as THREE from "three";
import { useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ShinyParticleGalaxy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Create gradient particle layers
    const layers = [
      { color: new THREE.Color("#FFEE93"), size: 0.8, depth: 100 },
      { color: new THREE.Color("#94D82A"), size: 0.6, depth: 150 },
      { color: new THREE.Color("#0B405B"), size: 0.4, depth: 200 },
    ];

    const particleGroups: THREE.Points[] = [];

    layers.forEach((layer) => {
      const particleCount = 800;
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = -Math.random() * layer.depth;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: layer.color,
        size: layer.size,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
      });

      const points = new THREE.Points(geometry, material);
      particleGroups.push(points);
      scene.add(points);
    });

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    function onMouseMove(e: MouseEvent) {
      targetX = (e.clientX - windowHalfX) * 0.05;
      targetY = (e.clientY - windowHalfY) * 0.05;
    }

    if (!isMobile) {
      window.addEventListener("mousemove", onMouseMove);
    }

    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);

      // Rotate each layer at slightly different speeds
      particleGroups.forEach((group, i) => {
        group.rotation.y += 0.0005 + i * 0.0002;
        group.rotation.x += 0.0003 + i * 0.0001;
      });

      // Move camera based on cursor
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (-targetY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }

    animate();

    function handleResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      particleGroups.forEach((group) => {
        group.geometry.dispose();
        (group.material as THREE.Material).dispose();
        scene.remove(group);
      });
      renderer.dispose();
      window.removeEventListener("resize", handleResize);
      if (!isMobile) window.removeEventListener("mousemove", onMouseMove);
    };
  }, [isMobile]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
        <h1 className={`${isMobile ? "text-3xl" : "text-6xl md:text-8xl"} font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#FFEE93] via-[#94D82A] to-[#0B405B]`}>
          GALAXY
        </h1>
        <p className={`${isMobile ? "text-sm" : "text-lg md:text-xl"} mt-4 text-gray-300 max-w-2xl`}>
          Fly through a mesmerizing galaxy of shining particles with this interactive 3D background.
        </p>
      </div>
    </div>
  );
}
