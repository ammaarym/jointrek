import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, useScroll, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarTaxiFront, User, MapPin, Shield, Lock, Check, CreditCard, UserCheck, AlertTriangle, ChevronDown, ChevronUp, Mail, ShieldCheck, Users, BellRing, Flag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-fixed";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import findRidesScreenshot from "@assets/image_1751166578599.png";

// Aurora Background Component
interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
  showRadialGradient?: boolean;
}

const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen items-center justify-center bg-[#FCFAF7] text-foreground transition-bg",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
            [--aurora:repeating-linear-gradient(100deg,#B48A5C_10%,#B48A5C_15%,#B48A5C_20%,#B48A5C_25%,#B48A5C_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert dark:invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:dark:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-50 will-change-transform`,

            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};

// Particles Component
interface MousePosition {
  x: number;
  y: number;
}

function useMousePosition(): MousePosition {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return mousePosition;
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}

function hexToRgb(hex: string): number[] {
  hex = hex.replace("#", "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const hexInt = parseInt(hex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

const Particles: React.FC<ParticlesProps> = ({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#B48A5C",
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mousePosition = useMousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    animate();
    window.addEventListener("resize", initCanvas);

    return () => {
      window.removeEventListener("resize", initCanvas);
    };
  }, [color]);

  useEffect(() => {
    onMouseMove();
  }, [mousePosition.x, mousePosition.y]);

  useEffect(() => {
    initCanvas();
  }, [refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const onMouseMove = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = mousePosition.x - rect.left - w / 2;
      const y = mousePosition.y - rect.top - h / 2;
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
      }
    }
  };

  type Circle = {
    x: number;
    y: number;
    translateX: number;
    translateY: number;
    size: number;
    alpha: number;
    targetAlpha: number;
    dx: number;
    dy: number;
    magnetism: number;
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const pSize = Math.floor(Math.random() * 2) + size;
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.1;
    const dy = (Math.random() - 0.5) * 0.1;
    const magnetism = 0.1 + Math.random() * 4;
    return {
      x,
      y,
      translateX,
      translateY,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
    };
  };

  const rgb = hexToRgb(color);

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h
      );
    }
  };

  const drawParticles = () => {
    clearContext();
    const particleCount = quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): number => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const animate = () => {
    clearContext();
    circles.current.forEach((circle: Circle, i: number) => {
      const edge = [
        circle.x + circle.translateX - circle.size,
        canvasSize.current.w - circle.x - circle.translateX - circle.size,
        circle.y + circle.translateY - circle.size,
        canvasSize.current.h - circle.y - circle.translateY - circle.size,
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2)
      );
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;
      circle.translateX +=
        (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
        ease;
      circle.translateY +=
        (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
        ease;

      drawCircle(circle, true);

      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1);
        const newCircle = circleParams();
        drawCircle(newCircle);
      }
    });
    window.requestAnimationFrame(animate);
  };

  return (
    <div
      className={cn("pointer-events-none", className)}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
};

// Floating Elements Component
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-gradient-to-r from-[#B48A5C] to-[#B48A5C] rounded-full opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
          style={{
            left: `${10 + i * 15}%`,
            top: `${20 + i * 10}%`,
          }}
        />
      ))}
    </div>
  );
};

// Morphing Shape Component
const MorphingShape = ({ className }: { className?: string }) => {
  return (
    <motion.div
      className={cn("absolute bg-gradient-to-br from-[#B48A5C] to-[#B48A5C] rounded-full opacity-10", className)}
      animate={{
        borderRadius: ["50%", "30%", "50%"],
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Enhanced Card Component with Hover Effects
const EnhancedCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <motion.div
      className={cn("bg-gradient-to-br from-[#FEFCF8] to-[#FEFCF8] p-4 sm:p-8 rounded-xl shadow-lg border border-[#E8DCC6]", className)}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(180, 138, 92, 0.1)",
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const { currentUser, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  // Scroll to top and add fade-in animation effect
  useEffect(() => {
    // Scroll to top immediately when component mounts
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect authenticated users to profile (avoid redirect loops)
  useEffect(() => {
    if (!loading && currentUser && window.location.pathname === '/') {
      console.log("Home page: Authenticated user on home, redirecting to profile");
      window.location.replace('/profile');
    }
  }, [currentUser, loading]);

  const handleLogin = () => {
    console.log("[DEBUG] Home page login clicked");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7]">
      {/* Sticky Header with Get Started Button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold font-satoshi transition-colors" style={{ color: '#B8956B' }}>
              Trek
            </span>
          </Link>
          
          <Button
            onClick={handleLogin}
            className="text-white px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{ backgroundColor: '#B8956B' }}
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Hero Section with Aurora Background and Effects */}
      <section className="relative min-h-screen bg-gradient-to-br from-[#FCFAF7] via-[#FCFAF7] to-[#FCFAF7] overflow-hidden pt-16">
        <FloatingElements />
        <MorphingShape className="w-96 h-96 -top-48 -right-48" />
        <MorphingShape className="w-64 h-64 -bottom-32 -left-32" />
        
        {/* Aurora Background Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--aurora:repeating-linear-gradient(100deg,#B48A5C_10%,#B48A5C_15%,#B48A5C_20%,#B48A5C_25%,#B48A5C_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert
            after:content-[''] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-50 will-change-transform
            [mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]
            "
          ></div>
        </div>
        
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 z-10">
          <motion.div
            initial={{ opacity: 0.0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="flex flex-col gap-4 items-center justify-center text-center"
          >
            <motion.div 
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#B8956B] to-[#B8956B] bg-clip-text text-transparent text-center"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Share rides with fellow{" "}
              <span style={{ color: '#B8956B' }}>Gators</span>
            </motion.div>
            
            <motion.p 
              className="text-sm sm:text-xl text-center text-stone-600 max-w-2xl leading-relaxed px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              The safe, convenient way for UF students to carpool to campus,
              back home, or anywhere in between.
            </motion.p>

            {/* Find Rides Screenshot with enhanced animation */}
            <motion.div 
              className="mb-6 md:mb-12 mt-6"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              <div className="max-w-sm sm:max-w-4xl mx-auto px-4 sm:px-0">
                <motion.img 
                  src={findRidesScreenshot} 
                  alt="Trek Find Rides Interface" 
                  className="w-full rounded-lg sm:rounded-2xl shadow-lg sm:shadow-2xl border border-stone-200"
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Action buttons or sign-in card */}
            {currentUser ? (
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    className="text-white px-4 py-2 sm:px-8 sm:py-4 text-sm sm:text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: '#B8956B' }}
                  >
                    <Link href="/find-rides">Find a Ride</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    className="text-white px-4 py-2 sm:px-8 sm:py-4 text-sm sm:text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: '#9B7F56' }}
                  >
                    <Link href="/setup-post-ride">Offer a Ride</Link>
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="flex flex-col items-center max-w-2xl mx-auto px-4"
              >
                <EnhancedCard className="w-full mb-4 sm:mb-8">
                  <div className="flex items-center justify-center mb-3 sm:mb-4">
                    <div className="rounded-full p-2 sm:p-3 mr-2 sm:mr-3" style={{ backgroundColor: '#F0E6D6' }}>
                      <Lock className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#8A6F47' }} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold" style={{ color: '#8A6F47' }}>
                      Please sign in to continue
                    </h3>
                  </div>
                  <p className="text-stone-700 mb-4 sm:mb-6 text-center text-sm sm:text-base">
                    Trek is exclusively for University of Florida students. You'll need to sign in with your UF email to access rides.
                  </p>
                  <div className="flex justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        className="text-white px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                        style={{ backgroundColor: '#B8956B' }}
                        onClick={handleLogin}
                      >
                        Get Started
                      </Button>
                    </motion.div>
                  </div>
                </EnhancedCard>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 w-full">
                  <motion.div 
                    className="flex items-start p-3 sm:p-4 rounded-lg" 
                    style={{ backgroundColor: '#FEFCF8' }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="shrink-0 rounded-full p-2 sm:p-3 mr-3 sm:mr-4" style={{ backgroundColor: '#F0E6D6' }}>
                      <Shield className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#8A6F47' }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 mb-1 text-sm sm:text-base">UF Students Only</h4>
                      <p className="text-xs sm:text-sm text-stone-700">Verified UF emails ensure you're traveling with fellow Gators.</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start p-3 sm:p-4 rounded-lg" 
                    style={{ backgroundColor: '#FEFCF8' }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="shrink-0 rounded-full p-2 sm:p-3 mr-3 sm:mr-4" style={{ backgroundColor: '#F0E6D6' }}>
                      <Check className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#8A6F47' }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 mb-1 text-sm sm:text-base">Secure & Easy</h4>
                      <p className="text-xs sm:text-sm text-stone-700">Find rides or offer your own in just a few clicks after signing in.</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AuroraBackground>
      </section>

      {/* How Trek Works Section with Enhanced Effects */}
      <section className="py-8 sm:py-20 bg-gradient-to-b from-[#FCFAF7] to-neutral-50 relative overflow-hidden">
        <MorphingShape className="w-72 h-72 top-10 right-10 opacity-5" />
        <Particles
          className="absolute inset-0"
          quantity={50}
          ease={80}
          color="#B8956B"
          size={0.3}
        />
        <div className="container mx-auto px-4 relative z-10">
          <motion.h2 
            className="text-2xl sm:text-4xl font-bold text-center mb-6 sm:mb-16 text-stone-900"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            How Trek Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-12 max-w-5xl mx-auto">
            {[
              { icon: User, title: "Sign Up", description: "Create an account using your UF email to join the Gator community." },
              { icon: MapPin, title: "Find or Post Rides", description: "Browse available rides or offer a ride to fellow students." },
              { icon: CarTaxiFront, title: "Travel Safe", description: "Connect with verified students and enjoy secure, convenient transportation." }
            ].map((step, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <motion.div 
                  className="w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-lg transition-transform duration-300" 
                  style={{ background: 'linear-gradient(135deg, #F0E6D6, #E8DCC6)' }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <step.icon className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </motion.div>
                <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-4 text-stone-900">{step.title}</h3>
                <p className="text-stone-700 text-sm sm:text-lg leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features Section with Enhanced Effects */}
      <section className="py-8 sm:py-20 bg-gradient-to-b from-neutral-50 to-white relative overflow-hidden">
        <MorphingShape className="w-96 h-96 -bottom-48 -right-48 opacity-5" />
        <FloatingElements />
        <div className="container mx-auto px-4 relative z-10">
          <motion.h2 
            className="text-2xl sm:text-4xl font-bold text-center mb-6 sm:mb-16 text-stone-900"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Your Safety is Our Priority
          </motion.h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 max-w-6xl mx-auto">
            {[
              { icon: UserCheck, title: "Verified Students", description: "All users must verify with UF email addresses" },
              { icon: CreditCard, title: "Secure Payments", description: "Banking details protected by Stripe encryption" },
              { icon: Shield, title: "Ride Tracking", description: "SMS notifications and ride verification codes" },
              { icon: AlertTriangle, title: "Report System", description: "Easy reporting for safety concerns" }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="text-center p-3 sm:p-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.05 }}
              >
                <motion.div 
                  className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-md" 
                  style={{ backgroundColor: '#F0E6D6' }}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <feature.icon className="h-5 w-5 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </motion.div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-stone-900">{feature.title}</h3>
                <p className="text-xs sm:text-base text-stone-700">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section with Enhanced Effects */}
      <section className="py-6 sm:py-20 bg-gradient-to-b from-white to-neutral-50 relative overflow-hidden">
        <MorphingShape className="w-80 h-80 -top-40 -left-40 opacity-5" />
        <Particles
          className="absolute inset-0"
          quantity={30}
          ease={80}
          color="#B8956B"
          size={0.2}
        />
        <div className="container mx-auto px-2 sm:px-4 relative z-10">
          <motion.h2 
            className="text-xl sm:text-4xl font-bold text-center mb-4 sm:mb-16 text-stone-900"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="max-w-3xl mx-auto space-y-1 sm:space-y-4">
            {[
              {
                id: "security",
                question: "How does Trek protect my banking information?",
                answer: "Trek uses industry-leading security measures. All payment processing is handled by Stripe, which is PCI DSS compliant and uses bank-level encryption. We never see or store your banking details, credit card numbers, or SSN. Your financial information is encrypted and securely transmitted directly to Stripe's secure servers."
              },
              {
                id: "scammers", 
                question: "How does Trek prevent scammers?",
                answer: "All users must verify their identity using official UF email addresses (@ufl.edu). Additionally, we require phone number verification via SMS before accessing ride features. This dual verification system ensures only legitimate UF students can use the platform."
              },
              {
                id: "safety",
                question: "What safety features does Trek provide?",
                answer: "Trek includes SMS notifications for ride updates, verification codes for ride start/completion, gender preference settings, and an easy reporting system. All users are verified UF students, and we track ride completion to ensure accountability."
              },
              {
                id: "payments",
                question: "How do payments work?",
                answer: "Payments are processed securely through Stripe. Passengers are charged when rides are completed, not when booked. If a ride is cancelled or doesn't occur, you receive automatic refunds. Drivers receive payouts directly to their bank accounts after ride completion."
              }
            ].map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <Collapsible
                  open={openFAQ === faq.id}
                  onOpenChange={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                >
                  <CollapsibleTrigger asChild>
                    <motion.div whileHover={{ x: 3 }}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between py-1 px-2 sm:p-6 h-auto text-left rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors min-h-[2rem] sm:min-h-auto"
                      >
                        <span className="font-medium text-stone-900 text-[11px] sm:text-lg leading-tight pr-1 flex-1">{faq.question}</span>
                        <motion.div
                          animate={{ rotate: openFAQ === faq.id ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {openFAQ === faq.id ? (
                            <ChevronUp className="h-3 w-3 sm:h-5 sm:w-5 text-stone-600 shrink-0 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 sm:h-5 sm:w-5 text-stone-600 shrink-0 ml-1" />
                          )}
                        </motion.div>
                      </Button>
                    </motion.div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2 pb-1 sm:px-6 sm:pb-6">
                    <motion.div 
                      className="pt-1 sm:pt-4 border-t border-stone-100"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-stone-700 leading-tight text-[10px] sm:text-base">{faq.answer}</p>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Particles Section */}
      <div className="relative h-[300px] sm:h-[500px] w-full bg-gradient-to-br from-neutral-50 via-[#FCFAF7] to-[#FCFAF7] flex flex-col items-center justify-center overflow-hidden">
        <MorphingShape className="w-full h-full opacity-10" />
        <motion.span 
          className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-[#B8956B] to-[#B8956B] bg-clip-text text-center text-4xl sm:text-8xl font-semibold leading-none text-transparent relative z-10"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Trek
        </motion.span>
        <Particles
          className="absolute inset-0"
          quantity={150}
          ease={80}
          color="#B8956B"
          refresh
        />
      </div>
    </div>
  );
}