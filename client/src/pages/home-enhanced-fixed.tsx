import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CarTaxiFront,
  User,
  MapPin,
  Shield,
  Lock,
  Check,
  CreditCard,
  UserCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StarBorder } from "@/components/ui/star-border";
// Removed useAuth import - landing page doesn't need authentication
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import findRidesScreenshot from "@assets/image_1751166578599.png";
import trekLogo from "@assets/TREK (Presentation)_1751439938143.png";

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
        canvasSize.current.h,
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
    end2: number,
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
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
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
      className={cn(
        "absolute bg-gradient-to-br from-[#B48A5C] to-[#B48A5C] rounded-full opacity-10",
        className,
      )}
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
const EnhancedCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={cn(
        "bg-gradient-to-br from-[#FEFCF8] to-[#FEFCF8] p-4 sm:p-8 rounded-xl shadow-lg border border-[#E8DCC6]",
        className,
      )}
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

  const handleLogin = () => {
    console.log("[DEBUG] Home page login clicked");
    navigate("/login");
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] relative">
      {/* Hero Section with Enhanced Effects */}
      <section className="relative bg-gradient-to-br from-[#FCFAF7] via-[#FCFAF7] to-[#FCFAF7] overflow-hidden pt-8 pb-4 flex items-start justify-center">
        <MorphingShape className="w-96 h-96 -top-48 -right-48" />
        <MorphingShape className="w-64 h-64 -bottom-32 -left-32" />

        {/* Aurora Background Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50 will-change-transform pointer-events-none blur-[10px] invert [background-image:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%),repeating-linear-gradient(100deg,#B48A5C_10%,#B48A5C_15%,#B48A5C_20%,#B48A5C_25%,#B48A5C_30%)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] after:content-[''] after:absolute after:inset-0 after:[background-image:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%),repeating-linear-gradient(100deg,#B48A5C_10%,#B48A5C_15%,#B48A5C_20%,#B48A5C_25%,#B48A5C_30%)] after:[background-size:200%,_100%] after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference [mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]"></div>
        </div>

        <div className="relative flex flex-col items-center justify-center px-4 z-10 text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0.0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="flex flex-col gap-4 items-center justify-center"
          >
            {/* Large Trek Logo */}
            <motion.div
              initial={{ opacity: 0.0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.6,
                ease: "easeInOut",
              }}
              className="-mb-6 sm:-mb-4"
            >
              <img
                src={trekLogo}
                alt="Trek"
                className="h-24 sm:h-32 md:h-40 lg:h-48 w-auto"
                style={{ backgroundColor: "transparent" }}
              />
            </motion.div>

            <motion.div
              className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 leading-tight"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Rideshare Marketplace Built for UF{" "}
              {/* <span style={{ color: "#B8956B" }}>Gators</span> */}
            </motion.div>

            <motion.p
              className="text-sm sm:text-lg mb-2 md:mb-4 text-stone-600 max-w-2xl mx-auto leading-relaxed px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Getting in and out of the Swamp doesn't have to suck
            </motion.p>

            {/* Find Rides Screenshot with enhanced animation */}
            <motion.div
              className="mb-1 md:mb-2"
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

            {/* Get Early Access Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              className="flex flex-col items-center justify-center mb-1 sm:mb-2 mt-2"
            >
              <StarBorder onClick={scrollToBottom}>Get Early Access</StarBorder>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How Trek Works Section with Enhanced Effects */}
      <section className="py-4 sm:py-8 bg-gradient-to-b from-[#FCFAF7] to-neutral-50 relative overflow-hidden">
        <MorphingShape className="w-72 h-72 top-10 right-10 opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-center mb-2 sm:mb-4 text-stone-900"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            How Trek Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: User,
                title: "Sign Up",
                description:
                  "Create an account using your UF email to join the Gator community.",
              },
              {
                icon: MapPin,
                title: "Find or Post Rides",
                description:
                  "Browse available rides or offer a ride to fellow students.",
              },
              {
                icon: CarTaxiFront,
                title: "Travel Safe",
                description:
                  "Connect with verified students and enjoy secure, convenient transportation.",
              },
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
                  className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-lg transition-transform duration-300"
                  style={{
                    background: "linear-gradient(135deg, #F0E6D6, #E8DCC6)",
                  }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <step.icon
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    style={{ color: "#8A6F47" }}
                  />
                </motion.div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-stone-900">
                  {step.title}
                </h3>
                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features Section with Enhanced Effects */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-neutral-50 to-white relative overflow-hidden">
        <MorphingShape className="w-96 h-96 -bottom-48 -left-48 opacity-15" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 text-stone-900"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Your Safety is Our Priority
          </motion.h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 max-w-5xl mx-auto">
            {[
              {
                icon: UserCheck,
                title: "Verified Students",
                description: "All users must verify with UF email addresses",
              },
              {
                icon: Lock,
                title: "Contact Privacy",
                description: "Contact info only shared after mutual approval",
              },
              {
                icon: CreditCard,
                title: "Secure Payments",
                description: "Banking and payment info protected by Stripe",
              },
              {
                icon: AlertTriangle,
                title: "Report System",
                description: "Easy reporting for safety concerns",
              },
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
                  className="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-3 shadow-md"
                  style={{ backgroundColor: "#F0E6D6" }}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                >
                  <feature.icon
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    style={{ color: "#8A6F47" }}
                  />
                </motion.div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 text-stone-900">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-700">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section with Enhanced Effects */}
      <section className="py-8 sm:py-12 bg-gradient-to-b from-white to-neutral-50 relative overflow-hidden">
        <MorphingShape className="w-80 h-80 -top-40 -right-40 opacity-15" />
        <div className="container mx-auto px-2 sm:px-4 relative z-10">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-center mb-2 sm:mb-4 text-stone-900"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="max-w-2xl mx-auto space-y-1 sm:space-y-2">
            {[
              {
                id: "security",
                question: "How does Trek protect my banking information?",
                answer:
                  "Trek uses industry-leading security measures. All payment processing is handled by Stripe, which is PCI DSS compliant and uses bank-level encryption. We never see or store your banking details, credit card numbers, or SSN. Your financial information is encrypted and securely transmitted directly to Stripe's secure servers.",
              },
              {
                id: "scammers",
                question: "How does Trek prevent scammers?",
                answer:
                  "All users must verify their identity using official UF email addresses (@ufl.edu). Additionally, we require phone number verification via SMS before accessing ride features. This dual verification system ensures only legitimate UF students can use the platform.",
              },
              {
                id: "safety",
                question: "What safety features does Trek provide?",
                answer:
                  "Trek includes SMS notifications for ride updates, verification codes for ride start/completion, gender preference settings, and an easy reporting system. All users are verified UF students, and we track ride completion to ensure accountability.",
              },
              {
                id: "payments",
                question: "How do payments work?",
                answer:
                  "Payments are processed securely through Stripe. Passengers are charged when rides are completed, not when booked. If a ride is cancelled or doesn't occur, you receive automatic refunds. Drivers receive payouts directly to their bank accounts after ride completion.",
              },
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
                  onOpenChange={() =>
                    setOpenFAQ(openFAQ === faq.id ? null : faq.id)
                  }
                >
                  <CollapsibleTrigger asChild>
                    <motion.div whileHover={{ x: 3 }}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between py-1 px-2 sm:py-2 sm:px-3 h-auto text-left rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors min-h-[2rem] sm:min-h-auto"
                      >
                        <span className="font-medium text-stone-900 text-[11px] sm:text-sm leading-tight pr-1 flex-1">
                          {faq.question}
                        </span>
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
                  <CollapsibleContent className="px-2 pb-1 sm:px-3 sm:pb-3">
                    <motion.div
                      className="pt-1 sm:pt-2 border-t border-stone-100"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-stone-700 leading-tight text-[10px] sm:text-sm">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta Signup Footer */}
      <div className="relative py-4 sm:py-8 w-full bg-[#FCFAF7]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Ready to Fix College Travel?
            </h3>
            <p className="text-stone-700 text-lg mb-6">
              I'm handpicking early testers for Trek's beta. Let me know if you want in.
            </p>

            {/* LinkedIn CTA */}
            <div className="flex items-center justify-center mb-6">
              <a
                href="https://linkedin.com/in/ammaar-mohammed"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-md hover:bg-white/90 transition-colors"
              >
                <div className="w-8 h-8 bg-[#0077B5] rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">in</span>
                </div>
                <span className="text-stone-700 font-medium">
                  Text me on LinkedIn
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Copyright Footer */}
      <div className="bg-[#FCFAF7] py-3 border-t border-stone-200">
        <div className="container mx-auto px-4 text-center">
          <div className="text-stone-600 text-xs sm:text-sm">
            <p>© 2025 Ammaar Mohammed. All rights reserved.</p>
            <p className="mt-1">
              Trek is coming soon to the University of Florida
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
