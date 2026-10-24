# 太和殿 · 邸报源（热榜）

给 `太和殿` 工作台的钦天监提供每日三报：**微博 / 抖音 / B站 各前 5 条**。

仓库里只有抓取脚本和热榜 JSON，没有任何个人数据。

## 产出

```
radar/latest.json                  最新一报（工作台读这个）
radar/editions/<日期>-<时段>.json   历史存档（morning / noon / evening）
```

## 定时

`.github/workflows/radar.yml`：每天 **07:30 / 12:30 / 18:30（北京时间）** 各跑一次，抓完自动提交。
也可以在 Actions 页面点 `Run workflow` 手动跑一次。

## 本地跑一次

```bash
node fetch.mjs
```

## 工作台怎么读

在工作台的 `.env` 里加：

```
RADAR_URL=https://raw.githubusercontent.com/<你的用户名>/<仓库名>/main/radar/latest.json
```

打开工作台时自动拉取，落进钦天监 · 观象台。

## 数据来源

热榜数据来自 [newsnow](https://github.com/ourongxing/newsnow) 的公开聚合接口。
只存标题、链接、排名，不存正文。
