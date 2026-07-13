/**
 * speed-insights.js — PT Mitra Abadi Sindomas
 * Vercel Speed Insights initialization
 * 
 * This script initializes Vercel Speed Insights for performance monitoring.
 * It should be loaded on all pages for consistent tracking.
 */

import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
injectSpeedInsights();
