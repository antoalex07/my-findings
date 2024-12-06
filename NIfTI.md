```
const volume = new Float32Array(dims[0] * dims[1] * dims[2]); 
```
the nifti file i have contains a int16array we are going to convert that to a float

```
  function createVolumeFromNiftiData(volume, dims, voxelSize = 1) {
    const finalVolume = new Group();
    const [width, height, depth] = dims;
    let isTrue = true;
    for(let z = 0; z < depth; z++) {
      for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          const index = x + y * width + z * width * height;
          const intensity = volume[index];
          if(intensity != 0) {
            const geometry = new BoxGeometry(1, 1, 1);
            const material = new MeshStandardMaterial({
              color: new Color(intensity, intensity, intensity),
              transparent: true,
              opacity: 1
            })
            const cube = new Mesh(geometry, material);
            cube.position.set(x - 350, y - 254, z);
            console.log(x, y, z, intensity)
            finalVolume.add(cube);
          }
        }
      }
    }
    return finalVolume;
  }
```

if you run this code as such you will get the whole nifti image as such with each pixel in the matrix detailed however it will take too much gpu to render that much content and your system will show this stupid message that page is not responding and all in chrome so i hade to do it slice by slice first i took 18 slices and generated a portion of it as i continued since there were too many i had to reduce the number of slices in it 

### Marching Cubes Algorithm ###
instead of doing the above method where u have to traverse through one value at a time determine whether it is in the intensity range and assign a cube of dimensions 1, 1, 1 on it and copulating that with it u can try the marching cubes algorithm where you will take 8 values at once find whether there are three matching intensities in those and form a triangle in it and copulate the entire matrix with it and i am gonna do it myself without the help of chatgpt i may or may not be back in a month see yaa gotta form the algorithm


the marching cubes algorithm generated a 3d image of the nifti file that i had then i applied a gaussian filter over it to make the model more smooth currently i have rendered over `226824 triangles` to form this model

