// App.js

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function Model({ playAnimation, position, rotation }) {
  const group = useRef();
  const { scene, animations } = useGLTF('/model/blink.glb');
  const mixer = useRef();
  const actions = useRef();

  // Activate shadows on the model
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  // Setup mixer and animation actions
  useEffect(() => {
    if (animations && scene) {
      mixer.current = new THREE.AnimationMixer(scene);

      actions.current = {
        idle: mixer.current.clipAction(animations[0]),
        nice: mixer.current.clipAction(animations[1]),
      };

      // Adjust the timeScale of the "nice" animation to 2x
      actions.current.nice.timeScale = 2;

      actions.current.idle.play();
    }
  }, [animations, scene]);

  // Control animation switching
  useEffect(() => {
    if (actions.current) {
      if (playAnimation) {
        actions.current.idle.stop();
        actions.current.nice.reset().play();
      } else {
        actions.current.nice.stop();
        actions.current.idle.reset().play();
      }
    }
  }, [playAnimation]);

  // Update the mixer every frame
  useFrame((state, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  return scene ? (
    <group ref={group} position={position} rotation={rotation}>
      <primitive object={scene} />
    </group>
  ) : null;
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    // Adjust camera settings based on screen size
    if (size.width < 600) {
      // For mobile devices
      camera.position.set(0, 0, 15); // Move the camera back
      camera.updateProjectionMatrix();
    } else {
      // For desktops
      camera.position.set(0, 0, 7); // Default camera position
      camera.updateProjectionMatrix();
    }
  }, [camera, size]);

  return null;
}

function App() {
  const [playAnimation, setPlayAnimation] = useState(false);
  const [clicks, setClicks] = useState([]);

  const handleClick = (event) => {
    setPlayAnimation(true);

    // Stop the animation after its duration
    setTimeout(() => {
      setPlayAnimation(false);
    }, 1000); // If the original animation lasted 2 seconds, now it lasts 1 second

    // Get the click position relative to the container
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left; // x position within the container
    const y = event.clientY - rect.top; // y position within the container

    // Add the click to the clicks array
    setClicks((prevClicks) => [
      ...prevClicks,
      { id: Date.now(), x, y },
    ]);
  };

  const removeClick = (id) => {
    setClicks((prevClicks) => prevClicks.filter((click) => click.id !== id));
  };

  // Define the desired position (x, y, z) and rotation (x, y, z in radians)
  const modelPosition = [0, -3, 0]; // Original position
  const modelRotation = [0.2, Math.PI / 45, 0]; // Rotate 45 degrees on the Y-axis

  return (
    <div
      onClick={handleClick}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        backgroundImage: 'url("/tela.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        gl={{ alpha: true }}
      >
        {/* Add the responsive camera */}
        <ResponsiveCamera />

        {/* Add a directional light with shadows */}
        <directionalLight
          position={[10, 10, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        {/* Ambient light to illuminate evenly */}
        <ambientLight intensity={0.5} />

        {/* Add an HDRI environment */}
        <Environment preset="sunset" />

        {/* Add contact shadows on the ground */}


        <Model
          playAnimation={playAnimation}
          position={modelPosition}
          rotation={modelRotation}
        />
      </Canvas>

      {/* Render floating elements */}
      {clicks.map((click) => (
        <div
          key={click.id}
          className="floating-element"
          style={{ top: click.y, left: click.x }}
          onAnimationEnd={() => removeClick(click.id)}
        >
          <img src="/moon.png" alt="Moon" className="moon-icon" />
          <span className="plus-five">+5</span>
        </div>
      ))}
    </div>
  );
}

export default App;
