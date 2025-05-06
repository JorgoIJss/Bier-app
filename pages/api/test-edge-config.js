// pages/api/test-edge-config.js
import { get } from '@vercel/edge-config';

export default async function handler(req, res) {
  try {
    const test = await get('test');
    res.status(200).json({ success: true, test });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      config: process.env.EDGE_CONFIG ? 'Set' : 'Not set'
    });
  }
}