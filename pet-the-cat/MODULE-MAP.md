# 可读版：模块化 + 注释 + 排版

从站点原包解出的 `source/app.js` 做了一次"只动排版与注释、不动逻辑"的重构：

- 按原代码里天然的 IIFE 边界拆成 **17 个模块 + 1 个资源装载**，共 18 个文件；
- 每个文件加文件头注释（职责、关键概念、从哪开始读）；
- JS/CSS 用 prettier（print-width 100）统一缩进换行；
- 全部用普通 `<script>` 顺序加载（**不是** ES Module），所以 `file://` 双击也能跑。

逻辑零改动：拆出来的代码除缩进/换行外与 `source/app.js` 逐字一致，唯一保留的那一处改动仍是资源读取来源
（`document.currentScript` → `window.PET_ASSETS`，见 `14-read-photo.js`）。

## 怎么跑

直接双击 `index.html`，或在目录里起个静态服务：

```bash
python -m http.server 8000
# 打开 http://localhost:8000/
```

## 模块地图

| 文件 | 职责 |
| --- | --- |
| `src/00-assets.js` | base64 → Uint8Array，挂到 `window.PET_ASSETS`（513587 字节 / 27 张 AVIF） |
| `src/01-coat-surface.js` | 毛皮表面：把照片当可变形贴图，WebGL 与 Canvas2D 两条渲染路径 |
| `src/02-coat-outline.js` | 从身体图提取轮廓折线与脖颈极限，供手部贴边判定 |
| `src/03-cat-tail.js` | 26 节尾巴骨骼：抓握、拖拽、回弹、卷尾 |
| `src/04-tail-photo.js` | 把尾巴照片沿骨骼切片贴图（软件光栅 + canvas 两套） |
| `src/05-tail-socket.js` | 尾巴根与身体网格的缝合（蒙皮权重） |
| `src/06-overhead-cat.js` | 猫本体：顶点权重、呼吸、塌陷、被抚摸反馈、绘制 |
| `src/07-hand-layer.js` | 袖口遮挡：被猫挡住的部分裁掉 |
| `src/08-overhead-hand.js` | 手部照片分层（掌/指/指影）与落点、透视 |
| `src/09-tail-hand.js` | 抓尾巴那只手的姿态 |
| `src/10-hand-change.js` | 手在"背 ↔ 尾"之间的补间过渡 |
| `src/11-fur-contact.js` | 手指接触处的毛边与阴影，让手"陷进毛里" |
| `src/12-purr.js` | WebAudio 合成呼噜声（站点没有任何音频文件） |
| `src/13-silver-tabby.js` | 银渐层（saba）由茶虎像素现场调色合成 |
| `src/14-read-photo.js` | AVIF 加载、按目录裁切、按名字缓存 |
| `src/15-moonlight.js` | 暗色主题的月光/窗影叠加 |
| `src/16-proportions.js` | 体格滑杆（大小 / 躯干粗细）与 localStorage |
| `src/17-main.js` | DOM 装配、指针/键盘路由、状态机、帧循环 |
| `styles.css` | 从内联 `<style>` 抽出的样式（含 13 个猫种缩略图的 webp data URI） |

## 读代码时的术语表

原作者的命名偏简洁，几个高频缩写：

- `u, v`：归一化贴图坐标（u 横向、v 纵向），`x, y` 是屏幕/归一化画面坐标
- `w, h, sw, sh`：显示尺寸、贴图源尺寸
- `dpr`：devicePixelRatio
- `xy`：每个网格顶点的采样坐标数组（`[u0,v0,u1,v1,...]`）
- `light`：每顶点的光照向量（2 个分量）
- `lift`：毛束隆起量，越大毛越"起毛"
- `pile`：毛层厚度（长毛猫更厚）
- `pad`：一次抚摸里手掌/手指的接触点
- `seat`：把尾巴截面"坐"到身体表面上的插值
- `aspect`：画面宽高比 935/1517
- `junction` / `socket`：尾巴根部的缝合区

## 数据流（一帧）

```
输入事件 → route() 判定背/尾 → track()/tailPickup() 投到 uv
   ↓
OverheadCat.tick() 弹簧积分：load / bulk / lift / shear
CatTail.update()   尾巴骨骼角度
   ↓
OverheadCat.draw() → CoatSurface.draw()（顶点位移 + 光照 + 毛束）→ 身体
TailPhoto.draw()   → 尾巴切片贴图 → TailSocket 缝合
HandLayer/OverheadHand/TailHand → 手、袖口、指影
FurContact.draw()  → 手指毛边
drawMoonlight()    → 暗色主题光照
```
