# 个人网站 v5 · 2026-10-29

基于已发布 v4，在独立目录新增内容与三维交互。此前版本及输入素材保持不变。

- Eternal Flow：原始总展板 + 8 页方案，共 9 页，保留两份原 PDF 的独立入口。
- Rendering studies：3 幅静帧和 1 段用户提供的视频。
- Wolne Tory / Layered Tides：使用实际 SKP 几何转换的交互模型，在作品查看器和卡片提供 3D 入口。
- Wolne Tory 采用作品集第 33 页的青灰场地、灰白体块和棕灰结构线。旋转中心为设计主体世界坐标约 (800,7,-970) 米。周边城市保留为背景；远离场地的游离对象不纳入展示。
- 旧厂房：进入自动缓慢巡游；拖动/缩放后停止；相机限在室内，原“结构全景”替换为“内部纵览”。补充连接节点、螺栓、管线、墙体、锈蚀、屋面、裂缝、碎砖与杂草。
- 公园：细化树干、根系、树篱、细枝、草叶、落叶、长椅五金、人物服装和建筑细节；保留 180° 观察、浮光与原插画色调。
- 所有新场景遵循系统减少动态及网站动效开关。

## 本地预览
使用 tools/serve.cjs，端口 8767。所有过程文件和验收图片位于本目录 tools/ 与 validation/，禁止将它们部署为公共文件。

## 模型与维护
使用安装的 SketchUpAPI.dll 只读提取几何，转换脚本为 tools/convert-skp.py。GLB 经合批、索引优化后压缩为 assets/models/*.glb.gz，由浏览器原生 DecompressionStream 解压。Three.js 0.180.0 及 MIT 许可本地保存在 js/vendor/three。不使用外部运行时 CDN。

Wolne Tory 模型约 46.6 MB 压缩数据，首次打开需下载；低性能手机的帧率仍受硬件影响。桌面及手机布局通过 Chromium 验证，未做所有真机浏览器测试。照片场景是根据单张照片的视觉重建，非实测建筑或完整背面测绘。

发布文件以 validation/release-manifest.json 为准。验证脚本 tools/accept-v5.cjs，结果 validation/acceptance-v5.json。
