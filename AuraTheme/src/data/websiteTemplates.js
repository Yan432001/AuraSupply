/**
 * Multi-Service Website Sub-Module Templates Registry
 * 
 * Defines the extensible website templates available under the E-commerce / Website module.
 * Admin can select which sub-website template is active or manage them under Website/E-commerce settings.
 */

export const WEBSITE_TEMPLATES = [
  {
    id: 'default',
    key: 'ecommerce-default',
    name: 'Default E-commerce',
    shortName: 'Storefront',
    tagline: 'Standard Online Shopping & Retail Catalog',
    description: 'Full featured multi-store B2B & retail e-commerce platform with live product catalog, category filters, shopping cart, Telegram Mini App ordering, and checkout.',
    badge: 'Base / Default',
    badgeColor: 'blue',
    icon: 'ShoppingCartOutlined',
    category: 'Commerce & Retail',
    heroTitle: 'Aura Global Hospitality & Supply Platform',
    heroSubtitle: 'Complete digital menu, wholesale supply catalog, and automated Telegram ordering for multi-branch stores.',
    primaryCtaText: 'Browse Catalog',
    primaryCtaPath: '/products',
    secondaryCtaText: 'Explore Shops',
    secondaryCtaPath: '/shops',
    features: [
      'Multi-Warehouse Product Inventory',
      'Telegram Mini App E-Menu Integration',
      'Instant Cart & Tiered Wholesale Pricing',
      'Contactless Table QR Code Ordering',
      'Order Status Tracking & Receipt Generator'
    ],
    navItems: [
      { key: 'shops', label: 'Shops Directory', path: '/shops' },
      { key: 'products', label: 'Products Catalog', path: '/products' },
      { key: 'service', label: 'Services & Solutions', path: '/service' },
      { key: 'learn', label: 'Learning Academy', path: '/learn' }
    ]
  },
  {
    id: 'education',
    key: 'ecommerce-education',
    name: 'Education Website',
    shortName: 'LMS & Academy',
    tagline: 'Interactive Courses, Academic LMS & Admissions Portal',
    description: 'Tailored for universities, training academies, and educational institutions with course catalogs, syllabus modules, faculty instructors, student admissions, and certificate verification.',
    badge: 'LMS & Courses',
    badgeColor: 'purple',
    icon: 'BookOutlined',
    category: 'Education & Academics',
    heroTitle: 'Empowering Future Leaders Through Practical Skills',
    heroSubtitle: 'Accredited professional training, hospitality business certifications, and hands-on masterclasses with industry mentors.',
    primaryCtaText: 'Explore Courses',
    primaryCtaPath: '/learn',
    secondaryCtaText: 'Apply for Admission',
    secondaryCtaPath: '#admissions',
    features: [
      'Interactive Course Curriculum & Syllabus',
      'Online Student Admission & Registration',
      'Faculty & Lecturer Directory',
      'Downloadable Study Materials & Playbooks',
      'Verified Digital Certificate Verification'
    ],
    navItems: [
      { key: 'courses', label: 'Course Catalog', path: '/learn' },
      { key: 'curriculum', label: 'Academic Programs', path: '/learn' },
      { key: 'faculty', label: 'Faculty & Mentors', path: '/service' },
      { key: 'admissions', label: 'Admissions & Fees', path: '/learn' }
    ]
  },
  {
    id: 'company',
    key: 'ecommerce-company',
    name: 'Company Profile',
    shortName: 'Corporate B2B',
    tagline: 'Corporate Showcase, Enterprise Solutions & Portfolio',
    description: 'Designed for enterprise corporations, holding companies, and B2B providers. Showcases corporate mission, executive leadership, client portfolio, ESG impact, and custom business proposals.',
    badge: 'Corporate B2B',
    badgeColor: 'cyan',
    icon: 'BankOutlined',
    category: 'Corporate & Enterprise',
    heroTitle: 'Global Supply Chain & Enterprise Technology Solutions',
    heroSubtitle: 'Delivering end-to-end commercial procurement, intelligent logistics dispatch, and enterprise hospitality systems across Southeast Asia.',
    primaryCtaText: 'Our Solutions',
    primaryCtaPath: '/service',
    secondaryCtaText: 'Request Corporate Proposal',
    secondaryCtaPath: '#contact',
    features: [
      'Executive Leadership & Board Showcase',
      'Enterprise Service Pillars & Infrastructure',
      'Case Studies & Verified Client Portfolio',
      'Investor Relations & ESG Sustainability',
      'Direct RFP & Corporate Proposal Submission'
    ],
    navItems: [
      { key: 'about', label: 'About Company', path: '/service' },
      { key: 'solutions', label: 'Enterprise Solutions', path: '/service' },
      { key: 'portfolio', label: 'Case Studies', path: '/shops' },
      { key: 'contact', label: 'Corporate Inquiries', path: '/service' }
    ]
  },
  {
    id: 'booking',
    key: 'ecommerce-booking',
    name: 'Service / Booking Website',
    shortName: 'Service Booking',
    tagline: 'Appointments, Agency Consulting & On-Demand Booking',
    description: 'Built for service agencies, consulting practices, and appointment-based businesses with tiered service packages, live consultation calendar booking, and project quote estimators.',
    badge: 'Service & Agency',
    badgeColor: 'orange',
    icon: 'CalendarOutlined',
    category: 'Services & Consulting',
    heroTitle: 'Bespoke Advisory, Technical Setup & Operational Consulting',
    heroSubtitle: 'Book 1-on-1 strategy consultations, retail store engineering, and turnkey Telegram E-Menu deployment with guaranteed delivery.',
    primaryCtaText: 'Book Appointment',
    primaryCtaPath: '#booking',
    secondaryCtaText: 'View Service Packages',
    secondaryCtaPath: '/service',
    features: [
      'Interactive Consultation Booking Calendar',
      'Tiered Service Packages & Hourly Retainers',
      'Instant Quote Estimator & Proposal Tool',
      'Automated Meeting Confirmation & Calendar Sync',
      'Dedicated Account Manager SLA'
    ],
    navItems: [
      { key: 'services', label: 'Consulting Menu', path: '/service' },
      { key: 'packages', label: 'Pricing Plans', path: '/service' },
      { key: 'booking', label: 'Book Appointment', path: '/service' },
      { key: 'reviews', label: 'Client Testimonials', path: '/service' }
    ]
  }
];

export const DEFAULT_WEBSITE_TEMPLATE = 'default';

export const getWebsiteTemplate = (templateId) => {
  return (
    WEBSITE_TEMPLATES.find((t) => t.id === templateId) ||
    WEBSITE_TEMPLATES.find((t) => t.key === templateId) ||
    WEBSITE_TEMPLATES[0]
  );
};

export const getAllWebsiteTemplates = () => WEBSITE_TEMPLATES;
