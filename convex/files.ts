import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const sendImage = mutation({
  args: { 
    uploadUrl: v.string(), 
    storageId: v.string() 
  },
  handler: async (ctx, { uploadUrl, storageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get the image from storage
    const url = await ctx.storage.getUrl(storageId);
    
    return { success: true, url };
  },
});
