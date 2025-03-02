class AlphaVideo {
  constructor(option) {
    const defaultOption = {
      src: "",
      autoplay: true,
      loop: true,
      canvas: null,
      // 默认透明视频展示大小
      width: 375,
      height: 300,
      // 动画视频 所在位置，left 左，right 右
      direction: "left",
      onError: function () {},
      onPlay: function () {},
    };
    this.options = {
      ...defaultOption,
      ...option,
    };
    this.radio = window.devicePixelRatio;


    this.directionOption = {
      // 纹理坐标
      left: {
        // 纹理坐标
        textureVertice: [
            0.0,1.0, // 左上角
            0.5,1.0, // 右上角
            0.0,0.0, // 左下角
            0.5,0.0, // 右下角
            ],
            // 纹理 偏移
            fsSourceRadio: '0.5'
        },

      right: {
        // 纹理坐标
        textureVertice: [
            0.5, 1.0,
            1.0, 1.0,
            0.5, 0.0,
            1.0, 0.0
        ],
         // 纹理 偏移
        fsSourceRadio: '-0.5'
      }
    };

    this.initVideo();
    this.initWebgl();

    if (this.options.autoplay) {
      this.video.play();
    }
  }

  initVideo() {
    const { onPlay, onError, loop, src } = this.options;

    const video = document.createElement("video");
    video.autoplay = false;
    video.mute = true;
    video.volume = 0;
    video.muted = true;
    video.loop = loop;
    video.setAttribute("x-webkit-airplay", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("playsinline", "true");
    video.style.display = "none";
    video.src = src;
    video.crossOrigin = "anonymous";
    video.addEventListener("canplay", () => {
      this.playing = true;
      onPlay && onPlay();
    });
    video.addEventListener("error", () => {
      onError && onError();
    });
    video.addEventListener("play", () => {
      window.requestAnimationFrame(() => {
        this.drawFrame();
      });
    });
    document.body.appendChild(video);
    this.video = video;
  }

  drawFrame() {
    if (this.playing) {
      this.drawWebglFrame();
    }
    window.requestAnimationFrame(() => {
      this.drawFrame();
    });
  }

  drawWebglFrame() {
    const gl = this.gl;
    // 配置纹理图像
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      this.video
    );
    // 绘制
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  play() {
    this.playing = true;
    this.video.play();
  }

  pause() {
    this.playing = false;
    this.video.pause();
  }

  initWebgl() {
    // 设置 canvas 尺寸和点击事件
    this.canvas = this.options.canvas;
    this.canvas.width = this.options.width * this.radio;
    this.canvas.height = this.options.height * this.radio;
    this.canvas.addEventListener("click", () => {
      this.play();
    });
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      document.body.appendChild(this.canvas);
    }

    const gl = this.canvas.getContext("webgl");
    // 设置视口大小
    gl.viewport(
      0,0,
      this.options.width * this.radio,
      this.options.height * this.radio
    );
    // 着色器程序设置
    const program = this._initShaderProgram(gl);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = this._initBuffer(gl);

    // 绑定缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
    // 顶点位置 a_position 读取 绑定缓冲区
    const aPosition = gl.getAttribLocation(program, "a_position");
    // 允许属性读取，将缓冲区的值分配给特定的属性
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);


    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.texture);
    const aTexCoord = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

    // 绑定纹理
    const texture = this._initTexture(gl);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const scaleLocation = gl.getUniformLocation(program, "u_scale");
    gl.uniform2fv(scaleLocation, [this.radio, this.radio]);

    this.gl = gl;
  }
  // 根据类型创建着色器
  _createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  _initShaderProgram(gl) {
    // 顶点 着色器glsl代码
    const vsSource = `
      attribute vec2 a_position; // 接收顶点位置
      attribute vec2 a_texCoord; // 接收纹理坐标
      varying vec2 v_texCoord; // 传递给片段着色器的纹理坐标
      uniform vec2 u_scale; // 缩放因子

      void main(void) {
          gl_Position = vec4(a_position, 0.0, 1.0); // 设置顶点位置
          v_texCoord = a_texCoord; // 传递纹理坐标
      }
      `;


    // 片段 着色器 glsl 代码
    const fsSource = `
      precision lowp float;  // 设置浮点数精度， 必须指明float的精度，因为计算过程中片段着色器的精度没有默认
      varying vec2 v_texCoord; // 从顶点着色器接收的纹理坐标
      uniform sampler2D u_sampler; // 纹理采样器

      void main(void) {
        // 设置像素颜色：
        // RGB 从当前纹理坐标采样
        gl_FragColor = vec4(texture2D(u_sampler, v_texCoord).rgb,
        // Alpha 从偏移后的纹理坐标采样 R 通道
        texture2D(u_sampler, v_texCoord+vec2(${this.directionOption[ this.options.direction].fsSourceRadio}, 0)).r);
      }
      `;
    // 创建 顶点着色器
    const vsShader = this._createShader(gl, gl.VERTEX_SHADER, vsSource);
    // 创建 片段着色器
    const fsShader = this._createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    // 创建 着色器程序
    const program = gl.createProgram();
    // 将 顶点着色器程序附着到webgl
    gl.attachShader(program, vsShader);
    // 将 片段 着色器程序附着到webgl
    gl.attachShader(program, fsShader);
    // 关联着色器程序到整个绘制对象中
    gl.linkProgram(program);

    return program;
  }

  _initBuffer(gl) {
    // 位置缓冲区（Position Buffer）初始化：
    // 这部分定义了一个矩形的四个顶点坐标，范围在 -1 到 1 之间，这是 WebGL 的标准化设备坐标系（NDC）。
    const positionVertice = new Float32Array([
      -1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0,
    ]);
    const positionBuffer = gl.createBuffer(); // 创建buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); // 把缓冲区对象绑定到目标
    gl.bufferData(gl.ARRAY_BUFFER, positionVertice, gl.STATIC_DRAW); // 向缓冲区对象写入刚定义的顶点数据
    // 纹理缓冲区（Texture Buffer）初始化：
    const textureBuffer = gl.createBuffer();

    // 这里将纹理 部分映射到整个画布上
    const textureVertice = new Float32Array(this.directionOption[ this.options.direction].textureVertice);
    // 这部分根据 direction 选项（left 或 right）设置纹理坐标，用于将视频帧映射到矩形上。
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    // gl.STATIC_DRAW 表示数据不会频繁更改，适合静态几何形状
    gl.bufferData(gl.ARRAY_BUFFER, textureVertice, gl.STATIC_DRAW);
    // 位置和纹理坐标都使用 Float32Array 是因为 WebGL 需要类型化数组
    // 返回的两个 buffer 会在后续的渲染过程中被使用
    // 这段代码是实现透明视频效果的基础，通过合理设置纹理坐标来实现 alpha 通道的映射。
    return {
      position: positionBuffer,
      texture: textureBuffer,
    };
  }

  _initTexture(gl) {
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 对纹理图像进行y轴反转，因为WebGL纹理坐标系统的t轴（分为t轴和s轴）的方向和图片的坐标系统Y轴方向相反。因此将Y轴进行反转。
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }
}
