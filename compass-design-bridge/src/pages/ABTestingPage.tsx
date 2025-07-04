import React, { useState, useEffect } from "react";
import MainLayout from "@/components/dashboard/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { abTestResults } from "@/services/mockData";
import { mcpService } from "@/services/mcpService";
import { toast } from "@/hooks/use-toast";
import { Play, Pause, BarChart3, TrendingUp, Users } from "lucide-react";

const ABTestingPage = () => {
  const [tests, setTests] = useState(abTestResults);
  const [loading, setLoading] = useState(false);
  const [newTestName, setNewTestName] = useState("");

  useEffect(() => {
    loadABTests();
  }, []);

  const loadABTests = async () => {
    setLoading(true);
    try {
      const response = await mcpService.fetchABTestData();
      if (response.success) {
        setTests(response.data);
      }
    } catch (error) {
      toast({
        title: "データ読み込みエラー",
        description: "A/Bテストデータの読み込みに失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewTest = () => {
    if (!newTestName.trim()) {
      toast({
        title: "テスト名が必要です",
        description: "A/Bテストの名前を入力してください",
        variant: "destructive",
      });
      return;
    }

    const newTest = {
      id: (tests.length + 1).toString(),
      name: newTestName,
      variants: [
        { name: "コントロール", conversionRate: 0, visitors: 0, conversions: 0 },
        { name: "バリアントA", conversionRate: 0, visitors: 0, conversions: 0 },
      ],
      status: "running" as const,
      significance: 0,
    };

    setTests([newTest, ...tests]);
    setNewTestName("");
    
    toast({
      title: "新しいテストを作成しました",
      description: `${newTestName} が開始されました`,
    });
  };

  const toggleTestStatus = (testId: string) => {
    setTests(tests.map(test => {
      if (test.id === testId) {
        const newStatus = test.status === 'running' ? 'paused' : 'running';
        toast({
          title: `テストを${newStatus === 'running' ? '開始' : '一時停止'}しました`,
          description: test.name,
        });
        return { ...test, status: newStatus };
      }
      return test;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '実行中';
      case 'completed': return '完了';
      case 'paused': return '一時停止';
      default: return '不明';
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">A/Bテスト管理</h1>
        <p className="text-muted-foreground">
          デザイン変更の効果を測定し、データドリブンな意思決定を支援
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">実行中のテスト</TabsTrigger>
          <TabsTrigger value="completed">完了したテスト</TabsTrigger>
          <TabsTrigger value="create">新規作成</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-4">
            {tests.filter(test => test.status === 'running' || test.status === 'paused').map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(test.status)}>
                        {getStatusText(test.status)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTestStatus(test.id)}
                      >
                        {test.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {test.variants.map((variant, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">{variant.name}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>訪問者数:</span>
                            <span>{variant.visitors.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>コンバージョン数:</span>
                            <span>{variant.conversions}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span>コンバージョン率:</span>
                            <span>{variant.conversionRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>統計的有意性:</span>
                      <span>{Math.round(test.significance * 100)}%</span>
                    </div>
                    <Progress value={test.significance * 100} className="h-2" />
                  </div>

                  {test.winner && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          勝者: {test.winner}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {tests.filter(test => test.status === 'completed').map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <Badge className={getStatusColor(test.status)}>
                      {getStatusText(test.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {test.variants.map((variant, index) => (
                      <div key={index} className={`p-4 border rounded-lg ${
                        test.winner === variant.name ? 'border-green-500 bg-green-50' : ''
                      }`}>
                        <h4 className="font-medium mb-2">
                          {variant.name}
                          {test.winner === variant.name && (
                            <span className="ml-2 text-green-600 text-sm">🏆 勝者</span>
                          )}
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>訪問者数:</span>
                            <span>{variant.visitors.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>コンバージョン数:</span>
                            <span>{variant.conversions}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span>コンバージョン率:</span>
                            <span>{variant.conversionRate}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>統計的有意性:</span>
                    <span className="font-medium">{Math.round(test.significance * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>新しいA/Bテストを作成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="test-name" className="text-sm font-medium">
                  テスト名
                </label>
                <Input
                  id="test-name"
                  placeholder="例: ヘッダーCTAボタンの色テスト"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">テスト設定</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">コントロール（現在のデザイン）</h5>
                    <p className="text-sm text-muted-foreground">
                      現在のデザインをベースラインとして使用
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">バリアントA（新しいデザイン）</h5>
                    <p className="text-sm text-muted-foreground">
                      テストしたい新しいデザイン変更
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={createNewTest} 
                className="w-full bg-mcp-primary hover:bg-mcp-tertiary"
                disabled={!newTestName.trim()}
              >
                テストを開始
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default ABTestingPage;
