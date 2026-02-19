import { motion } from "framer-motion";

interface PharmaGuardLogoProps {
    size?: number;
    className?: string;
    animated?: boolean;
}

/**
 * Premium PharmaGuard logo — abstract DNA helix merged with a shield.
 * Inline SVG with gradient fills and optional entrance animation.
 */
export default function PharmaGuardLogo({ size = 40, className = "", animated = true }: PharmaGuardLogoProps) {
    const Wrapper = animated ? motion.div : "div";
    const wrapperProps = animated
        ? { whileHover: { scale: 1.08, rotate: 3 }, whileTap: { scale: 0.95 } }
        : {};

    return (
        <Wrapper {...(wrapperProps as any)} className={className} style={{ width: size, height: size }}>
            <svg
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
            >
                <defs>
                    {/* Main red gradient */}
                    <linearGradient id="pg-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF3D4D" />
                        <stop offset="50%" stopColor="#D11A2A" />
                        <stop offset="100%" stopColor="#8A1C26" />
                    </linearGradient>

                    {/* Lighter accent */}
                    <linearGradient id="pg-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF6B7A" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#D11A2A" stopOpacity="0.4" />
                    </linearGradient>

                    {/* Inner glow */}
                    <radialGradient id="pg-glow" cx="50%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="#FF6B7A" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>

                    {/* Shield clip path */}
                    <clipPath id="shield-clip">
                        <path d="M32 4 C32 4, 8 12, 8 28 C8 44, 20 56, 32 60 C44 56, 56 44, 56 28 C56 12, 32 4, 32 4 Z" />
                    </clipPath>
                </defs>

                {/* Shield base */}
                <path
                    d="M32 4 C32 4, 8 12, 8 28 C8 44, 20 56, 32 60 C44 56, 56 44, 56 28 C56 12, 32 4, 32 4 Z"
                    fill="url(#pg-grad-main)"
                    stroke="url(#pg-grad-light)"
                    strokeWidth="1"
                />

                {/* Inner glow overlay */}
                <path
                    d="M32 4 C32 4, 8 12, 8 28 C8 44, 20 56, 32 60 C44 56, 56 44, 56 28 C56 12, 32 4, 32 4 Z"
                    fill="url(#pg-glow)"
                />

                {/* DNA helix strand 1 */}
                <path
                    d="M24 16 C28 22, 36 22, 40 16 C36 28, 28 28, 24 16"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.9"
                />
                <path
                    d="M24 28 C28 34, 36 34, 40 28 C36 40, 28 40, 24 28"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                />
                <path
                    d="M26 40 C29 44, 35 44, 38 40 C35 48, 29 48, 26 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.5"
                />

                {/* DNA base pair connectors */}
                <line x1="27" y1="19" x2="37" y2="19" stroke="white" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
                <line x1="26" y1="23" x2="38" y2="23" stroke="white" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
                <line x1="27" y1="31" x2="37" y2="31" stroke="white" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
                <line x1="26" y1="35" x2="38" y2="35" stroke="white" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
                <line x1="28" y1="43" x2="36" y2="43" stroke="white" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />

                {/* Top highlight crescent */}
                <ellipse cx="28" cy="14" rx="8" ry="3" fill="white" opacity="0.08" />
            </svg>
        </Wrapper>
    );
}
