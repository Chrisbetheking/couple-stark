# 二人火花 · Couple Spark

一个给成年情侣线下玩的本地优先 PWA：大转盘、真心话/大冒险、暖味骰子、姿势卡、道具清单、边界清单、计时器和自定义题库。支持中文/English，一切数据只存在浏览器本机。

> 说明：这个项目参考了你提供截图里的“场景卡、粉色氛围、转盘、任务页、道具选择、姿势卡”等交互结构，但没有复制第三方 App 的题目、图片或素材。内置内容为重新设计的原创提示，更强调同意、边界、隐私和可跳过。

## 核心功能

- **怡情场景**：温柔热身、真心话、听话模式、撩拨升级、随机渐进、姿势卡、收尾关怀。
- **小爱转盘**：内置温柔/升温/收尾三套转盘，也能每行一个选项自定义。
- **真心话 / 大冒险**：按强度 1-5 抽卡，支持跳过、降级、升温。
- **暖味骰子**：动作 + 位置 + 时长随机组合。
- **边界清单**：两个人分别标记 Yes / Maybe / No，共同匹配后再玩。
- **道具选择**：选择已有道具后，抽卡会更偏向相关内容。
- **爱计时**：适合按摩、亲吻、暂停、对视和收尾，可选震动提醒。
- **内容实验室**：新增、编辑、导出、导入自定义题库 JSON。
- **隐私友好**：没有服务器、没有账号、没有埋点，localStorage 本地保存。
- **PWA**：手机浏览器打开后可添加到主屏幕，支持基础离线缓存。

## 快速运行

最简单方式：

```bash
cd couple-spark
python3 -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

也可以用 npm：

```bash
npm run dev
```

可选 Vite 开发服务器：

```bash
npm install
npm run dev:vite
```

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库，比如 `couple-spark`。
2. 把本项目所有文件推到 `main` 分支。
3. 仓库 Settings → Pages → Source 选择 **GitHub Actions**。
4. 已内置 `.github/workflows/pages.yml`，推送后会自动部署静态 PWA。

## 自定义题库格式

在“内容实验室”里导入 JSON，格式示例：

```json
[
  {
    "type": "dare",
    "level": 2,
    "tags": ["custom", "warmup"],
    "zh": "{giver} 给 {receiver} 一个 20 秒的肩颈按摩。",
    "en": "{giver} gives {receiver} a 20-second shoulder massage."
  }
]
```

可用占位符：

- `{giver}`：随机执行方
- `{receiver}`：随机接受方
- `{p1}`：第一个名字
- `{p2}`：第二个名字

推荐类型：`truth`、`dare`、`kiss`、`touch`、`prop`、`pose`、`care`、`aftercare`。

## 使用建议

建议顺序：

1. 先做 **边界清单**，把 Yes / Maybe / No 说清楚。
2. 选 2-4 个今晚真的会用的 **道具**。
3. 从“升温小情调”或“暖昧小问答”开始。
4. 只有两个人都舒服时，再提高强度或进入更大胆场景。
5. 结束后一定做“抱抱收尾”或至少喝水、拥抱、复盘感受。

任何一方说停，都应该立即停。跳过不是扫兴，是让下次更安心。

## 文件结构

```text
couple-spark/
├─ index.html
├─ manifest.webmanifest
├─ service-worker.js
├─ icon.svg
├─ src/
│  ├─ main.js       # SPA 逻辑、路由、localStorage、游戏抽卡
│  ├─ data.js       # 中英文内置场景、题库、道具、边界项、转盘预设
│  ├─ i18n.js       # UI 文案中英双语
│  └─ styles.css    # 玻璃拟态 UI、响应式布局、转盘、雪花背景
├─ .github/workflows/pages.yml
├─ package.json
└─ LICENSE
```

## 设计取舍

- 没有后端：避免私密数据离开设备。
- 没有第三方统计：避免行为数据被记录。
- 没有露骨图片素材：用文字、抽象线条和氛围 UI，降低隐私与版权风险。
- 强制进入前确认：减少误用，提醒同意与安全词。
- 题库可导入导出：方便你们长期维护自己的玩法。

## License

MIT
