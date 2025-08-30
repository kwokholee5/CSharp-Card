# 🎯 C# Interview Revision Cards

An interactive web application for mastering C# technical interview questions through spaced repetition and flip cards.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Vite](https://img.shields.io/badge/Vite-7.1-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 🔄 **Interactive Flip Cards** - Click or press space to reveal answers
- 📚 **Categorized Questions** - Organized by difficulty (Basics → Expert)
- 💾 **Progress Tracking** - LocalStorage saves your learning progress
- 📱 **Mobile Responsive** - Works perfectly on all devices
- ⌨️ **Keyboard Navigation** - Full keyboard support for efficient studying
- 🔍 **Search & Filter** - Find questions by keywords, tags, or difficulty
- 🌙 **Works Offline** - Study anywhere without internet
- 🚀 **Lightning Fast** - Built with Vite for instant page loads

## 🎮 Demo

Visit the live demo: [Coming Soon on Cloudflare Pages]

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/CSharp-Card.git
cd CSharp-Card

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173 to see the app.

## 🎯 Usage

### Keyboard Shortcuts
- `Space` or `Enter` - Flip card
- `←` / `→` - Previous/Next card
- `K` - Mark as known
- `U` - Mark as unknown

### Adding Questions

Questions are stored in JSON files under `/data/questions/`. To add new questions:

1. Navigate to the appropriate category folder
2. Edit or create a JSON file following the schema
3. Run `npm run validate` to check your questions

Example question format:
```json
{
  "id": "var-0001",
  "question": "What is the difference between 'var' and explicit typing?",
  "answer": "'var' uses implicit typing where the compiler infers the type",
  "category": "basics",
  "difficulty": 2,
  "tags": ["variables", "types"]
}
```

## 📁 Project Structure

```
CSharp-Card/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── data/
│   ├── metadata/        # Categories and schema
│   └── questions/       # Question JSON files
└── public/              # Static assets
```

## 🛠️ Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npm run type-check
```

## 🚢 Deployment

### Cloudflare Pages (Recommended - FREE)

1. Build the project:
```bash
npm run build
cp -r data dist/
```

2. Deploy using Wrangler:
```bash
npx wrangler pages deploy dist --project-name=csharp-cards
```

### GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add deploy script to package.json:
```json
"scripts": {
  "predeploy": "npm run build && cp -r data dist/",
  "deploy": "gh-pages -d dist"
}
```

3. Deploy:
```bash
npm run deploy
```

## 📊 Current Content

- **C# Basics**: 10 questions on variables and data types
- **Intermediate**: Coming soon (OOP, Collections, LINQ)
- **Advanced**: Coming soon (Async, Generics, Delegates)
- **Expert**: Coming soon (Performance, Design Patterns)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Add your questions or features
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Questions sourced from common C# interview topics
- Built with React, TypeScript, and Vite
- Deployed on Cloudflare Pages

## 📞 Support

Having issues? Please open an issue on GitHub.

---

Made with ❤️ for C# developers preparing for technical interviews