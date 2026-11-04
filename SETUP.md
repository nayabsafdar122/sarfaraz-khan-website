# Adv. Sarfaraz Khan website: Vercel setup

The website is `index.html` plus the `img` folder. The `api` folder holds two small Vercel functions:
- `api/chat.js`: the AI assistant (keeps the AI key private)
- `api/book.js`: optional branded booking email via Resend

## 1. Deploy
1. Put these files in the GitHub repository (they are already at the top level of this folder).
2. Go to https://vercel.com/new, click **Import** next to the repository, leave every setting as it is (Framework Preset: **Other**, no build command), and click **Deploy**.
3. Every change pushed to GitHub redeploys the site automatically.

## 2. Booking emails (already working)
Booking requests are sent through **Web3Forms** using the access key in `index.html` (`WEB3FORMS_KEY`). They go to the email address the key was created with.
- To send them to the client instead: create a new key at https://web3forms.com with **advmsk.legal@gmail.com**, then replace the key in `index.html`.
- Test: submit the form once on the live site and check the inbox (and spam the first time).
- Optional branded email: create a Resend account, then add `RESEND_API_KEY` under **Project → Settings → Environment Variables** and redeploy.

## 3. AI assistant
1. Create an API key at https://console.anthropic.com (set a monthly spend limit under Billing).
2. In Vercel: **Project → Settings → Environment Variables**, add `ANTHROPIC_API_KEY` = the key, then **Deployments → ⋯ → Redeploy**.
3. Without the key, the chat still works using its built-in answers.
The key is never placed in `index.html`, so visitors cannot see it.

## 4. Connect the client's domain
1. In Vercel open the project, then **Settings → Domains**, type the domain (for example `sarfarazkhan.com`) and click **Add**. Choose the option that also adds `www` and redirects one to the other.
2. Vercel then shows the DNS records to create. Log in where the domain was bought (GoDaddy, Namecheap, Hostinger, etc.), open **DNS settings**, and add exactly the records Vercel shows. They are usually:
   - **A** record, Host/Name `@`, Value `76.76.21.21`
   - **CNAME** record, Host/Name `www`, Value `cname.vercel-dns.com`
   Delete any old **A** record for `@` or **CNAME** for `www` that point somewhere else (for example a "parked" page).
   (Alternative: switch the domain's nameservers to the ones Vercel lists, then Vercel manages everything.)
3. Wait a few minutes (sometimes up to a few hours). When Vercel shows **Valid Configuration**, the site is live on the domain with HTTPS turned on automatically.

## Changing what the assistant knows
- The AI briefing is the `SYSTEM` text in `api/chat.js`.
- The built-in fallback answers are the `FAQB` list near the bottom of `index.html`.

## Privacy note
Visitors' chat messages are sent to Anthropic (the AI provider) to generate answers. Mention this in the site's privacy notice, and remind visitors not to share sensitive details in the chat.
