

# Fix AWS Logo in Footer

## Problem
The inline SVG paths for the AWS logo are malformed — wrong viewBox, bad transforms, and incomplete path data causing a distorted rendering.

## Solution
Replace the broken inline SVG with the official AWS logo image (user-provided), compressed and saved to `src/assets/`. Render it as an `<img>` tag at the correct small size (monochrome via CSS grayscale filter to match the muted footer aesthetic).

## Steps

1. **Compress and copy** the uploaded AWS logo (`df69333c05cd1c97716a8064c3ee21e0.png`) to `src/assets/aws-logo.png` — resize to ~80px wide for the small footer usage
2. **`src/components/landing/sections/Footer.tsx`** — Replace the `AwsLogo` SVG component with an `<img>` import:
   - `import awsLogo from "@/assets/aws-logo.png"`
   - Render as `<img src={awsLogo} alt="AWS" className="h-3 w-auto grayscale opacity-50" />` inline next to the text
   - Remove the old `AwsLogo` function entirely

## What does NOT change
- Status badge, shimmer animation, footer layout, links, copyright

