import { isNIFTI, readHeader, readImage } from 'nifti-reader-js';
import React, { useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EdgeMasks, edgeVertexIndices, triangleTable } from '../../components/LookUpTable';

const fetchArray = (header, image) => {
    if(header.datatypeCode === 4) {
        const array = new Int16Array(image);
        const expectedLength = header.dims[1] * header.dims[2] * header.dims[3];

        if(array.length === expectedLength) {
            return array;
        } else {
            throw new Error("Unexpected data length, Possible mismatch in the header dimensions")
        }
    } else {
        throw new Error("Unexpected datatype. Expected Int16 data");
    }
}

const createNiftiFile = async (url) => {
    const response = await fetch(url) ;
    const arrayBuffer = await response.arrayBuffer()
    if(isNIFTI(arrayBuffer)) {
    return arrayBuffer;
    } else {
    throw new Error("not a valid NIfTI file");
    }
}

const generateScalarField = (int16Array, dims) => {
    
    const volume = [];
    let min = 0;
    let max = 0;
    for(let i = 0; i < int16Array.length; i++) {
        if(int16Array[i] < min) {
            min = int16Array[i];
        }
        if(int16Array[i] > max) {
            max = int16Array[i];
        }
    }

    const value = (1 - min) / (max - min);
    // console.log(value);

    for(let z = 0; z < dims[2]; z++) {
        volume[z] = []
        for(let y = 0; y < dims[1]; y++) {
            volume[z][y] = []
            for(let x = 0; x < dims[0]; x++) {
                if(x === 0 || y === 0 || z === 0 || x === dims[0] - 1 || y === dims[1] - 1 || z === dims[2] - 1){
                    volume[z][y][x] = 0;
                } 
                else {
                    
                    const index = (x - 1) + (y - 1) * (dims[0] - 2) + (z - 1) * (dims[0] - 2) * (dims[1] - 2);

                    if(int16Array[index] > 0) {
                        volume[z][y][x] = value; 
                    } else {
                        volume[z][y][x] = 0;
                    }
                }
            }
        }
    }
    return volume;
}

const getCube = (scalarField, x, y, z) => {
    const vertexOffsets = [
        [0, 0, 0], [1, 0, 0],
        [0, 0, 1], [1, 0, 1],
        [0, 1, 0], [1, 1, 0],
        [0, 1, 1], [1, 1, 1], 
    ];

    const cube = [];
    for(let i = 0; i < 8; i++) {
        const [dx, dy, dz] = vertexOffsets[i];
        const pos = [x + dx, y + dy, z + dz];        
        cube.push({
            position: pos,
            value: scalarField[pos[2]][pos[1]][pos[0]],
        });
    }
    return cube;
}

const getCubeIndex = (cube, threshold) => {
    let cubeIndex = 0;
    for(let i = 0; i < 8; i++) {
        if(cube[i].value >= threshold){
            cubeIndex |= (1 << i);
        }
    }
    return cubeIndex;
}

const interpolateVertex = (cube, edgeIndex, threshold) => {
    const [v1, v2] = edgeVertexIndices[edgeIndex];
    const t = (threshold - cube[v1].value) / (cube[v2].value - cube[v1].value);
    
    return [
        cube[v1].position[0] + t * (cube[v2].position[0] - cube[v1].position[0]),
        cube[v1].position[1] + t * (cube[v2].position[1] - cube[v1].position[1]),
        cube[v1].position[2] + t * (cube[v2].position[2] - cube[v1].position[2]),
    ]
}

const interpolateEdges = (cube, edges, threshold) => {
    const vertices = [];
    for(let i = 0; i < 12; i++) {
        if(edges & (1 << i)) {
            vertices[i] = interpolateVertex(cube, i, threshold);
        }
    }
    return vertices;
}

function createGaussianKernel(size, sigma) {
    const kernel = [];
    const mean = Math.floor(size / 2);
    let sum = 0;

    for(let x = 0; x < size; x++) {
        kernel[x] = [];
        for(let y = 0; y < size; y++) {
            kernel[x][y] = [];
            for(let z = 0; z < size; z++) {
                const g = Math.exp(-((x - mean) ** 2 + (y - mean) ** 2 + (z - mean) ** 2) / (2 * sigma ** 2));
                kernel[x][y][z] = g;
                sum += g;
            }
        }
    }

    for(let x = 0; x < size; x++) {
        for(let y = 0; y < size; y++) {
            for(let z = 0; z < size; z++) {
                kernel[x][y][z] /= sum;
            }
        }
    }
    return kernel;
}

function applyGaussianFilter(volume, dims, kernel) {
    const size = kernel.length;
    const mean = Math.floor(size / 2);

    const smoothed = JSON.parse(JSON.stringify(volume)); 

    for(let z = mean; z < dims[2] - mean; z++) {
        for(let y = mean; y < dims[1] - mean; y++) {
            for(let x = mean; x < dims[0] - mean; x++) {
                let sum = 0;
                for(let i = 0; i < size; i++) {
                    for(let j = 0; j < size; j++) {
                        for(let k = 0; k < size; k++) {
                            sum += volume[z + i - mean][y + j - mean][x + k - mean] * kernel[i][j][k];
                        }
                    }
                }
                smoothed[z][y][x] = sum;
            }
        }
    }
    return smoothed;
}


const marchingCubes = (scalarField, dims, threshold) => {
    const geometry = new THREE.BufferGeometry();
    
    const vertices = [];
   
    for(let z = 0; z < dims[2] - 1; z++) {
        for(let y = 0; y < dims[1] - 1; y++) {
            for(let x = 0; x < dims[0] - 1; x++) {
                const cube = getCube(scalarField, x, y, z);
                const cubeIndex = getCubeIndex(cube, threshold);

                const edges = EdgeMasks[cubeIndex];
                if(edges === 0) {
                    continue;
                }

                const interpolatedVertices = interpolateEdges(cube, edges, threshold);
                const triangles = triangleTable[cubeIndex]

                let i = 0;

                while(triangles[i] != -1) {
                    const v1 = interpolatedVertices[triangles[i]];
                    const v2 = interpolatedVertices[triangles[i + 1]];
                    const v3 = interpolatedVertices[triangles[i + 2]];

                    vertices.push(...v1, ...v2, ...v3);     
                    i += 3;
                }
            }
        }
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeBoundingSphere();
    geometry.computeVertexNormals();

    return geometry;
}

const MarchingCubes6 = () => {

    const konohaRef = useRef(null);

    const handleRasengan = async () => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050505);
        scene.fog = new THREE.Fog(0x050505, 2000, 3500);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 1);
        renderer.setPixelRatio(window.devicePixelRatio);

        if(konohaRef.current) {
            konohaRef.current.innerHTML = '';
            konohaRef.current.appendChild(renderer.domElement);
        }

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.5;
        controls.update();

        function clearScene() {
            while (scene.children.length > 0) {
                const child = scene.children[0];
                if (child.geometry) child.geometry.dispose(); // Dispose geometry
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => mat.dispose());
                    } else {
                        child.material.dispose(); // Dispose material
                    }
                }
                scene.remove(child); // Remove from scene
            }
        }

        clearScene(); 

        const niftiData = await createNiftiFile("./mask.nii");
        const niftiHeader = readHeader(niftiData);
        const niftiImage = readImage(niftiHeader, niftiData);

        const int16Array = fetchArray(niftiHeader, niftiImage);

        const dims = niftiHeader.dims.slice(1, 4).map(dim => dim + 2);

        const scalarField = generateScalarField(int16Array, dims);
        const threshold = 0.166666666665;

        const size = 5;
        const sigma = 1.0;

        const kernel = createGaussianKernel(size, sigma);
        const gaussianFilter = applyGaussianFilter(scalarField, dims, kernel);

        let geometry = marchingCubes(gaussianFilter, dims, threshold);

        const phongMaterial = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            uniforms: {
                lightSource: {value: new THREE.Vector3(1.0, 1.0, 1.0)}
            },
            vertexShader: `
                out vec3 vNormal;
                out vec3 vPosition;

                void main() {
                    vNormal = normalize((normalMatrix * normal).xyz); 
                    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

                    gl_Position = projectionMatrix * vec4(vPosition, 1.0);
                }
            `,
            fragmentShader: `
                in vec3 vNormal;

                out vec4 fragColor;

                void main() {

                    vec3 ambient = vec3(0.5, 0.5, 0.5);

                    vec3 lightColor = vec3(1.0, 1.0, 1.0);
                    vec3 lightSource = vec3(1.0, 1.0, 1.0);
                    float diffuseStrength = max(0.0, dot(lightSource, vNormal));
                    vec3 diffuse = diffuseStrength * lightColor;

                    vec3 cameraSource = vec3(0.0, 0.0, 1.0);
                    vec3 viewSource = normalize(cameraSource);
                    vec3 reflectSource = normalize(reflect(-lightSource, vNormal));
                    float specularStrength = max(0.0, dot(viewSource, reflectSource));
                    specularStrength = pow(specularStrength, 32.0);
                    vec3 specular = specularStrength * lightColor;

                    vec3 lighting = vec3(0.0, 0.0, 0.0);
                    lighting = ambient * 0.0 + diffuse * 0.5 + specular * 0.5;

                    vec3 modelColor = vec3(0.75, 0.75, 0.75);
                    vec3 color = modelColor * lighting;
                    
                    fragColor = vec4(color, 1.0);
                }
            `
        });
        
        const cubes = new THREE.Mesh(geometry, phongMaterial);
        cubes.position.set(Math.trunc(-(dims[0] / 2)), Math.trunc(-(dims[1] / 2)), Math.trunc(-(dims[2] / 2)));
        scene.add(cubes);

        const light = new THREE.PointLight(0xffffff, 1, 10000);
        light.position.set(0, 0, 0);
        scene.add(light);

        camera.position.z = Math.max(dims[0], dims[1], dims[2]) * 1.2;

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        animate();

    }

  return (
    <div>
        <button onClick={handleRasengan}>vroom vroom</button>
        <div ref={konohaRef} style={{ width: "100vw", height: "100vh" }}></div>
  </div>
  );
};

export default MarchingCubes6;
