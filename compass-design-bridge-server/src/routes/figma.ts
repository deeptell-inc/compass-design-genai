import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { fileStorageService } from '../services/fileStorageService';

const router = Router();

// Use file storage for development/demo
interface FigmaApiKeyData {
  userId: string;
  encryptedApiKey: string;
  figmaUserInfo?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Encryption key for API keys (in production, use environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here';

// Encrypt API key
function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt API key
function decryptApiKey(encryptedApiKey: string): string {
  const parts = encryptedApiKey.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Simple file-based storage functions
async function saveFigmaApiKey(userId: string, encryptedApiKey: string, figmaUserInfo: any): Promise<void> {
  const data: FigmaApiKeyData = {
    userId,
    encryptedApiKey,
    figmaUserInfo,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await fileStorageService.saveFigmaApiKey(userId, JSON.stringify(data));
}

async function getFigmaApiKeyData(userId: string): Promise<FigmaApiKeyData | null> {
  try {
    const data = await fileStorageService.getFigmaApiKey(userId);
    if (!data) return null;
    
    try {
      return JSON.parse(data) as FigmaApiKeyData;
    } catch {
      // If it's just a plain string (old format), convert it
      return {
        userId,
        encryptedApiKey: data,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  } catch {
    return null;
  }
}

async function deleteFigmaApiKey(userId: string): Promise<void> {
  const data = await getFigmaApiKeyData(userId);
  if (data) {
    data.isActive = false;
    data.updatedAt = new Date().toISOString();
    await fileStorageService.saveFigmaApiKey(userId, JSON.stringify(data));
  }
}

// Test Figma API connection
async function testFigmaConnection(apiKey: string) {
  try {
    const response = await fetch('https://api.figma.com/v1/me', {
      headers: {
        'X-Figma-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error('Failed to connect to Figma API');
  }
}

// Save Figma API key
router.post('/figmaKey', async (req: Request, res: Response) => {
  try {
    const { apiKey, userId } = req.body;

    if (!apiKey || !userId) {
      return res.status(400).json({ 
        error: 'API key and user ID are required' 
      });
    }

    // Test the API key first
    let figmaUserInfo;
    try {
      figmaUserInfo = await testFigmaConnection(apiKey);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid Figma API key or connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Encrypt the API key
    const encryptedApiKey = encryptApiKey(apiKey);

    // Save to file storage
    await saveFigmaApiKey(userId, encryptedApiKey, figmaUserInfo);

    res.json({
      success: true,
      message: 'Figma API key saved successfully',
      figmaUserInfo: figmaUserInfo
    });

  } catch (error) {
    console.error('Error saving Figma API key:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Figma API key info
router.get('/figmaKey/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const data = await getFigmaApiKeyData(userId);

    if (!data || !data.isActive) {
      return res.status(404).json({ 
        error: 'No Figma API key found for this user' 
      });
    }

    res.json({
      success: true,
      hasApiKey: true,
      isActive: data.isActive,
      figmaUserInfo: data.figmaUserInfo,
      lastUpdated: data.updatedAt
    });

  } catch (error) {
    console.error('Error retrieving Figma API key info:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete Figma API key
router.delete('/figmaKey/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    await deleteFigmaApiKey(userId);

    res.json({
      success: true,
      message: 'Figma API key deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Figma API key:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test Figma connection for a user
router.post('/figmaKey/:userId/test', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const data = await getFigmaApiKeyData(userId);

    if (!data || !data.isActive) {
      return res.status(404).json({ 
        error: 'No Figma API key found for this user' 
      });
    }

    // Decrypt and test the API key
    const apiKey = decryptApiKey(data.encryptedApiKey);
    
    const figmaUserInfo = await testFigmaConnection(apiKey);

    // Update the user info in storage
    await saveFigmaApiKey(userId, data.encryptedApiKey, figmaUserInfo);

    res.json({
      success: true,
      message: 'Figma connection test successful',
      figmaUserInfo: figmaUserInfo
    });

  } catch (error) {
    console.error('Error testing Figma connection:', error);
    res.status(500).json({ 
      error: 'Figma connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get Figma API key for internal use (returns decrypted key)
router.get('/figmaKey/:userId/key', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;

    // Simple authentication check (in production, use proper JWT validation)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = await getFigmaApiKeyData(userId);

    if (!data || !data.isActive) {
      return res.status(404).json({ 
        error: 'No Figma API key found for this user' 
      });
    }

    const apiKey = decryptApiKey(data.encryptedApiKey);

    res.json({
      success: true,
      apiKey: apiKey
    });

  } catch (error) {
    console.error('Error retrieving Figma API key:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;