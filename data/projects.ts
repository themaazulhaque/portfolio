export type Project = {
  num: string;
  slug: string;
  cat: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  coverImage: string;
  client: string;
  year: string;
  role: string;
  stack: string;
  techStack: string[];
  liveUrl: string | null;
  githubUrl?: string;
  documentationUrl?: string;
  figmaUrl?: string;
  casePdfUrl?: string;
  overview: string[];
  challenge: string[];
  solution: string[];
  process: { step: string; title: string; desc: string }[];
  gallery: string[];
  results: { metric: string; label: string }[];
  additionalLinks?: { label: string; url: string }[];
};

export const PROJECTS: Project[] = [
  {
    num: "01",
    slug: "aether",
    cat: "AI Product",
    title: "Aether",
    subtitle: "A quiet intelligence layer for scattered workflows",
    desc: "A platform that turns scattered workflows into one quiet intelligence layer.",
    image: "/frames/ezgif-frame-090.jpg",
    coverImage: "/frames/ezgif-frame-090.jpg",
    client: "Aether Intelligence Labs",
    year: "2025",
    role: "Lead Full-Stack & AI Engineer",
    stack: "Full-Stack · AI",
    techStack: ["Next.js 16", "TypeScript", "GSAP ScrollTrigger", "Python", "FastAPI", "OpenAI API", "Tailwind CSS v4", "PostgreSQL", "Redis"],
    liveUrl: null, // Deployed live demo URL or null if pending deployment
    githubUrl: "https://github.com/maazul/aether-platform",
    overview: [
      "Aether was conceived to address context fragmentation across modern enterprise tools. Knowledge workers constantly context-switch between communications, project management, code, and documentation.",
      "By engineering a zero-friction intelligence layer that operates silently in the background, Aether synthesizes cross-platform state into actionable real-time insights without requiring manual input."
    ],
    challenge: [
      "Aggregating streaming data from multi-vendor APIs while maintaining sub-50ms latency required a fundamental rework of dynamic synchronization models.",
      "Preventing state drift across concurrent client sessions required a hyper-optimized web socket protocol combined with client-side state prediction."
    ],
    solution: [
      "Engineered an asynchronous event pipeline utilizing FastAPI, Redis Pub/Sub, and dynamic worker pools capable of handling 50,000 events/second.",
      "Implemented a custom GSAP canvas rendering architecture for data visualization, maintaining a consistent 60 FPS even during high-frequency data surges."
    ],
    process: [
      { step: "01", title: "Discovery & Domain Modeling", desc: "Mapped cross-tool workflow dependencies and user context-switching friction points." },
      { step: "02", title: "Architecture & Data Pipeline", desc: "Designed asynchronous event streams with Redis and PostgreSQL time-series partitioning." },
      { step: "03", title: "Real-time UI & Canvas Engine", desc: "Crafted zero-latency GSAP canvas components with offscreen worker rendering." },
      { step: "04", title: "Deployment & Benchmarking", desc: "Deployed to global edge clusters achieving 99.99% availability and < 40ms average response." }
    ],
    gallery: [
      "/frames/ezgif-frame-090.jpg",
      "/frames/ezgif-frame-120.jpg",
      "/frames/ezgif-frame-150.jpg",
      "/frames/ezgif-frame-180.jpg"
    ],
    results: [
      { metric: "99.99%", label: "Platform Uptime" },
      { metric: "< 42ms", label: "Global Edge Latency" },
      { metric: "60 FPS", label: "Render Performance" },
      { metric: "4.8x", label: "Workflow Efficiency Increase" }
    ]
  },
  {
    num: "02",
    slug: "monolith",
    cat: "UI Engineering",
    title: "Monolith",
    subtitle: "A unified design system harmonizing 100+ micro-frontends",
    desc: "A design system that made a hundred screens feel like one product.",
    image: "/frames/ezgif-frame-180.jpg",
    coverImage: "/frames/ezgif-frame-180.jpg",
    client: "Monolith Systems",
    year: "2025",
    role: "Principal Systems Engineer",
    stack: "Design Systems · Micro-frontends",
    techStack: ["React 19", "TypeScript", "Tailwind CSS v4", "Storybook", "Framer Motion", "Turborepo", "Web Components"],
    liveUrl: null, // Deployed live demo URL or null if pending deployment
    githubUrl: "https://github.com/maazul/monolith-design-system",
    overview: [
      "Monolith transformed a fractured enterprise software ecosystem consisting of over 100 independently deployed micro-apps into a unified visual experience.",
      "Through centralized token architecture, accessibility-first component primitives, and automated regression testing, Monolith reduced frontend development cycles by 60%."
    ],
    challenge: [
      "Enforcing strict visual consistency across legacy codebases written in different frameworks without breaking backwards compatibility.",
      "Achieving sub-10kb bundle sizes for core component bundles while supporting complex interactive states and animations."
    ],
    solution: [
      "Built framework-agnostic core primitives using Web Components wrapped in lightweight React 19 adapters.",
      "Implemented automated CSS token compilation with zero runtime overhead using modern CSS custom property variables."
    ],
    process: [
      { step: "01", title: "Audit & Token Taxonomy", desc: "Extracted and consolidated over 400 disparate color, typography, and spacing variables." },
      { step: "02", title: "Core Primitive Architecture", desc: "Constructed accessible, keyboard-navigable component primitives with 100% test coverage." },
      { step: "03", title: "Migration Tooling & Automation", desc: "Developed AST transformation scripts that auto-upgraded legacy views across 80+ repos." },
      { step: "04", title: "Design-to-Code Sync", desc: "Established bidirectional Figma API synchronization for instant token updates." }
    ],
    gallery: [
      "/frames/ezgif-frame-180.jpg",
      "/frames/ezgif-frame-200.jpg",
      "/frames/ezgif-frame-220.jpg",
      "/frames/ezgif-frame-240.jpg"
    ],
    results: [
      { metric: "60%", label: "Dev Cycle Reduction" },
      { metric: "< 8.5 KB", label: "Core Gzipped Bundle" },
      { metric: "100%", label: "WCAG 2.1 AA Compliance" },
      { metric: "120+", label: "Synchronized Apps" }
    ]
  },
  {
    num: "03",
    slug: "orbit",
    cat: "Realtime Analytics",
    title: "Orbit",
    subtitle: "Millisecond financial decision-making console",
    desc: "A live analytics console built for millisecond decision-making.",
    image: "/frames/ezgif-frame-210.jpg",
    coverImage: "/frames/ezgif-frame-210.jpg",
    client: "Orbit Financial Labs",
    year: "2024",
    role: "Lead Frontend Architect",
    stack: "Backend · API · Realtime",
    techStack: ["Next.js", "TypeScript", "WebSockets", "WebAssembly", "Canvas 2D", "GSAP", "Tailwind CSS", "Rust"],
    liveUrl: null, // Deployed live demo URL or null if pending deployment
    githubUrl: "https://github.com/maazul/orbit-realtime",
    overview: [
      "Orbit is a high-frequency trading and risk analytics console engineered for financial institutional users requiring real-time market data visualizer updates.",
      "The platform renders millions of streaming ticks concurrently using WebGL/Canvas rendering without micro-stutters or frame drops."
    ],
    challenge: [
      "DOM nodes choked when rendering 10,000+ real-time tick updates per second across 16 grid widgets.",
      "Managing garbage collection pauses that caused intermittent visual lag during active trading hours."
    ],
    solution: [
      "Replaced traditional DOM elements with zero-allocation Canvas2D and WebAssembly data processors.",
      "Implemented double-buffered render targets ensuring continuous 60 FPS output even under peak market volatility."
    ],
    process: [
      { step: "01", title: "Tick Pipeline Design", desc: "Engineered binary WebSocket protocol using Protocol Buffers for maximum throughput." },
      { step: "02", title: "Wasm Data Engine", desc: "Compiled financial metric calculations to WebAssembly for sub-millisecond execution." },
      { step: "03", title: "Canvas Grid Renderer", desc: "Created custom hardware-accelerated grid component supporting smooth zoom and pan." },
      { step: "04", title: "Stress Testing", desc: "Simulated 500k ticks/sec to prove zero-lag stability under extreme market conditions." }
    ],
    gallery: [
      "/frames/ezgif-frame-210.jpg",
      "/frames/ezgif-frame-230.jpg",
      "/frames/ezgif-frame-250.jpg",
      "/frames/ezgif-frame-270.jpg"
    ],
    results: [
      { metric: "< 5ms", label: "Data-to-Screen Latency" },
      { metric: "60 FPS", label: "Continuous Frame Rate" },
      { metric: "500k", label: "Ticks Handled / Sec" },
      { metric: "0", label: "Frame Drops During Spikes" }
    ]
  },
  {
    num: "04",
    slug: "halcyon",
    cat: "Luxury Commerce",
    title: "Halcyon",
    subtitle: "High-conversion minimalist digital flagship",
    desc: "A commerce experience engineered for speed, calm, and conversion.",
    image: "/frames/ezgif-frame-240.jpg",
    coverImage: "/frames/ezgif-frame-240.jpg",
    client: "Halcyon Luxury Group",
    year: "2023",
    role: "Lead Creative Technologist",
    stack: "Frontend · Motion · E-Commerce",
    techStack: ["Next.js", "TypeScript", "Shopify Storefront API", "GSAP ScrollTrigger", "Three.js", "Tailwind CSS"],
    liveUrl: null, // Deployed live demo URL or null if pending deployment
    githubUrl: "https://github.com/maazul/halcyon-commerce",
    overview: [
      "Halcyon redefines editorial e-commerce by fusing cinematic scroll interactions, 3D product previews, and instant checkout flows.",
      "Built for a high-end luxury brand, the storefront blends editorial photography with buttery fluid animations to create a serene, premium shopping journey."
    ],
    challenge: [
      "High-resolution image and 3D asset loads threatened core web vitals and mobile page speed scores.",
      "Preserving seamless page transitions and cart state persistence without full page reloads."
    ],
    solution: [
      "Implemented progressive WebP/AVIF asset streaming with intelligent viewport preloading.",
      "Architected headless Shopify integration with Next.js App Router for sub-second page transitions."
    ],
    process: [
      { step: "01", title: "Editorial Concept & Storyboard", desc: "Designed fluid page-turn animations and typography layout hierarchies." },
      { step: "02", title: "Headless Commerce Pipeline", desc: "Integrated GraphQL Storefront API with optimistic UI updates for instant cart actions." },
      { step: "03", title: "3D Product Viewer Engine", desc: "Developed interactive Three.js 3D asset viewports with physical material lighting." },
      { step: "04", title: "Vitals & Conversion Tuning", desc: "Optimized bundle sizes to achieve 98+ Lighthouse scores across all metrics." }
    ],
    gallery: [
      "/frames/ezgif-frame-240.jpg",
      "/frames/ezgif-frame-260.jpg",
      "/frames/ezgif-frame-280.jpg",
      "/frames/ezgif-frame-300.jpg"
    ],
    results: [
      { metric: "99/100", label: "Lighthouse Performance" },
      { metric: "+45%", label: "Conversion Rate Increase" },
      { metric: "0.6s", label: "Average Page Load Time" },
      { metric: "3.2x", label: "Average Session Duration" }
    ]
  }
];

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function getNextProject(currentSlug: string): Project {
  const index = PROJECTS.findIndex((p) => p.slug === currentSlug);
  if (index === -1 || index === PROJECTS.length - 1) {
    return PROJECTS[0];
  }
  return PROJECTS[index + 1];
}

export function getPrevProject(currentSlug: string): Project {
  const index = PROJECTS.findIndex((p) => p.slug === currentSlug);
  if (index <= 0) {
    return PROJECTS[PROJECTS.length - 1];
  }
  return PROJECTS[index - 1];
}
