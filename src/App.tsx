import { useEffect, useMemo, useState } from "react";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import { Calendar, Palette } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";

import { DashboardView } from "./components/DashboardView";
import { GanttView } from "./components/GanttView";
import { OwnerView } from "./components/OwnerView";
import { ProgressManager } from "./components/ProgressManager";
import { FilterPanel } from "./components/FilterPanel";
import { ExportDialog } from "./components/ExportDialog";
import { ColorSettingsDialog } from "./components/ColorSettingsDialog";
import { CountdownTracker } from "./components/CountdownTracker";

// Utility: date helpers
const toDate = (s: string) => new Date(s);
const daysBetween = (a: string, b: string) =>
  Math.round(
    (toDate(b).getTime() - toDate(a).getTime()) /
      (1000 * 60 * 60 * 24),
  );

// Owner-based color mapping (distinct from status colors)
export const ownerColors: Record<string, string> = {
  Leadership: "#7c3aed", // Deep Purple (violet-600)
  Marketing: "#f59e0b", // Amber/Orange (amber-500)
  Design: "#ec4899", // Pink (pink-500)
  Product: "#06b6d4", // Cyan/Teal (cyan-500)
};

// Default category colors for task types
export const defaultCategoryColors: Record<string, string> = {
  website: "#6366f1", // Indigo (indigo-500)
  tradeshow: "#eab308", // Yellow (yellow-500)
  templates: "#10b981", // Emerald/Green (emerald-500)
  "visual-assets": "#8b5cf6", // Purple (violet-500)
};

export const categoryLabels: Record<string, string> = {
  website: "Website",
  tradeshow: "Tradeshow",
  templates: "Templates",
  "visual-assets": "Visual Assets",
};

// Status colors (distinct from owner colors)
export const statusColors = {
  completed: "#10b981", // Green (emerald-500)
  "in-progress": "#3b82f6", // Blue (blue-500)
  "not-started": "#6b7280", // Gray (gray-500)
  overdue: "#ef4444", // Red (red-500)
};

// Timeline bounds
const KICKOFF = "2025-11-10"; // Next Monday from Nov 7, 2025
const SOFT_READY = "2026-03-30";
const LEDUCATION = "2026-04-14";
const END = "2026-12-10"; // 13 months from kickoff

// Subtask definitions with weights and descriptions
const subtaskDefinitions: Record<
  string,
  Array<{
    id: string;
    label: string;
    weight: number;
    description: string;
  }>
> = {
  foundations: [
    {
      id: "mission",
      label: "Mission Statement",
      weight: 0.25,
      description:
        "Define company purpose and reason for existence",
    },
    {
      id: "vision",
      label: "Vision Statement",
      weight: 0.25,
      description:
        "Articulate long-term aspirations and future state",
    },
    {
      id: "values",
      label: "Core Values",
      weight: 0.2,
      description:
        "Establish fundamental beliefs and operating principles",
    },
    {
      id: "positioning",
      label: "Brand Positioning",
      weight: 0.2,
      description:
        "Define unique market position and competitive differentiation",
    },
    {
      id: "messages",
      label: "Key Messages",
      weight: 0.1,
      description:
        "Craft primary communication themes and talking points",
    },
  ],
  verbal: [
    {
      id: "pillars",
      label: "Brand Pillars",
      weight: 0.3,
      description:
        "Define core brand attributes and personality traits",
    },
    {
      id: "tagline",
      label: "Tagline",
      weight: 0.15,
      description: "Create memorable brand tagline",
    },
    {
      id: "elevator",
      label: "Elevator Pitch",
      weight: 0.2,
      description: "Develop concise 30-second brand pitch",
    },
    {
      id: "boilerplate",
      label: "Boilerplate Copy",
      weight: 0.2,
      description:
        "Write standard company description for PR and media",
    },
    {
      id: "audience",
      label: "Audience Messaging",
      weight: 0.15,
      description: "Tailor messaging for key customer segments",
    },
  ],
  visual_guides: [
    {
      id: "logo",
      label: "Logo System",
      weight: 0.35,
      description:
        "Design primary and secondary logo variations with usage guidelines",
    },
    {
      id: "color",
      label: "Color Palette",
      weight: 0.25,
      description:
        "Define brand color system with primary, secondary, and accent colors",
    },
    {
      id: "typography",
      label: "Typography System",
      weight: 0.2,
      description:
        "Select and specify brand typefaces and hierarchy rules",
    },
    {
      id: "graphics",
      label: "Graphic Language",
      weight: 0.2,
      description:
        "Establish visual patterns, shapes, and graphic elements",
    },
  ],
  photo_guides: [
    {
      id: "standards",
      label: "Render Animations",
      weight: 0.3,
      description:
        "Create 3D product renders and animations showcasing key features and applications",
    },
    {
      id: "shoot_planning",
      label: "Photography Sourcing",
      weight: 0.2,
      description:
        "Select and contract professional photographers for brand imagery",
    },
    {
      id: "execution",
      label: "Photography Acquisition",
      weight: 0.3,
      description:
        "Purchase and license professional photography from selected photographers",
    },
    {
      id: "editing",
      label: "Image Processing",
      weight: 0.2,
      description:
        "Process and optimize acquired images to brand standards",
    },
  ],
  templates: [
    {
      id: "decks",
      label: "Presentation Decks",
      weight: 0.25,
      description:
        "Create PowerPoint/Keynote templates with branded layouts",
    },
    {
      id: "data_sheets",
      label: "Data Sheets",
      weight: 0.2,
      description: "Design product data sheet templates",
    },
    {
      id: "business_cards",
      label: "Business Cards",
      weight: 0.15,
      description:
        "Design business card layout and produce initial batch",
    },
    {
      id: "install_instr",
      label: "Installation Instructions",
      weight: 0.15,
      description:
        "Create branded installation guide templates",
    },
    {
      id: "letterhead",
      label: "Letterhead",
      weight: 0.1,
      description: "Design letterhead and stationery system",
    },
    {
      id: "email_sigs",
      label: "Email Signatures",
      weight: 0.15,
      description:
        "Create email signature templates for all staff",
    },
  ],
  social_templates: [
    {
      id: "instagram",
      label: "Instagram Templates",
      weight: 0.35,
      description: "Design Instagram post and story templates",
    },
    {
      id: "linkedin",
      label: "LinkedIn Templates",
      weight: 0.35,
      description: "Create LinkedIn post and article templates",
    },
    {
      id: "display_ads",
      label: "Display Ad Suite",
      weight: 0.3,
      description:
        "Design digital display ad templates in standard sizes",
    },
  ],
  product_id: [
    {
      id: "naming",
      label: "Naming Rules",
      weight: 0.5,
      description:
        "Establish product naming conventions and taxonomy",
    },
    {
      id: "architecture",
      label: "Line Architecture",
      weight: 0.5,
      description:
        "Define product line structure and family relationships",
    },
  ],
  literature: [
    {
      id: "spec_sheets",
      label: "Spec/Tear Sheets",
      weight: 0.3,
      description:
        "Design specification sheet templates for product lines",
    },
    {
      id: "tech_docs",
      label: "Technical Documentation",
      weight: 0.25,
      description:
        "Create technical documentation templates and guidelines",
    },
    {
      id: "brochures",
      label: "Family Brochures",
      weight: 0.25,
      description: "Design product family brochure templates",
    },
    {
      id: "labels",
      label: "Product Labels",
      weight: 0.2,
      description:
        "Design product label system and packaging inserts",
    },
  ],
  analytics: [
    {
      id: "ga_setup",
      label: "Google Analytics Setup",
      weight: 0.35,
      description:
        "Configure GA4 tracking and conversion events",
    },
    {
      id: "clarity_setup",
      label: "Clarity Setup",
      weight: 0.25,
      description:
        "Implement Microsoft Clarity for session recordings",
    },
    {
      id: "kpi_dashboard",
      label: "KPI Dashboard",
      weight: 0.4,
      description:
        "Build executive dashboard for key performance metrics",
    },
  ],
  trade_signage: [
    {
      id: "signage_design",
      label: "Signage Design",
      weight: 0.4,
      description:
        "Design booth signage, banners, and dimensional graphics",
    },
    {
      id: "postcards",
      label: "Postcards",
      weight: 0.3,
      description:
        "Create promotional postcards for booth distribution",
    },
    {
      id: "swag",
      label: "Swag Items",
      weight: 0.3,
      description:
        "Source and design branded swag items for giveaways",
    },
  ],
  factory_env: [
    {
      id: "site_audit",
      label: "Site Audit",
      weight: 0.2,
      description:
        "Survey factory spaces and identify branding opportunities",
    },
    {
      id: "design_concepts",
      label: "Design Concepts",
      weight: 0.3,
      description:
        "Develop environmental graphics concepts for factory spaces",
    },
    {
      id: "production",
      label: "Production",
      weight: 0.3,
      description:
        "Fabricate and produce environmental graphics elements",
    },
    {
      id: "installation",
      label: "Installation",
      weight: 0.2,
      description: "Install graphics in factory locations",
    },
  ],
  soft_launch_prep: [
    {
      id: "qa",
      label: "Quality Assurance",
      weight: 0.3,
      description:
        "Final testing and review of all deliverables",
    },
    {
      id: "approvals",
      label: "Final Approvals",
      weight: 0.2,
      description:
        "Secure stakeholder sign-off on launch materials",
    },
    {
      id: "press_list",
      label: "Press List",
      weight: 0.15,
      description:
        "Compile media contacts and PR distribution list",
    },
    {
      id: "email_plan",
      label: "Email Campaign Plan",
      weight: 0.2,
      description:
        "Plan announcement email sequence and content",
    },
    {
      id: "social_plan",
      label: "Social Media Plan",
      weight: 0.15,
      description:
        "Schedule launch social media content calendar",
    },
  ],
  booth_design: [
    {
      id: "concept",
      label: "Booth Concept",
      weight: 0.3,
      description:
        "Develop booth design concepts and 3D renderings",
    },
    {
      id: "approval",
      label: "Design Approval",
      weight: 0.2,
      description:
        "Present concepts and secure stakeholder approval",
    },
    {
      id: "specs",
      label: "Technical Specs",
      weight: 0.25,
      description:
        "Create detailed technical drawings and specifications",
    },
    {
      id: "graphics",
      label: "Graphics Production",
      weight: 0.25,
      description:
        "Design and produce all booth graphics and signage",
    },
  ],
  booth_engineer: [
    {
      id: "rfp",
      label: "RFP Development",
      weight: 0.25,
      description:
        "Create request for proposal package for vendors",
    },
    {
      id: "vendor_review",
      label: "Vendor Review",
      weight: 0.25,
      description: "Evaluate and compare vendor bids",
    },
    {
      id: "selection",
      label: "Vendor Selection",
      weight: 0.2,
      description:
        "Select fabrication vendor and finalize contract",
    },
    {
      id: "engineering",
      label: "Engineering Review",
      weight: 0.3,
      description:
        "Review structural engineering and safety requirements",
    },
  ],
  booth_fab: [
    {
      id: "fabrication",
      label: "Booth Fabrication",
      weight: 0.5,
      description:
        "Vendor fabricates booth structure and components",
    },
    {
      id: "graphics_print",
      label: "Graphics Printing",
      weight: 0.25,
      description: "Print and mount all booth graphics",
    },
    {
      id: "qa_review",
      label: "QA Review",
      weight: 0.25,
      description: "Inspect completed booth before shipping",
    },
  ],
  booth_ship: [
    {
      id: "logistics",
      label: "Logistics Coordination",
      weight: 0.3,
      description: "Coordinate shipping and drayage to show",
    },
    {
      id: "i_and_d",
      label: "I&D Scheduling",
      weight: 0.2,
      description: "Schedule installation and dismantle crews",
    },
    {
      id: "install",
      label: "Booth Installation",
      weight: 0.3,
      description: "On-site booth setup and installation",
    },
    {
      id: "final_qa",
      label: "Final QA",
      weight: 0.2,
      description:
        "Final walkthrough and quality check before show opens",
    },
  ],
  web_discovery: [
    {
      id: "stakeholder_interviews",
      label: "Stakeholder Interviews",
      weight: 0.25,
      description:
        "Interview key stakeholders to gather requirements",
    },
    {
      id: "competitor_analysis",
      label: "Competitor Analysis",
      weight: 0.2,
      description:
        "Analyze competitor websites and industry best practices",
    },
    {
      id: "user_personas",
      label: "User Personas",
      weight: 0.15,
      description:
        "Define target user personas and user journeys",
    },
    {
      id: "site_architecture",
      label: "Site Architecture",
      weight: 0.25,
      description:
        "Define sitemap and information architecture",
    },
    {
      id: "requirements_doc",
      label: "Requirements Documentation",
      weight: 0.15,
      description:
        "Document functional and technical requirements",
    },
  ],
  web_ui: [
    {
      id: "design_system",
      label: "Design System",
      weight: 0.3,
      description:
        "Create UI component library and design tokens",
    },
    {
      id: "page_templates",
      label: "Page Templates",
      weight: 0.35,
      description:
        "Design key page templates (home, product, contact, etc.)",
    },
    {
      id: "responsive_design",
      label: "Responsive Design",
      weight: 0.2,
      description:
        "Ensure mobile and tablet responsive layouts",
    },
    {
      id: "prototype",
      label: "Interactive Prototype",
      weight: 0.15,
      description:
        "Build clickable prototype for stakeholder review",
    },
  ],
  cms_build: [
    {
      id: "cms_selection",
      label: "CMS Selection",
      weight: 0.15,
      description:
        "Select and configure content management system",
    },
    {
      id: "product_schema",
      label: "Product Schema",
      weight: 0.25,
      description:
        "Build product data structure and custom fields",
    },
    {
      id: "frontend_dev",
      label: "Frontend Development",
      weight: 0.35,
      description:
        "Code website frontend from approved designs",
    },
    {
      id: "integrations",
      label: "Third-party Integrations",
      weight: 0.25,
      description:
        "Integrate forms, analytics, and other tools",
    },
  ],
  content_load: [
    {
      id: "content_audit",
      label: "Content Audit",
      weight: 0.2,
      description: "Audit existing content and identify gaps",
    },
    {
      id: "copywriting",
      label: "Copywriting",
      weight: 0.3,
      description:
        "Write new web copy aligned with brand voice",
    },
    {
      id: "product_entry",
      label: "Product Entry",
      weight: 0.3,
      description: "Enter all product data into CMS",
    },
    {
      id: "media_optimization",
      label: "Media Optimization",
      weight: 0.2,
      description: "Optimize and upload images and videos",
    },
  ],
  qa_launch: [
    {
      id: "functional_testing",
      label: "Functional Testing",
      weight: 0.3,
      description: "Test all website functionality and forms",
    },
    {
      id: "browser_testing",
      label: "Cross-browser Testing",
      weight: 0.2,
      description: "Test across browsers and devices",
    },
    {
      id: "performance",
      label: "Performance Optimization",
      weight: 0.25,
      description: "Optimize page speed and Core Web Vitals",
    },
    {
      id: "seo_setup",
      label: "SEO Setup",
      weight: 0.25,
      description:
        "Configure meta tags, schema markup, and redirects",
    },
  ],
};

// Shared tracks (only web scope changes between versions)
const sharedTracks = [
  {
    id: "foundations",
    label: "Brand Foundations",
    start: "2025-11-10",
    end: "2025-12-22",
    owner: "Leadership",
  },
  {
    id: "verbal",
    label: "Verbal Identity",
    start: "2025-11-24",
    end: "2026-01-09",
    owner: "Marketing",
  },
  {
    id: "visual_guides",
    label: "Visual Identity",
    start: "2025-12-01",
    end: "2026-01-23",
    owner: "Design",
    category: "visual-assets" as const,
  },
  {
    id: "photo_guides",
    label: "Render Animations + Photography Acquisition",
    start: "2025-12-08",
    end: "2026-02-07",
    owner: "Design",
    category: "visual-assets" as const,
  },
  {
    id: "templates",
    label: "Core Templates",
    start: "2026-01-05",
    end: "2026-02-21",
    owner: "Design",
    category: "templates" as const,
  },
  {
    id: "social_templates",
    label: "Social & Digital Ad Templates",
    start: "2026-01-12",
    end: "2026-02-28",
    owner: "Marketing",
    category: "templates" as const,
  },
  {
    id: "product_id",
    label: "Product Identity",
    start: "2025-12-15",
    end: "2026-02-07",
    owner: "Product",
  },
  {
    id: "literature",
    label: "Product Literature",
    start: "2026-01-12",
    end: "2026-03-25",
    owner: "Product",
    category: "templates" as const,
  },
  {
    id: "analytics",
    label: "Analytics & KPI Dashboard",
    start: "2026-02-01",
    end: "2026-03-10",
    owner: "Marketing",
  },
  {
    id: "trade_signage",
    label: "Tradeshow Materials",
    start: "2026-02-10",
    end: "2026-03-25",
    owner: "Marketing",
    category: "tradeshow" as const,
  },
  {
    id: "factory_env",
    label: "Factory Environmental Graphics (Phase 1)",
    start: "2026-05-01",
    end: "2026-07-15",
    owner: "Design",
  },
  {
    id: "soft_launch_prep",
    label: "Soft Launch Readiness",
    start: "2026-03-10",
    end: "2026-03-30",
    owner: "Leadership",
  },
  {
    id: "leducation",
    label: "LEDucation NYC — Booth Live",
    start: "2026-04-14",
    end: "2026-04-14",
    owner: "Marketing",
    category: "tradeshow" as const,
  },

  // Post-launch optimization & expansion (Apr-Dec 2026)
  {
    id: "post_launch_review",
    label: "Post-launch Review & Optimization",
    start: "2026-04-15",
    end: "2026-05-15",
    owner: "Leadership",
  },
  {
    id: "content_expansion",
    label: "Content Library Expansion",
    start: "2026-05-01",
    end: "2026-08-31",
    owner: "Marketing",
  },
  {
    id: "photo_shoot_2",
    label: "Additional Photography Acquisition",
    start: "2026-05-15",
    end: "2026-07-15",
    owner: "Design",
    category: "visual-assets" as const,
  },
  {
    id: "video_production",
    label: "Brand Video Series Production",
    start: "2026-06-01",
    end: "2026-09-30",
    owner: "Marketing",
    category: "visual-assets" as const,
  },
  {
    id: "packaging_design",
    label: "Sample Case Redesign",
    start: "2026-05-01",
    end: "2026-08-15",
    owner: "Product",
  },
  {
    id: "dealer_portal",
    label: "Dealer Portal Development",
    start: "2026-06-15",
    end: "2026-10-31",
    owner: "Product",
  },
  {
    id: "international_adapt",
    label: "International Market Adaptations",
    start: "2026-07-01",
    end: "2026-10-15",
    owner: "Product",
  },
  {
    id: "lightfair",
    label: "Lightfair Tradeshow Prep",
    start: "2026-08-01",
    end: "2026-10-31",
    owner: "Marketing",
    category: "tradeshow" as const,
  },
  {
    id: "factory_env_2",
    label: "Factory Graphics Phase 2",
    start: "2026-10-01",
    end: "2026-12-10",
    owner: "Design",
  },
  {
    id: "brand_guidelines_v2",
    label: "Brand Guidelines v2",
    start: "2026-09-15",
    end: "2026-11-15",
    owner: "Design",
  },
  {
    id: "seo_content_opt",
    label: "SEO & Content Optimization",
    start: "2026-05-01",
    end: "2026-12-10",
    owner: "Marketing",
    category: "website" as const,
  },
  {
    id: "social_campaign_q3",
    label: "Q3 Social Media Campaigns",
    start: "2026-07-01",
    end: "2026-09-30",
    owner: "Marketing",
  },
  {
    id: "social_campaign_q4",
    label: "Q4 Social Media Campaigns",
    start: "2026-10-01",
    end: "2026-12-10",
    owner: "Marketing",
  },
  {
    id: "year_end_review",
    label: "Year-End Review & 2027 Roadmap",
    start: "2026-11-15",
    end: "2026-12-10",
    owner: "Leadership",
  },
];

// Tradeshow booth track
const tradeshowBooth = [
  {
    id: "booth_design",
    label: "Tradeshow Booth — Concept & Design",
    start: "2025-12-01",
    end: "2026-01-20",
    owner: "Design",
    category: "tradeshow" as const,
  },
  {
    id: "booth_engineer",
    label: "Booth Engineering & Vendor Bids",
    start: "2026-01-15",
    end: "2026-02-15",
    owner: "Marketing",
    category: "tradeshow" as const,
  },
  {
    id: "booth_fab",
    label: "Fabrication & Graphics Production",
    start: "2026-02-10",
    end: "2026-03-29",
    owner: "Marketing",
    category: "tradeshow" as const,
  },
  {
    id: "booth_ship",
    label: "Ship to Show / Install",
    start: "2026-03-30",
    end: "2026-04-13",
    owner: "Marketing",
    category: "tradeshow" as const,
  },
];

// Website tracks - Full Website Relaunch
const websiteTracks = [
  {
    id: "web_discovery",
    label: "Website Discovery",
    start: "2025-12-15",
    end: "2026-01-10",
    owner: "Product",
    category: "website" as const,
  },
  {
    id: "web_ui",
    label: "UI Design System + Templates",
    start: "2026-01-05",
    end: "2026-02-05",
    owner: "Design",
    category: "website" as const,
  },
  {
    id: "cms_build",
    label: "CMS Build + Product Schema",
    start: "2026-01-20",
    end: "2026-03-10",
    owner: "Product",
    category: "website" as const,
  },
  {
    id: "content_load",
    label: "Content Loading",
    start: "2026-02-10",
    end: "2026-03-20",
    owner: "Marketing",
    category: "website" as const,
  },
  {
    id: "qa_launch",
    label: "QA & Performance Testing",
    start: "2026-03-10",
    end: "2026-03-28",
    owner: "Product",
    category: "website" as const,
  },
  {
    id: "go_live",
    label: "Go Live (Soft Launch)",
    start: "2026-03-30",
    end: "2026-03-30",
    owner: "Leadership",
    category: "website" as const,
  },

  // Post-launch web enhancements
  {
    id: "web_monitoring",
    label: "Website Performance Monitoring",
    start: "2026-04-01",
    end: "2026-12-10",
    owner: "Marketing",
    category: "website" as const,
  },
  {
    id: "web_international",
    label: "Multi-language Expansion",
    start: "2026-09-01",
    end: "2026-11-30",
    owner: "Product",
    category: "website" as const,
  },
  {
    id: "web_features_q2",
    label: "Feature Additions Q3-Q4",
    start: "2026-08-01",
    end: "2026-10-31",
    owner: "Product",
    category: "website" as const,
  },
];

// Build chart rows from tasks
function buildRows(tasks: typeof sharedTracks) {
  const minStart = KICKOFF;
  return tasks.map((t) => {
    const offset = Math.max(0, daysBetween(minStart, t.start));
    const length = Math.max(1, daysBetween(t.start, t.end));
    return { ...t, offset, length };
  });
}

// Compose all tasks
const allProjectTasks = [
  ...sharedTracks,
  ...tradeshowBooth,
  ...websiteTracks,
];

const milestones = [
  { date: "2025-12-22", label: "Brand Foundations Complete" },
  { date: SOFT_READY, label: "Soft Launch Ready" },
  { date: LEDUCATION, label: "LEDucation NYC" },
  { date: "2026-06-01", label: "Q2 Content Expansion Launch" },
  { date: "2026-09-01", label: "Q3 Campaigns Begin" },
  { date: "2026-11-01", label: "Lightfair Prep" },
  { date: END, label: "Year-End Review" },
];

export default function App() {
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Category colors - customizable by user
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('categoryColors');
    return saved ? JSON.parse(saved) : defaultCategoryColors;
  });

  // Color settings dialog
  const [isColorSettingsOpen, setIsColorSettingsOpen] = useState(false);

  // Task overrides for custom dates, owners, and labels
  const [taskOverrides, setTaskOverrides] = useState<
    Record<string, { start?: string; end?: string; owner?: string; label?: string }>
  >({});

  // Custom tasks created by user
  const [customTasks, setCustomTasks] = useState<
    Array<{ id: string; label: string; start: string; end: string; owner: string; category?: string }>
  >([]);

  // Deleted task IDs
  const [deletedTaskIds, setDeletedTaskIds] = useState<Set<string>>(new Set());

  // Save category colors to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('categoryColors', JSON.stringify(categoryColors));
  }, [categoryColors]);

  // Update a single category color
  const updateCategoryColor = (category: string, color: string) => {
    setCategoryColors(prev => ({
      ...prev,
      [category]: color
    }));
  };

  // Reset category colors to defaults
  const resetCategoryColors = () => {
    setCategoryColors(defaultCategoryColors);
    toast.success('Category colors reset to defaults');
  };

  // Track which subtasks are completed (taskId: { subtaskId: boolean })
  const [subtaskProgress, setSubtaskProgress] = useState<
    Record<string, Record<string, boolean>>
  >(() => {
    const saved = localStorage.getItem('subtaskProgress');
    if (saved) {
      return JSON.parse(saved);
    }
    // Initial sample data
    return {
      foundations: {
        mission: true,
        vision: false,
        values: false,
        positioning: false,
        messages: false,
      },
    };
  });

  // Save subtask progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('subtaskProgress', JSON.stringify(subtaskProgress));
  }, [subtaskProgress]);

  const allTasks = useMemo(() => {
    // Combine base tasks and custom tasks
    const combinedTasks = [...allProjectTasks, ...customTasks];
    
    // Apply task overrides and filter out deleted tasks
    const tasksWithOverrides = combinedTasks
      .filter((task) => !deletedTaskIds.has(task.id))
      .map((task) => {
        const override = taskOverrides[task.id];
        if (override) {
          return {
            ...task,
            start: override.start || task.start,
            end: override.end || task.end,
            owner: override.owner || task.owner,
            label: override.label || task.label,
          };
        }
        return task;
      });
    return buildRows(tasksWithOverrides);
  }, [taskOverrides, customTasks, deletedTaskIds]);

  // Calculate overall task progress based on weighted subtasks
  const progress = useMemo(() => {
    const result: Record<string, number> = {};

    Object.keys(subtaskDefinitions).forEach((taskId) => {
      const subtasks = subtaskDefinitions[taskId];
      const completed = subtaskProgress[taskId] || {};

      let totalProgress = 0;
      subtasks.forEach((subtask) => {
        if (completed[subtask.id]) {
          totalProgress += subtask.weight * 100;
        }
      });

      result[taskId] = Math.round(totalProgress);
    });

    // For tasks without subtasks, keep at 0
    allTasks.forEach((task) => {
      if (!result[task.id]) {
        result[task.id] = 0;
      }
    });

    return result;
  }, [subtaskProgress, allTasks]);

  // Get unique owners for filter dropdown
  const uniqueOwners = useMemo(() => {
    const owners = new Set(allTasks.map((t) => t.owner));
    return Array.from(owners).sort();
  }, [allTasks]);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        task.label
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        task.owner
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Owner filter
      const matchesOwner =
        ownerFilter === "all" || task.owner === ownerFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const taskProgress = progress[task.id] || 0;
        const today = toDate(currentDate);
        const start = toDate(task.start);
        const end = toDate(task.end);

        if (statusFilter === "completed") {
          matchesStatus = taskProgress === 100;
        } else if (statusFilter === "in-progress") {
          matchesStatus =
            today >= start &&
            today <= end &&
            taskProgress < 100;
        } else if (statusFilter === "not-started") {
          matchesStatus = today < start;
        } else if (statusFilter === "overdue") {
          matchesStatus = today > end && taskProgress < 100;
        }
      }

      return matchesSearch && matchesOwner && matchesStatus;
    });
  }, [
    allTasks,
    searchTerm,
    ownerFilter,
    statusFilter,
    progress,
    currentDate,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setOwnerFilter("all");
    setStatusFilter("all");
  };

  const handleCreateTask = (taskData: {
    label: string;
    start: string;
    end: string;
    owner: string;
    category?: string;
  }) => {
    const newTask = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...taskData,
    };
    setCustomTasks((prev) => [...prev, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletedTaskIds((prev) => new Set([...prev, taskId]));
    // Also remove from task overrides and subtask progress
    setTaskOverrides((prev) => {
      const updated = { ...prev };
      delete updated[taskId];
      return updated;
    });
    setSubtaskProgress((prev) => {
      const updated = { ...prev };
      delete updated[taskId];
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster />

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Brand Rebuild Project Management
              </h1>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Kickoff:{" "}
                  {new Date(KICKOFF).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Soft Launch:{" "}
                  {new Date(SOFT_READY).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  LEDucation:{" "}
                  {new Date(LEDUCATION).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsColorSettingsOpen(true)}
                className="gap-2"
              >
                <Palette className="h-4 w-4" />
                Category Colors
              </Button>
              <ExportDialog
                tasks={allTasks}
                progress={progress}
                version="A"
              />
            </div>
          </div>

          <div className="flex gap-3 items-center justify-end">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border shadow-sm">
              <Calendar className="h-4 w-4 text-blue-500" />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="text-sm border-none outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5 h-auto p-1 bg-white shadow-sm border">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="gantt"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
            >
              Gantt Chart
            </TabsTrigger>
            <TabsTrigger
              value="countdown"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Countdown
            </TabsTrigger>
            <TabsTrigger
              value="by-owner"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
            >
              By Owner
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
            >
              Manage Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardView
              tasks={allTasks}
              progress={progress}
              currentDate={currentDate}
            />
          </TabsContent>

          <TabsContent value="gantt" className="space-y-4">
            <Card className="p-4 bg-white/80 backdrop-blur shadow-lg border-0">
              <FilterPanel
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                ownerFilter={ownerFilter}
                setOwnerFilter={setOwnerFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                owners={uniqueOwners}
                onReset={resetFilters}
              />
            </Card>

            {filteredTasks.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground bg-white/80 backdrop-blur shadow-lg border-0">
                No tasks match the current filters. Try
                adjusting your search criteria.
              </Card>
            ) : (
              <GanttView
                tasks={filteredTasks}
                progress={progress}
                kickoff={KICKOFF}
                endDate={END}
                currentDate={currentDate}
                milestones={milestones}
                categoryColors={categoryColors}
                onUpdateTask={(taskId, updates) => {
                  setTaskOverrides((prev) => ({
                    ...prev,
                    [taskId]: { ...prev[taskId], ...updates },
                  }));
                }}
                onCreateTask={handleCreateTask}
                onDeleteTask={handleDeleteTask}
                onResetTimelines={() => setTaskOverrides({})}
                hasOverrides={
                  Object.keys(taskOverrides).length > 0
                }
                subtaskDefinitions={subtaskDefinitions}
                subtaskProgress={subtaskProgress}
              />
            )}
          </TabsContent>

          <TabsContent value="countdown" className="space-y-4">
            <CountdownTracker 
              tasks={allTasks}
              currentDate={currentDate}
              progress={progress}
            />
          </TabsContent>

          <TabsContent value="by-owner" className="space-y-4">
            <Card className="p-4">
              <FilterPanel
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                ownerFilter={ownerFilter}
                setOwnerFilter={setOwnerFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                owners={uniqueOwners}
                onReset={resetFilters}
              />
            </Card>

            {filteredTasks.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No tasks match the current filters. Try
                adjusting your search criteria.
              </Card>
            ) : (
              <OwnerView
                tasks={filteredTasks}
                progress={progress}
                currentDate={currentDate}
              />
            )}
          </TabsContent>

          <TabsContent value="progress">
            <ProgressManager
              tasks={allTasks}
              progress={progress}
              subtaskProgress={subtaskProgress}
              setSubtaskProgress={setSubtaskProgress}
              subtaskDefinitions={subtaskDefinitions}
              currentDate={currentDate}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Color Settings Dialog */}
      <ColorSettingsDialog
        open={isColorSettingsOpen}
        onOpenChange={setIsColorSettingsOpen}
        categoryColors={categoryColors}
        onUpdateColor={updateCategoryColor}
        onResetColors={resetCategoryColors}
      />
    </div>
  );
}