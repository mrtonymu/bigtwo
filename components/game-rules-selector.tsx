"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GameRules, PRESET_RULES, GameRulesManager, GameRulesValidator } from '@/lib/game-rules'
import { Copy, Download, Upload, Settings, Users, Clock, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

interface GameRulesSelectorProps {
  selectedRules: GameRules
  onRulesChange: (rules: GameRules) => void
  onClose: () => void
}

export function GameRulesSelector({ selectedRules, onRulesChange, onClose }: GameRulesSelectorProps) {
  const [currentRules, setCurrentRules] = useState<GameRules>(selectedRules)
  const [activeTab, setActiveTab] = useState('presets')
  const [customRulesJson, setCustomRulesJson] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // 预设规则卡片
  const PresetRuleCard = ({ rules }: { rules: GameRules }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        currentRules.id === rules.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={() => setCurrentRules(rules)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {rules.name}
          {rules.timeRules.enabled && <Clock className="h-4 w-4 text-blue-500" />}
          {rules.specialRules.allowBombs && <span className="text-orange-500">💥</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-3">{rules.description}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" />
            {rules.playerCount.min}-{rules.playerCount.max}人
          </Badge>
          {rules.timeRules.enabled && (
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {rules.timeRules.turnTime}秒/回合
            </Badge>
          )}
          <Badge variant="outline">
            <Trophy className="h-3 w-3 mr-1" />
            {rules.scoring.finishBonuses.first}分奖励
          </Badge>
        </div>
        <div className="text-xs text-gray-500">
          特殊规则: {[
            rules.specialRules.mustStartWithDiamond3 && '方块3开始',
            rules.specialRules.allowBombs && '炸弹模式',
            rules.specialRules.doubleOnLastCard && '最后一张双倍'
          ].filter(Boolean).join(', ') || '无'}
        </div>
      </CardContent>
    </Card>
  )

  // 自定义规则编辑器
  const CustomRulesEditor = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>规则名称</Label>
          <Input 
            value={currentRules.name}
            onChange={(e) => setCurrentRules({...currentRules, name: e.target.value})}
          />
        </div>
        <div>
          <Label>规则描述</Label>
          <Input 
            value={currentRules.description}
            onChange={(e) => setCurrentRules({...currentRules, description: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>最少玩家</Label>
          <Slider
            value={[currentRules.playerCount.min]}
            onValueChange={([value]) => setCurrentRules({
              ...currentRules,
              playerCount: {...currentRules.playerCount, min: value}
            })}
            min={2}
            max={4}
            step={1}
          />
          <div className="text-sm text-gray-500 mt-1">{currentRules.playerCount.min}人</div>
        </div>
        <div>
          <Label>最多玩家</Label>
          <Slider
            value={[currentRules.playerCount.max]}
            onValueChange={([value]) => setCurrentRules({
              ...currentRules,
              playerCount: {...currentRules.playerCount, max: value}
            })}
            min={2}
            max={4}
            step={1}
          />
          <div className="text-sm text-gray-500 mt-1">{currentRules.playerCount.max}人</div>
        </div>
        <div>
          <Label>默认玩家</Label>
          <Slider
            value={[currentRules.playerCount.default]}
            onValueChange={([value]) => setCurrentRules({
              ...currentRules,
              playerCount: {...currentRules.playerCount, default: value}
            })}
            min={currentRules.playerCount.min}
            max={currentRules.playerCount.max}
            step={1}
          />
          <div className="text-sm text-gray-500 mt-1">{currentRules.playerCount.default}人</div>
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">允许的牌型</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {Object.entries(currentRules.allowedCombinations).map(([key, enabled]) => (
            <div key={key} className="flex items-center space-x-2">
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => setCurrentRules({
                  ...currentRules,
                  allowedCombinations: {
                    ...currentRules.allowedCombinations,
                    [key]: checked
                  }
                })}
              />
              <Label className="text-sm">
                {key === 'single' && '单牌'}
                {key === 'pair' && '对子'}
                {key === 'threeOfAKind' && '三条'}
                {key === 'straight' && '顺子'}
                {key === 'flush' && '同花'}
                {key === 'fullHouse' && '葫芦'}
                {key === 'fourOfAKind' && '四条'}
                {key === 'straightFlush' && '同花顺'}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">特殊规则</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {Object.entries(currentRules.specialRules).map(([key, enabled]) => (
            <div key={key} className="flex items-center space-x-2">
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => setCurrentRules({
                  ...currentRules,
                  specialRules: {
                    ...currentRules.specialRules,
                    [key]: checked
                  }
                })}
              />
              <Label className="text-sm">
                {key === 'mustStartWithDiamond3' && '必须方块3开始'}
                {key === 'lastCardSpadeRule' && '最后一张不能是黑桃'}
                {key === 'passOnThreeConsecutive' && '三次连续pass跳过'}
                {key === 'allowBombs' && '允许炸弹（四条打任意）'}
                {key === 'doubleOnLastCard' && '最后一张牌双倍积分'}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">时间限制</Label>
        <div className="space-y-3 mt-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentRules.timeRules.enabled}
              onCheckedChange={(checked) => setCurrentRules({
                ...currentRules,
                timeRules: {
                  ...currentRules.timeRules,
                  enabled: checked
                }
              })}
            />
            <Label>启用时间限制</Label>
          </div>
          {currentRules.timeRules.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>回合时间（秒）</Label>
                <Slider
                  value={[currentRules.timeRules.turnTime]}
                  onValueChange={([value]) => setCurrentRules({
                    ...currentRules,
                    timeRules: {...currentRules.timeRules, turnTime: value}
                  })}
                  min={10}
                  max={120}
                  step={5}
                />
                <div className="text-sm text-gray-500 mt-1">{currentRules.timeRules.turnTime}秒</div>
              </div>
              <div>
                <Label>超时处理</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={currentRules.timeRules.timeoutAction === 'auto_pass' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentRules({
                      ...currentRules,
                      timeRules: {...currentRules.timeRules, timeoutAction: 'auto_pass'}
                    })}
                  >
                    自动跳过
                  </Button>
                  <Button
                    variant={currentRules.timeRules.timeoutAction === 'kick_player' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentRules({
                      ...currentRules,
                      timeRules: {...currentRules.timeRules, timeoutAction: 'kick_player'}
                    })}
                  >
                    踢出玩家
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const handleSaveRules = () => {
    const validation = GameRulesValidator.validateRules(currentRules)
    if (!validation.valid) {
      toast.error(`规则验证失败: ${validation.errors.join(', ')}`)
      return
    }

    onRulesChange(currentRules)
    toast.success('游戏规则已更新')
    onClose()
  }

  const handleExportRules = () => {
    const json = GameRulesManager.exportRules(currentRules.id)
    if (json) {
      navigator.clipboard.writeText(json)
      toast.success('规则已复制到剪贴板')
    }
  }

  const handleImportRules = () => {
    if (!customRulesJson.trim()) {
      toast.error('请输入规则JSON')
      return
    }

    const result = GameRulesManager.importRules(customRulesJson)
    if (result.success && result.rules) {
      setCurrentRules(result.rules)
      toast.success('规则导入成功')
    } else {
      toast.error(`导入失败: ${result.error}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          游戏规则设置
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportRules}>
            <Copy className="h-4 w-4 mr-2" />
            导出规则
          </Button>
          <Button onClick={handleSaveRules}>
            应用规则
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presets">预设规则</TabsTrigger>
          <TabsTrigger value="custom">自定义规则</TabsTrigger>
          <TabsTrigger value="import">导入/导出</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(PRESET_RULES).map((rules) => (
              <PresetRuleCard key={rules.id} rules={rules} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <CustomRulesEditor />
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>导入/导出规则</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>导入规则JSON</Label>
                <Textarea
                  value={customRulesJson}
                  onChange={(e) => setCustomRulesJson(e.target.value)}
                  placeholder="粘贴规则JSON配置..."
                  rows={10}
                />
                <Button onClick={handleImportRules} className="mt-2">
                  <Upload className="h-4 w-4 mr-2" />
                  导入规则
                </Button>
              </div>
              <div>
                <Label>当前规则预览</Label>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(currentRules, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}