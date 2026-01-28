export function initGlobe() {
  const mount = document.getElementById("globe-bg");
  if (!mount) return;

  try {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearAlpha(0);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(5, 2, 5);
    scene.add(dir);

    const geometry = new THREE.SphereGeometry(1.05, 64, 64);

    const loader = new THREE.TextureLoader();

    const textures = {
      map: "./assets/textures/earth_day.jpg",
      bump: "./assets/textures/earth_bump.jpg",
      normal: "./assets/textures/earth_normal.jpg",
    };

    loader.load(textures.map, (tex) => {
      material.map = tex;
      material.needsUpdate = true;
    });
    loader.load(textures.bump, (tex) => {
      material.bumpMap = tex;
      material.needsUpdate = true;
    });
    loader.load(textures.normal, (tex) => {
      material.normalMap = tex;
      material.needsUpdate = true;
    });

    const material = new THREE.MeshPhongMaterial({
      color: 0x7aa7ff,
      transparent: true,
      opacity: 0.36,
      shininess: 6,
    });

    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    let loadedAny = false;

    loader.load(
      textures.map,
      (tex) => {
        loadedAny = true;
        material.map = tex;
        material.opacity = 0.42;
        material.needsUpdate = true;
      },
      undefined,
      () => {},
    );

    loader.load(
      textures.bump,
      (tex) => {
        loadedAny = true;
        material.bumpMap = tex;
        material.bumpScale = 0.04;
        material.needsUpdate = true;
      },
      undefined,
      () => {},
    );

    loader.load(
      textures.normal,
      (tex) => {
        loadedAny = true;
        material.normalMap = tex;
        material.normalScale = new THREE.Vector2(0.35, 0.35);
        material.needsUpdate = true;
      },
      undefined,
      () => {},
    );

    // Soft fallback look if textures are missing
    setTimeout(() => {
      if (!loadedAny) {
        material.wireframe = true;
        material.opacity = 0.14;
        material.needsUpdate = true;
      }
    }, 1200);

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      earth.rotation.y += 0.0015;
      earth.rotation.x += 0.0002;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      mount.innerHTML = "";
    };
  } catch (err) {
    // Graceful fallback: do nothing; UI remains usable.
    console.error("Globe init failed:", err);
  }
}
