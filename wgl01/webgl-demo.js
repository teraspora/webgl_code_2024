// from https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL

import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

const isPowerOf2 = n => n & (n - 1) === 0;

// Vertex shader source
const vsSource = document.scripts[0].text;
// const vsSource = `# version 300 es
// attribute vec4 aVertexPosition;
// attribute vec2 aTextureCoord;

// uniform mat4 uModelViewMatrix;
// uniform mat4 uProjectionMatrix;

// varying highp vec2 vTextureCoord;

// void main(void) {
//   gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
//   vTextureCoord = aTextureCoord;
// }
// `;
// const vsSource = `
//     attribute vec4 aVertexPosition;
//     attribute vec4 aVertexColor;

//     uniform mat4 uModelViewMatrix;
//     uniform mat4 uProjectionMatrix;

//     varying lowp vec4 vColor;

//     void main(void) {
//       gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
//       vColor = aVertexColor;
//     }
// `;

// Fragment shader source
const fsSource = document.scripts[1].text;
// const fsSource = `# version 300 es
//     varying highp vec2 vTextureCoord;

//     uniform sampler2D uSampler;
//     out vec4 fragColor;

//     void main(void) {
//       fragColor = texture(uSampler, vTextureCoord);
//     }
//   `;
// const fsSource = `#version 300 es
//     varying lowp vec4 vColor;

//     void main(void) {
//       gl_FragColor = vColor.rgba;
//     }
// `;

// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
    // Create the shader program
  
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, alert
  
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(
        `Unable to initialize the shader program: ${gl.getProgramInfoLog(
          shaderProgram,
        )}`,
      );
      return null;
    }
  
    return shaderProgram;
  }
  
// creates a shader of the given type, uploads the source and
// compiles it.
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
  
    // Send the source to the shader object
  
    gl.shaderSource(shader, source);
  
    // Compile the shader program
  
    gl.compileShader(shader);
  
    // See if it compiled successfully
  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
}

// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel,
    );

    const image = new Image();
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        image,
      );

    // WebGL1 has different requirements for power of 2 images
    // vs. non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function main() {
    const canvas = document.querySelector("#glcanvas");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert(
        "Unable to initialize WebGL. Your browser or machine may not support it.",
        );
        return;
    }

    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aVertexColor and also
    // look up uniform locations.
    // const programInfo = {
    //     program: shaderProgram,
    //     attribLocations: {
    //     vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    //     vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    //     },
    //     uniformLocations: {
    //     projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
    //     modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    //     },
    // };
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
          textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
          modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
          uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
        },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);
    // Load texture
    const texture = loadTexture(gl, "sb1_x1024.png");
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Draw the scene
    function render(t) {
        drawScene(gl, programInfo, buffers, texture, t / 2000);
        requestAnimationFrame(render);
    }
    render();
}

main();
