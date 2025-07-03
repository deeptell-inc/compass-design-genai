# COMPASS Design GenAI - AWS Deployment Guide

このガイドでは、COMPASS Design GenAI アプリケーションを AWS にデプロイする方法を説明します。

## 📋 前提条件

デプロイを開始する前に、以下のツールがインストールされている必要があります：

- **AWS CLI** (v2.0以上)
- **Terraform** (v1.0以上)
- **Docker** (v20.0以上)
- **Node.js** (v18以上)
- **Git**

### 自動依存関係インストール

依存関係を自動でインストールするには：

```bash
chmod +x scripts/install-dependencies.sh
./scripts/install-dependencies.sh
```

## 🚀 クイックデプロイ

### 1. スクリプトを実行可能にする

```bash
chmod +x deploy.sh
chmod +x scripts/destroy.sh
```

### 2. デプロイを実行

```bash
./deploy.sh
```

このスクリプトは以下を自動で実行します：

1. ✅ 前提条件のチェック
2. 🔧 AWS認証情報の設定
3. 📝 環境ファイルの作成
4. 🏗️ Terraformでインフラ構築
5. 🐳 Dockerイメージのビルドとプッシュ
6. 🚀 ECSサービスのデプロイ

### 3. デプロイ完了

デプロイが成功すると、以下のURLが表示されます：

- **フロントエンド**: `http://[load-balancer-dns]`
- **バックエンド**: `http://[load-balancer-dns]:3002`
- **ヘルスチェック**: `http://[load-balancer-dns]:3002/health`

## 🗃️ インフラストラクチャ構成

デプロイされるAWSリソース：

### ネットワーク
- **VPC** (10.0.0.0/16)
- **パブリックサブネット** x2 (高可用性)
- **プライベートサブネット** x2 (データベース用)
- **インターネットゲートウェイ**
- **Application Load Balancer**

### コンピュート
- **ECS Fargate クラスター**
- **フロントエンドサービス** (nginx + React)
- **バックエンドサービス** (Node.js + Express)

### データベース
- **RDS PostgreSQL** (db.t3.micro)
- **自動バックアップ** (7日間保持)

### コンテナレジストリ
- **ECR リポジトリ** (フロントエンド・バックエンド)

### モニタリング
- **CloudWatch ログ**
- **ECS Container Insights**

## 🔧 手動設定

### 環境変数の更新

デプロイ後、以下の環境変数を実際の値に更新してください：

```bash
# バックエンド (compass-design-bridge-server/.env)
ANTHROPIC_API_KEY=your-actual-anthropic-api-key
OPENAI_API_KEY=your-actual-openai-api-key
FIGMA_ACCESS_TOKEN=your-actual-figma-token
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### セキュリティ設定

1. **RDSパスワード**を強力なものに変更
2. **JWTシークレット**を本番用に更新
3. **CORS設定**を適切なドメインに限定

### SSL/HTTPS設定 (オプション)

HTTPSを有効にするには：

1. **ACM証明書**を作成
2. **Route 53**でドメインを設定
3. **ALBリスナー**をHTTPS用に更新

## 📊 モニタリング・ログ

### CloudWatch ログ確認

```bash
# フロントエンドログ
aws logs tail /ecs/compass-design-genai-frontend --follow

# バックエンドログ
aws logs tail /ecs/compass-design-genai-backend --follow
```

### ECSサービス状態確認

```bash
aws ecs describe-services --cluster compass-design-genai-cluster --services compass-design-genai-frontend-service compass-design-genai-backend-service
```

## 🔄 更新・再デプロイ

コードを更新して再デプロイするには：

```bash
./deploy.sh
```

スクリプトは自動的に：
- 新しいDockerイメージをビルド
- ECRにプッシュ
- ECSサービスを更新

## 🗑️ インフラ削除

**⚠️ 注意**: この操作は取り返しがつきません！

```bash
./scripts/destroy.sh
```

このスクリプトは以下を削除します：
- すべてのECSサービス
- RDSデータベース（データ含む）
- VPCと関連リソース
- ECRリポジトリとイメージ

## 🐛 トラブルシューティング

### よくある問題

#### 1. Docker権限エラー

```bash
sudo usermod -aG docker $USER
# ログアウト・ログインが必要
```

#### 2. AWS認証エラー

```bash
aws configure list
aws sts get-caller-identity
```

#### 3. Terraform状態ロック

```bash
cd terraform
terraform force-unlock [LOCK_ID]
```

#### 4. ECSタスク起動失敗

CloudWatchログを確認：

```bash
aws logs describe-log-groups --log-group-name-prefix "/ecs/compass-design-genai"
```

### デバッグコマンド

```bash
# ECSタスク定義確認
aws ecs describe-task-definition --task-definition compass-design-genai-frontend

# ALBターゲット状態確認
aws elbv2 describe-target-health --target-group-arn [TARGET_GROUP_ARN]

# ECRイメージ確認
aws ecr describe-images --repository-name compass-design-genai-frontend
```

## 💰 コスト見積もり

月額概算コスト（東京リージョン）：

- **ECS Fargate**: ~$30-50
- **RDS t3.micro**: ~$20
- **ALB**: ~$25
- **ECR**: ~$5
- **CloudWatch**: ~$5

**合計**: 約 $85-105/月

## 🔒 セキュリティ考慮事項

1. **IAM権限**: 最小権限の原則
2. **VPC設定**: プライベートサブネットでデータベース保護
3. **セキュリティグループ**: 必要最小限のポート開放
4. **暗号化**: RDS暗号化有効
5. **ログ監査**: CloudTrail設定推奨

## 📞 サポート

問題が発生した場合：

1. **ログ確認**: CloudWatchでエラーログを確認
2. **ドキュメント**: 各AWSサービスの公式ドキュメント
3. **コミュニティ**: Stack OverflowやGitHub Issues

---

�� **デプロイ成功をお祈りします！** 