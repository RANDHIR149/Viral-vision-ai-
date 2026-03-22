import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ViralContent {
  title: string;
  description: string;
  hashtags: string[];
  tags?: string[];
  viralScore: number;
  tips: string[];
  enhancements?: string[];
  platformData?: {
    tagsString?: string;
    bestTime?: string;
    trendAnalysis?: string;
    contentPillars?: string[];
    hook?: string;
    visualFlow?: string;
    hookTiming?: string;
    retentionTips?: string[];
    audioSuggestions?: string[];
    [key: string]: any;
  };
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Dynamic scaling based on original size
      // For very large images, scale down more aggressively
      let maxDim = 1024;
      if (file.size > 20 * 1024 * 1024) { // > 20MB
        maxDim = 800;
      } else if (file.size > 10 * 1024 * 1024) { // > 10MB
        maxDim = 1024;
      } else {
        maxDim = 1600; // Better quality for smaller files
      }

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Adjust quality based on file size to keep payload manageable
      const quality = file.size > 20 * 1024 * 1024 ? 0.5 : 0.7;
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality).split(",")[1];
      resolve(compressedBase64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression. The file might be corrupted or too large for the browser to handle."));
    };
  });
}

async function fileToBase64(file: File, onProgress?: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 50); // First 50% is reading
        onProgress(percent);
      }
    };
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (onProgress) onProgress(50); // Finished reading
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function analyzeMedia(
  file: File,
  language: string,
  platform: string,
  isTurbo: boolean = false,
  onProgress?: (progress: number) => void,
  retryCount: number = 0
): Promise<ViralContent> {
  const MAX_RETRIES = 2;
  const model = "gemini-3-flash-preview"; 

  // Increased file size limits for "Large File" support
  const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB (will be compressed)
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image is way too large. Please upload an image smaller than 50MB.");
  }
  if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
    throw new Error("Video is too large for analysis. Please upload a video smaller than 100MB.");
  }

  let base64Data: string;
  const mimeType = file.type;

  try {
    if (mimeType.startsWith('image/')) {
      base64Data = await compressImage(file);
      if (onProgress) onProgress(50);
    } else {
      base64Data = await fileToBase64(file, onProgress);
    }
  } catch (e) {
    console.error("File processing failed:", e);
    throw new Error("Failed to process media file. It might be corrupted or in an unsupported format.");
  }

  const prompt = `You are the world's #1 Social Media Growth Hacker. ${isTurbo ? 'Perform a lightning-fast analysis.' : 'Perform a deep viral analysis.'} 
  Analyze this ${mimeType.startsWith('video') ? 'video' : 'image'} for ${platform}.

  ${mimeType.startsWith('video') ? `
  VIDEO SPECIFIC ANALYSIS:
  - Visual Flow: Analyze the pacing and transitions.
  - Hook Timing: Identify the exact second the hook should start.
  - Retention Tips: How to keep viewers watching until the end.
  - Audio Suggestions: What type of trending audio or voiceover would work best.
  ` : ''}

  STRICT QUALITY DIRECTIVES:
  - VIRAL TITLE: Scroll-stopping headline with relevant emojis. Make it crazy, high-energy, and attention-grabbing.
  - CAPTION: Professional yet high-energy and viral. Hook + Value + CTA. Use plenty of relevant emojis to make it look fun and engaging.
  - HASHTAGS: Strategic mix of 10-15 hashtags.
  - SEO TAGS: 15-20 optimized tags.
  - BEST TIME: Provide a highly accurate, specific peak hour to post (e.g., "6:45 PM" or "8:15 AM") based on current platform algorithms.
  - LANGUAGE: All text MUST be in ${language}.

  Return a JSON object with:
  - title, description, hashtags, viralScore, tips, enhancements
  - platformData: { tagsString, bestTime, trendAnalysis, contentPillars, hook }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType.startsWith('image/') ? 'image/jpeg' : mimeType,
              },
            },
          ],
        },
      ],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        // Skip Google Search in Turbo Mode for 2-3x faster response
        tools: isTurbo ? [] : [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            viralScore: { type: Type.NUMBER },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            enhancements: { type: Type.ARRAY, items: { type: Type.STRING } },
            platformData: { 
              type: Type.OBJECT,
              properties: {
                tagsString: { type: Type.STRING },
                bestTime: { type: Type.STRING },
                trendAnalysis: { type: Type.STRING },
                contentPillars: { type: Type.ARRAY, items: { type: Type.STRING } },
                hook: { type: Type.STRING },
                visualFlow: { type: Type.STRING },
                hookTiming: { type: Type.STRING },
                retentionTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                audioSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          required: ["title", "description", "hashtags", "viralScore", "tips", "enhancements"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error(`Gemini Analysis Error (Attempt ${retryCount + 1}):`, error);
    
    // Retry on transient network or server errors
    const isTransientError = 
      error.message?.includes('Rpc failed') || 
      error.message?.includes('xhr error') ||
      error.message?.includes('500') ||
      error.message?.includes('503') ||
      error.message?.includes('deadline exceeded');

    if (isTransientError && retryCount < MAX_RETRIES) {
      // Exponential backoff: 1s, 2s
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(r => setTimeout(r, delay));
      return analyzeMedia(file, language, platform, isTurbo, onProgress, retryCount + 1);
    }

    if (error.message?.includes('Rpc failed') || error.message?.includes('xhr error')) {
      throw new Error("Network error: The file might be too large or the connection was interrupted. Please try a smaller file or check your internet.");
    }
    
    throw new Error(error.message || "Failed to analyze media. Please try again.");
  }
}
