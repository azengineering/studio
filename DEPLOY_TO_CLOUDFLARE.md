# Deploying PolitiRate to Cloudflare Pages

This guide provides step-by-step instructions for deploying your Next.js application to Cloudflare Pages.

## Prerequisites

1.  A [Cloudflare account](https://dash.cloudflare.com/sign-up).
2.  Your application code pushed to a [GitHub](https://github.com/) or [GitLab](https://gitlab.com/) repository.
3.  Your Supabase project created with the correct database schema.

---

## Step 1: Connect Your Git Repository to Cloudflare

1.  Log in to the **Cloudflare dashboard**.
2.  Navigate to **Workers & Pages** in the left-hand sidebar.
3.  Click **Create application**, then select the **Pages** tab.
4.  Click **Connect to Git**. You will be prompted to authorize Cloudflare to access your GitHub or GitLab account.
5.  Select the repository for your PolitiRate application and click **Begin setup**.

---

## Step 2: Configure Your Build Settings

On the "Set up builds and deployments" screen, configure the following:

-   **Project name**: Choose a name for your project (e.g., `politirate-app`).
-   **Production branch**: Select the branch you want to deploy from (usually `main` or `master`).
-   **Framework preset**: Cloudflare should automatically detect **Next.js**. If not, select it from the dropdown.

The build settings should be automatically configured by the preset. They should look like this:
-   **Build command**: `next build`
-   **Build output directory**: `.next`

---

## Step 3: Add Environment Variables

This is the most important step to connect your application to your Supabase database.

1.  Scroll down to the **Environment variables (advanced)** section.
2.  Click **Add variable** for each of the following keys from your `.env.local` file.

| Variable Name                 | Value                                  | Type   |
| ----------------------------- | -------------------------------------- | ------ |
| `NEXT_PUBLIC_SUPABASE_URL`    | Your Supabase project URL              | Value  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Your Supabase public anon key          | Value  |
| `SUPABASE_SERVICE_ROLE_KEY`   | Your Supabase service role key         | Secret |

**Important:** For `SUPABASE_SERVICE_ROLE_KEY`, be sure to click the **Encrypt** button next to the value field. This turns the variable into a "Secret," which hides its value in the Cloudflare dashboard and build logs for security.

---

## Step 4: Deploy Your Application

1.  Click the **Save and Deploy** button.
2.  Cloudflare will now build and deploy your application. You can watch the progress in the deployment logs.
3.  Once the deployment is complete, Cloudflare will provide you with a production URL (e.g., `your-project-name.pages.dev`).

---

## Step 5: Configure Supabase Authentication

For Google Sign-In and other OAuth providers to work correctly on your live site, you must update your Supabase settings.

1.  Go to your **Supabase project dashboard**.
2.  Navigate to **Authentication** -> **URL Configuration** from the sidebar.
3.  In the **Site URL** field, enter your Cloudflare Pages URL (e.g., `https://your-project-name.pages.dev`).
4.  In the **Redirect URLs** section, add the following URL: `https://your-project-name.pages.dev/auth/callback`
5.  Click **Save**.

Your PolitiRate application is now live and fully configured on Cloudflare Pages!
