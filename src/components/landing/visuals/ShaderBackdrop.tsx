import { useEffect, useRef } from "react";

/**
 * ShaderBackdrop — a live WebGL2 fragment-shader ground for the dark
 * landing anchors (Hero, Final CTA).
 *
 * Same visual language as WebGPU shader sites, built on WebGL2 so it runs
 * on every phone our users carry. Falls back silently to the CSS graphite
 * gradient underneath when no context is available.
 */

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPointer;   // 0..1, smoothed
uniform float uEnergy;    // preset intensity
uniform float uBloom;     // electric bloom strength

// -- value noise -------------------------------------------------------
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 st = uv;
  st.x *= uRes.x / uRes.y;

  float t = uTime * 0.045 * uEnergy;

  // domain-warped flow — slow, felt rather than seen
  vec2 q = vec2(fbm(st * 1.6 + t), fbm(st * 1.6 + vec2(4.3, 1.7) - t));
  float f = fbm(st * 1.9 + q * 0.9 + vec2(0.0, t * 0.6));

  // graphite ramp: lit metal, not flat paint
  vec3 black  = vec3(0.035, 0.037, 0.041);
  vec3 mid    = vec3(0.128, 0.133, 0.143);
  vec3 light  = vec3(0.395, 0.408, 0.428);

  // light pool drifting toward the upper right
  vec2 pool = vec2(0.66 + 0.05 * sin(uTime * 0.07), 0.24 + 0.04 * cos(uTime * 0.05));
  pool.x *= uRes.x / uRes.y;
  float d = distance(st, pool);
  float ar = uRes.x / uRes.y;
  float rad = mix(0.66, 1.15, clamp((ar - 0.45) / 1.35, 0.0, 1.0));
  float glow = smoothstep(rad, 0.02, d);
  glow = pow(glow, 1.35);

  float shade = clamp(glow * (0.72 + 0.6 * f) + f * 0.16, 0.0, 1.0);
  vec3 col = mix(black, mid, smoothstep(0.0, 0.55, shade));
  col = mix(col, light, smoothstep(0.5, 1.0, shade) * 0.85);

  // one restrained electric bloom, following the pointer
  vec2 ptr = uPointer;
  ptr.x *= uRes.x / uRes.y;
  float pd = distance(st, ptr);
  float bloom = smoothstep(mix(0.34, 0.62, clamp((ar - 0.45) / 1.35, 0.0, 1.0)), 0.0, pd);
  col += vec3(0.106, 0.341, 0.961) * bloom * bloom * uBloom;

  // vignette so the headline sits on the darkest ground
  float vig = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.15, 1.0)));
  col *= mix(mix(0.34, 0.5, clamp((ar - 0.45) / 1.35, 0.0, 1.0)), 1.0, vig);

  // animated film grain, in-shader
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7);
  col += (g - 0.5) * 0.028;

  o = vec4(col, 1.0);
}
`;

type Preset = "hero" | "cta";

const PRESETS: Record<Preset, { energy: number; bloom: number }> = {
  hero: { energy: 1.0, bloom: 0.26 },
  cta: { energy: 0.6, bloom: 0.16 },
};

interface Props {
  preset?: Preset;
  className?: string;
}

export function ShaderBackdrop({ preset = "hero", className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return; // CSS graphite fallback stays visible

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uPointer = gl.getUniformLocation(prog, "uPointer");
    const uEnergy = gl.getUniformLocation(prog, "uEnergy");
    const uBloom = gl.getUniformLocation(prog, "uBloom");

    const cfg = PRESETS[preset];
    gl.uniform1f(uEnergy, cfg.energy);
    gl.uniform1f(uBloom, cfg.bloom);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();

    // pointer target (0..1), smoothed toward on each frame
    const target = { x: 0.72, y: 0.66 };
    const cur = { x: 0.72, y: 0.66 };
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.x = (e.clientX - r.left) / Math.max(1, r.width);
      target.y = 1 - (e.clientY - r.top) / Math.max(1, r.height);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", resize);

    let raf = 0;
    let visible = true;
    let last = 0;
    const start = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden) return;
      if (now - last < 33) return; // ~30fps cap
      last = now;
      resize();
      const t = (now - start) / 1000;
      // idle drift when the pointer never moves (mobile)
      const dx = reduce ? 0 : Math.sin(t * 0.11) * 0.06;
      const dy = reduce ? 0 : Math.cos(t * 0.09) * 0.05;
      cur.x += (target.x + dx - cur.x) * 0.05;
      cur.y += (target.y + dy - cur.y) * 0.05;
      gl.uniform2f(uPointer, cur.x, cur.y);
      gl.uniform1f(uTime, reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (reduce) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);

    raf = requestAnimationFrame(draw);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 w-full h-full pointer-events-none lp-shader-canvas ${className}`}
    />
  );
}
