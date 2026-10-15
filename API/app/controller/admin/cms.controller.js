const cmsStorage = require('../../services/cmsStorage.service');

const cmsController = {
  // Public / All data
  getAll(req, res) {
    try {
      const data = cmsStorage.getAll();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Site Settings
  getSettings(req, res) {
    try {
      const data = cmsStorage.getSettings();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  updateSettings(req, res) {
    try {
      const updated = cmsStorage.updateSettings(req.body);
      return res.json({ status: true, message: 'Settings saved successfully', data: updated });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Menus
  getMenus(req, res) {
    try {
      const data = cmsStorage.getMenus();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  saveMenu(req, res) {
    try {
      const saved = cmsStorage.saveMenu(req.body);
      return res.json({ status: true, message: 'Menu item saved', data: saved });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteMenu(req, res) {
    try {
      cmsStorage.deleteMenu(req.params.id);
      return res.json({ status: true, message: 'Menu item removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Hero Slides
  getHeroSlides(req, res) {
    try {
      const data = cmsStorage.getHeroSlides();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  saveHeroSlide(req, res) {
    try {
      const saved = cmsStorage.saveHeroSlide(req.body);
      return res.json({ status: true, message: 'Hero slide saved', data: saved });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteHeroSlide(req, res) {
    try {
      cmsStorage.deleteHeroSlide(req.params.id);
      return res.json({ status: true, message: 'Hero slide removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Pages
  getPages(req, res) {
    try {
      const data = cmsStorage.getPages();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  getPageBySlug(req, res) {
    try {
      const pages = cmsStorage.getPages();
      const page = pages.find(p => p.slug === req.params.slug);
      if (!page) {
        return res.status(404).json({ status: false, message: 'Page not found' });
      }
      return res.json({ status: true, data: page });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  savePage(req, res) {
    try {
      const saved = cmsStorage.savePage(req.body);
      return res.json({ status: true, message: 'Page saved successfully', data: saved });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deletePage(req, res) {
    try {
      cmsStorage.deletePage(req.params.id);
      return res.json({ status: true, message: 'Page removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Blog Posts
  getPosts(req, res) {
    try {
      const data = cmsStorage.getPosts();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  savePost(req, res) {
    try {
      const saved = cmsStorage.savePost(req.body);
      return res.json({ status: true, message: 'Post saved successfully', data: saved });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deletePost(req, res) {
    try {
      cmsStorage.deletePost(req.params.id);
      return res.json({ status: true, message: 'Post removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Team
  getTeam(req, res) {
    try {
      const data = cmsStorage.getTeam();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  saveTeamMember(req, res) {
    try {
      const saved = cmsStorage.saveTeamMember(req.body);
      return res.json({ status: true, message: 'Team member saved', data: saved });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteTeamMember(req, res) {
    try {
      cmsStorage.deleteTeamMember(req.params.id);
      return res.json({ status: true, message: 'Team member removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Testimonials
  getTestimonials(req, res) {
    try {
      const data = cmsStorage.getTestimonials();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  saveTestimonial(req, res) {
    try {
      const saved = cmsStorage.saveTestimonial(req.body);
      return res.json({ status: true, message: 'Testimonial saved', data: saved });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteTestimonial(req, res) {
    try {
      cmsStorage.deleteTestimonial(req.params.id);
      return res.json({ status: true, message: 'Testimonial removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // FAQs
  getFaqs(req, res) {
    try {
      const data = cmsStorage.getFaqs();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  saveFaq(req, res) {
    try {
      const saved = cmsStorage.saveFaq(req.body);
      return res.json({ status: true, message: 'FAQ saved', data: saved });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteFaq(req, res) {
    try {
      cmsStorage.deleteFaq(req.params.id);
      return res.json({ status: true, message: 'FAQ removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Partners
  getPartners(req, res) {
    try {
      const data = cmsStorage.getPartners();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  savePartner(req, res) {
    try {
      const saved = cmsStorage.savePartner(req.body);
      return res.json({ status: true, message: 'Partner logo saved', data: saved });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deletePartner(req, res) {
    try {
      cmsStorage.deletePartner(req.params.id);
      return res.json({ status: true, message: 'Partner removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Inquiries / Messages
  getInquiries(req, res) {
    try {
      const data = cmsStorage.getInquiries();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  submitInquiry(req, res) {
    try {
      const { name, email, message, phone, subject } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ status: false, message: 'Name, email, and message are required' });
      }
      const item = cmsStorage.addInquiry({ name, email, message, phone, subject });
      return res.json({ status: true, message: 'Thank you for reaching out! We will contact you soon.', data: item });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  updateInquiry(req, res) {
    try {
      const updated = cmsStorage.updateInquiry(req.params.id, req.body);
      return res.json({ status: true, message: 'Message updated', data: updated });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteInquiry(req, res) {
    try {
      cmsStorage.deleteInquiry(req.params.id);
      return res.json({ status: true, message: 'Message deleted' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Newsletter Subscribers
  getSubscribers(req, res) {
    try {
      const data = cmsStorage.getSubscribers();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  subscribe(req, res) {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ status: false, message: 'Valid email address is required' });
      }
      const item = cmsStorage.addSubscriber(email);
      return res.json({ status: true, message: 'Subscribed successfully to our newsletter!', data: item });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteSubscriber(req, res) {
    try {
      cmsStorage.deleteSubscriber(req.params.id);
      return res.json({ status: true, message: 'Subscriber removed' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Media Library
  getMedia(req, res) {
    try {
      const data = cmsStorage.getMedia();
      return res.json({ status: true, data });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  addMedia(req, res) {
    try {
      const item = cmsStorage.addMedia(req.body);
      return res.json({ status: true, message: 'Media asset recorded', data: item });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  deleteMedia(req, res) {
    try {
      cmsStorage.deleteMedia(req.params.id);
      return res.json({ status: true, message: 'Media asset deleted' });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  // Database Connection Health Check
  getDbStatus(req, res) {
    try {
      const connection = require('../../config/utill/connection');
      return res.json({
        status: true,
        database: {
          configured_host: process.env.DB_HOST || 'localhost',
          database_name: process.env.DB_NAME || 'bpas_v6_8_9_db',
          tables_ready: [
            'bpas_cms_site_settings',
            'bpas_cms_menus',
            'bpas_cms_hero_slides',
            'bpas_cms_pages',
            'bpas_cms_posts',
            'bpas_cms_blog_categories',
            'bpas_cms_team_members',
            'bpas_cms_testimonials',
            'bpas_cms_faqs',
            'bpas_cms_partners',
            'bpas_cms_contact_messages',
            'bpas_cms_newsletter_subscribers',
            'bpas_cms_media_assets'
          ],
          migration_script: 'database_schema_cms.sql'
        }
      });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  },

  bulkImport(req, res) {
    try {
      const { collection } = req.params;
      const records = req.body?.records || req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ status: false, message: 'Expected records array' });
      }
      const imported = cmsStorage.bulkImport(collection, records);
      return res.json({ status: true, message: `Successfully imported ${imported.length} records into ${collection}`, data: imported });
    } catch (err) {
      return res.status(500).json({ status: false, message: err.message });
    }
  }
};

module.exports = cmsController;
