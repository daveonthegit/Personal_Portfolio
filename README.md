# Developer Portfolio

A production-ready developer portfolio built with Next.js, TypeScript, and React Three Fiber. Features interactive 3D models, case studies, and optimized performance.

## ✨ Features

- **🎯 Modern Stack**: Next.js 14, TypeScript, Tailwind CSS
- **🎨 3D Graphics**: Interactive models with React Three Fiber
- **📱 Responsive Design**: Optimized for all devices
- **⚡ Performance**: Lighthouse score 90+, lazy loading, code splitting
- **📝 Content Management**: MDX-based project case studies
- **🎥 Media Support**: Mux and Cloudflare Stream integration
- **🔍 SEO Optimized**: Sitemap, robots.txt, OpenGraph
- **♿ Accessible**: WCAG compliant, keyboard navigation
- **🌙 Dark Mode**: System preference detection
- **📊 Analytics Ready**: Plausible and Google Analytics support

## 🚀 Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd developer-portfolio
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Add your content**
   - Replace placeholder content in `content/projects/`
   - Add your 3D models to `public/assets/models/`
   - Update personal information in components and pages

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (pages)/           # Route groups
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── R3FScene.tsx       # 3D scene component
│   ├── ModelViewer.tsx    # 3D model viewer
│   ├── VideoPlayer.tsx    # Video player
│   └── ...
├── content/              # MDX content
│   └── projects/         # Project case studies
├── lib/                  # Utilities
├── public/               # Static assets
│   ├── assets/
│   │   ├── models/       # GLB/glTF files
│   │   ├── images/       # Images
│   │   └── textures/     # 3D textures
│   └── resume.pdf
├── contentlayer.config.ts # Content configuration
├── tailwind.config.ts     # Tailwind configuration
└── next.config.js        # Next.js configuration
```

## 🎨 Adding Projects

### 1. Create MDX File

Create a new file in `content/projects/project-name.mdx`:

```mdx
---
title: "Your Project Title"
date: "2024-01-15"
summary: "Brief description of your project"
tags: ["React", "TypeScript", "Three.js"]
hero: "/assets/images/project-hero.jpg"
repoUrl: "https://github.com/username/repo"
liveUrl: "https://project-demo.com"
modelSlug: "your-model-name"  # Optional: links to 3D model
videoId: "mux:abc123"         # Optional: Mux or Cloudflare video
metrics:
  performance: "95/100"
  users: "10k+"
  conversion: "+35%"
---

## Your Project Content

Write your case study here using MDX...
```

### 2. Add Images

Place project images in `public/assets/images/`:
- Hero image: `project-name-hero.jpg` (1200x630 recommended)
- Screenshots: `project-name-1.png`, etc.
- OpenGraph: `project-name-og.jpg` (1200x630)

### 3. Add 3D Models (Optional)

1. Export from Blender as GLB:
   - Use Draco compression
   - Optimize textures (1K-2K resolution)
   - Keep under 50K triangles for web performance

2. Add to `public/assets/models/your-model-name.glb`

3. Update the model registry in `app/models/[slug]/page.tsx`

## 🎬 Video Integration

### Mux Setup

1. Sign up at [Mux](https://mux.com)
2. Upload your videos and get playback IDs
3. Set environment variable:
   ```bash
   NEXT_PUBLIC_MUX_TOKEN=your_token
   ```
4. Use in MDX: `videoId: "mux:your_playback_id"`

### Cloudflare Stream Setup

1. Sign up for [Cloudflare Stream](https://cloudflare.com/products/cloudflare-stream/)
2. Upload videos and get video IDs
3. Set environment variable:
   ```bash
   NEXT_PUBLIC_CF_ACCOUNT_ID=your_account_id
   ```
4. Use in MDX: `videoId: "cf:your_video_id"`

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run typecheck    # Type check with TypeScript
npm run analyze      # Analyze bundle size
```

### Environment Variables

Key environment variables (see `env.example` for complete list):

```bash
# Required
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Video (choose one or both)
NEXT_PUBLIC_MUX_TOKEN=your_mux_token
NEXT_PUBLIC_CF_ACCOUNT_ID=your_cf_account

# Analytics (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com

# Contact info
NEXT_PUBLIC_EMAIL=your.email@example.com
NEXT_PUBLIC_GITHUB_USERNAME=yourusername
NEXT_PUBLIC_LINKEDIN_USERNAME=yourusername
```

## 🎯 Performance Optimization

### Bundle Analysis

```bash
npm run analyze
```

This opens a visual analysis of your bundle size. Keep an eye on:
- Total bundle size (aim for <500KB initial)
- Large dependencies
- Unused code

### 3D Model Optimization

**Blender Export Settings:**
- Format: glTF Binary (.glb)
- Include: Selected Objects, Materials, Textures
- Transform: +Y Up
- Geometry: Apply Modifiers, UVs, Normals
- Materials: Export Materials
- Compression: Draco (Position: 14, Normal: 10, Color: 10)
- Animation: Export only if needed

**Post-Processing:**
```bash
# Install gltf-pipeline for additional optimization
npm install -g gltf-pipeline

# Optimize GLB file
gltf-pipeline -i model.glb -o model-optimized.glb --draco.compressionLevel=10
```

### Image Optimization

- Use WebP format when possible
- Compress images with tools like [Squoosh](https://squoosh.app/)
- Provide multiple sizes for responsive images
- Use Next.js Image component for automatic optimization

## 🔧 Customization

### Branding

1. **Colors**: Update `tailwind.config.ts` with your brand colors
2. **Typography**: Modify font imports in `app/layout.tsx`
3. **Logo**: Replace placeholder logo in `components/Header.tsx`
4. **Favicon**: Generate and replace files in `public/`

### Content

1. **Personal Info**: Update `app/about/page.tsx`
2. **Skills**: Modify skills data in about page
3. **Social Links**: Update links in `components/Footer.tsx`
4. **Resume**: Replace `public/resume.pdf`

### SEO

1. **Metadata**: Update default SEO in `app/layout.tsx`
2. **OpenGraph**: Replace `public/og-image.jpg`
3. **Sitemap**: Modify `app/sitemap.ts` if adding new routes

## 📱 Responsive Design

The portfolio is fully responsive with breakpoints:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

3D components automatically adjust quality and controls for mobile devices.

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance (WCAG AA)
- Reduced motion support

Test accessibility:
```bash
# Install axe-core for testing
npm install -g @axe-core/cli

# Test a page
axe https://localhost:3000
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel
   ```

2. **Set Environment Variables** in Vercel dashboard

3. **Custom Domain** (optional): Add in Vercel project settings

### Other Platforms

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=.next
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

### Lighthouse Performance

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Test performance
lighthouse http://localhost:3000 --only-categories=performance,accessibility,best-practices,seo
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

### Cross-Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🐛 Troubleshooting

### Common Issues

**3D Models Not Loading:**
- Check file path and format (must be .glb)
- Verify model is under 10MB
- Test model in [glTF Viewer](https://gltf-viewer.donmccurdy.com/)

**Build Errors:**
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run typecheck`

**Performance Issues:**
- Run bundle analyzer: `npm run analyze`
- Check image sizes and formats
- Verify 3D models are optimized
- Use Chrome DevTools Performance tab

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [React Three Fiber docs](https://docs.pmnd.rs/react-three-fiber)
- Search [GitHub issues](https://github.com/yourusername/portfolio/issues)
- Open a new issue with reproduction steps

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) - 3D graphics
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Contentlayer](https://contentlayer.dev/) - Content management
- [Lucide React](https://lucide.dev/) - Icons
- [Vercel](https://vercel.com/) - Hosting platform

---

Built with ❤️ and modern web technologies. 

**[Live Demo](https://your-domain.com)** • **[Documentation](https://github.com/yourusername/portfolio)** • **[Issues](https://github.com/yourusername/portfolio/issues)**
