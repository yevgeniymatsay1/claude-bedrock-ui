# Quick Setup Guide for Your Co-Founder

## What You've Built

A simple web interface where your co-founder can chat with Claude AI using your AWS Bedrock credits. It looks and works like claude.ai but uses your AWS account.

## Features Available

- **Switch Models**: Toggle between Claude Sonnet 4.5 (faster, cheaper) and Opus 4.1 (smarter, more expensive)
- **Upload Files**: Attach images and documents (PDFs, Word docs, text files)
- **Web Search**: Enable search to get current information from the web
- **Extended Thinking**: Turn on for complex problems that need deep reasoning
- **Auto-Save**: Conversations automatically save in the browser

## Next Steps to Deploy

### 1. Get AWS Bedrock Access (5 minutes)

1. Log into your AWS Console
2. Go to: https://console.aws.amazon.com/bedrock/
3. Click "Model access" on the left
4. Click "Manage model access"
5. Check these boxes:
   - Claude 4.5 Sonnet
   - Claude 4.1 Opus
6. Click "Request model access"
7. Wait ~30 seconds for approval

### 2. Create AWS Access Keys (5 minutes)

1. Go to: https://console.aws.amazon.com/iam/
2. Click "Users" → "Create user"
3. User name: `claude-chat-app`
4. Click "Next"
5. Select "Attach policies directly"
6. Search for and select: `AmazonBedrockFullAccess`
7. Click "Next" → "Create user"
8. Click on the user you just created
9. Click "Security credentials" tab
10. Click "Create access key"
11. Select "Application running outside AWS"
12. Click "Next" → "Create access key"
13. **IMPORTANT**: Copy both keys somewhere safe:
    - Access Key ID
    - Secret Access Key

### 3. Deploy to AWS Amplify (10 minutes)

#### A. Push to GitHub

```bash
# In your terminal, from the claude-bedrock-ui folder:
git remote add origin https://github.com/YOUR_USERNAME/claude-chat.git
git add .
git commit -m "Initial deployment"
git push -u origin main
```

#### B. Deploy on Amplify

1. Go to: https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Choose "GitHub" → Authorize if needed
4. Select your repository and branch (main)
5. Click "Next"

#### C. Add Environment Variables

In the "Advanced settings" section, add these:

```
Key: AWS_REGION
Value: us-east-1

Key: AWS_ACCESS_KEY_ID
Value: [paste the access key from step 2]

Key: AWS_SECRET_ACCESS_KEY
Value: [paste the secret key from step 2]
```

Optional - for web search:
```
Key: NEXT_PUBLIC_TAVILY_API_KEY
Value: [get free key from https://tavily.com]
```

6. Click "Next" → "Save and deploy"
7. Wait 3-5 minutes for deployment

#### D. Share the URL

Once deployed, Amplify shows a URL like:
`https://main.d1234567890.amplifyapp.com`

Share this with your co-founder! That's it!

## Testing Locally First (Optional)

Want to test before deploying?

```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local with your AWS credentials
# Then run:
npm run dev
```

Open http://localhost:3000

## Cost Estimate

For moderate usage (~1000 messages/month):

- **Hosting**: ~$5/month (covered by AWS credits)
- **Claude Sonnet 4.5**: ~$10-20/month (covered by AWS credits)
- **Claude Opus 4.1**: ~$30-50/month if used heavily (covered by AWS credits)

**Total**: Should be fully covered by your AWS credits!

## Troubleshooting

### "Failed to get response" error
- Double-check environment variables in Amplify Console
- Verify model access was approved in Bedrock
- Check that access keys have BedrockFullAccess permission

### Can't push to GitHub
```bash
# Create a new repo on GitHub first, then:
git remote remove origin
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

### Build fails on Amplify
- Check that all environment variables are set
- Look at the build logs in Amplify Console
- Verify `amplify.yml` is in the repo root

## Security Notes

- Anyone with the URL can use it (no authentication)
- All usage charges to your AWS account
- Keep your AWS keys secure (never commit them to git)
- Consider adding password protection via CloudFront if needed

## Support

- AWS Bedrock Docs: https://docs.aws.amazon.com/bedrock/
- Amplify Docs: https://docs.aws.amazon.com/amplify/

---

Built with ❤️ to maximize your AWS credits usage!
