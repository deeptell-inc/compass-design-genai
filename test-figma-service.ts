// テスト用スクリプト
import { FigmaService } from './src/services/figmaService';

async function testFigmaService() {
  const figmaService = new FigmaService();
  
  try {
    // ファイルキーの例（URLから抽出）
    const fileKey = 'your-22-char-file-key';
    
    // 1. 基本的なファイル取得
    console.log('Testing basic file fetch...');
    const file = await figmaService.getFile(fileKey, 1);
    console.log('✅ File fetched:', file.name);
    
    // 2. デザイントークンの抽出
    console.log('Testing design token extraction...');
    const tokens = figmaService.extractDesignTokens(file);
    console.log('✅ Design tokens extracted:', tokens.length);
    
    // 3. 特定ノードの取得
    if (file.document.children && file.document.children.length > 0) {
      const nodeId = file.document.children[0].id;
      const nodes = await figmaService.getFileNodes(fileKey, [nodeId]);
      console.log('✅ Nodes fetched:', Object.keys(nodes).length);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFigmaService(); 