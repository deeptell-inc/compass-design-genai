
// Strat Link用のモックデータ

export type AiInsight = {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "conversion" | "ux" | "ui" | "engagement";
};

export const activityData = [
  { date: "05/10", pageViews: 320, clicks: 120, conversions: 12 },
  { date: "05/11", pageViews: 332, clicks: 132, conversions: 14 },
  { date: "05/12", pageViews: 401, clicks: 191, conversions: 18 },
  { date: "05/13", pageViews: 350, clicks: 153, conversions: 15 },
  { date: "05/14", pageViews: 425, clicks: 176, conversions: 19 },
  { date: "05/15", pageViews: 378, clicks: 147, conversions: 16 },
  { date: "05/16", pageViews: 410, clicks: 168, conversions: 21 },
];

export const figmaProjects = [
  { id: "1", name: "ECダッシュボード", lastModified: "2025-05-15" },
  { id: "2", name: "モバイルアプリリデザイン", lastModified: "2025-05-14" },
  { id: "3", name: "ランディングページ最適化", lastModified: "2025-05-10" },
];

export const aiInsights: AiInsight[] = [
  {
    id: "1",
    title: "CTAボタンの視認性問題",
    description: "ランディングページの主要CTAボタンのコントラストが低く、視認性が低下し、コンバージョンに影響している可能性があります。",
    impact: "high",
    category: "conversion",
  },
  {
    id: "2",
    title: "モバイルナビゲーションの使いやすさ",
    description: "モバイルユーザーがデスクトップユーザーに比べてセクション間の移動に20%長い時間を費やしており、ナビゲーションの問題が示唆されます。",
    impact: "medium",
    category: "ux",
  },
  {
    id: "3",
    title: "フォーム離脱パターン",
    description: "ユーザーの40%が支払い情報入力ステップでチェックアウトフォームを離脱しており、業界平均より高くなっています。",
    impact: "high",
    category: "conversion",
  },
];

export const codeGenerationTemplates = [
  {
    id: "1",
    title: "Reactコンポーネント",
    description: "Tailwind CSSスタイリングを使用したReactコンポーネントを生成",
    frameworks: ["React", "Tailwind CSS"]
  },
  {
    id: "2",
    title: "Vueコンポーネント",
    description: "スタイリング付きのVue.jsコンポーネントを生成",
    frameworks: ["Vue", "CSS"]
  },
  {
    id: "3",
    title: "ランディングページ",
    description: "レスポンシブデザインの完全なランディングページを生成",
    frameworks: ["HTML", "CSS", "JavaScript"]
  },
];

export const stats = {
  designsProcessed: 42,
  codeGenerationRequests: 156,
  designTokensExtracted: 327,
  averageCodeQualityScore: 8.7,
};

export const generateMockInsights = (): AiInsight[] => {
  const insights = [
    {
      id: (Math.random() * 1000).toFixed(0),
      title: "フォームフィールドの検証フィードバック",
      description: "フォームフィールドにインラインバリデーションフィードバックを追加することで、完了率が約12-18%向上する可能性があります。",
      impact: "medium" as const,
      category: "ux" as const,
    },
    {
      id: (Math.random() * 1000).toFixed(0),
      title: "ヘッダーコントラストの改善",
      description: "ヘッダーテキストと背景のコントラストを高めることで、ユーザーの15%の読みやすさが向上します。",
      impact: "medium" as const,
      category: "ux" as const,
    },
    {
      id: (Math.random() * 1000).toFixed(0),
      title: "商品画像表示",
      description: "ユーザーエンゲージメントデータによると、ギャラリーに複数の角度を表示する商品は23%高い相互作用を示しています。",
      impact: "high" as const,
      category: "conversion" as const,
    },
    {
      id: (Math.random() * 1000).toFixed(0),
      title: "読み込み状態のフィードバック",
      description: "読み込み状態中に視覚的フィードバックを追加することで、体感待機時間の短縮とバウンス率の低下が期待できます。",
      impact: "low" as const,
      category: "ux" as const,
    },
  ];
  
  return insights.sort(() => 0.5 - Math.random()).slice(0, 3);
};

export const abTestResults = [
  {
    id: "1",
    name: "ホームページCTAボタンテスト",
    variants: [
      { name: "コントロール", conversionRate: 3.2, visitors: 1000, conversions: 32 },
      { name: "バリアントA", conversionRate: 4.1, visitors: 1000, conversions: 41 },
    ],
    status: "completed" as const,
    significance: 0.95,
    winner: "バリアントA",
  },
  {
    id: "2", 
    name: "商品ページレイアウトテスト",
    variants: [
      { name: "コントロール", conversionRate: 2.8, visitors: 800, conversions: 22 },
      { name: "バリアントB", conversionRate: 3.5, visitors: 800, conversions: 28 },
    ],
    status: "running" as const,
    significance: 0.87,
  },
];

export const businessMetrics = {
  conversionRate: 3.4,
  averageOrderValue: 85.50,
  customerLifetimeValue: 245.00,
  bounceRate: 0.42,
  pageLoadTime: 2.3,
  userSatisfactionScore: 4.2,
};

export const userBehaviorData = [
  { date: "05/10", sessions: 1250, bounceRate: 0.38, avgSessionDuration: 185 },
  { date: "05/11", sessions: 1320, bounceRate: 0.35, avgSessionDuration: 195 },
  { date: "05/12", sessions: 1480, bounceRate: 0.33, avgSessionDuration: 210 },
  { date: "05/13", sessions: 1380, bounceRate: 0.36, avgSessionDuration: 188 },
  { date: "05/14", sessions: 1520, bounceRate: 0.31, avgSessionDuration: 225 },
  { date: "05/15", sessions: 1420, bounceRate: 0.34, avgSessionDuration: 198 },
  { date: "05/16", sessions: 1580, bounceRate: 0.29, avgSessionDuration: 235 },
];

export const uxResearchInsights = [
  {
    id: "1",
    title: "モバイルUXベストプラクティス",
    summary: "モバイルユーザーエクスペリエンス設計の主要原則",
    category: "mobile",
    insights: ["タッチターゲットサイズは最低44px", "フォームフィールドを最小限に"],
    source: "nngroup.com",
  },
  {
    id: "2", 
    title: "コンバージョン率最適化",
    summary: "コンバージョン率向上のための実証済み手法",
    category: "conversion",
    insights: ["明確な価値提案", "チェックアウトの摩擦を減らす"],
    source: "abtest.design",
  },
];
