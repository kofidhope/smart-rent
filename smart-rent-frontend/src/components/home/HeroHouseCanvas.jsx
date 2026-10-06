import {useMemo, useRef} from 'react'
import {Canvas, useFrame} from '@react-three/fiber'
import * as THREE from 'three'

const BRAND_GREEN = '#1D9E75'
const BODY = '#F4F6F5'
const BODY_EDGE = '#E5EAE8'
const ROOF = '#163D32'
const ACCENT = '#FBF7F1'

function lerp(a, b, t) {
    return a + (b - a) * t
}

function MinimalHouse({pointerRef, reduceMotion}) {
    const group = useRef()
    const smooth = useRef({x: 0, y: 0, yaw: 0.42})
    const edgesGeometry = useMemo(
        () => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.15, 0.72, 0.92)),
        [],
    )

    useFrame((state, delta) => {
        const g = group.current
        if (!g) return

        const t = state.clock.elapsedTime
        const targetX = reduceMotion
            ? 0
            : (pointerRef.current?.x ?? 0) * 0.22
        const targetY = reduceMotion
            ? 0
            : (pointerRef.current?.y ?? 0) * 0.12

        const follow = reduceMotion ? 1 : Math.min(1, delta * 5)
        smooth.current.x = lerp(smooth.current.x, targetX, follow)
        smooth.current.y = lerp(smooth.current.y, targetY, follow)

        const baseYaw = 0.42
        const drift = reduceMotion ? 0 : Math.sin(t * 0.35) * 0.06
        const targetYaw = baseYaw + drift + smooth.current.x
        smooth.current.yaw = lerp(smooth.current.yaw, targetYaw, follow)

        g.rotation.y = smooth.current.yaw
        g.rotation.x = smooth.current.y
        g.position.y = reduceMotion ? 0 : Math.sin(t * 0.45) * 0.05
    })

    return (
        <group ref={group} position={[0, -0.15, 0]}>
            {/* Plinth — grounds the model in the panel */}
            <mesh position={[0, 0.02, 0]} receiveShadow>
                <cylinderGeometry args={[1.05, 1.12, 0.06, 48]} />
                <meshStandardMaterial
                    color={ACCENT}
                    roughness={0.95}
                    metalness={0}
                />
            </mesh>

            {/* Main volume */}
            <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.15, 0.72, 0.92]} />
                <meshStandardMaterial
                    color={BODY}
                    roughness={0.82}
                    metalness={0.04}
                />
            </mesh>

            {/* Roof — quiet wedge, not playful */}
            <mesh position={[0, 0.98, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[0.88, 0.42, 4]} />
                <meshStandardMaterial
                    color={ROOF}
                    roughness={0.78}
                    metalness={0.06}
                />
            </mesh>

            {/* Door */}
            <mesh position={[0, 0.32, 0.465]} castShadow>
                <boxGeometry args={[0.22, 0.38, 0.04]} />
                <meshStandardMaterial
                    color={BRAND_GREEN}
                    roughness={0.65}
                    metalness={0.08}
                />
            </mesh>

            {/* Windows */}
            {[-0.32, 0.32].map((x) => (
                <mesh key={x} position={[x, 0.52, 0.465]} castShadow>
                    <boxGeometry args={[0.24, 0.2, 0.04]} />
                    <meshStandardMaterial
                        color={BODY_EDGE}
                        roughness={0.5}
                        metalness={0.1}
                    />
                </mesh>
            ))}

            {/* Soft edge trim */}
            <lineSegments
                geometry={edgesGeometry}
                position={[0, 0.48, 0]}>
                <lineBasicMaterial color={BODY_EDGE} transparent opacity={0.35} />
            </lineSegments>
        </group>
    )
}

function Scene({pointerRef, reduceMotion}) {
    return (
        <>
            <color attach="background" args={['#FBF7F1']} />
            <fog attach="fog" args={['#FBF7F1', 4.5, 9]} />
            <ambientLight intensity={0.65} />
            <directionalLight
                position={[2.5, 4, 3]}
                intensity={0.85}
                castShadow
                shadow-mapSize={[512, 512]}
            />
            <directionalLight position={[-2, 2, -1]} intensity={0.25} />
            <MinimalHouse pointerRef={pointerRef} reduceMotion={reduceMotion} />
        </>
    )
}

export default function HeroHouseCanvas({
    pointerRef,
    reduceMotion,
    inView = true,
    className,
}) {
    return (
        <Canvas
            className={className}
            frameloop={inView ? 'always' : 'never'}
            dpr={[1, 1.5]}
            gl={{antialias: true, powerPreference: 'high-performance'}}
            shadows
            camera={{position: [1.65, 1.05, 2.35], fov: 32, near: 0.1, far: 20}}
            onCreated={({gl}) => {
                gl.toneMapping = THREE.ACESFilmicToneMapping
                gl.toneMappingExposure = 1.05
            }}>
            <Scene pointerRef={pointerRef} reduceMotion={reduceMotion} />
        </Canvas>
    )
}
