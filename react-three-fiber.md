
```
<Canvas camera={{position:[3, 3, 3] }}>
              <ambientLight intensity={1}/>
              <OrbitControls 
                  enableZoom={false}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 3}
                  minAzimuthAngle={-Infinity}
                  maxAzimuthAngle={Infinity}
              />
              <Suspense fallback={null}>
                <Chair/>
              </Suspense>
              <Environment preset='sunset' />
            </Canvas>
```

the minPolarAngle and maxPolarAngle specifies the camera angle in some way, at first it was math.pi / 2 on both and the angle was at the middle like the front view change that to / 4 you will get bottom view /3 gives u a view from between top and front

```
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useRef } from 'react'

const CustomCamera = () => {
    
    const cameraRef = useRef();

    useFrame(() => {
        if(cameraRef.current) {
        console.log('Camera position:', cameraRef.current.position);
        console.log('Camera rotation:', cameraRef.current.rotation);
        }
    });

  return (
    <PerspectiveCamera ref={cameraRef} makeDefault position={[4.35, 3.31, -3.61]} fov={60} />
  )
}

export default CustomCamera
```
this code helped me find the position in which i wanted the model to be in there were 2 parts euler and vector i put in vector and that was it did not try euler dont know what happens

```
<EffectComposer>
  <DepthOfField
    focusDistance={0.001}
    focalLength={0.02}
    bokehScale={1.0}/>
</EffectComposer>
```
i don't correctly know how to mess with these values 


```            
<Backdrop castShadow floor={2} position={[0, -0.5, -3]} scale={[50, 10, 4]}>
  <meshStandardMaterial color="#353540" envMapIntensity={0.1} />
</Backdrop>

```
this creates a background for the model that looks like a paper bend stuff like that use if necessary will do more research on it later
