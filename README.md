# Claude Chat UI for AWS Bedrock

A simple, production-ready web interface for chatting with Claude via AWS Bedrock. Built with Next.js 15, TypeScript, and Tailwind CSS.

[![Deploy Status](https://img.shields.io/badge/deploy-amplify-orange)](https://aws.amazon.com/amplify/)

## Features

- **Model Selection**: Switch between Claude Sonnet 4.5 and Opus 4.1
- **File Attachments**: Upload images, PDFs, and documents
- **Web Search**: Enable web search for up-to-date information (via Tavily API)
- **Extended Thinking**: Toggle extended thinking mode for complex reasoning
- **Conversation History**: Automatically saved to browser localStorage
- **Streaming Responses**: Real-time streaming for better UX
- **Clean UI**: Modern, responsive interface similar to claude.ai

## Prerequisites

- AWS Account with Bedrock access
- AWS Access Key and Secret Key with Bedrock permissions
- Node.js 18+ installed (for local development)

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd claude-bedrock-ui
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here

# Optional - for web search feature
NEXT_PUBLIC_TAVILY_API_KEY=your_tavily_api_key_here
```

**Note**: Get a free Tavily API key at https://tavily.com if you want web search functionality.

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment to AWS Amplify

AWS Amplify provides the easiest way to deploy this application while maximizing your AWS credits usage.

### Step 1: Push to GitHub

1. Create a new GitHub repository
2. Push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 2: Deploy to AWS Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Select "GitHub" and authorize AWS Amplify
4. Select your repository and branch (main)
5. Amplify will auto-detect the Next.js framework
6. Click "Next"

### Step 3: Configure Environment Variables

In the Amplify Console, before deploying:

1. Expand "Advanced settings"
2. Add environment variables:
   - `AWS_REGION`: us-east-1
   - `AWS_ACCESS_KEY_ID`: your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: your AWS secret key
   - `NEXT_PUBLIC_TAVILY_API_KEY`: (optional) your Tavily API key

3. Click "Save and deploy"

### Step 4: Access Your App

Once deployment completes (usually 3-5 minutes), AWS Amplify will provide a URL like:
`https://main.d1234567890.amplifyapp.com`

Share this URL with your co-founder!

## AWS Bedrock Model Access

Make sure your AWS account has access to the Claude models:

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Click "Model access" in the left sidebar
3. Request access to:
   - Claude 4.5 Sonnet (us.anthropic.claude-sonnet-4-5-20250929-v1:0)
   - Claude 4.1 Opus (us.anthropic.claude-opus-4-20250514-v1:0)
4. Wait for approval (usually instant for most accounts)

## Usage

### Basic Chat
1. Type your message in the input box
2. Press Enter or click Send
3. Claude will respond with streaming text

### Model Selection
- Click "Sonnet 4.5" or "Opus 4.1" in the header
- Sonnet is faster and cheaper
- Opus is more capable for complex tasks

### File Attachments
1. Click the image icon at the bottom left
2. Select images (.jpg, .png) or documents (.pdf, .txt, .docx)
3. Files will appear as thumbnails above the input
4. Click X to remove any attachment

### Extended Thinking
- Click the brain icon in the header to toggle
- When enabled, Claude uses additional reasoning tokens
- Useful for complex problems, math, or analysis

### Web Search
- Click the search icon in the header to toggle
- When enabled, Claude will search the web before responding
- Requires Tavily API key to be configured

### Clear Chat
- Click "Clear" button in the header
- Confirms before deleting all conversation history

## Cost Considerations

- **Sonnet 4.5**: ~$3 per million input tokens, ~$15 per million output tokens
- **Opus 4.1**: ~$15 per million input tokens, ~$75 per million output tokens
- **AWS Amplify**: ~$0.01 per build minute, ~$0.15/GB for hosting
- **Tavily API**: Free tier includes 1,000 searches/month

Estimated monthly costs for moderate usage (~10k messages):
- Amplify hosting: $5-10
- Bedrock API: $20-50 (mostly Sonnet)
- Total: ~$30-60/month (all covered by AWS credits)

## Troubleshooting

### "Failed to get response" Error
- Check your AWS credentials in environment variables
- Verify your AWS account has Bedrock model access
- Check AWS region matches (us-east-1)
- Look at browser console for detailed errors

### Models Not Loading
- Request model access in AWS Bedrock Console
- Wait 1-2 minutes for access to propagate
- Check IAM permissions include `bedrock:InvokeModel`

### Web Search Not Working
- Verify `NEXT_PUBLIC_TAVILY_API_KEY` is set
- Get a free API key at https://tavily.com
- Check browser console for API errors

### Amplify Build Fails
- Check environment variables are set correctly
- Verify `amplify.yml` is in the root directory
- Check build logs in Amplify Console

## Security Notes

- **Never commit `.env.local`** - it's in `.gitignore` for safety
- Store AWS credentials securely in Amplify environment variables
- Consider using AWS IAM roles instead of access keys for production
- The app has no authentication - anyone with the URL can use it
- Add CloudFront password protection if needed

## Project Structure

```
claude-bedrock-ui/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Bedrock API integration
│   ├── page.tsx                  # Main chat interface
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── amplify.yml                   # AWS Amplify build config
├── .env.example                  # Environment variable template
├── .env.local                    # Your credentials (not committed)
└── package.json                  # Dependencies
```

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: AWS Bedrock SDK v3
- **Deployment**: AWS Amplify
- **Search**: Tavily API (optional)

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review AWS Bedrock documentation: https://docs.aws.amazon.com/bedrock/
3. Check Next.js documentation: https://nextjs.org/docs

## License

MIT License - feel free to modify and use for your needs!

---

Built for easy deployment and maximum AWS credits usage. Perfect for non-technical users who need a simple Claude interface.
