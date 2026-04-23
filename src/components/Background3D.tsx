import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── Shared mouse state (window-level, doesn't block form clicks) ─── */
const mouseState = { x: 0, y: 0 };

/* ─── Simplex 3D Noise (Ashima/webgl-noise) ─── */
const noise3D = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

/* ─── Vertex Shader ─── */
const vertexShader = /* glsl */ `
${noise3D}

uniform float uTime;
uniform float uNoiseStrength;
uniform float uFrequency;

varying vec2 vUv;
varying float vDistortion;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  vec3 pos = position;

  float n1 = snoise(vec3(
    pos.x * uFrequency + uTime * 0.15,
    pos.y * uFrequency + uTime * 0.12,
    pos.z * uFrequency
  )) * uNoiseStrength;

  float n2 = snoise(vec3(
    pos.x * uFrequency * 2.0 - uTime * 0.08,
    pos.y * uFrequency * 2.0 + uTime * 0.1,
    pos.z * uFrequency * 2.0
  )) * uNoiseStrength * 0.4;

  float totalNoise = n1 + n2;
  vDistortion = totalNoise;

  pos += normal * totalNoise;
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

/* ─── Fragment Shader ─── */
const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uOpacity;

varying vec2 vUv;
varying float vDistortion;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  float m1 = smoothstep(-1.0, 1.0, vWorldPos.y + vDistortion * 2.5);
  float m2 = smoothstep(-1.0, 1.0, vWorldPos.x + sin(uTime * 0.2) * 0.4);

  vec3 color = mix(uColor1, uColor2, m1);
  color = mix(color, uColor3, m2 * 0.6);

  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
  color += fresnel * 0.35;

  float shimmer = sin(vDistortion * 8.0 + uTime * 0.5) * 0.04 + 1.0;
  color *= shimmer;

  gl_FragColor = vec4(color, uOpacity);
}
`;

/* ─── Gradient Blob Mesh ─── */
function GradientBlob() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const mouseSmooth = useRef({ x: 0, y: 0 });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uNoiseStrength: { value: 0.3 },
    uFrequency: { value: 0.8 },
    uColor1: { value: new THREE.Color('#0ea5e9') },
    uColor2: { value: new THREE.Color('#8b5cf6') },
    uColor3: { value: new THREE.Color('#06d6a0') },
    uOpacity: { value: 0.85 },
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;

    mouseSmooth.current.x += (mouseState.x * 1.5 - mouseSmooth.current.x) * 0.03;
    mouseSmooth.current.y += (mouseState.y * 1.5 - mouseSmooth.current.y) * 0.03;

    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.05 + mouseSmooth.current.y * 0.3;
      meshRef.current.rotation.y = t * 0.08 + mouseSmooth.current.x * 0.3;
      meshRef.current.position.x = mouseSmooth.current.x * 0.4;
      meshRef.current.position.y = mouseSmooth.current.y * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} scale={2.2}>
      <icosahedronGeometry args={[1, 48]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Wireframe Ring ─── */
function WireframeRing() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      ref.current.rotation.x = t * 0.03 + mouseState.y * 0.2;
      ref.current.rotation.y = t * 0.05 + mouseState.x * 0.2;
      ref.current.rotation.z = t * 0.02;
    }
  });

  return (
    <mesh ref={ref} scale={3.2}>
      <torusGeometry args={[1, 0.005, 64, 128]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
    </mesh>
  );
}

/* ─── Floating Particles ─── */
function FloatingParticles({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!);

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = Math.random() * 2 + 0.5;
    }
    return { positions: pos, sizes: sz };
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.015;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.01) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.03}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Ambient Glow Rings ─── */
function GlowRings() {
  const group = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.x = t * 0.02 + mouseState.y * 0.1;
      group.current.rotation.z = t * 0.015 + mouseState.x * 0.1;
    }
  });

  return (
    <group ref={group}>
      {[3.5, 4.2, 5.0].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / (3 + i), i * 0.5, 0]}>
          <torusGeometry args={[r, 0.003, 32, 128]} />
          <meshBasicMaterial
            color={['#0ea5e9', '#8b5cf6', '#06d6a0'][i]}
            transparent
            opacity={0.12}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Exported Component ─── */
const Background3D: React.FC = () => {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseState.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseState.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const handleCreated = useCallback((state: any) => {
    state.gl.setClearColor('#000000', 0);
  }, []);

  return (
    <div className="scene-3d">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={handleCreated}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <GradientBlob />
        <WireframeRing />
        <GlowRings />
        <FloatingParticles count={150} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.3} />
      </Canvas>
    </div>
  );
};

export default Background3D;
