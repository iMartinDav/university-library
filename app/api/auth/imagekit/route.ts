import { NextResponse } from "next/server";
import config from "@/lib/config";
import crypto from "crypto";

export async function GET() {
  try {
    // Get ImageKit private key from your config
    const privateKey = config.env.imagekit.privateKey;
    
    if (!privateKey) {
      return NextResponse.json(
        { error: "ImageKit private key is not configured" },
        { status: 500 }
      );
    }

    // Calculate expiration time (exactly 20 minutes from now)
    const expire = Math.floor(Date.now() / 1000) + 1200;
    
    // Generate a simple token with no special characters
    const token = crypto.randomBytes(16).toString('hex');
    
    // The ImageKit signature must be calculated exactly as per their docs
    // First we create the signature string with token and expire
    const toSign = token + expire;
    
    // Generate the signature using HMAC SHA-1 with the private key
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(toSign)
      .digest('hex');

    console.log("Generated auth parameters:", { token, expire, signature });
    
    // Return exactly what ImageKit expects
    return NextResponse.json({
      token,
      expire,
      signature
    });
  } catch (error) {
    console.error("ImageKit authentication error:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication parameters" },
      { status: 500 }
    );
  }
}
