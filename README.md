# my-findings
This repository is a collection of all the new code blocks i have found worked upon and solved errors


```
<script src="pako.min.js"></script>
<script src="untar.js"></script>
<script>
fetch('test.tar.gz').then(res => res.arrayBuffer()) // Download gzipped tar file and get ArrayBuffer
                    .then(pako.inflate)             // Decompress gzip using pako
                    .then(arr => arr.buffer)        // Get ArrayBuffer from the Uint8Array pako returns
                    .then(untar)                    // Untar
                    .then(files => {                // js-untar returns a list of files (See https://github.com/InvokIT/js-untar#file-object for details)
                        console.log(files);
                    });
</script>

```
