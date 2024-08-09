
```<Canvas camera={{position:[3, 3, 3] }}>
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
            </Canvas>```

the minPolarAngle and maxPolarAngle specifies the camera angle in some way, at first it was math.pi / 2 on both and the angle was at the middle like the front view change that to / 4 you will get bottom view /3 gives u a view from between top and front

