# Heroku Deployment Guide

## Prerequisites
- Heroku Student Account 
- Git repository on GitHub
- Heroku CLI installed

## Step-by-Step Deployment

### 1. Install Heroku CLI
```bash
# Windows (using Chocolatey)
choco install heroku-cli

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login to Heroku
```bash
heroku login
```

### 3. Prepare Your Repository
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial portfolio commit"

# Add GitHub remote
git remote add origin https://github.com/daveonthegit/personal-portfolio.git
git push -u origin main
```

### 4. Create Heroku App
```bash
# Create new Heroku app
heroku create your-portfolio-name

# Or let Heroku generate a name
heroku create
```

### 5. Configure Buildpacks (Multi-buildpack approach)
```bash
# Set Node.js buildpack first (for frontend assets)
heroku buildpacks:add heroku/nodejs

# Add Go buildpack second (for main app)
heroku buildpacks:add heroku/go
```

### 6. Set Environment Variables
```bash
heroku config:set PORT=8080
```

### 7. Deploy
```bash
# Deploy to Heroku
git push heroku main
```

### 8. Open Your Portfolio
```bash
heroku open
```

## Alternative: Docker Deployment
If you prefer Docker deployment on Heroku:

```bash
# Set stack to container
heroku stack:set container

# Deploy using heroku.yml
git push heroku main
```

## Continuous Deployment
To enable automatic deployments from GitHub:

1. Go to your Heroku Dashboard
2. Select your app
3. Go to "Deploy" tab
4. Connect to GitHub
5. Enable "Automatic deploys" from main branch

## Monitoring
```bash
# View logs
heroku logs --tail

# Check app status
heroku ps
```

## Custom Domain (Optional)
```bash
# Add custom domain
heroku domains:add your-domain.com

# Get DNS target
heroku domains
```

## Troubleshooting

### Build Issues
- Check buildpack order: Node.js first, then Go
- Verify package.json has all dependencies
- Check Go module is properly initialized

### Runtime Issues
- Check logs: `heroku logs --tail`
- Verify PORT environment variable is used
- Ensure static files are being served correctly

## Cost with Heroku Student
- Eco dynos: $5/month (but you get credits!)
- Student credits should cover hosting costs
- Consider using sleep mode for development

## Your App Structure
```
your-app.herokuapp.com/
├── /              # Home page
├── /about         # About page  
├── /projects      # Projects showcase
├── /resume        # Resume page with PDF
└── /contact       # Contact form
```
