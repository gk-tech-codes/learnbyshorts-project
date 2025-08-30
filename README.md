# LearnByShorts

A modern educational platform that delivers bite-sized learning content through interactive stories and quizzes.

## Features

- Interactive story-based learning
- Topic-specific quizzes
- Text-to-speech functionality
- Responsive design
- Contact form integration
- Analytics tracking

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Python (AWS Lambda)
- **Database**: DynamoDB
- **Hosting**: AWS S3 + CloudFront
- **Analytics**: Google Analytics

## Project Structure

```
├── frontend/           # Frontend application
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   ├── data/          # JSON data files
│   └── *.html         # HTML pages
├── backend/           # Backend Lambda functions
│   ├── lambda_auth.py # Authentication handler
│   └── requirements.txt
├── package.json       # Node.js dependencies
└── vercel.json       # Deployment configuration
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Open `frontend/index.html` in your browser

## Deployment

The application is configured for deployment on AWS using S3 and CloudFront.

## License

MIT License
