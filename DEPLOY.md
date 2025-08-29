# Deployment Guide for C# Revision Cards

## Option 1: Cloudflare Pages (Recommended - FREE)

### Why Cloudflare Pages?
- ✅ **100% FREE** - No credit card required
- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Automatic HTTPS** - SSL certificate included
- ✅ **DDoS Protection** - Enterprise-grade security
- ✅ **Unlimited Bandwidth** - No traffic limits

### Step-by-Step Deployment:

#### 1. Build the Application
```bash
npm run build
cp -r data dist/
```

#### 2. Create Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account (no credit card needed)

#### 3. Deploy via Cloudflare Dashboard
1. Go to **Workers & Pages** → **Create application** → **Pages**
2. Choose **Upload assets**
3. Name your project: `csharp-cards`
4. Upload the entire `dist` folder
5. Click **Deploy**

Your app will be live at: `https://csharp-cards.pages.dev`

#### 4. (Optional) Connect GitHub for Auto-Deploy
1. Go to your project settings
2. Click **Git integration**
3. Connect your GitHub repository
4. Set build command: `npm run build && cp -r data dist/`
5. Set output directory: `dist`

## Option 2: GitHub Pages (Also FREE)

### Deploy to GitHub Pages:
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"predeploy": "npm run build && cp -r data dist/",
"deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

Access at: `https://yourusername.github.io/CSharp-Card`

## Option 3: Deploy on Your VPS

### Using Nginx (Production Ready):

1. **Build the app:**
```bash
npm run build
cp -r data dist/
```

2. **Install Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

3. **Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/csharp-cards
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your VPS IP
    
    root /home/jacklee/CSharp-Card/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /data {
        expires 1h;
        add_header Cache-Control "public";
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

4. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/csharp-cards /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Add SSL with Let's Encrypt (FREE):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Option 4: Quick Local Hosting (Development)

### For testing on VPS:
```bash
# Using Node.js serve
npm install -g serve
serve -s dist -l 5000

# Or using Python
cd dist
python3 -m http.server 8000

# Or using npx
npx serve dist -l 5000
```

## Environment Variables

Create `.env.production` for production builds:
```env
VITE_API_ENDPOINT=https://your-domain.com
```

## Post-Deployment Checklist

- [ ] Test card flip animations
- [ ] Verify data loading
- [ ] Check mobile responsiveness
- [ ] Test offline functionality
- [ ] Verify HTTPS is working
- [ ] Check browser console for errors
- [ ] Test keyboard navigation

## Monitoring

For Cloudflare Pages:
- Analytics available in dashboard
- Web Analytics (free tier included)
- Performance metrics

## Support

Issues? Check:
1. Browser console for errors
2. Network tab for failed requests
3. Ensure `/data` folder is included in deployment