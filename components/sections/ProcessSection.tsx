"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

function Step01Illustration({ visible }: { visible: boolean }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="240" height="240" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 3 concentric circles */}
        <circle cx="140" cy="140" r="120" stroke="rgba(42,51,243,0.15)" strokeWidth="1" />
        <circle cx="140" cy="140" r="80" stroke="rgba(42,51,243,0.25)" strokeWidth="1" />
        <circle cx="140" cy="140" r="40" stroke="rgba(107,143,248,0.4)" strokeWidth="1.5" />

        {/* Center dot */}
        <circle cx="140" cy="140" r="8" fill="#2a33f3" style={{ filter: "drop-shadow(0 0 12px rgba(42,51,243,0.8))" }} />

        {/* Line 1 - to r=40, endpoint (171, 114) */}
        <motion.line
          x1="140" y1="140" x2="171" y2="114"
          stroke="rgba(107,143,248,0.7)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={visible ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        />
        <motion.circle
          cx="171" cy="114" r="4" fill="#6B8FF8"
          initial={{ opacity: 0, scale: 0 }}
          animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        />

        {/* Line 2 - to r=80, endpoint (83, 197) */}
        <motion.line
          x1="140" y1="140" x2="83" y2="197"
          stroke="rgba(107,143,248,0.6)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={visible ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
        />
        <motion.circle
          cx="83" cy="197" r="4" fill="#6B8FF8" opacity="0.8"
          initial={{ opacity: 0, scale: 0 }}
          animate={visible ? { opacity: 0.8, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: 1.7 }}
        />

        {/* Line 3 - to r=120, endpoint (48, 63) */}
        <motion.line
          x1="140" y1="140" x2="48" y2="63"
          stroke="rgba(107,143,248,0.45)" strokeWidth="1.5" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={visible ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 0.7, delay: 1.9, ease: "easeOut" }}
        />
        <motion.circle
          cx="48" cy="63" r="4" fill="#6B8FF8" opacity="0.6"
          initial={{ opacity: 0, scale: 0 }}
          animate={visible ? { opacity: 0.6, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: 2.6 }}
        />
      </svg>
    </motion.div>
  );
}

function Step02Illustration({ visible }: { visible: boolean }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.8 }}
    >
      <svg width="240" height="240" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mockup frame */}
        <rect x="40" y="60" width="200" height="140" rx="12" stroke="rgba(107,143,248,0.4)" strokeWidth="1.5" fill="rgba(42,51,243,0.05)" />
        <rect x="40" y="60" width="200" height="30" rx="12" fill="rgba(42,51,243,0.1)" />
        <circle cx="60" cy="75" r="4" fill="#ff5f57" opacity="0.7" />
        <circle cx="76" cy="75" r="4" fill="#febc2e" opacity="0.7" />
        <circle cx="92" cy="75" r="4" fill="#28c840" opacity="0.7" />
        <rect x="60" y="108" width="80" height="6" rx="3" fill="rgba(107,143,248,0.5)" />
        <rect x="60" y="124" width="120" height="4" rx="2" fill="rgba(255,255,255,0.15)" />
        <rect x="60" y="136" width="100" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
        {/* Blue button */}
        <rect x="60" y="156" width="70" height="24" rx="6" fill="rgba(42,51,243,0.6)" style={{ filter: "drop-shadow(0 0 8px rgba(42,51,243,0.6))" }} />

        {/* Wave path - drawn as pencil moves */}
        <motion.path
          d="M 141 183 C 151 176, 158 189, 168 183 C 178 176, 185 189, 195 183"
          stroke="rgba(107,143,248,0)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={visible ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.6, delay: 0.3, ease: "easeInOut" }}
        />

        {/* Pencil follows the exact wave path */}
        <motion.g
          style={{
            offsetPath: `path('M 141 183 C 151 176, 158 189, 168 183 C 178 176, 185 189, 190 183')`,
            offsetRotate: "0deg",
          }}
          initial={{ offsetDistance: "0%" }}
          animate={visible ? { offsetDistance: ["0%", "0%", "100%"] } : { offsetDistance: "0%" }}
          transition={{
            duration: 1.6,
            delay: 0.3,
            ease: "easeInOut",
            times: [0, 0, 1],
          }}
        >
          <path
            d="M190 180 L220 150 L230 160 L200 190 Z"
            stroke="#6B8FF8" strokeWidth="1.5" fill="rgba(107,143,248,0.1)"
            style={{ transform: "translate(-190px, -193px)" }}
          />
          <path
            d="M190 180 L185 195 L200 190 Z"
            fill="#6B8FF8" opacity="0.6"
            style={{ transform: "translate(-190px, -193px)" }}
          />
        </motion.g>
      </svg>
    </motion.div>
  );
}

const steps = [
  {
    number: "01",
    title: "היכרות והבנה",
    description: "לפני שאנחנו כותבים שורת קוד אחת, אנחנו לומדים את העסק שלך לעומק. המטרות, הקהל, המתחרים. רק ככה אפשר לבנות משהו שבאמת עובד.",
    illustration: (visible: boolean) => <Step01Illustration visible={visible} />,
  },
  {
    number: "02",
    title: "עיצוב ואפיון",
    description: "מגבשים את הרעיונות לחזון ויזואלי מדויק. כל אלמנט, כל צבע, כל מרחק — בכוונה. לא אסתטיקה בשביל אסתטיקה — UX שמוביל לפעולה.",
    illustration: (visible: boolean) => <Step02Illustration visible={visible} />,
  },
  {
    number: "03",
    title: "פיתוח",
    description: "קוד נקי, מהיר ומדויק. Next.js, TypeScript, ביצועים מעולים, נגישות מלאה. בונים לטווח הארוך, לא רק להשקה.",
    illustration: (
      <svg width="240" height="240" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ direction: "ltr" }}>
        <defs>
          <clipPath id="terminal-clip">
            <rect x="30" y="50" width="220" height="180" rx="12" />
          </clipPath>
        </defs>
        <rect x="30" y="50" width="220" height="180" rx="12" stroke="rgba(107,143,248,0.3)" strokeWidth="1.5" fill="rgba(10,10,10,0.8)" />
        <rect x="30" y="50" width="220" height="32" fill="rgba(42,51,243,0.15)" />
        <circle cx="52" cy="66" r="5" fill="#ff5f57" opacity="0.7" />
        <circle cx="70" cy="66" r="5" fill="#febc2e" opacity="0.7" />
        <circle cx="88" cy="66" r="5" fill="#28c840" opacity="0.7" />
        <g clipPath="url(#terminal-clip)">
          <motion.text
            x="70" y="108"
            fontFamily="monospace" fontSize="11"
            fill="rgba(107,143,248,0.9)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.1 }}
          >const</motion.text>
          <motion.text
            x="110" y="108"
            fontFamily="monospace" fontSize="11"
            fill="rgba(255,255,255,0.7)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.1 }}
          > studio =</motion.text>
          <motion.text
            x="70" y="128"
            fontFamily="monospace" fontSize="11"
            fill="rgba(255,255,255,0.4)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.1 }}
          >  name:</motion.text>
          <motion.text
            x="116" y="128"
            fontFamily="monospace" fontSize="11"
            fill="rgba(107,243,143,0.8)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.1 }}
          > &quot;YEYE&quot;</motion.text>
          <motion.text
            x="70" y="148"
            fontFamily="monospace" fontSize="11"
            fill="rgba(255,255,255,0.4)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.1 }}
          >  quality:</motion.text>
          <motion.text
            x="128" y="148"
            fontFamily="monospace" fontSize="11"
            fill="rgba(107,243,143,0.8)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.1 }}
          > 100</motion.text>
          <motion.text
            x="70" y="168"
            fontFamily="monospace" fontSize="11"
            fill="rgba(255,255,255,0.4)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.1 }}
          >  deliver:</motion.text>
          <motion.text
            x="124" y="168"
            fontFamily="monospace" fontSize="11"
            fill="rgba(107,243,143,0.8)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1, duration: 0.1 }}
          > true</motion.text>
          {/* Blinking cursor */}
          <motion.rect
            x="70" y="182"
            width="8" height="14"
            rx="1"
            fill="#6B8FF8"
            animate={{ opacity: [1, 1, 0, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, times: [0, 0.49, 0.5, 0.99, 1] }}
          />
        </g>
      </svg>
    ),
  },
  {
    number: "04",
    title: "השקה ותמיכה",
    description: "ביום ההשקה אנחנו שם. אחרי ההשקה — גם. ליווי מלא, תיקונים מהירים, ומערכת שגדלה איתך.",
    illustration: (_visible: boolean) => (
      <motion.div
        animate={{ rotate: [-4, 4, -4], y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      >
        <svg width="240" height="240" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M140 40 C140 40 110 80 110 130 L140 150 L170 130 C170 80 140 40 140 40Z" stroke="rgba(107,143,248,0.6)" strokeWidth="1.5" fill="rgba(42,51,243,0.1)" />
          <circle cx="140" cy="100" r="14" stroke="rgba(107,143,248,0.8)" strokeWidth="1.5" fill="rgba(42,51,243,0.2)" style={{ filter: "drop-shadow(0 0 8px rgba(42,51,243,0.6))" }} />
          <path d="M110 130 L85 160 L110 155 Z" stroke="rgba(107,143,248,0.4)" strokeWidth="1.5" fill="rgba(42,51,243,0.05)" />
          <path d="M170 130 L195 160 L170 155 Z" stroke="rgba(107,143,248,0.4)" strokeWidth="1.5" fill="rgba(42,51,243,0.05)" />
          <motion.path
            d="M125 155 C125 155 130 185 140 195 C150 185 155 155 155 155 Z"
            fill="rgba(42,51,243,0.4)"
            style={{ filter: "drop-shadow(0 0 12px rgba(42,51,243,0.8))" }}
            animate={{
              d: [
                "M125 155 C125 155 130 185 140 195 C150 185 155 155 155 155 Z",
                "M126 155 C124 155 128 190 140 200 C152 190 156 155 154 155 Z",
                "M124 155 C126 155 132 182 140 193 C148 182 154 155 156 155 Z",
                "M125 155 C125 155 130 185 140 195 C150 185 155 155 155 155 Z",
              ],
              scaleY: [1, 1.08, 0.96, 1],
            }}
            transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut", times: [0, 0.33, 0.66, 1] }}
          />
          <motion.path
            d="M132 155 C132 155 135 178 140 185 C145 178 148 155 148 155 Z"
            fill="rgba(107,143,248,0.7)"
            animate={{
              d: [
                "M132 155 C132 155 135 178 140 185 C145 178 148 155 148 155 Z",
                "M131 155 C133 155 136 181 140 188 C144 181 147 155 149 155 Z",
                "M133 155 C131 155 134 176 140 183 C146 176 149 155 147 155 Z",
                "M132 155 C132 155 135 178 140 185 C145 178 148 155 148 155 Z",
              ],
              scaleY: [1, 1.1, 0.95, 1],
            }}
            transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut", times: [0, 0.33, 0.66, 1], delay: 0.05 }}
          />
          <circle cx="60" cy="80" r="2" fill="white" opacity="0.4" />
          <circle cx="210" cy="60" r="2" fill="white" opacity="0.4" />
          <circle cx="50" cy="160" r="1.5" fill="white" opacity="0.3" />
          <circle cx="220" cy="140" r="1.5" fill="white" opacity="0.3" />
        </svg>
      </motion.div>
    ),
  },
];

const particles = [...Array(35)].map((_, i) => ({
  size: i % 3 === 0 ? 3 : 2,
  color: i % 2 === 0 ? "#2a33f3" : "#6B8FF8",
  left: `${5 + (i * 5.8) % 90}%`,
  top: `${10 + (i * 13) % 80}%`,
  duration: 3 + (i % 4),
  delay: i * 0.35,
}));

const CODE_LINES = [
  { text: 'const studio = {', color: 'rgba(107,143,248,0.9)' },
  { text: '  name: ', color: 'rgba(255,255,255,0.4)', suffix: '"YEYE"', suffixColor: 'rgba(107,243,143,0.8)' },
  { text: '  quality: ', color: 'rgba(255,255,255,0.4)', suffix: '100', suffixColor: 'rgba(107,243,143,0.8)' },
  { text: '  deliver: ', color: 'rgba(255,255,255,0.4)', suffix: 'true', suffixColor: 'rgba(107,243,143,0.8)' },
  { text: '}', color: 'rgba(107,143,248,0.9)' },
];

const FULL_TEXT = CODE_LINES.map(l => l.text + (l.suffix || '')).join('\n');

function TerminalIllustration({ visible }: { visible: boolean }) {
  const [charIndex, setCharIndex] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (visible && !started) {
      setStarted(true);
      setCharIndex(0);
    }
    if (!visible) {
      setStarted(false);
      setCharIndex(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!started) return;
    if (charIndex >= FULL_TEXT.length) return;
    const timeout = setTimeout(() => {
      setCharIndex((c) => c + 1);
    }, 40);
    return () => clearTimeout(timeout);
  }, [started, charIndex]);

  // Build lines from charIndex
  let remaining = charIndex;
  const renderedLines = CODE_LINES.map((line) => {
    const full = line.text + (line.suffix || '');
    const visible_chars = Math.min(remaining, full.length);
    remaining = Math.max(0, remaining - full.length);
    const mainVisible = Math.min(visible_chars, line.text.length);
    const suffixVisible = Math.max(0, visible_chars - line.text.length);
    return {
      main: line.text.slice(0, mainVisible),
      mainColor: line.color,
      suffix: (line.suffix || '').slice(0, suffixVisible),
      suffixColor: line.suffixColor || '',
    };
  });

  const isDone = charIndex >= FULL_TEXT.length;

  return (
    <div style={{
      width: "260px",
      height: "200px",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid rgba(107,143,248,0.3)",
      backgroundColor: "rgba(10,10,10,0.9)",
      direction: "ltr",
    }}>
      {/* Chrome bar */}
      <div style={{
        height: "32px",
        backgroundColor: "rgba(42,51,243,0.15)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: "6px",
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#28c840" }} />
      </div>

      {/* Code */}
      <div style={{
        padding: "16px 16px",
        fontFamily: "monospace",
        fontSize: "10px",
        lineHeight: "1.7",
        display: "flex",
        flexDirection: "column",
      }}>
        {renderedLines.map((line, i) => (
          <div key={i}>
            <span style={{ color: line.mainColor }}>{line.main}</span>
            {line.suffix && <span style={{ color: line.suffixColor }}>{line.suffix}</span>}
          </div>
        ))}
        {/* Blinking cursor */}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, times: [0, 0.5, 0.5], ease: "linear" }}
          style={{
            display: "inline-block",
            width: "8px",
            height: "14px",
            backgroundColor: "#6B8FF8",
            borderRadius: "1px",
            marginTop: isDone ? "2px" : "0",
          }}
        />
      </div>
    </div>
  );
}

function StepSection({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const illustrationRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.8, 2.2, 2, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const rawGlow = useTransform(scrollYProgress, [0.7, 0.85, 1], [0, 0.9, 0]);
  const glowOpacity = useSpring(rawGlow, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.6 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: index + 1,
      }}
    >

      {/* Transition glow - peaks when entering/leaving */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(42,51,243,0.25) 0%, transparent 60%)",
          filter: "blur(60px)",
          opacity: useTransform(scrollYProgress, [0, 0.15, 0.5, 0.85, 1], [0.8, 0, 0, 0, 0.8]),
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(42,51,243,0.5) 0%, rgba(107,143,248,0.2) 40%, transparent 70%)",
          filter: "blur(60px)",
          opacity: glowOpacity,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            opacity: [0.15, 0.45, 0.15],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
          style={{
            position: "absolute",
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            backgroundColor: p.color,
            left: p.left,
            top: p.top,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      <div style={{
        maxWidth: "1100px",
        width: "100%",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: "260px",
        direction: index % 2 === 0 ? "rtl" : "ltr",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Text */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px", textAlign: "right", direction: "rtl" }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontSize: "80px",
              fontWeight: 800,
              color: "rgba(42,51,243,0.15)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            {step.number}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 30 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontFamily: "'GoogleSans', Arial, sans-serif",
              fontWeight: 700,
              fontSize: "48px",
              color: "white",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginTop: "-16px",
            }}
          >
            {step.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontFamily: "Assistant, Arial, sans-serif",
              fontWeight: 400,
              fontSize: "19px",
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.85,
              maxWidth: "480px",
            }}
          >
            {step.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: "flex", gap: "8px" }}
          >
            {steps.map((_, j) => (
              <div key={j} style={{
                width: j === index ? "24px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: j === index ? "#2a33f3" : "rgba(255,255,255,0.15)",
                transition: "all 0.3s ease",
              }} />
            ))}
          </motion.div>
        </div>

        {/* Illustration — scale driven by scroll */}
        <div
          ref={illustrationRef}
          style={{
            flexShrink: 0,
            width: "320px",
            height: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle, rgba(42,51,243,0.15) 0%, transparent 70%)",
            filter: "blur(20px)",
          }} />
          <motion.div
            style={{
              position: "relative",
              zIndex: 1,
              scale,
              opacity,
            }}
          >
            {index === 2 ? (
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div style={{ transform: "scale(0.75)", transformOrigin: "center center" }}>
                  <TerminalIllustration visible={visible} />
                </div>
              </motion.div>
            ) : index === 3 ? (
              <motion.div
                initial={{ y: 300, opacity: 0 }}
                animate={visible ? { y: 0, opacity: 1 } : { y: 300, opacity: 0 }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              >
                {typeof step.illustration === "function" ? step.illustration(visible) : step.illustration}
              </motion.div>
            ) : typeof step.illustration === "function" ? step.illustration(visible) : step.illustration}
          </motion.div>
        </div>
      </div>

    </div>
  );
}

export default function ProcessSection() {
  return (
    <section id="process" style={{ position: "relative" }}>
      {/* Title */}
      <div style={{
        textAlign: "center",
        padding: "80px 24px 0",
        position: "relative",
        zIndex: 10,
      }}>
        <h2 style={{
          fontFamily: "'GoogleSans', Arial, sans-serif",
          fontWeight: 700,
          fontSize: "34px",
          color: "white",
          marginBottom: "16px",
        }}>
          איך אנחנו עובדים?
        </h2>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "80px" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #2a33f3, #6B8FF8)",
            borderRadius: "2px",
            margin: "0 auto",
            overflow: "hidden",
          }}
        />
      </div>
      {steps.map((step, i) => (
        <StepSection key={step.number} step={step} index={i} />
      ))}
    </section>
  );
}
