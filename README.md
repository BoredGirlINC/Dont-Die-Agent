# Don't Die Agent - Your AI Life Blueprint Generator

A web application that generates personalized life blueprints to help you live a longer, healthier life. Built with modern web technologies and Firebase integration for user management and data persistence.

## Features

- 🔐 User Authentication (Google, Twitter, Email/Password, and Metamask)
- 📋 Personalized Blueprint Generation
- 💾 Blueprint History Storage
- 🏷️ Custom Blueprint Tagging
- 👤 User Profile Management

## Tech Stack

- Vite (Build Tool)
- Firebase (Authentication & Database)
- TailwindCSS + DaisyUI (Styling)
- Web3 Integration (Metamask Authentication)

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Firebase project with:
  - Authentication enabled (Google, Twitter, Email/Password)
  - Firestore database created
  - Web app configuration

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd dont-die-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a Firebase configuration:
   - Go to your Firebase Console
   - Create a new project (or select existing)
   - Enable Authentication methods (Google, Twitter, Email/Password)
   - Create a Firestore database
   - Get your web app configuration
   - Update `src/firebase.js` with your configuration

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
dont-die-agent/
├── src/
│   ├── services/
│   │   ├── auth.js        # Authentication service
│   │   └── blueprint.js   # Blueprint management service
│   ├── firebase.js        # Firebase configuration
│   ├── main.js           # Main application logic
│   └── style.css         # Global styles
├── index.html            # Main HTML file
├── package.json          # Project dependencies
├── vite.config.js        # Vite configuration
└── README.md            # Project documentation
```

## Usage

1. Visit the application in your browser
2. Sign in using your preferred method
3. Click "Get your Blueprint" to generate a personalized blueprint
4. View your saved blueprints in your profile
5. Add custom tags to organize your blueprints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

